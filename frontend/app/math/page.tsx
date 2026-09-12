'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

export default function MathPage() {
  return (
    <main className="min-h-screen">
      <section className="border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-16">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)] mb-6">
              // THE MATH
            </p>
          </Reveal>
          <Reveal blur>
            <h1 className="font-serif text-5xl md:text-7xl leading-[0.98] tracking-[-0.035em]">
              Four formulas.
              <br />
              Every one auditable.
            </h1>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-8 text-lg text-[var(--muted)] max-w-2xl leading-relaxed">
              No black box. No hidden model. Each step of the pipeline is a
              closed-form expression you can check on paper, re-run, or argue with.
            </p>
          </Reveal>
        </div>
      </section>

      <Section
        n="01"
        title="Forecast"
        plain="We don't predict the future. We resample from the household's own history, a thousand times, and take empirical quantiles at each future day."
        formal={
          <>
            S<sub>t</sub> = Σ<sub>i=1..t</sub> h<sub>i</sub>, h<sub>i</sub> ~ Uniform(H)
            <br /><br />
            P10, P50, P90, P05 = quantile(S, [0.10, 0.50, 0.90, 0.05])
          </>
        }
        explainer={[
          'H is the set of daily net cashflows over the last 90 days.',
          'Each synthetic path S is a cumulative sum of 60 values drawn with replacement from H.',
          'We generate 1000 paths, then take empirical quantiles across them at each day.',
          'Fixed seed = 42. Given the same history, the same 1000 paths, the same numbers. Byte-identical.',
        ]}
        why="Model-free. Deterministic with a fixed seed. Runs in ~250 ms on 1 CPU. No training data needed — which matters because we only have one household's history."
      />

      <Section
        n="02"
        title="Pre-trade guard"
        plain="Every candidate investment must survive the worst-case path on every upcoming obligation. If any obligation would be breached, we block."
        formal={
          <>
            For every obligation O with due date d and amount a:
            <br /><br />
            B − x + S<sub>d</sub><sup>(P5)</sup> ≥ a · (1 + m)
            <br /><br />
            m = 0.05 (safety margin)
          </>
        }
        explainer={[
          'B is the current cash balance. x is the proposed investment amount.',
          'S_d^(P5) is the P5 (5th percentile) cumulative cashflow on day d.',
          'The right side is the obligation plus a 5% safety margin.',
          'If the inequality fails for ANY obligation in the horizon, the trade is rejected.',
        ]}
        why="We use P5, not P50. The metric gates on zero missed obligations — a single breach voids the entire automation score. P5 gives us 95% confidence. P50 would fail 50% of the time."
      />

      <Section
        n="03"
        title="Max safe investable"
        plain="The largest trade the guard would allow. Found by binary search over the guard predicate."
        formal={
          <>
            x* = max {'{'} x ∈ [0, B] : guard(x, O, S) = pass for all O ∈ horizon {'}'}
            <br /><br />
            30 iterations → precision B / 2<sup>30</sup> ≈ ₹0.19 on ₹2 lakh
          </>
        }
        explainer={[
          'B is the current balance. The search space is [0, B].',
          'The guard is non-linear — whether x is allowed depends on the intersection of multiple obligation windows.',
          'Binary search gives a provable logarithmic bound. 30 iterations gets ₹0.19 precision.',
          'Deterministic. No heuristic. Same inputs → same x*.',
        ]}
        why="A closed-form solution exists only in degenerate cases (single obligation, no overlap). Real households have 3–5 obligations with overlapping windows. Binary search is provable and fast."
      />

      <Section
        n="04"
        title="Calibration"
        plain="We score ourselves on how honest we are about uncertainty, not how accurate our prediction was."
        formal={
          <>
            coverage = |{'{'} t : h<sub>t</sub> ∈ [P10<sub>t</sub>, P90<sub>t</sub>] {'}'}| / N
            <br /><br />
            target: 0.85 ≤ coverage ≤ 0.95
          </>
        }
        explainer={[
          'For each historical day t, we check if the actual value h_t fell inside the P10–P90 band we would have produced.',
          'coverage = fraction of days where it did.',
          'If coverage < 0.85 → band too narrow, model is overconfident.',
          'If coverage > 0.95 → band too wide, we\'re leaving money idle.',
        ]}
        why="The evaluation metric rewards honest uncertainty. Conservative bands (coverage > 0.95) lose points. Aggressive bands (coverage < 0.85) lose points. The target band is 0.85–0.95."
      />

      <section className="border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)] mb-6">
              // WHY NOT ML
            </p>
          </Reveal>
          <Reveal blur>
            <h2 className="font-serif text-3xl md:text-4xl leading-tight tracking-tight mb-8">
              We rejected deep learning. Here's the argument.
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <ul className="space-y-4 text-[var(--muted)] leading-relaxed">
              <li className="flex gap-4">
                <span className="font-mono text-[11px] text-[var(--accent)] shrink-0 mt-1.5">01</span>
                <span>An LSTM or Transformer is not deterministic across runs. Dropout, GPU nondeterminism, and initialization all introduce variance. The rules require byte-identical output on repeat runs. An ML model fails this gate.</span>
              </li>
              <li className="flex gap-4">
                <span className="font-mono text-[11px] text-[var(--accent)] shrink-0 mt-1.5">02</span>
                <span>We have one household's worth of history. You cannot train a neural net on 90 data points.</span>
              </li>
              <li className="flex gap-4">
                <span className="font-mono text-[11px] text-[var(--accent)] shrink-0 mt-1.5">03</span>
                <span>The metric scores calibration, not accuracy. Bootstrap gives empirically calibrated quantiles by construction. An ML model has to be <em>trained</em> to be calibrated — extra work, extra failure mode.</span>
              </li>
            </ul>
          </Reveal>

          <Reveal delay={0.16}>
            <div className="mt-12 flex flex-wrap gap-3">
              <Link
                href="/demo"
                className="group inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[var(--text)] text-[var(--bg)] text-sm font-medium tracking-tight hover:opacity-90 transition-opacity"
              >
                See it run
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/judges"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-full border border-[var(--border-strong)] text-sm font-medium tracking-tight hover:bg-[var(--surface)] transition-colors"
              >
                For judges
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

interface SectionProps {
  n: string;
  title: string;
  plain: string;
  formal: React.ReactNode;
  explainer: string[];
  why: string;
}

function Section({ n, title, plain, formal, explainer, why }: SectionProps) {
  return (
    <section className="border-b border-[var(--border)]">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <Reveal>
          <div className="flex items-baseline gap-4 mb-6">
            <span className="font-mono text-[11px] text-[var(--accent)] tracking-widest">{n}</span>
            <h2 className="font-serif text-3xl md:text-4xl tracking-tight">{title}</h2>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <p className="text-base md:text-lg text-[var(--muted)] leading-relaxed mb-8 max-w-3xl">
            {plain}
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="equation mb-8">{formal}</div>
        </Reveal>

        <Reveal delay={0.14}>
          <ul className="space-y-3 mb-8">
            {explainer.map((line, i) => (
              <li key={i} className="flex gap-3 text-sm text-[var(--muted)] leading-relaxed">
                <span className="text-[var(--subtle)] font-mono text-[10px] shrink-0 mt-1.5">—</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.18}>
          <div className="border-l-2 border-[var(--accent)] pl-5 py-1">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent)] mb-2">
              why
            </p>
            <p className="text-sm text-[var(--muted)] leading-relaxed">{why}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}