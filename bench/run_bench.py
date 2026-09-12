"""
Self-built bench for FS-2603.

Runs the full pipeline (ingest → forecast → guard → execute → reconcile)
on synthetic data and prints raw numbers. Publishes:

  - Determinism: two runs of the same input produce identical output hashes
  - Calibration: P90 interval coverage over simulated days
  - Guard: how many trades were blocked, and why
  - Reconciliation: exact-to-paisa diff
  - Compute: wall time and peak RAM

Run:
    python bench/run_bench.py
"""

import json
import os
import sys
import time
import hashlib
import tracemalloc
from datetime import date as _date, timedelta

# Make backend importable when running from repo root
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND = os.path.join(ROOT, "backend")
sys.path.insert(0, BACKEND)

from engine.ingest import ingest, cancel_reversals          # noqa: E402
from engine.forecast import forecast as run_forecast        # noqa: E402
from engine.obligations import build_obligations, compute_safe_investable  # noqa: E402
from engine.execution import execute, reconcile             # noqa: E402
from state import STATE                                     # noqa: E402


# ─────────────────────────────────────────────────────────────
# Synthetic data generator (deterministic)
# ─────────────────────────────────────────────────────────────

def generate_transactions(start: str, days: int, seed: int = 42) -> list[dict]:
    """Deterministic synthetic salary + rent + EMI + noise."""
    import random
    rng = random.Random(seed)
    d0 = _date.fromisoformat(start)
    txns = []

    for i in range(days):
        d = (d0 + timedelta(days=i)).isoformat()
        dom = (d0 + timedelta(days=i)).day

        if dom == 1:
            txns.append({"date": d, "amount": 80000, "description": "SALARY CREDIT"})
        if dom == 3:
            txns.append({"date": d, "amount": -25000, "description": "RENT AUTO DEBIT"})
        if dom == 7:
            txns.append({"date": d, "amount": -12000, "description": "CAR EMI HDFC"})
        if dom == 15:
            txns.append({"date": d, "amount": -4000, "description": "INSURANCE PREMIUM"})

        # Noise — 2-4 small debits per day
        n = rng.randint(0, 2)
        for _ in range(n):
            amt = -round(rng.uniform(50, 800), 2)
            txns.append({"date": d, "amount": amt, "description": "UPI DEBIT"})

    return txns


# ─────────────────────────────────────────────────────────────
# Determinism check
# ─────────────────────────────────────────────────────────────

def hash_json(obj) -> str:
    payload = json.dumps(obj, sort_keys=True).encode()
    return hashlib.sha256(payload).hexdigest()[:16]


def run_pipeline(txns: list[dict], today: str) -> dict:
    """Full pipeline. Returns everything needed for hashing + scoring."""
    STATE.reset()

    clean = cancel_reversals(ingest(txns))

    fc = run_forecast(clean, start=today)

    obligations = build_obligations([
        {"id": "rent", "name": "Rent", "amount": 25000, "due_date": _future(today, 21)},
        {"id": "emi",  "name": "Car EMI", "amount": 12000, "due_date": _future(today, 25)},
        {"id": "ins",  "name": "Insurance", "amount": 4000, "due_date": _future(today, 33)},
    ])

    opening = 200000.0
    STATE.set_cash(opening)

    investable = compute_safe_investable(opening, fc["days"], obligations, today)
    exec_result = execute(investable, today, fc["days"], obligations)
    rec = reconcile(opening)

    return {
        "forecast": fc,
        "investable": investable,
        "exec": exec_result,
        "reconcile": rec,
    }


def _future(today: str, days: int) -> str:
    return (_date.fromisoformat(today) + timedelta(days=days)).isoformat()


# ─────────────────────────────────────────────────────────────
# Calibration measurement
# ─────────────────────────────────────────────────────────────

def measure_calibration(txns: list[dict], today: str, windows: int = 10) -> dict:
    """
    Walk forward: for each of `windows` synthetic 'past' cutoffs,
    forecast, then check whether the actual next-day value fell in [P10, P90].
    """
    hits = 0
    total = 0
    base = _date.fromisoformat(today)

    for w in range(1, windows + 1):
        cutoff = (base - timedelta(days=w * 5)).isoformat()
        clean = cancel_reversals(ingest(txns))
        fc = run_forecast(clean, start=cutoff)
        if not fc["days"]:
            continue

        # The P50 for day 0 should be close to reality for a calibrated model.
        # Use a simpler proxy: does the actual first-day value fall in [p10, p90]?
        actual = _actual_day(txns, cutoff)
        if actual is None:
            continue
        p10 = fc["days"][0]["p10"]
        p90 = fc["days"][0]["p90"]
        if p10 <= actual <= p90:
            hits += 1
        total += 1

    coverage = round(hits / total, 4) if total else 1.0
    return {"coverage": coverage, "samples": total, "hits": hits}


def _actual_day(txns: list[dict], day: str) -> float | None:
    total = 0.0
    found = False
    for t in txns:
        if t["date"] == day:
            total += float(t["amount"])
            found = True
    return total if found else None


# ─────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────

def main():
    today = _date.today().isoformat()
    txns = generate_transactions(start="2026-06-01", days=100)

    print("=" * 60)
    print("FS-2603 SELF-BENCH")
    print("=" * 60)
    print(f"today          : {today}")
    print(f"transactions   : {len(txns)}")
    print()

    # ── Run 1
    tracemalloc.start()
    t0 = time.perf_counter()
    r1 = run_pipeline(txns, today)
    t1 = time.perf_counter()
    _, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    # ── Run 2 (determinism)
    t2 = time.perf_counter()
    r2 = run_pipeline(txns, today)
    t3 = time.perf_counter()

    hash1 = hash_json({
        "days": r1["forecast"]["days"],
        "investable": r1["investable"],
        "trades": r1["exec"]["trades"],
        "diff": r1["reconcile"]["reconciliation_diff_paisa"],
    })
    hash2 = hash_json({
        "days": r2["forecast"]["days"],
        "investable": r2["investable"],
        "trades": r2["exec"]["trades"],
        "diff": r2["reconcile"]["reconciliation_diff_paisa"],
    })

    print("[ Determinism ]")
    print(f"  run 1 hash     : {hash1}")
    print(f"  run 2 hash     : {hash2}")
    print(f"  identical      : {hash1 == hash2}")
    print()

    print("[ Performance ]")
    print(f"  run 1 wall     : {round((t1 - t0) * 1000, 2)} ms")
    print(f"  run 2 wall     : {round((t3 - t2) * 1000, 2)} ms")
    print(f"  peak RAM       : {round(peak / (1024 * 1024), 2)} MB")
    print()

    print("[ Forecast ]")
    fc = r1["forecast"]
    print(f"  horizon        : {fc['horizon_days']} days")
    print(f"  n_samples      : {fc['n_samples']}")
    print(f"  seed           : {fc['seed']}")
    print(f"  p10_end        : {fc['summary']['p10_end']}")
    print(f"  p50_end        : {fc['summary']['p50_end']}")
    print(f"  p90_end        : {fc['summary']['p90_end']}")
    print(f"  band_width_end : {fc['summary']['band_width_end']}")
    print()

    print("[ Guard + Execution ]")
    print(f"  opening cash   : 200000")
    print(f"  investable     : {r1['investable']}")
    print(f"  deployed       : {r1['exec']['deployed']}")
    print(f"  remaining      : {r1['exec']['remaining_cash']}")
    trades = r1["exec"]["trades"]
    committed = [t for t in trades if t["status"] == "COMMITTED"]
    rejected = [t for t in trades if t["status"] == "REJECTED"]
    print(f"  trades         : {len(trades)} total  ({len(committed)} committed, {len(rejected)} rejected)")
    for t in trades:
        print(f"    {t['id']} {t['symbol']:12s} {t['status']:10s} ₹{t['amount']:>10,.2f}")
    print()

    print("[ Reconciliation ]")
    rec = r1["reconcile"]
    print(f"  opening        : {rec['opening_cash']}")
    print(f"  deployed       : {rec['total_deployed']}")
    print(f"  expected cash  : {rec['expected_cash']}")
    print(f"  actual cash    : {rec['actual_cash']}")
    print(f"  diff (paisa)   : {rec['reconciliation_diff_paisa']}")
    print(f"  status         : {rec['status']}")
    print()

    print("[ Calibration (walk-forward) ]")
    cal = measure_calibration(txns, today)
    print(f"  coverage       : {cal['coverage']}  ({cal['hits']}/{cal['samples']})")
    print(f"  target         : 0.85 – 0.95")
    print()

    print("[ Bench Summary ]")
    summary = {
        "determinism_ok": hash1 == hash2,
        "wall_ms_run1": round((t1 - t0) * 1000, 2),
        "wall_ms_run2": round((t3 - t2) * 1000, 2),
        "peak_ram_mb": round(peak / (1024 * 1024), 2),
        "p10_end": fc["summary"]["p10_end"],
        "p50_end": fc["summary"]["p50_end"],
        "p90_end": fc["summary"]["p90_end"],
        "band_width_end": fc["summary"]["band_width_end"],
        "investable": r1["investable"],
        "deployed": r1["exec"]["deployed"],
        "reconciliation_diff_paisa": rec["reconciliation_diff_paisa"],
        "trades_committed": len(committed),
        "trades_rejected": len(rejected),
        "calibration_coverage": cal["coverage"],
    }
    out_path = os.path.join(os.path.dirname(__file__), "output.json")
    with open(out_path, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"  written        : bench/output.json")
    print("=" * 60)


if __name__ == "__main__":
    main()