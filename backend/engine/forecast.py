"""
Forecast engine for FS-2603.

Produces a 60-day probabilistic cashflow forecast:
  P10 (pessimistic) / P50 (median) / P90 (optimistic) per day.

Method: bootstrap resampling of daily net cashflow from history.
Deterministic given the configured seed.

Regime widening:
  Applied to the empirical distribution BEFORE resampling, around the
  global mean. This preserves the central tendency while actually
  spreading cumulative endpoints (unlike per-sample widening, which
  preserves each sample's sum and therefore leaves endpoints flat).
"""

from datetime import date as _date, timedelta
from typing import Any

import numpy as np

from config import cfg
from state import Transaction


# ─────────────────────────────────────────────────────────────
# Daily aggregation
# ─────────────────────────────────────────────────────────────

def daily_net(txns: list[Transaction], start: str, end: str) -> np.ndarray:
    """
    Daily net cashflow vector (positive = credit, negative = debit)
    for every day between start and end inclusive.
    """
    d0 = _date.fromisoformat(start)
    d1 = _date.fromisoformat(end)
    n_days = (d1 - d0).days + 1
    series = np.zeros(n_days, dtype=float)

    for t in txns:
        try:
            d = _date.fromisoformat(t.date)
        except ValueError:
            continue
        if d < d0 or d > d1:
            continue
        idx = (d - d0).days
        series[idx] += t.amount

    return series


# ─────────────────────────────────────────────────────────────
# Bootstrap resampling
# ─────────────────────────────────────────────────────────────

def bootstrap_paths(
    history: np.ndarray,
    horizon: int,
    n_samples: int,
    seed: int,
    regime_widen: float = 1.0,
) -> np.ndarray:
    """
    Generate n_samples synthetic paths of length `horizon` by resampling
    from the empirical history with replacement. Returns cumulative sums.
    """
    rng = np.random.default_rng(seed)
    n_days = len(history)
    if n_days == 0:
        return np.zeros((n_samples, horizon), dtype=float)

    # Apply regime widening to the EMPIRICAL DISTRIBUTION before resampling.
    # We widen around the GLOBAL mean (not the per-sample mean) because:
    #   - Widening around global mean → central tendency preserved, spread increases
    #   - Widening around per-sample mean → each sample's sum is preserved,
    #     so cumulative endpoint quantiles never move.
    if regime_widen != 1.0:
        global_mean = float(history.mean())
        history = global_mean + (history - global_mean) * regime_widen

    draws = rng.choice(history, size=(n_samples, horizon), replace=True)
    return np.cumsum(draws, axis=1)


# ─────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────

def forecast(
    txns: list[Transaction],
    start: str,
    horizon_days: int | None = None,
    regime_widen: float | None = None,
) -> dict[str, Any]:
    """
    Produce the P10 / P50 / P90 cash path over `horizon_days` from `start`.
    """
    h = horizon_days or cfg("forecast", "horizon_days", 60)
    n = cfg("forecast", "n_samples", 1000)
    seed = cfg("forecast", "seed", 42)
    history_days = cfg("forecast", "history_days", 90)
    widen = regime_widen if regime_widen is not None else 1.0

    start_date = _date.fromisoformat(start)
    hist_start = (start_date - timedelta(days=history_days)).isoformat()
    hist_end = (start_date - timedelta(days=1)).isoformat()

    history = daily_net(txns, hist_start, hist_end)

    paths = bootstrap_paths(history, h, n, seed, regime_widen=widen)

    # Quantiles across samples, per day
    p05 = np.percentile(paths, 5, axis=0)
    p10 = np.percentile(paths, 10, axis=0)
    p50 = np.percentile(paths, 50, axis=0)
    p90 = np.percentile(paths, 90, axis=0)

    days = []
    for i in range(h):
        day_iso = (start_date + timedelta(days=i)).isoformat()
        days.append({
            "date": day_iso,
            "p05": round(float(p05[i]), 2),
            "p10": round(float(p10[i]), 2),
            "p50": round(float(p50[i]), 2),
            "p90": round(float(p90[i]), 2),
        })

    coverage = _empirical_coverage(history, p10, p90)

    return {
        "start": start,
        "horizon_days": h,
        "history_days": history_days,
        "n_samples": n,
        "seed": seed,
        "regime_widen": widen,
        "days": days,
        "calibration": {
            "p90_interval_coverage": coverage,
            "target": [0.85, 0.95],
        },
        "summary": {
            "p10_end": days[-1]["p10"] if days else 0.0,
            "p50_end": days[-1]["p50"] if days else 0.0,
            "p90_end": days[-1]["p90"] if days else 0.0,
            "band_width_end": round(
                (days[-1]["p90"] - days[-1]["p10"]) if days else 0.0, 2
            ),
        },
    }


def _empirical_coverage(history: np.ndarray, p10: np.ndarray, p90: np.ndarray) -> float:
    """
    Fraction of historical daily values inside the P10–P90 band.
    A deterministic self-check, not the sealed metric.
    """
    if len(history) == 0:
        return 1.0
    n = min(len(history), len(p10))
    band_lo = p10[:n]
    band_hi = p90[:n]
    sample = history[-n:]
    hits = ((sample >= band_lo) & (sample <= band_hi)).sum()
    return round(float(hits) / n, 4)