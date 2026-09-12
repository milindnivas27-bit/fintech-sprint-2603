"""
Deterministic single-writer state for FS-2603.

Holds:
- The obligation register (fixed, forward-declared commitments)
- The cash ledger (current balance)
- The blotter (append-only trade log)
- Scored-run counters (missed obligations, reconciliation diff, P90 samples)

Single-writer by design: no concurrent mutation, no partial writes.
"""

from dataclasses import dataclass, field, asdict
from typing import Any
import threading


@dataclass
class Transaction:
    id: str
    date: str          # ISO YYYY-MM-DD
    amount: float      # positive = credit, negative = debit
    merchant: str
    raw_description: str = ""


@dataclass
class Obligation:
    id: str
    name: str
    amount: float
    due_date: str      # ISO YYYY-MM-DD
    recurrence: str = "one-off"   # "monthly" | "one-off"


@dataclass
class Trade:
    id: str
    timestamp: str
    action: str        # "BUY" | "SELL"
    symbol: str
    amount: float
    price: float
    status: str        # "COMMITTED" | "SETTLED" | "REJECTED"
    settlement_date: str
    tax_lot_id: str = ""
    reason: str = ""


@dataclass
class StateSnapshot:
    cash_balance: float
    obligations: list[dict]
    blotter: list[dict]
    missed_obligations: int
    reconciliation_diff: float
    p90_coverage_ratio: float
    p90_samples: int


class AppState:
    """Deterministic single-writer state."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.reset()

    def reset(self) -> None:
        with self._lock:
            self.cash_balance: float = 0.0
            self.obligations: list[Obligation] = []
            self.blotter: list[Trade] = []
            self.missed_obligations: int = 0
            self.reconciliation_diff: float = 0.0
            self.p90_hits: int = 0
            self.p90_samples: int = 0

    # ── Obligations ──────────────────────────────────────

    def add_obligation(self, o: Obligation) -> None:
        with self._lock:
            self.obligations.append(o)

    def upcoming_obligations(self, from_date: str) -> list[Obligation]:
        with self._lock:
            return [o for o in self.obligations if o.due_date >= from_date]

    # ── Cash + blotter ───────────────────────────────────

    def set_cash(self, value: float) -> None:
        with self._lock:
            self.cash_balance = round(value, 2)

    def record_trade(self, t: Trade) -> None:
        with self._lock:
            self.blotter.append(t)

    # ── Scored counters ──────────────────────────────────

    def record_missed_obligation(self) -> None:
        with self._lock:
            self.missed_obligations += 1

    def record_p90_sample(self, hit: bool) -> None:
        with self._lock:
            self.p90_samples += 1
            if hit:
                self.p90_hits += 1

    def set_reconciliation_diff(self, value: float) -> None:
        with self._lock:
            self.reconciliation_diff = round(value, 4)

    # ── Snapshot ─────────────────────────────────────────

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            coverage = (
                round(self.p90_hits / self.p90_samples, 4)
                if self.p90_samples > 0
                else 1.0
            )
            return asdict(StateSnapshot(
                cash_balance=self.cash_balance,
                obligations=[asdict(o) for o in self.obligations],
                blotter=[asdict(t) for t in self.blotter],
                missed_obligations=self.missed_obligations,
                reconciliation_diff=self.reconciliation_diff,
                p90_coverage_ratio=coverage,
                p90_samples=self.p90_samples,
            ))


# Module-level singleton — imported everywhere
STATE = AppState()