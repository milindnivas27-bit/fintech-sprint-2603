'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export function Compare() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const withoutBars = [
    { label: 'Rent · 3rd', pct: 100, color: 'var(--accent)' },
    { label: 'EMI · 7th', pct: 82, color: 'var(--accent)' },
    { label: 'Insurance · 15th', pct: 12, color: 'var(--accent)' },
  ];

  const withBars = [
    { label: 'Rent · 3rd', pct: 100, color: 'var(--good)' },
    { label: 'EMI · 7th', pct: 100, color: 'var(--good)' },
    { label: 'Insurance · 15th', pct: 100, color: 'var(--good)' },
  ];

  return (
    <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Without guard */}
      <div className="border border-[var(--border)] rounded-lg p-6 md:p-8" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-[var(--accent)]" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--accent)]">
            Without guard
          </span>
        </div>

        <h3 className="font-serif text-2xl mb-2">Aggressive, naive investing</h3>
        <p className="text-sm text-[var(--muted)] mb-7">
          &ldquo;You have ₹2L idle — invest ₹1.8L.&rdquo; One late salary. One missed debit. One
          penalty. Credit score hit.
        </p>

        <div className="space-y-3">
          {withoutBars.map((b) => (
            <div key={b.label}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[var(--muted)]">{b.label}</span>
                <span className="tabular-nums font-mono">{b.pct}%</span>
              </div>
              <div className="h-[3px] rounded-full" style={{ background: 'var(--border)' }}>
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: visible ? `${b.pct}%` : '0%',
                    background: b.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs font-mono uppercase tracking-wider text-[var(--accent)]">
          Missed obligations: 1
        </p>
      </div>

      {/* With guard */}
      <div className="border border-[var(--border)] rounded-lg p-6 md:p-8" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-[var(--good)]" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--good)]">
            With FS-2603 guard
          </span>
        </div>

        <h3 className="font-serif text-2xl mb-2">Conservative, honest investing</h3>
        <p className="text-sm text-[var(--muted)] mb-7">
          Invest ₹1.2L. Reserve ₹80K against the worst-case P5 path. Every obligation
          covered, forever. Returns are smaller. Nothing breaks.
        </p>

        <div className="space-y-3">
          {withBars.map((b) => (
            <div key={b.label}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[var(--muted)]">{b.label}</span>
                <span className="tabular-nums font-mono">{b.pct}%</span>
              </div>
              <div className="h-[3px] rounded-full" style={{ background: 'var(--border)' }}>
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: visible ? `${b.pct}%` : '0%',
                    background: b.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs font-mono uppercase tracking-wider text-[var(--good)]">
          Missed obligations: 0
        </p>
      </div>
    </div>
  );
}