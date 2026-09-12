'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight, ArrowUpRight, Play, Loader2, Code, FileText, Sparkles,
} from 'lucide-react';
import { HeroCanvas } from '@/components/HeroCanvas';
import { ScrambleText } from '@/components/ScrambleText';
import { Reveal } from '@/components/Reveal';
import { Magnetic } from '@/components/Magnetic';
import { Pipeline } from '@/components/Pipeline';
import { MathCard } from '@/components/MathCard';
import { Compare } from '@/components/Compare';
import { TeamCard } from '@/components/TeamCard';
import { FanChart } from '@/components/FanChart';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface DayPoint { date: string; p05: number; p10: number; p50: number; p90: number }
interface ForecastSummary { p10_end: number; p50_end: number; p90_end: number; band_width_end: number }
interface ForecastCalibration { p90_interval_coverage: number; target: [number, number] }
interface ForecastResponse { days: DayPoint[]; summary: ForecastSummary; calibration: ForecastCalibration }
interface Trade { id: string; symbol: string; amount: number; status: string; settlement_date: string; reason: string }
interface InvestResponse { opening_cash: number; safe_investable: number; remaining_cash: number; deployed: number; trades: Trade[]; settlement_date: string }
interface ReconcileResponse { opening_cash: number; total_deployed: number; expected_cash: number; actual_cash: number; reconciliation_diff_paisa: number; status: string }

const SAMPLE_TXNS = [
  { date: '2026-06-01', amount: 80000, description: 'SALARY CREDIT' },
  { date: '2026-06-03', amount: -25000, description: 'RENT AUTO DEBIT' },
  { date: '2026-06-07', amount: -12000, description: 'CAR EMI HDFC' },
  { date: '2026-06-15', amount: -4000, description: 'INSURANCE PREMIUM' },
  { date: '2026-07-01', amount: 80000, description: 'SALARY CREDIT' },
  { date: '2026-07-03', amount: -25000, description: 'RENT AUTO DEBIT' },
  { date: '2026-07-07', amount: -12000, description: 'CAR EMI HDFC' },
  { date: '2026-07-15', amount: -4000, description: 'INSURANCE PREMIUM' },
  { date: '2026-08-01', amount: 80000, description: 'SALARY CREDIT' },
  { date: '2026-08-03', amount: -25000, description: 'RENT AUTO DEBIT' },
  { date: '2026-08-07', amount: -12000, description: 'CAR EMI HDFC' },
  { date: '2026-08-15', amount: -4000, description: 'INSURANCE PREMIUM' },
];

const SAMPLE_OBLIGATIONS = [
  { id: 'rent', name: 'Rent', amount: 25000, due_date: '2026-10-03' },
  { id: 'emi', name: 'Car EMI', amount: 12000, due_date: '2026-10-07' },
  { id: 'ins', name: 'Insurance', amount: 4000, due_date: '2026-10-15' },
];

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [invest, setInvest] = useState<InvestResponse | null>(null);
  const [reconcile, setReconcile] = useState<ReconcileResponse | null>(null);

  async function run() {
    setLoading(true);
    setError('');
    setForecast(null);
    setInvest(null);
    setReconcile(null);
    try {
      const fcRes = await fetch(`${API_BASE}/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: SAMPLE_TXNS, start_date: '2026-09-12' }),
      });
      if (!fcRes.ok) throw new Error(`Forecast ${fcRes.status}`);
      const fc: ForecastResponse = await fcRes.json();
      setForecast(fc);

      const invRes = await fetch(`${API_BASE}/invest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_balance: 200000,
          today: '2026-09-12',
          obligations: SAMPLE_OBLIGATIONS,
          forecast_days: fc.days,
        }),
      });
      if (!invRes.ok) throw new Error(`Invest ${invRes.status}`);
      setInvest(await invRes.json());

      const recRes = await fetch(`${API_BASE}/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opening_cash: 200000 }),
      });
      if (!recRes.ok) throw new Error(`Reconcile ${recRes.status}`);
      setReconcile(await recRes.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen relative">

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="dot-grid" />
        <div className="radial-glow-red" style={{ top: '-300px', right: '-300px' }} />
        <div className="radial-glow-indigo" style={{ bottom: '-300px', left: '-200px' }} />
        <div className="absolute inset-0 opacity-[0.55]">
          <HeroCanvas />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)] mb-8">
            // FS-2603 · FINTECH SPRINT &apos;26
          </p>

          <h1 className="font-serif text-[14vw] md:text-[7.5rem] leading-[0.92] tracking-[-0.04em] max-w-5xl">
            <ScrambleText as="span" text="An investment engine" duration={1200} delay={200} className="block text-[var(--muted)]" />
            <ScrambleText as="span" text="that never" duration={1200} delay={450} className="block" />
            <span className="block">
              misses a bill<span className="text-[var(--accent)]">.</span>
            </span>
          </h1>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
            <p className="md:col-span-7 text-base md:text-lg leading-relaxed text-[var(--muted)] max-w-2xl">
              An investment engine for banks and wealth apps. It decides how much
              of a household's idle cash can be safely invested — without ever
              missing a fixed obligation. Probabilistic forecast, deterministic
              guard, zero black box.
            </p>

            <div className="md:col-span-5 flex flex-wrap gap-3 md:justify-end">
              <Magnetic>
                <a href="#demo" className="group inline-flex items-center gap-2 h-12 px-6 rounded-full bg-[var(--text)] text-[var(--bg)] text-sm font-medium tracking-tight hover:opacity-90 transition-opacity">
                  Run live demo
                  <Play className="w-3.5 h-3.5" />
                </a>
              </Magnetic>
              <Magnetic>
                <a href="#math" className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-[var(--border-strong)] text-sm font-medium tracking-tight hover:bg-[var(--surface)] transition-colors">
                  See the math
                </a>
              </Magnetic>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl">
            <MetricChip label="Missed obligations" value="0" accent="var(--good)" />
            <MetricChip label="Compute budget" value="1 CPU · 1 GB" />
            <MetricChip label="Settlement model" value="T+2" />
            <MetricChip label="Deterministic seed" value="42" />
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)] mb-10">
              // THE PROBLEM
            </p>
          </Reveal>
          <Reveal blur>
            <h2 className="font-serif text-3xl md:text-5xl leading-[1.05] tracking-[-0.03em] max-w-4xl">
              ₹2,00,000 sits idle. Not because the household is cautious — because
              automation is risky.
            </h2>
          </Reveal>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl">
            <Reveal delay={0.05}>
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                Salary lands anywhere across a 6-day window. Rent, EMIs, and premiums
                don&apos;t. A single missed auto-debit costs more than the returns from
                automating.
              </p>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                Existing products apply a fixed cash buffer — too large in stable
                months, too small in irregular ones. Households rationally keep
                months of cash idle.
              </p>
            </Reveal>
            <Reveal delay={0.19}>
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                Over three years, that idle balance forfeits roughly 7–9% real return
                annually. ₹2L idle for three years ≈ ₹45,000 given up.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* PIPELINE */}
      <Pipeline />

      {/* MATH */}
      <section id="math" className="border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)] mb-10">
              // THE MATH
            </p>
          </Reveal>
          <Reveal blur>
            <h2 className="font-serif text-3xl md:text-5xl leading-[1.05] tracking-[-0.03em] max-w-3xl mb-14">
              Four formulas. Every one auditable.
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Reveal>
              <MathCard
                n="01"
                title="Forecast"
                plain="We don't predict the future. We resample from the household's own 90-day history, one thousand times, and take empirical quantiles."
                equation={
                  <>
                    S<sub>t</sub> = Σ<sub>i=1..t</sub> h<sub>i</sub>, h<sub>i</sub> ~ Uniform(H)
                    <br />
                    P10, P50, P90 = quantile(S, [0.10, 0.50, 0.90])
                  </>
                }
                why="Model-free. Deterministic with fixed seed. Fast on 1 CPU."
              />
            </Reveal>
            <Reveal delay={0.08}>
              <MathCard
                n="02"
                title="Pre-trade guard"
                plain="For any candidate investment x, every obligation must survive on the worst-case (P5) path with a 5% margin. If any fails, block."
                equation={
                  <>
                    B − x + S<sub>d</sub><sup>(P5)</sup> ≥ a · (1 + m)
                    <br />
                    m = 0.05, d = due date
                  </>
                }
                why="P5 not P50 — the metric gates on zero misses. 95% confidence."
              />
            </Reveal>
            <Reveal delay={0.16}>
              <MathCard
                n="03"
                title="Max safe investable"
                plain="The largest trade that survives every obligation in the horizon. Found by binary search over the guard."
                equation={
                  <>
                    x* = max {'{'} x ∈ [0, B] : guard(x) = pass for all O {'}'}
                    <br />
                    iter = 30 → precision B / 2^30 ≈ ₹0.19
                  </>
                }
                why="Guard is non-linear on overlapping obligation windows. Closed form fails."
              />
            </Reveal>
            <Reveal delay={0.24}>
              <MathCard
                n="04"
                title="Calibration"
                plain="We're honest about our uncertainty. The P10–P90 band must contain the truth ~90% of the time, no more, no less."
                equation={
                  <>
                    coverage = |{'{'} t : h<sub>t</sub> ∈ [P10<sub>t</sub>, P90<sub>t</sub>] {'}'}| / N
                    <br />
                    target: 0.85 ≤ coverage ≤ 0.95
                  </>
                }
                why="Rewards honest uncertainty, not conservative bands or aggressive claims."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* COMPARE */}
      <section className="border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)] mb-10">
              // WHY IT MATTERS
            </p>
          </Reveal>
          <Reveal blur>
            <h2 className="font-serif text-3xl md:text-5xl leading-[1.05] tracking-[-0.03em] max-w-3xl mb-14">
              Same household. Same balance. Two very different outcomes.
            </h2>
          </Reveal>
          <Compare />
        </div>
      </section>

      {/* LIVE DEMO */}
      <section id="demo" className="border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)] mb-10">
              // LIVE DEMO
            </p>
          </Reveal>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <Reveal blur>
              <h2 className="font-serif text-3xl md:text-5xl leading-[1.05] tracking-[-0.03em] max-w-2xl">
                One button. Full pipeline.
              </h2>
            </Reveal>
            <Magnetic>
              <button
                onClick={run}
                disabled={loading}
                className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-[var(--accent)] text-white text-sm font-medium tracking-tight hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Running pipeline…' : 'Run full pipeline'}
              </button>
            </Magnetic>
          </div>

          {error && (
            <div className="mb-8 p-4 border border-[var(--accent)]/40 bg-[var(--accent-soft)] rounded text-sm">
              {error}
            </div>
          )}

          {forecast && (
            <div className="border border-[var(--border)] rounded-lg p-6 md:p-8" style={{ background: 'var(--surface)' }}>
              <FanChart days={forecast.days} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-[var(--border)]">
                <Metric label="P10 end" value={fmt(forecast.summary.p10_end)} />
                <Metric label="P50 end" value={fmt(forecast.summary.p50_end)} />
                <Metric label="P90 end" value={fmt(forecast.summary.p90_end)} />
                <Metric label="Calibration" value={`${(forecast.calibration.p90_interval_coverage * 100).toFixed(0)}%`} hint="target 85–95%" />
              </div>
            </div>
          )}

          {invest && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="border border-[var(--border)] rounded-lg p-5" style={{ background: 'var(--surface)' }}>
                <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-2">Opening cash</p>
                <p className="font-serif text-3xl">{fmt(invest.opening_cash)}</p>
              </div>
              <div className="border border-[var(--accent)]/50 rounded-lg p-5" style={{ background: 'var(--accent-soft)' }}>
                <p className="text-xs text-[var(--accent)] uppercase tracking-wider mb-2">Safe investable</p>
                <p className="font-serif text-3xl text-[var(--accent)]">{fmt(invest.safe_investable)}</p>
              </div>
              <div className="border border-[var(--border)] rounded-lg p-5" style={{ background: 'var(--surface)' }}>
                <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-2">Reserve</p>
                <p className="font-serif text-3xl">{fmt(invest.remaining_cash)}</p>
              </div>
            </div>
          )}

          {reconcile && (
            <div className="mt-6 border border-[var(--border)] rounded-lg p-5 flex items-center justify-between" style={{ background: 'var(--surface)' }}>
              <div>
                <p className="text-xs text-[var(--muted)] uppercase tracking-wider">Reconciliation</p>
                <p className="font-mono text-sm mt-1">diff = {reconcile.reconciliation_diff_paisa.toFixed(2)} paisa</p>
              </div>
              <span
                className="font-mono text-xs uppercase tracking-wider px-3 py-1 rounded"
                style={{
                  color: reconcile.status === 'OK' ? 'var(--good)' : 'var(--accent)',
                  background: reconcile.status === 'OK' ? 'rgba(52,211,153,0.1)' : 'var(--accent-soft)',
                }}
              >
                {reconcile.status}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* TEAM */}
      <section className="border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)] mb-10">
              // THE TEAM
            </p>
          </Reveal>
          <Reveal blur>
            <h2 className="font-serif text-3xl md:text-5xl leading-[1.05] tracking-[-0.03em] max-w-3xl mb-14">
              Two people. One project.
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <Reveal>
              <TeamCard
                name="Milind Nivas"
                role="Forecast engine · Frontend"
                image="/founders/milind.jpeg"
                bio="Designed the probabilistic cashflow model, the dashboard, and the deployment pipeline."
              />
            </Reveal>
            <Reveal delay={0.08}>
              <TeamCard
                name="Yuvan Chennu"
                role="Execution engine · Guard"
                image="/founders/yuvan.jpeg"
                bio="Built the pre-trade guard, the FIFO tax-lot tracker, and the reconciliation audit."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* DELIVERABLES */}
      <section className="border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)] mb-10">
              // DELIVERABLES
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
            <a
              href="https://github.com/milindnivas27-bit/fintech-sprint-2603"
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-[var(--border)] rounded-lg p-6 card-hover"
              style={{ background: 'var(--surface)' }}
            >
              <Code className="w-5 h-5 mb-4" />
              <p className="font-serif text-xl">Source code</p>
              <p className="text-xs text-[var(--muted)] mt-1 font-mono">github · public repo</p>
              <ArrowUpRight className="w-4 h-4 mt-5 opacity-60 group-hover:opacity-100 transition-opacity" />
            </a>
            <a
              href="/deck.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-[var(--border)] rounded-lg p-6 card-hover"
              style={{ background: 'var(--surface)' }}
            >
              <FileText className="w-5 h-5 mb-4" />
              <p className="font-serif text-xl">Round 1 deck</p>
              <p className="text-xs text-[var(--muted)] mt-1 font-mono">pdf · 10 slides</p>
              <ArrowUpRight className="w-4 h-4 mt-5 opacity-60 group-hover:opacity-100 transition-opacity" />
            </a>
            <Link
              href="/demo"
              className="group border border-[var(--border)] rounded-lg p-6 card-hover"
              style={{ background: 'var(--surface)' }}
            >
              <Play className="w-5 h-5 mb-4" />
              <p className="font-serif text-xl">Full demo</p>
              <p className="text-xs text-[var(--muted)] mt-1 font-mono">live · separate page</p>
              <ArrowRight className="w-4 h-4 mt-5 opacity-60 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span className="font-serif text-base">FS-2603</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--subtle)]">
              Obligation-Safe Investing
            </span>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">
            FinTech Sprint &apos;26 · Milind Nivas · Yuvan Chennu
          </p>
        </div>
      </footer>
    </main>
  );
}

function MetricChip({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="border-t border-[var(--border)] pt-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--subtle)]">{label}</p>
      <p className="font-serif text-lg mt-1" style={{ color: accent || 'var(--text)' }}>{value}</p>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-mono">{label}</p>
      <p className="mt-1 font-serif text-xl tabular-nums">{value}</p>
      {hint && <p className="text-[10px] text-[var(--subtle)] mt-0.5">{hint}</p>}
    </div>
  );
}

function fmt(n: number): string {
  if (!isFinite(n)) return '₹0';
  return '₹' + Math.round(n).toLocaleString('en-IN');
}