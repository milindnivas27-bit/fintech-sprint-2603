"""
Persistence layer for FS-2603.

Stores every pipeline run so judges can audit history.
SQLite for the demo. Postgres in production.
"""

import sqlite3
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DB_PATH = Path(__file__).parent / "fs2603.db"


def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = _conn()
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            profile_id TEXT,
            opening_cash REAL,
            safe_investable REAL,
            deployed REAL,
            remaining_cash REAL,
            reconciliation_diff_paisa REAL,
            trade_count INTEGER,
            rejection_count INTEGER,
            trades_json TEXT,
            forecast_summary_json TEXT
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS obligations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER NOT NULL,
            name TEXT,
            amount REAL,
            due_date TEXT,
            FOREIGN KEY(run_id) REFERENCES runs(id)
        )
    """)
    c.execute("CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs(created_at DESC)")
    conn.commit()
    conn.close()


def log_run(
    profile_id: str | None,
    opening_cash: float,
    safe_investable: float,
    deployed: float,
    remaining_cash: float,
    reconciliation_diff_paisa: float,
    trades: list[dict],
    forecast_summary: dict,
    obligations: list[dict],
) -> int:
    conn = _conn()
    c = conn.cursor()

    trade_count = len(trades)
    rejection_count = sum(1 for t in trades if t.get("status") == "REJECTED")

    c.execute("""
        INSERT INTO runs (
            created_at, profile_id, opening_cash, safe_investable,
            deployed, remaining_cash, reconciliation_diff_paisa,
            trade_count, rejection_count, trades_json, forecast_summary_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        datetime.now(timezone.utc).isoformat(),
        profile_id,
        float(opening_cash),
        float(safe_investable),
        float(deployed),
        float(remaining_cash),
        float(reconciliation_diff_paisa),
        trade_count,
        rejection_count,
        json.dumps(trades),
        json.dumps(forecast_summary),
    ))
    run_id = c.lastrowid

    for o in obligations:
        c.execute(
            "INSERT INTO obligations (run_id, name, amount, due_date) VALUES (?, ?, ?, ?)",
            (run_id, o.get("name"), float(o.get("amount", 0)), o.get("due_date")),
        )

    conn.commit()
    conn.close()
    return run_id or 0


def list_runs(limit: int = 50) -> list[dict[str, Any]]:
    conn = _conn()
    c = conn.cursor()
    rows = c.execute("""
        SELECT id, created_at, profile_id, opening_cash, safe_investable,
               deployed, remaining_cash, reconciliation_diff_paisa,
               trade_count, rejection_count
        FROM runs
        ORDER BY id DESC
        LIMIT ?
    """, (limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_run(run_id: int) -> dict[str, Any] | None:
    conn = _conn()
    c = conn.cursor()
    row = c.execute("SELECT * FROM runs WHERE id = ?", (run_id,)).fetchone()
    if not row:
        conn.close()
        return None
    run = dict(row)
    run["trades"] = json.loads(run.pop("trades_json") or "[]")
    run["forecast_summary"] = json.loads(run.pop("forecast_summary_json") or "{}")
    obs = c.execute(
        "SELECT name, amount, due_date FROM obligations WHERE run_id = ?", (run_id,)
    ).fetchall()
    run["obligations"] = [dict(o) for o in obs]
    conn.close()
    return run


def stats() -> dict[str, Any]:
    conn = _conn()
    c = conn.cursor()
    total = c.execute("SELECT COUNT(*) FROM runs").fetchone()[0]
    avg_investable = c.execute("SELECT AVG(safe_investable) FROM runs").fetchone()[0] or 0
    avg_deployed = c.execute("SELECT AVG(deployed) FROM runs").fetchone()[0] or 0
    total_trades = c.execute("SELECT SUM(trade_count) FROM runs").fetchone()[0] or 0
    conn.close()
    return {
        "total_runs": total,
        "avg_safe_investable": round(float(avg_investable), 2),
        "avg_deployed": round(float(avg_deployed), 2),
        "total_trades": int(total_trades),
    }