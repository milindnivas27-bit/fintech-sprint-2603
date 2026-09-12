# FS-2603 — Obligation-Safe Automated Investing

An investment engine that never misses a bill.

**Team:** Milind Nivas · Yuvan Chennu

**Statement:** FS-2603 · Wealth & Planning · Personal Finance + Investment Platforms

## What this is

An automated investment system that determines, from a probabilistic cashflow forecast, how much of a household's balance can safely be invested over a 60-day horizon — guaranteeing no fixed obligation is ever missed.

## 3-Command Run
git clone <repo-url>
cd fintech-sprint-2603
docker compose up


*(Filled in as the build progresses — Round 3 requirement.)*

## Structure

- `backend/` — Python engine (forecast + execution)
- `frontend/` — Next.js dashboard
- `bench/` — self-built test harness
- `config.toml` — all tunable thresholds (H+8 config-only response)