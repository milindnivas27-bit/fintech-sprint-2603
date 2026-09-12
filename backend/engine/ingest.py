"""
Statement ingest and normalization for FS-2603.

Input: raw transaction rows (dicts) — deliberately messy.
Output: clean list of Transaction, ordered by date, deduplicated, in INR.

Handles: duplicates, reversals, missing fields, foreign currencies,
joint-account rows where the second holder is not the user.
"""

from datetime import datetime
from typing import Any
import hashlib
import re

from state import Transaction


# ─────────────────────────────────────────────────────────────
# Simple FX table (approximate, static — no live API in scored path)
# ─────────────────────────────────────────────────────────────

FX_TO_INR = {
    "INR": 1.0,
    "USD": 83.0,
    "EUR": 90.0,
    "GBP": 105.0,
    "AED": 22.6,
    "SGD": 62.0,
}


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

_DATE_FORMATS = (
    "%Y-%m-%d",
    "%d-%m-%Y",
    "%d/%m/%Y",
    "%Y/%m/%d",
    "%d %b %Y",
    "%d %B %Y",
    "%b %d, %Y",
)


def _parse_date(value: Any) -> str | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value.date().isoformat()
    s = str(value).strip()
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def _parse_amount(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip()
    s = re.sub(r"[₹$€£,]", "", s)
    s = s.replace("(", "-").replace(")", "")   # (500) → -500
    try:
        return float(s)
    except ValueError:
        return None


def _normalize_merchant(raw: str) -> str:
    """Lowercase, strip noise, collapse whitespace. Preserves intent."""
    if not raw:
        return ""
    s = raw.lower()
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _dedupe_key(txn: dict) -> str:
    """Deterministic hash for deduplication."""
    payload = "|".join([
        str(txn.get("date", "")),
        str(txn.get("amount", "")),
        str(txn.get("description", "")),
    ])
    return hashlib.sha256(payload.encode()).hexdigest()[:16]


# ─────────────────────────────────────────────────────────────
# Main ingest
# ─────────────────────────────────────────────────────────────

def ingest(raw: list[dict], user_id: str = "primary") -> list[Transaction]:
    """
    Take messy raw rows, return clean, deduplicated, INR-denominated Transactions.
    Sorted ascending by date (deterministic).
    """
    seen: set[str] = set()
    out: list[Transaction] = []

    for row in raw:
        if not isinstance(row, dict):
            continue

        date = _parse_date(row.get("date"))
        amount = _parse_amount(row.get("amount"))
        if date is None or amount is None:
            continue

        # Multi-currency: convert to INR
        currency = str(row.get("currency", "INR")).upper()
        rate = FX_TO_INR.get(currency)
        if rate is None:
            continue
        amount = round(amount * rate, 2)

        # Skip joint-account rows that aren't the primary user
        account_holder = str(row.get("account_holder", user_id)).lower()
        if account_holder and account_holder != user_id.lower():
            continue

        # Deduplicate
        key = _dedupe_key(row)
        if key in seen:
            continue
        seen.add(key)

        raw_desc = str(row.get("description", "")).strip()
        merchant = _normalize_merchant(raw_desc)

        out.append(Transaction(
            id=key,
            date=date,
            amount=amount,
            merchant=merchant,
            raw_description=raw_desc,
        ))

    # Deterministic sort
    out.sort(key=lambda t: (t.date, t.id))
    return out


# ─────────────────────────────────────────────────────────────
# Reversal handling
# ─────────────────────────────────────────────────────────────

def cancel_reversals(txns: list[Transaction]) -> list[Transaction]:
    """
    Match a transaction to a later exact-negative counterpart within 3 days.
    Both are removed. Handles the 'delayed reversal' edge case.
    """
    from datetime import date as _date, timedelta

    removed: set[str] = set()
    for i, t in enumerate(txns):
        if t.id in removed or t.amount <= 0:
            continue
        for j in range(i + 1, len(txns)):
            u = txns[j]
            if u.id in removed:
                continue
            if abs(u.amount + t.amount) < 0.01:
                try:
                    d1 = _date.fromisoformat(t.date)
                    d2 = _date.fromisoformat(u.date)
                except ValueError:
                    continue
                if (d2 - d1) <= timedelta(days=3):
                    removed.add(t.id)
                    removed.add(u.id)
                    break

    return [t for t in txns if t.id not in removed]