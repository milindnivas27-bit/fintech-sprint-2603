"""
FS-2603 — Obligation-Safe Automated Investing
FastAPI entry point.
"""

from contextlib import asynccontextmanager
from datetime import date as _date
from typing import Any
import os
import time

import psutil
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import load_config
from state import STATE
from engine.ingest import ingest, cancel_reversals
from engine.forecast import forecast as run_forecast
from engine.obligations import build_obligations, compute_safe_investable
from engine.execution import execute, reconcile, detect_regime_break
from profiles import list_profile_summaries, get_profile
from db import init_db, log_run, list_runs, get_run, stats as db_stats


_START_TIME = time.time()
_PROCESS = psutil.Process(os.getpid())


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_config(force_reload=True)
    init_db()
    yield


app = FastAPI(
    title="FS-2603 — Obligation-Safe Automated Investing",
    version="0.5.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────
# Observability
# ─────────────────────────────────────────────────────────

@app.get("/healthz")
def healthz() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "fs-2603",
        "version": "0.5.0",
        "uptime_seconds": round(time.time() - _START_TIME, 2),
    }


@app.get("/metrics")
def metrics() -> dict[str, Any]:
    snap = STATE.snapshot()
    mem = _PROCESS.memory_info()
    cpu = _PROCESS.cpu_times()
    return {
        "missed_obligations_total": snap["missed_obligations"],
        "p90_coverage_ratio": snap["p90_coverage_ratio"],
        "reconciliation_diff_paisa": round(snap["reconciliation_diff"], 2),
        "obligations_registered": len(snap["obligations"]),
        "blotter_size": len(snap["blotter"]),
        "cash_balance": snap["cash_balance"],
        "uptime_seconds": round(time.time() - _START_TIME, 2),
        "peak_ram_mb": round(mem.rss / (1024 * 1024), 2),
        "cpu_time_seconds": round(cpu.user + cpu.system, 3),
    }


@app.get("/state")
def state() -> dict[str, Any]:
    return STATE.snapshot()


@app.post("/reset")
def reset() -> dict[str, str]:
    STATE.reset()
    return {"status": "reset"}


# ─────────────────────────────────────────────────────────
# Database endpoints
# ─────────────────────────────────────────────────────────

@app.get("/runs")
def runs_endpoint(limit: int = 50) -> dict[str, Any]:
    """Recent pipeline runs from the audit database."""
    return {"runs": list_runs(limit)}


@app.get("/runs/{run_id}")
def run_detail(run_id: int) -> dict[str, Any]:
    """Full record of a single run, including trades and obligations."""
    r = get_run(run_id)
    if not r:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    return r


@app.get("/db-stats")
def db_stats_endpoint() -> dict[str, Any]:
    """Aggregate stats across every logged run."""
    return db_stats()


# ─────────────────────────────────────────────────────────
# Profiles
# ─────────────────────────────────────────────────────────

@app.get("/profiles")
def profiles() -> dict[str, Any]:
    return {"profiles": list_profile_summaries()}


@app.get("/profiles/{profile_id}")
def profile_detail(profile_id: str) -> dict[str, Any]:
    p = get_profile(profile_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Profile '{profile_id}' not found")
    return p


# ─────────────────────────────────────────────────────────
# Forecast
# ─────────────────────────────────────────────────────────

class ForecastRequest(BaseModel):
    transactions: list[dict] = []
    start_date: str | None = None
    horizon_days: int | None = None
    regime_widen: float | None = None


@app.post("/forecast")
def forecast_endpoint(req: ForecastRequest) -> dict[str, Any]:
    txns = cancel_reversals(ingest(req.transactions))
    start = req.start_date or _date.today().isoformat()
    result = run_forecast(
        txns,
        start=start,
        horizon_days=req.horizon_days,
        regime_widen=req.regime_widen,
    )
    result["transactions_ingested"] = len(txns)
    result["transactions_raw"] = len(req.transactions)
    return result


# ─────────────────────────────────────────────────────────
# Invest + persist
# ─────────────────────────────────────────────────────────

class InvestRequest(BaseModel):
    current_balance: float
    today: str | None = None
    obligations: list[dict] = []
    forecast_days: list[dict] = []
    profile_id: str | None = None


@app.post("/invest")
def invest(req: InvestRequest) -> dict[str, Any]:
    today = req.today or _date.today().isoformat()

    STATE.reset()
    STATE.set_cash(req.current_balance)

    obligations = build_obligations(req.obligations)
    for o in obligations:
        STATE.add_obligation(o)

    investable = compute_safe_investable(
        req.current_balance, req.forecast_days, obligations, today
    )

    result = execute(investable, today, req.forecast_days, obligations)

    # Persist to database
    fc_summary = {}
    if req.forecast_days:
        last = req.forecast_days[-1]
        fc_summary = {
            "p10_end": last.get("p10", 0),
            "p50_end": last.get("p50", 0),
            "p90_end": last.get("p90", 0),
        }

    run_id = log_run(
        profile_id=req.profile_id,
        opening_cash=req.current_balance,
        safe_investable=investable,
        deployed=result["deployed"],
        remaining_cash=result["remaining_cash"],
        reconciliation_diff_paisa=0.0,
        trades=result["trades"],
        forecast_summary=fc_summary,
        obligations=req.obligations,
    )

    return {
        "run_id": run_id,
        "today": today,
        "opening_cash": req.current_balance,
        "safe_investable": investable,
        **result,
    }


# ─────────────────────────────────────────────────────────
# Reconcile
# ─────────────────────────────────────────────────────────

class ReconcileRequest(BaseModel):
    opening_cash: float


@app.post("/reconcile")
def reconcile_endpoint(req: ReconcileRequest) -> dict[str, Any]:
    return reconcile(req.opening_cash)


# ─────────────────────────────────────────────────────────
# Regime break
# ─────────────────────────────────────────────────────────

class RegimeCheckRequest(BaseModel):
    recent_credits: list[float] = []
    historical_credits: list[float] = []


@app.post("/regime-check")
def regime_check(req: RegimeCheckRequest) -> dict[str, Any]:
    return detect_regime_break(req.recent_credits, req.historical_credits)