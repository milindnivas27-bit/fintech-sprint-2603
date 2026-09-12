'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Loader2, AlertTriangle, ArrowLeft, CheckCircle2, Users } from 'lucide-react';
import { FanChart } from '@/components/FanChart';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ProfileSummary {
  id: string;
  name: string;
  role: string;
  description: string;
  opening_balance: number;
  obligation_count: number;
  transaction_count: number;
}

interface ProfileFull {
  id: string;
  name: string;
  role: string;
  description: string;
  opening_balance: number;
  transactions: { date: string; amount: number; description: string }[];
  obligations: { id: string; name: string; amount: number; due_date: string }[];
}

interface DayPoint { date: string; p05: number; p10: number; p50: number; p90: number }

export default function DemoPage() {
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forecast, setForecast] = useState<{ days: DayPoint[]; summary: any; calibration: any } | null>(null);
  const [invest, setInvest] = useState<any>(null);
  const [reconcile, setReconcile] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE}/profiles`)
      .then((r) => r.json())
      .then((d) => {
        setProfiles(d.profiles);
        if (d.profiles.length > 0) setSelected(d.profiles[0].id);
      })
      .catch(() => setError('Could not load profiles. Is the backend running?'));
  }, []);

  async function run() {
    if (!selected) return;
    setLoading(true);
    setError('');
    setForecast(null);
    setInvest(null);
    setReconcile(null);

    try {
      const profile: ProfileFull = await fetch(`${API_BASE}/profiles/${selected}`).then((r) => r.json());

      const fcRes = await fetch(`${API_BASE}/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: profile.transactions,
          start_date: '2026-09-12',
        }),
      });
      if (!fcRes.ok) throw new Error(`Forecast ${fcRes.status}`);
      const fc = await fcRes.json();
      setForecast(fc);

      const invRes = await fetch(`${API_BASE}/invest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_balance: profile.opening_balance,
          today: '2026-09-12',
          obligations: profile.obligations,
          forecast_days: fc.days,
        }),
      });
      if (!invRes.ok) throw new Error(`Invest ${invRes.status}`);
      setInvest(await invRes.json());

      const recRes = await fetch(`${API_BASE}/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opening_cash: profile.opening_balance }),
      });
      if (!recRes.ok) throw new Error(`Reconcile ${recRes.status}`);
      setReconcile(await recRes.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  const activeProfile = profiles.find((p) => p.id === selected);

  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--border)] sticky top-0 z-10 backdrop-blur-md bg-[var(--bg)]/85">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">
              Live Demo
            </span>
          </div>
          <div className="font-mono text-xs text-[var(--subtle)]">2026-09-12</div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)] mb-4">
          // PIPELINE RUN
        </p>
        <h1 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight max-w-3xl">
          Live pipeline run
        </h1>
        <p className="mt-5 text-[var(--muted)] max-w-2xl leading-relaxed">
          Pick a household scenario. We simulate a connected bank account, then run
          the full pipeline: Ingest → Forecast → Guard → Execute → Reconcile.
          Every threshold reads from <span className="font-mono text-xs">config.toml</span>.
        </p>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-[var(--subtle)]">
          Simulating a connected bank account · In production this comes from India&apos;s Account Aggregator framework
        </p>

        {/* Profile selector */}
        {profiles.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-3.5 h-3.5 text-[var(--muted)]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Household profile
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {profiles.map((p) => {
                const active = p.id === selected;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p.id)}
                    className={`text-left p-4 rounded-lg border transition-colors ${
                      active
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                        : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                    }`}
                    style={{ background: active ? 'var(--accent-soft)' : 'var(--surface)' }}
                  >
                    <p className={`font-serif text-lg ${active ? 'text-[var(--accent)]' : 'text-[var(--text)]'}`}>
                      {p.name}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--subtle)] mt-1 leading-tight">
                      {p.role}
                    </p>
                  </button>
                );
              })}
            </div>

            {activeProfile && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    {activeProfile.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 text-xs font-mono">
                  <div>
                    <p className="text-[var(--subtle)] uppercase tracking-wider">Balance</p>
                    <p className="mt-0.5 tabular-nums">₹{activeProfile.opening_balance.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-[var(--subtle)] uppercase tracking-wider">Obligations</p>
                    <p className="mt-0.5 tabular-nums">{activeProfile.obligation_count}</p>
                  </div>
                  <div>
                    <p className="text-[var(--subtle)] uppercase tracking-wider">Txns</p>
                    <p className="mt-0.5 tabular-nums">{activeProfile.transaction_count}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={run}
          disabled={loading || !selected}
          className="mt-8 inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[var(--text)] text-[var(--bg)] text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {loading ? 'Running…' : 'Run full pipeline'}
        </button>

        {error && (
          <div className="mt-8 p-4 border border-[var(--accent)]/40 bg-[var(--accent-soft)] rounded text-sm flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-[var(--accent)] shrink-0" />
            {error}
          </div>
        )}

        {forecast && (
          <section className="mt-12">
            <Label n="01" title="60-day cashflow forecast" />
            <div className="border border-[var(--border)] rounded-lg p-6" style={{ background: 'var(--surface)' }}>
              <FanChart days={forecast.days} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-[var(--border)]">
                <Metric label="P10 end" value={fmt(forecast.summary.p10_end)} />
                <Metric label="P50 end" value={fmt(forecast.summary.p50_end)} />
                <Metric label="P90 end" value={fmt(forecast.summary.p90_end)} />
                <Metric
                  label="Calibration"
                  value={`${(forecast.calibration.p90_interval_coverage * 100).toFixed(0)}%`}
                  hint="target 85–95%"
                />
              </div>
            </div>
          </section>
        )}

        {invest && (
          <section className="mt-12">
            <Label n="02" title="Pre-trade guard & execution" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Box label="Opening cash" value={fmt(invest.opening_cash)} />
              <div
                className="border border-[var(--accent)]/50 rounded-lg p-5"
                style={{ background: 'var(--accent-soft)' }}
              >
                <p className="text-xs text-[var(--accent)] uppercase tracking-wider mb-2">
                  Safe investable
                </p>
                <p className="font-serif text-3xl text-[var(--accent)]">
                  {fmt(invest.safe_investable)}
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {invest.opening_cash > 0
                    ? `${((invest.safe_investable / invest.opening_cash) * 100).toFixed(0)}% of balance`
                    : '—'}
                </p>
              </div>
              <Box label="Reserve" value={fmt(invest.remaining_cash)} />
            </div>

            <div
              className="mt-4 border border-[var(--border)] rounded-lg overflow-hidden"
              style={{ background: 'var(--surface)' }}
            >
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg)]/40">
                  <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)]">
                    <th className="px-4 py-3 font-mono">ID</th>
                    <th className="px-4 py-3 font-mono">Instrument</th>
                    <th className="px-4 py-3 font-mono">Amount</th>
                    <th className="px-4 py-3 font-mono">Status</th>
                    <th className="px-4 py-3 font-mono">Settlement</th>
                  </tr>
                </thead>
                <tbody>
                  {invest.trades.map((t: any) => (
                    <tr key={t.id} className="border-t border-[var(--border)]">
                      <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">{t.id}</td>
                      <td className="px-4 py-3">{t.symbol}</td>
                      <td className="px-4 py-3 tabular-nums">{fmt(t.amount)}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={t.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">
                        {t.settlement_date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {reconcile && (
          <section className="mt-12">
            <Label n="03" title="Reconciliation" />
            <div className="border border-[var(--border)] rounded-lg p-5" style={{ background: 'var(--surface)' }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <Metric label="Opening" value={fmt(reconcile.opening_cash)} />
                <Metric label="Deployed" value={fmt(reconcile.total_deployed)} />
                <Metric label="Expected" value={fmt(reconcile.expected_cash)} />
                <Metric label="Actual" value={fmt(reconcile.actual_cash)} />
              </div>
              <div
                className={`mt-5 pt-5 border-t border-[var(--border)] flex items-center gap-2 text-sm ${
                  reconcile.reconciliation_diff_paisa < 0.01
                    ? 'text-[var(--good)]'
                    : 'text-[var(--accent)]'
                }`}
              >
                {reconcile.reconciliation_diff_paisa < 0.01 ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                <span>
                  Diff: {reconcile.reconciliation_diff_paisa.toFixed(2)} paisa · {reconcile.status}
                </span>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Label({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4 mb-4">
      <span className="font-mono text-xs text-[var(--accent)] tracking-widest">{n}</span>
      <h2 className="font-serif text-xl">{title}</h2>
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

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--border)] rounded-lg p-5" style={{ background: 'var(--surface)' }}>
      <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-2">{label}</p>
      <p className="font-serif text-3xl">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const color =
    status === 'COMMITTED'
      ? 'var(--good)'
      : status === 'REJECTED'
      ? 'var(--accent)'
      : 'var(--warn)';
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider"
      style={{ color, backgroundColor: `${color}18`, border: `1px solid ${color}40` }}
    >
      {status}
    </span>
  );
}

function fmt(n: number): string {
  if (!isFinite(n)) return '₹0';
  return '₹' + Math.round(n).toLocaleString('en-IN');
}