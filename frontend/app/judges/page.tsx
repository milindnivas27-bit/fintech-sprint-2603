'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink, AlertTriangle, Cpu, Activity } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/healthz',
    desc: 'Liveness probe. Returns service status and uptime.',
  },
  {
    method: 'GET',
    path: '/metrics',
    desc: 'Domain metrics: missed obligations, P90 coverage, reconciliation diff, peak RAM, CPU time.',
  },
  {
    method: 'POST',
    path: '/forecast',
    desc: 'Ingest transactions and produce a 60-day P10/P50/P90 forecast. Deterministic given seed.',
  },
  {
    method: 'POST',
    path: '/invest',
    desc: 'Guard-checked trade execution. Returns trade list, safe investable amount, settlement date.',
  },
  {
    method: 'POST',
    path: '/reconcile',
    desc: 'Blotter audit. Returns exact-to-paisa reconciliation diff. Must be 0.',
  },
  {
    method: 'POST',
    path: '/regime-check',
    desc: 'Regime break detector. Fires when recent inflows shift beyond configured z-score threshold.',
  },
  {
    method: 'GET',
    path: '/profiles',
    desc: 'List of the five preloaded household scenarios.',
  },
  {
    method: 'GET',
    path: '/profiles/{id}',
    desc: 'Full scenario: transactions, obligations, opening balance for one household.',
  },
  {
    method: 'POST',
    path: '/reset',
    desc: 'Clear all state between test runs.',
  },
];

const FAILURES = [
  {
    title: 'Bootstrap assumes stationarity',
    body: 'The bootstrap resamples from the last 90 days. If income distribution shifts non-stationarily (the H+8 scenario: income drops to zero), the P10/P90 bands initially underestimate downside risk until the regime-break detector fires.',
    mitigation: 'Regime-break detector computes a z-score of recent inflow mean vs historical mean. Beyond z=3.0, the forecast widens its intervals by a configurable factor (default 1.5×).',
  },
  {
    title: 'Settlement-lag model breaks on unannounced partial fills',
    body: 'We model T+2 settlement as a fixed delay. If a broker returns a partial fill (only 60% of the requested quantity) without notifying, our reservation calculation is optimistic — we assume the full amount is committed.',
    mitigation: 'Reconciliation runs each cycle and re-reserves on mismatch. In the sealed run, 12% partial fill rate is detected within one cycle.',
  },
  {
    title: 'Guard fails on late-registered obligations',
    body: 'The guard scans obligations in the horizon at trade time. If an obligation is registered after a trade has committed (e.g. a new recurring bill appears mid-month), the guard cannot retroactively block.',
    mitigation: 'We treat obligations as forward-declared only. Trades are refused on any window where the obligation register is incomplete. In production this is enforced by requiring 30-day advance notice for new recurring obligations.',
  },
];

export default function JudgesPage() {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <main className="min-h-screen">
      <section className="border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 pt-20 pb-14">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--accent)] mb-6">
              // FOR JUDGES
            </p>
          </Reveal>
          <Reveal blur>
            <h1 className="font-serif text-5xl md:text-6xl leading-[0.98] tracking-[-0.035em] max-w-3xl">
              Direct access to the system.
            </h1>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-6 text-lg text-[var(--muted)] max-w-2xl leading-relaxed">
              Every endpoint, every failure condition, every cost number, in one place.
              Copy the API base URL, hit any endpoint, verify any claim.
            </p>
          </Reveal>

          {/* API base URL */}
          <Reveal delay={0.14}>
            <div className="mt-10 flex flex-col md:flex-row md:items-center gap-3 p-4 border border-[var(--border)] rounded-lg" style={{ background: 'var(--surface)' }}>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--subtle)] shrink-0">
                API base
              </span>
              <code className="flex-1 font-mono text-sm text-[var(--text)] break-all">
                {API_BASE}
              </code>
              <button
                onClick={() => copy(API_BASE, 'base')}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[var(--border)] text-[12px] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors shrink-0"
              >
                {copied === 'base' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied === 'base' ? 'Copied' : 'Copy'}
              </button>
              <a
                href={`${API_BASE}/docs`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[var(--border)] text-[12px] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors shrink-0"
              >
                OpenAPI docs
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </Reveal>

          {/* Quick links */}
          <Reveal delay={0.2}>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              <QuickLink href={`${API_BASE}/healthz`} label="/healthz" />
              <QuickLink href={`${API_BASE}/metrics`} label="/metrics" />
              <QuickLink href={`${API_BASE}/profiles`} label="/profiles" />
              <QuickLink href={`${API_BASE}/state`} label="/state" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ENDPOINTS */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)] mb-8">
              // ENDPOINT DIRECTORY
            </p>
          </Reveal>

          <div className="border border-[var(--border)] rounded-lg overflow-hidden" style={{ background: 'var(--surface)' }}>
            {ENDPOINTS.map((e, i) => (
              <div
                key={e.path}
                className={`grid grid-cols-12 gap-4 px-5 py-4 items-center ${
                  i > 0 ? 'border-t border-[var(--border)]' : ''
                }`}
              >
                <span
                  className={`col-span-2 md:col-span-1 font-mono text-[10px] uppercase tracking-wider ${
                    e.method === 'GET' ? 'text-[var(--good)]' : 'text-[var(--accent)]'
                  }`}
                >
                  {e.method}
                </span>
                <code className="col-span-10 md:col-span-4 font-mono text-sm text-[var(--text)]">
                  {e.path}
                </code>
                <p className="col-span-12 md:col-span-7 text-xs text-[var(--muted)] leading-relaxed">
                  {e.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OBSERVABILITY */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)] mb-8">
              // OBSERVABILITY
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Reveal>
              <ObsCard
                icon={Activity}
                title="Three domain metrics"
                body="/metrics exposes missed_obligations_total, p90_coverage_ratio, and reconciliation_diff_paisa — the three numbers that gate our score."
              />
            </Reveal>
            <Reveal delay={0.06}>
              <ObsCard
                icon={Cpu}
                title="Compute footprint"
                body="Peak RAM and CPU time sampled live via psutil. Published with every run in bench/output.json."
              />
            </Reveal>
            <Reveal delay={0.12}>
              <ObsCard
                icon={Check}
                title="Determinism"
                body="Same input → same output. Fixed seed=42. Two runs of the bench produce byte-identical hashes."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* FAILURE DISCLOSURE */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--accent)] mb-8">
              // WHERE THIS BREAKS
            </p>
          </Reveal>
          <Reveal blur>
            <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-10 max-w-3xl">
              Three specific conditions that produce a wrong answer.
            </h2>
          </Reveal>

          <div className="space-y-4">
            {FAILURES.map((f, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <div className="border border-[var(--border)] rounded-lg p-6" style={{ background: 'var(--surface)' }}>
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="w-4 h-4 text-[var(--accent)] shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-serif text-xl tracking-tight mb-3">{f.title}</h3>
                      <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
                        {f.body}
                      </p>
                      <div className="border-l-2 border-[var(--good)] pl-4 py-1">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--good)] mb-1.5">
                          mitigation
                        </p>
                        <p className="text-sm text-[var(--muted)] leading-relaxed">
                          {f.mitigation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* COST & FOOTPRINT */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)] mb-8">
              // COST &amp; FOOTPRINT
            </p>
          </Reveal>

          <Reveal blur>
            <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-10 max-w-3xl">
              Measured, not claimed. Reproducible from the repo.
            </h2>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl">
            <Metric label="Forecast latency" value="~250 ms" hint="1 CPU · 1 GB" />
            <Metric label="Peak RAM" value="~18 MB" hint="during bench" />
            <Metric label="Compute budget" value="1 CPU · 1 GB" hint="hard limit" />
            <Metric label="Determinism" value="byte-id" hint="same seed" />
          </div>

          <Reveal delay={0.16}>
            <p className="mt-10 text-sm text-[var(--muted)] leading-relaxed max-w-3xl">
              Run <code className="font-mono text-xs px-1.5 py-0.5 rounded border border-[var(--border)]">python bench/run_bench.py</code> from
              the repo root to reproduce every number above. The script prints wall time,
              peak RAM, calibration coverage, and reconciliation diff, and writes them to{' '}
              <code className="font-mono text-xs px-1.5 py-0.5 rounded border border-[var(--border)]">bench/output.json</code>.
            </p>
          </Reveal>
        </div>
      </section>

      {/* REPO */}
      <section>
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2">
                Source
              </p>
              <code className="font-mono text-sm text-[var(--text)]">
                github.com/milindnivas27-bit/fintech-sprint-2603
              </code>
            </div>
            <div className="flex gap-3">
              <a
                href="https://github.com/milindnivas27-bit/fintech-sprint-2603"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-[var(--border-strong)] text-sm font-medium tracking-tight hover:bg-[var(--surface)] transition-colors"
              >
                Open repo
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center justify-between gap-2 px-3 h-10 rounded-md border border-[var(--border)] text-[12px] font-mono text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors"
    >
      {label}
      <ExternalLink className="w-3 h-3 opacity-40 group-hover:opacity-100" />
    </a>
  );
}

function ObsCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
}) {
  return (
    <div className="border border-[var(--border)] rounded-lg p-6 h-full" style={{ background: 'var(--surface)' }}>
      <Icon className="w-4 h-4 text-[var(--text)] mb-4" strokeWidth={1.75} />
      <h3 className="font-serif text-lg tracking-tight mb-2">{title}</h3>
      <p className="text-sm text-[var(--muted)] leading-relaxed">{body}</p>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border-t border-[var(--border)] pt-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--subtle)]">{label}</p>
      <p className="mt-1 font-serif text-2xl tabular-nums">{value}</p>
      {hint && <p className="text-[10px] text-[var(--subtle)] mt-0.5 font-mono">{hint}</p>}
    </div>
  );
}