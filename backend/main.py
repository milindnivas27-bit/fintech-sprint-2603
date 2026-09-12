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
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import load_config
from state import STATE
from engine.ingest import ingest, cancel_reversals
from engine.forecast import forecast as run_forecast
from engine.obligations import build_obligations, compute_safe_investable
from engine.execution import execute, reconcile, detect_regime_break


_START_TIME = time.time()
_PROCESS = psutil.Process(os.getpid())


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_config(force_reload=True)
    yield


app = FastAPI(
    title="FS-2603 — Obligation-Safe Automated Investing",
    version="0.3.0",
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
        "version": "0.3.0",
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
# Invest (now live)
# ─────────────────────────────────────────────────────────

class InvestRequest(BaseModel):
    current_balance: float
    today: str | None = None
    obligations: list[dict] = []
    forecast_days: list[dict] = []


@app.post("/invest")
def invest(req: InvestRequest) -> dict[str, Any]:
    today = req.today or _date.today().isoformat()

    # Reset state for this run and set opening cash
    STATE.reset()
    STATE.set_cash(req.current_balance)

    # Build obligation register
    obligations = build_obligations(req.obligations)
    for o in obligations:
        STATE.add_obligation(o)

    # Compute safe investable amount via binary search on the guard
    investable = compute_safe_investable(
        req.current_balance, req.forecast_days, obligations, today
    )

    # Execute
    result = execute(investable, today, req.forecast_days, obligations)
    return {
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
# Regime break detection
# ─────────────────────────────────────────────────────────

class RegimeCheckRequest(BaseModel):
    recent_credits: list[float] = []
    historical_credits: list[float] = []


@app.post("/regime-check")
def regime_check(req: RegimeCheckRequest) -> dict[str, Any]:
    return detect_regime_break(req.recent_credits, req.historical_credits)