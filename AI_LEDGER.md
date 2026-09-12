# AI Ledger — FS-2603

Per the event rules: every component, which model, what it was asked for, what was changed.

## Forecast Engine
- **Model:** Claude (Sonnet 4.5)
- **Asked for:** Bootstrap resampling over 90-day history producing P10/P50/P90 over a 60-day horizon
- **Changed:** *(filled in during build)*

## Execution Engine
- **Model:** Claude (Sonnet 4.5)
- **Asked for:** Obligation guard with T+2 settlement lag, FIFO tax-lot selection, blotter reconciliation
- **Changed:** *(filled in during build)*

## Frontend
- **Model:** Claude (Sonnet 4.5)
- **Asked for:** Next.js dashboard with fan chart, obligation timeline, blotter view
- **Changed:** *(filled in during build)*

## Deck
- **Model:** Gamma (AI-generated)
- **Asked for:** 10-slide Round 1 deck covering the 5 scoring criteria
- **Changed:** Removed 3 stock images (wallet photo, server watermark, chart background) to match editorial tone