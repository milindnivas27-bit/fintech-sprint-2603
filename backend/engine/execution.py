"""
Execution engine for FS-2603.

Responsibilities:
- Take the safe-investable amount from the guard
- Apply settlement lag (T+2)
- Break into instrument allocations with FIFO tax lots
- Record trades in the blotter
- Reconcile the blotter exactly to the paisa
"""

from datetime import date as _date, timedelta
from typing import Any

from config import cfg
from state import Trade, STATE


# ─────────────────────────────────────────────────────────────
# Instruments
# ─────────────────────────────────────────────────────────────

INSTRUMENTS = {
    "EQ_INDEX":   {"name": "Equity Index Fund", "price": 100.0},
    "DEBT_SHORT": {"name": "Short Duration Debt", "price": 50.0},
    "GOLD_ETF":   {"name": "Gold ETF", "price": 75.0},
}

ALLOCATION = {
    "EQ_INDEX":   0.60,
    "DEBT_SHORT": 0.30,
    "GOLD_ETF":   0.10,
}


# ─────────────────────────────────────────────────────────────
# Trade ID sequence — monotonic, deterministic
# ─────────────────────────────────────────────────────────────

_TRADE_SEQ = 0


def _next_trade_id() -> str:
    global _TRADE_SEQ
    _TRADE_SEQ += 1
    return f"T{_TRADE_SEQ:06d}"


def _reset_trade_seq() -> None:
    global _TRADE_SEQ
    _TRADE_SEQ = 0


def _settlement_date(today: str) -> str:
    lag = cfg("execution", "settlement_lag_days", 2)
    d = _date.fromisoformat(today) + timedelta(days=lag)
    return d.isoformat()


# ─────────────────────────────────────────────────────────────
# FIFO lot tracking
# ─────────────────────────────────────────────────────────────

_OPEN_LOTS: dict[str, list[dict]] = {sym: [] for sym in INSTRUMENTS}


def _record_lot(symbol: str, trade_id: str, amount: float, price: float, date: str) -> None:
    _OPEN_LOTS[symbol].append({
        "trade_id": trade_id,
        "amount": amount,
        "price": price,
        "date": date,
        "remaining": amount,
    })


def _consume_fifo(symbol: str, sell_amount: float) -> list[dict]:
    consumed: list[dict] = []
    remaining = sell_amount
    for lot in _OPEN_LOTS.get(symbol, []):
        if remaining <= 0:
            break
        if lot["remaining"] <= 0:
            continue
        take = min(lot["remaining"], remaining)
        lot["remaining"] -= take
        consumed.append({
            "from_trade": lot["trade_id"],
            "amount": take,
            "price": lot["price"],
        })
        remaining -= take
    return consumed


# ─────────────────────────────────────────────────────────────
# Public execution
# ─────────────────────────────────────────────────────────────

def execute(
    investable: float,
    today: str,
    forecast_days: list[dict],
    obligations: list,
) -> dict[str, Any]:
    from engine.obligations import check_guard

    # Reset sequence so repeated calls are deterministic given same inputs
    _reset_trade_seq()

    min_trade = cfg("execution", "min_trade_value", 500)
    txn_bps = cfg("execution", "txn_cost_bps", 5)
    settle_date = _settlement_date(today)

    trades: list[Trade] = []
    deployed = 0.0
    total_cost = 0.0

    for symbol, weight in ALLOCATION.items():
        if investable < min_trade:
            break
        slot = round(investable * weight, 2)
        if slot < min_trade:
            continue

        # Defense-in-depth: every individual trade passes the guard
        guard = check_guard(slot, STATE.cash_balance, forecast_days, obligations, today)

        if not guard["allowed"]:
            trades.append(Trade(
                id=_next_trade_id(),
                timestamp=today,
                action="BUY",
                symbol=symbol,
                amount=slot,
                price=INSTRUMENTS[symbol]["price"],
                status="REJECTED",
                settlement_date=settle_date,
                tax_lot_id="",
                reason=guard["reason"],
            ))
            continue

        trade_id = _next_trade_id()
        cost = round(slot * txn_bps / 10000, 2)

        trades.append(Trade(
            id=trade_id,
            timestamp=today,
            action="BUY",
            symbol=symbol,
            amount=slot,
            price=INSTRUMENTS[symbol]["price"],
            status="COMMITTED",
            settlement_date=settle_date,
            tax_lot_id=trade_id,
            reason="Guard passed on P5 path",
        ))

        _record_lot(symbol, trade_id, slot, INSTRUMENTS[symbol]["price"], today)
        deployed += slot
        total_cost += cost

    # Update cash
    STATE.set_cash(STATE.cash_balance - deployed)

    # Record all trades in the blotter
    for t in trades:
        STATE.record_trade(t)

    return {
        "trades": [t.__dict__ for t in trades],
        "deployed": round(deployed, 2),
        "transaction_costs": round(total_cost, 2),
        "remaining_cash": round(STATE.cash_balance, 2),
        "settlement_date": settle_date,
    }


# ─────────────────────────────────────────────────────────────
# Reconciliation
# ─────────────────────────────────────────────────────────────

def reconcile(opening_cash: float) -> dict[str, Any]:
    """
    Audit: does the blotter reconcile to the current cash balance?
    reconciliation_diff must be 0 to the paisa.
    """
    snap = STATE.snapshot()
    blotter = snap["blotter"]

    committed = sum(
        t["amount"] for t in blotter
        if t["status"] in ("COMMITTED", "SETTLED") and t["action"] == "BUY"
    )

    expected_cash = round(opening_cash - committed, 2)
    actual_cash = round(snap["cash_balance"], 2)
    diff = round(abs(expected_cash - actual_cash), 4)

    STATE.set_reconciliation_diff(diff)

    return {
        "opening_cash": opening_cash,
        "total_deployed": round(committed, 2),
        "expected_cash": expected_cash,
        "actual_cash": actual_cash,
        "reconciliation_diff_paisa": diff,
        "status": "OK" if diff < 0.01 else "MISMATCH",
        "trades_audited": len(blotter),
    }


# ─────────────────────────────────────────────────────────────
# Regime break detection (H+8 prep)
# ─────────────────────────────────────────────────────────────

def detect_regime_break(
    recent_credits: list[float],
    historical_credits: list[float],
) -> dict[str, Any]:
    import numpy as np

    threshold = cfg("regime_break", "z_score_threshold", 3.0)
    widen_factor = cfg("regime_break", "interval_widen_factor", 1.5)

    if not recent_credits or not historical_credits:
        return {"detected": False, "regime_widen": 1.0, "z_score": 0.0}

    hist_mean = float(np.mean(historical_credits))
    hist_std = float(np.std(historical_credits)) or 1.0
    recent_mean = float(np.mean(recent_credits))

    z = abs(recent_mean - hist_mean) / hist_std
    detected = z >= threshold

    return {
        "detected": detected,
        "z_score": round(z, 3),
        "threshold": threshold,
        "regime_widen": widen_factor if detected else 1.0,
    }