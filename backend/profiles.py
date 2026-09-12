"""
Pre-loaded household profiles for FS-2603.

Five realistic scenarios spanning the household spectrum. Each ships
with 3 months of transaction history, a fixed obligation register,
and an opening balance. The /profiles endpoint serves these; the
frontend selector lets anyone run any of them through the pipeline.
"""

from typing import Any


def _month(prefix: str, entries: list[tuple[int, float, str]]) -> list[dict]:
    return [
        {"date": f"{prefix}-{day:02d}", "amount": amount, "description": desc}
        for (day, amount, desc) in entries
    ]


# ─────────────────────────────────────────────────────────────
# 1. Ravi — Stable salaried
# ─────────────────────────────────────────────────────────────

RAVI = {
    "id": "ravi",
    "name": "Ravi",
    "role": "Stable salaried · Bangalore",
    "description": "Regular 80k salary on the 1st, three fixed obligations. The textbook stable case.",
    "opening_balance": 200000,
    "transactions": (
        _month("2026-06", [
            (1, 80000, "SALARY CREDIT"),
            (3, -25000, "RENT AUTO DEBIT"),
            (7, -12000, "CAR EMI HDFC"),
            (15, -4000, "INSURANCE LIC"),
            (18, -850, "UPI SWIGGY"),
            (22, -1200, "UPI BLINKIT"),
        ]) + _month("2026-07", [
            (1, 80000, "SALARY CREDIT"),
            (3, -25000, "RENT AUTO DEBIT"),
            (7, -12000, "CAR EMI HDFC"),
            (15, -4000, "INSURANCE LIC"),
            (20, -650, "UPI ZOMATO"),
            (28, -1800, "UPI AMAZON"),
        ]) + _month("2026-08", [
            (1, 80000, "SALARY CREDIT"),
            (3, -25000, "RENT AUTO DEBIT"),
            (7, -12000, "CAR EMI HDFC"),
            (15, -4000, "INSURANCE LIC"),
            (23, -950, "UPI SWIGGY"),
        ])
    ),
    "obligations": [
        {"id": "rent", "name": "Rent", "amount": 25000, "due_date": "2026-10-03"},
        {"id": "emi", "name": "Car EMI", "amount": 12000, "due_date": "2026-10-07"},
        {"id": "ins", "name": "Insurance", "amount": 4000, "due_date": "2026-10-15"},
    ],
}


# ─────────────────────────────────────────────────────────────
# 2. Priya — Freelancer, irregular income
# ─────────────────────────────────────────────────────────────

PRIYA = {
    "id": "priya",
    "name": "Priya",
    "role": "Freelance designer · Mumbai",
    "description": "Income swings from ₹40k to ₹1.2L depending on project cycles. Wide forecast bands.",
    "opening_balance": 150000,
    "transactions": (
        _month("2026-06", [
            (4, 40000, "UPWORK PAYOUT"),
            (5, -18000, "RENT AUTO DEBIT"),
            (12, -3000, "HEALTH INSURANCE"),
            (19, -2200, "ADOBE SUBSCRIPTION"),
        ]) + _month("2026-07", [
            (2, 85000, "UPWORK PAYOUT"),
            (5, -18000, "RENT AUTO DEBIT"),
            (14, 35000, "DIRECT CLIENT PAYMENT"),
            (20, -3000, "HEALTH INSURANCE"),
            (24, -1100, "UPI SWIGGY"),
        ]) + _month("2026-08", [
            (6, 60000, "UPWORK PAYOUT"),
            (5, -18000, "RENT AUTO DEBIT"),
            (18, 35000, "DIRECT CLIENT PAYMENT"),
            (20, -3000, "HEALTH INSURANCE"),
            (26, -2400, "ADOBE SUBSCRIPTION"),
        ])
    ),
    "obligations": [
        {"id": "rent", "name": "Rent", "amount": 18000, "due_date": "2026-10-05"},
        {"id": "ins", "name": "Health Insurance", "amount": 3000, "due_date": "2026-10-20"},
    ],
}


# ─────────────────────────────────────────────────────────────
# 3. Arjun — Gig worker, small daily incomes
# ─────────────────────────────────────────────────────────────

ARJUN = {
    "id": "arjun",
    "name": "Arjun",
    "role": "Gig driver · Hyderabad",
    "description": "Daily platform payouts, small balance, tiny margin. The tight-buffer case.",
    "opening_balance": 25000,
    "transactions": (
        _month("2026-06", [
            (1, 9500, "SWIGGY WEEKLY PAYOUT"),
            (8, 11200, "SWIGGY WEEKLY PAYOUT"),
            (10, -8000, "RENT SHARED"),
            (15, 10400, "SWIGGY WEEKLY PAYOUT"),
            (22, 9800, "SWIGGY WEEKLY PAYOUT"),
            (26, -1500, "PETROL UPI"),
        ]) + _month("2026-07", [
            (1, 10100, "SWIGGY WEEKLY PAYOUT"),
            (8, 10800, "SWIGGY WEEKLY PAYOUT"),
            (10, -8000, "RENT SHARED"),
            (15, 11500, "SWIGGY WEEKLY PAYOUT"),
            (22, 9900, "SWIGGY WEEKLY PAYOUT"),
            (28, -1800, "PETROL UPI"),
        ]) + _month("2026-08", [
            (1, 10200, "SWIGGY WEEKLY PAYOUT"),
            (8, 11000, "SWIGGY WEEKLY PAYOUT"),
            (10, -8000, "RENT SHARED"),
            (15, 10700, "SWIGGY WEEKLY PAYOUT"),
            (22, 10300, "SWIGGY WEEKLY PAYOUT"),
        ])
    ),
    "obligations": [
        {"id": "rent", "name": "Rent (shared)", "amount": 8000, "due_date": "2026-10-10"},
    ],
}


# ─────────────────────────────────────────────────────────────
# 4. Meera — High income, heavy obligations
# ─────────────────────────────────────────────────────────────

MEERA = {
    "id": "meera",
    "name": "Meera",
    "role": "Senior manager · Gurgaon",
    "description": "₹2.5L monthly income but 5 fixed obligations. Large balance, high stakes.",
    "opening_balance": 800000,
    "transactions": (
        _month("2026-06", [
            (1, 250000, "SALARY CREDIT"),
            (3, -45000, "RENT AUTO DEBIT"),
            (5, -30000, "HOME LOAN EMI"),
            (7, -15000, "CAR EMI"),
            (10, -25000, "SCHOOL FEES"),
            (15, -8000, "INSURANCE LIC"),
        ]) + _month("2026-07", [
            (1, 250000, "SALARY CREDIT"),
            (3, -45000, "RENT AUTO DEBIT"),
            (5, -30000, "HOME LOAN EMI"),
            (7, -15000, "CAR EMI"),
            (10, -25000, "SCHOOL FEES"),
            (15, -8000, "INSURANCE LIC"),
            (22, -4500, "UPI TATA CLIQ"),
        ]) + _month("2026-08", [
            (1, 250000, "SALARY CREDIT"),
            (3, -45000, "RENT AUTO DEBIT"),
            (5, -30000, "HOME LOAN EMI"),
            (7, -15000, "CAR EMI"),
            (10, -25000, "SCHOOL FEES"),
            (15, -8000, "INSURANCE LIC"),
        ])
    ),
    "obligations": [
        {"id": "rent", "name": "Rent", "amount": 45000, "due_date": "2026-10-03"},
        {"id": "homeloan", "name": "Home Loan", "amount": 30000, "due_date": "2026-10-05"},
        {"id": "car", "name": "Car EMI", "amount": 15000, "due_date": "2026-10-07"},
        {"id": "school", "name": "School Fees", "amount": 25000, "due_date": "2026-10-10"},
        {"id": "ins", "name": "Insurance", "amount": 8000, "due_date": "2026-10-15"},
    ],
}


# ─────────────────────────────────────────────────────────────
# 5. Kiran — Early career, low income
# ─────────────────────────────────────────────────────────────

KIRAN = {
    "id": "kiran",
    "name": "Kiran",
    "role": "Junior developer · Pune",
    "description": "First job. ₹35k salary, shared rent, no EMI. Building a first buffer.",
    "opening_balance": 40000,
    "transactions": (
        _month("2026-06", [
            (1, 35000, "SALARY CREDIT"),
            (3, -6000, "RENT SHARED"),
            (12, -900, "UPI SWIGGY"),
            (18, -1400, "UPI ZOMATO"),
            (25, -2200, "UPI MYNTRA"),
        ]) + _month("2026-07", [
            (1, 35000, "SALARY CREDIT"),
            (3, -6000, "RENT SHARED"),
            (10, -750, "UPI SWIGGY"),
            (19, -1100, "UPI BOOKMYSHOW"),
            (27, -1800, "UPI AMAZON"),
        ]) + _month("2026-08", [
            (1, 35000, "SALARY CREDIT"),
            (3, -6000, "RENT SHARED"),
            (14, -650, "UPI SWIGGY"),
            (22, -950, "UPI ZOMATO"),
        ])
    ),
    "obligations": [
        {"id": "rent", "name": "Rent (shared)", "amount": 6000, "due_date": "2026-10-03"},
    ],
}


# ─────────────────────────────────────────────────────────────
# Registry
# ─────────────────────────────────────────────────────────────

_PROFILES = [RAVI, PRIYA, ARJUN, MEERA, KIRAN]


def list_profile_summaries() -> list[dict[str, Any]]:
    """Lightweight list — no transactions — for the frontend selector."""
    return [
        {
            "id": p["id"],
            "name": p["name"],
            "role": p["role"],
            "description": p["description"],
            "opening_balance": p["opening_balance"],
            "obligation_count": len(p["obligations"]),
            "transaction_count": len(p["transactions"]),
        }
        for p in _PROFILES
    ]


def get_profile(profile_id: str) -> dict[str, Any] | None:
    for p in _PROFILES:
        if p["id"] == profile_id:
            return p
    return None