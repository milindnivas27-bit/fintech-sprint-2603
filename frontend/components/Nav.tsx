'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/concept', label: 'Concept' },
  { href: '/math', label: 'Math' },
  { href: '/demo', label: 'Demo' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl"
      style={{
        background: 'rgba(8, 9, 10, 0.72)',
        borderBottom: '1px solid var(--rule)',
      }}
    >
      <div className="wrap h-14 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <span
            className="w-1.5 h-1.5 rounded-full transition-all group-hover:scale-150"
            style={{ background: 'var(--accent)' }}
          />
          <span className="font-medium text-[14px] tracking-[-0.02em]">
            FS-2603
          </span>
        </Link>

        <nav className="flex items-center gap-0.5">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 h-8 inline-flex items-center rounded-md text-[13px] tracking-[-0.006em] transition-colors"
                style={{
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  background: active ? 'var(--surface)' : 'transparent',
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/judges"
          className="group inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[12px] tracking-[-0.006em] transition-all shrink-0"
          style={{
            border: '1px solid var(--rule-strong)',
            color: 'var(--text-dim)',
          }}
        >
          For judges
          <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </header>
  );
}