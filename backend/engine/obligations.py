"""
Obligation register and pre-trade guard for FS-2603.

Obligations are treated as HARD CONSTRAINTS, not predictions.
The guard blocks any trade that would push the worst-case cash path
below the next obligation.
"""

from datetime import date as _date, timedelta
from typing import Any

from config import cfg
from state import Obligation


def build_obligations(rows: list[dict]) -> list[Obligation]:
    out: list[Obligation] = []
    for r in rows:
        if not isinstance(r, dict):
            continue
        try:
            out.append(Obligation(
                id=str(r.get("id", f"obl-{len(out)}")),
                name=str(r.get("name", "obligation")),
                amount=float(r.get("amount", 0)),
                due_date=str(r.get("due_date", "")),
                recurrence=str(r.get("recurrence", "one-off")),
            ))
        except (TypeError, ValueError):
            continue
    out.sort(key=lambda o: o.due_date)
    return out


def next_obligation(obligations: list[Obligation], from_date: str) -> Obligation | None:
    for o in obligations:
        if o.due_date >= from_date:
            return o
    return None


def worst_case_balance_at(
    forecast_days: list[dict],
    date: str,
    current_balance: float,
    quantile: str = "p05",
) -> float:
    """
    Return the worst-case forecast balance on `date`.
    If no forecast is provided, assumes a flat path (no drift).
    Conservative by construction.
    """
    if not forecast_days:
        # No forecast — assume the balance doesn't change (conservative)
        return current_balance

    for d in forecast_days:
        if d.get("date") == date:
            return current_balance + float(d.get(quantile, 0.0))

    # Date is beyond the forecast horizon → use the last available day
    return current_balance + float(forecast_days[-1].get(quantile, 0.0))


def _derive_horizon_end(
    forecast_days: list[dict],
    obligations: list[Obligation],
    today: str,
) -> str:
    """
    Determine how far into the future the guard should look.

    Priority:
      1. Last day of the forecast, if available.
      2. Latest obligation due date, if there's no forecast.
      3. Today, if neither exists.
    """
    if forecast_days:
        return forecast_days[-1]["date"]
    if obligations:
        return max(o.due_date for o in obligations)
    return today


def check_guard(
    proposed_amount: float,
    current_balance: float,
    forecast_days: list[dict],
    obligations: list[Obligation],
    today: str,
) -> dict[str, Any]:
    """
    Pre-trade guard.

    Returns {"allowed": bool, "reason": str, "binding_date": str|None}
    The trade is BLOCKED if any obligation inside the horizon
    would be breached on the P5 (worst-case) path after the trade.
    """
    safety_margin = cfg("obligations", "safety_margin", 0.05)
    post_trade_balance = current_balance - proposed_amount

    # Refuse trades that would push cash negative, regardless of forecast
    if post_trade_balance < 0:
        return {
            "allowed": False,
            "reason": "Trade would push cash balance negative",
            "binding_date": today,
        }

    # Determine horizon — includes obligations even without forecast data
    horizon_end = _derive_horizon_end(forecast_days, obligations, today)

    in_window = [
        o for o in obligations
        if today <= o.due_date <= horizon_end
    ]

    if not in_window:
        return {
            "allowed": True,
            "reason": "No obligations in horizon",
            "binding_date": None,
        }

    # Every obligation must survive on the worst-case path
    for o in in_window:
        worst_balance = worst_case_balance_at(
            forecast_days, o.due_date, post_trade_balance, quantile="p05"
        )
        required = o.amount * (1 + safety_margin)
        if worst_balance < required:
            return {
                "allowed": False,
                "reason": (
                    f"P5 balance on {o.due_date} is ₹{worst_balance:,.0f}, "
                    f"below obligation '{o.name}' of ₹{o.amount:,.0f} "
                    f"(+{int(safety_margin*100)}% margin)"
                ),
                "binding_date": o.due_date,
            }

    return {
        "allowed": True,
        "reason": "All obligations covered on P5 path",
        "binding_date": None,
    }


def compute_safe_investable(
    current_balance: float,
    forecast_days: list[dict],
    obligations: list[Obligation],
    today: str,
) -> float:
    """
    Binary-search the maximum trade size the guard would allow.
    Deterministic, bounded, fast.
    """
    lo, hi = 0.0, max(current_balance, 0.0)
    for _ in range(30):
        mid = (lo + hi) / 2
        result = check_guard(mid, current_balance, forecast_days, obligations, today)
        if result["allowed"]:
            lo = mid
        else:
            hi = mid
    return round(lo, 2)