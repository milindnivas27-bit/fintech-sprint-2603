'use client';

import { ReactNode } from 'react';

interface Props {
  n: string;
  title: string;
  plain: string;
  equation: ReactNode;
  why: string;
}

export function MathCard({ n, title, plain, equation, why }: Props) {
  return (
    <div className="border border-[var(--border)] rounded-lg p-6 md:p-8 card-hover" style={{ background: 'var(--surface)' }}>
      <div className="flex items-baseline gap-4 mb-5">
        <span className="font-mono text-xs text-[var(--accent)] tracking-widest">{n}</span>
        <h3 className="font-serif text-2xl tracking-tight">{title}</h3>
      </div>

      <p className="text-sm text-[var(--muted)] leading-relaxed mb-5">
        {plain}
      </p>

      <div className="equation mb-5">
        {equation}
      </div>

      <p className="text-xs text-[var(--subtle)] leading-relaxed">
        <span className="font-mono uppercase tracking-wider text-[var(--accent)]">why · </span>
        {why}
      </p>
    </div>
  );
}