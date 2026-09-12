'use client';

import Link from 'next/link';
import { ArrowRight, Upload, Sparkles, ShieldCheck, Send, CheckCircle2 } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const PIPELINE = [
  {
    n: '01',
    icon: Upload,
    title: 'Ingest',
    desc: 'Normalize raw transaction rows — mixed date formats, foreign currencies, duplicates, delayed reversals, joint-account noise. Result: a clean, deduped, INR-denominated series.',
    tag: 'python · engine/ingest.py',
  },
  {
    n: '02',
    icon: Sparkles,
    title: 'Forecast',
    desc: 'Bootstrap resampling over the household’s 90-day history. 1000 synthetic 60-day paths, cumulative-summed, then empirical quantiles per day. P10, P50, P90, P05.',
    tag: 'python · engine/forecast.py',
  },
  {
    n: '03',
    icon: ShieldCheck,
    title: 'Guard',
    desc: 'Before any trade: check the worst-case P5 path against every upcoming obligation. If any obligation would be breached, block. Binary search finds the max safe trade.',
    tag: 'python · engine/obligations.py',
  },
  {
    n: '04',
    icon: Send,
    title: 'Execute',
    desc: 'Split the safe amount across 3 instruments (60/30/10). Model T+2 settlement. Track FIFO tax lots. Record every trade in the append-only blotter.',
    tag: 'python · engine/execution.py',
  },
  {
    n: '05',
    icon: CheckCircle2,
    title: 'Reconcile',
    desc: 'Audit the blotter against the ledger. Diff must be exactly zero paisa. Publish the number. If nonzero, the automation score is void.',
    tag: 'python · engine/execution.py',
  },
];

const WHO = [
  { label: 'Banks', desc: 'Wells Fargo, HDFC, ICICI — offering automated savings features to salaried customers.' },
  { label: 'NBFCs', desc: 'Bajaj Finserv, Muthoot — with high idle cash balances on their books.' },
  { label: 'Wealth apps', desc: 'Groww, Zerodha Coin, INDmoney — that want to automate investments without breaching auto-debits.' },
  { label: 'Account aggregators', desc: 'Setu, Finvu, OneMoney — that provide the RBI-regulated consent flow this engine sits on top of.' },
];

export default function ConceptPage() {
  return (
    <main className="min-h-screen">
      {/* HEADER */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-16">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)] mb-6">
              // CONCEPT
            </p>
          </Reveal>
          <Reveal blur>
            <h1 className="font-serif text-5xl md:text-7xl leading-[0.98] tracking-[-0.035em] max-w-4xl">
              Idle cash is a tax on uncertainty.
            </h1>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-8 text-lg text-[var(--muted)] max-w-2xl leading-relaxed">
              FS-2603 is not a budgeting app. It's a decision engine that sits behind a
              bank's savings product, reads a household's cashflow, and answers one
              question: <span className="text-[var(--text)]">how much of this balance
              can be safely invested without ever missing a bill?</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)] mb-10">
              // THE PROBLEM
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-7">
              <Reveal blur>
                <h2 className="font-serif text-3xl md:text-4xl leading-tight tracking-tight mb-6">
                  Salaried households hold months of cash idle. Not because they're
                  cautious — because automating is risky.
                </h2>
              </Reveal>
              <Reveal delay={0.08}>
                <p className="text-base text-[var(--muted)] leading-relaxed mb-5">
                  Income lands anywhere across a 6-day window. Rent auto-debits on the
                  3rd. The car EMI on the 7th. Insurance on the 15th. A single missed
                  auto-debit costs a penalty, hits the credit score, and generates a
                  call from the bank.
                </p>
              </Reveal>
              <Reveal delay={0.16}>
                <p className="text-base text-[var(--muted)] leading-relaxed">
                  Existing automated-investment products apply a fixed cash buffer —
                  too large in stable months, too small in irregular ones. So households
                  rationally keep months of cash idle. Over three years, a ₹2L idle
                  balance forfeits roughly 7–9% real return annually.
                </p>
              </Reveal>
            </div>

            <div className="md:col-span-5">
              <Reveal delay={0.12}>
                <div className="border border-[var(--border)] rounded-lg p-8" style={{ background: 'var(--surface)' }}>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--subtle)] mb-5">
                    The math of a missed debit
                  </p>
                  <div className="space-y-5">
                    <Stat label="Penalty per miss" value="₹500" />
                    <Stat label="Credit score impact" value="-30 pts" />
                    <Stat label="Real return forfeited / yr" value="7–9%" />
                    <Stat label="Households with no buffer" value="62%" />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* THE PIPELINE */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)] mb-10">
              // PIPELINE
            </p>
          </Reveal>
          <Reveal blur>
            <h2 className="font-serif text-3xl md:text-5xl leading-tight tracking-[-0.03em] max-w-3xl mb-14">
              Five steps. One deterministic path.
            </h2>
          </Reveal>

          <div className="space-y-3">
            {PIPELINE.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.05} y={16}>
                <div className="grid grid-cols-12 gap-4 md:gap-8 py-6 border-t border-[var(--border)] items-start">
                  <div className="col-span-2 md:col-span-1 flex items-baseline gap-3">
                    <span className="font-mono text-[11px] text-[var(--accent)] tracking-widest">
                      {s.n}
                    </span>
                  </div>
                  <div className="col-span-10 md:col-span-3 flex items-center gap-3">
                    <s.icon className="w-4 h-4 text-[var(--text)] shrink-0" strokeWidth={1.75} />
                    <h3 className="font-serif text-2xl tracking-tight">{s.title}</h3>
                  </div>
                  <p className="col-span-12 md:col-span-6 text-sm text-[var(--muted)] leading-relaxed">
                    {s.desc}
                  </p>
                  <p className="col-span-12 md:col-span-2 font-mono text-[10px] uppercase tracking-wider text-[var(--subtle)] md:text-right">
                    {s.tag}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)] mb-10">
              // WHO BUILDS ON THIS
            </p>
          </Reveal>
          <Reveal blur>
            <h2 className="font-serif text-3xl md:text-5xl leading-tight tracking-[-0.03em] max-w-3xl mb-14">
              Not a consumer app. Infrastructure for the institutions that serve them.
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {WHO.map((w, i) => (
              <Reveal key={w.label} delay={i * 0.05}>
                <div className="border border-[var(--border)] rounded-lg p-6 card-hover" style={{ background: 'var(--surface)' }}>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent)] mb-3">
                    {w.label}
                  </p>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{w.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)] mb-10">
              // ARCHITECTURE
            </p>
          </Reveal>
          <Reveal blur>
            <h2 className="font-serif text-3xl md:text-4xl leading-tight tracking-[-0.03em] max-w-3xl mb-12">
              Single-writer state. Log-structured. Deterministic.
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Reveal>
              <Card
                title="State ownership"
                body="Immutable transaction history. Mutable cash ledger. Append-only blotter. Every state change goes through one writer with a threading lock."
              />
            </Reveal>
            <Reveal delay={0.06}>
              <Card
                title="Consistency model"
                body="Strong, single-node, log-structured. No distributed consensus needed — the compute budget is 1 CPU / 1 GB, and determinism is easier to guarantee single-process."
              />
            </Reveal>
            <Reveal delay={0.12}>
              <Card
                title="Failure path"
                body="Forecast fails → invest 0. Settlement rejects → retry next cycle. Market halt → freeze that holding only. Cash short of next obligation → block."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <p className="font-serif text-2xl md:text-3xl tracking-tight max-w-xl">
                Ready to see it run on five real-world household scenarios?
              </p>
              <Link
                href="/demo"
                className="group inline-flex items-center gap-2 h-12 px-6 rounded-full bg-[var(--text)] text-[var(--bg)] text-sm font-medium tracking-tight hover:opacity-90 transition-opacity shrink-0"
              >
                Open live demo
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
      <span className="text-xs text-[var(--muted)]">{label}</span>
      <span className="font-serif text-xl tabular-nums">{value}</span>
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-[var(--border)] rounded-lg p-6 h-full" style={{ background: 'var(--surface)' }}>
      <h3 className="font-serif text-xl tracking-tight mb-3">{title}</h3>
      <p className="text-sm text-[var(--muted)] leading-relaxed">{body}</p>
    </div>
  );
}