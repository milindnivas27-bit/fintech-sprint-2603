'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { ScrambleText } from '@/components/ScrambleText';
import { Magnetic } from '@/components/Magnetic';
import { Reveal } from '@/components/Reveal';

gsap.registerPlugin(ScrollTrigger);

const SECTIONS = [
  { href: '/concept', n: '01', label: 'Concept', desc: 'Who this is for. The problem. The five-step pipeline.' },
  { href: '/math',    n: '02', label: 'Math',    desc: 'Four formulas. Plain English, then formal. Auditable end to end.' },
  { href: '/demo',    n: '03', label: 'Demo',    desc: 'Five household scenarios. One button. Full pipeline.' },
];

const NUMBERS = [
  { k: 'Missed obligations', v: '0',     hint: 'the metric gate' },
  { k: 'Compute budget',     v: '1 CPU', hint: '1 GB RAM' },
  { k: 'Settlement',         v: 'T+2',   hint: 'modelled' },
  { k: 'Seed',               v: '42',    hint: 'byte-identical' },
];

const PIPELINE = [
  { n: '01', t: 'Ingest',    d: 'Normalize. Dedupe. Reconcile.' },
  { n: '02', t: 'Forecast',  d: '1000 bootstrap paths.' },
  { n: '03', t: 'Guard',     d: 'Block every unsafe trade.' },
  { n: '04', t: 'Execute',   d: 'T+2 settlement. FIFO lots.' },
  { n: '05', t: 'Reconcile', d: 'Diff = 0 paisa.' },
];

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const children = el.querySelectorAll('[data-hero]');
    gsap.fromTo(
      children,
      { opacity: 0, y: 20, filter: 'blur(8px)' },
      {
        opacity: 1, y: 0, filter: 'blur(0px)',
        duration: 1.0, stagger: 0.08, ease: 'power3.out',
      }
    );
  }, []);

  return (
    <main className="relative">

      {/* ═══════ HERO ═══════════════════════════════════ */}
      <section>
        <div className="wrap pt-24 md:pt-32 pb-24 md:pb-36">
          <div ref={heroRef} className="max-w-[1120px]">

            <p data-hero className="t-meta mb-14 md:mb-20">
              // FS-2603 · FinTech Sprint &apos;26
            </p>

            <h1 data-hero className="t-display">
              <ScrambleText
                as="span"
                text="An investment engine"
                duration={1400}
                delay={0}
                className="block"
                style={{ color: 'var(--text-dim)' }}
              />
              <ScrambleText
                as="span"
                text="that never"
                duration={1400}
                delay={0}
                className="block"
              />
              <span className="block">
                <ScrambleText
                  as="span"
                  text="misses a bill"
                  duration={1400}
                  delay={0}
                />
                <span style={{ color: 'var(--accent)' }}>.</span>
              </span>
            </h1>

            <div
              data-hero
              className="mt-20 md:mt-28 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16"
            >
              <p className="t-lead md:col-span-7 max-w-[54ch]">
                An investment engine for banks and wealth apps. It decides how
                much of a household&apos;s idle cash can be safely invested —{' '}
                <span style={{ color: 'var(--text-muted)' }}>
                  without ever missing a fixed obligation.
                </span>
              </p>

              <div className="md:col-span-5 flex flex-wrap gap-3 md:justify-end md:items-start">
                <Magnetic>
                  <Link href="/demo" className="btn-red">
                    Run demo
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Magnetic>
                <Magnetic>
                  <Link href="/judges" className="btn-ghost">
                    For judges
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </Magnetic>
              </div>
            </div>

            {/* Evidence ticks */}
            <div
              data-hero
              className="mt-20 md:mt-24 pt-8 flex flex-wrap gap-x-8 gap-y-3"
              style={{ borderTop: '1px solid var(--rule)' }}
            >
              {[
                'No LLM in the scored path',
                'Byte-identical reruns, seed=42',
                'Reconciliation diff = 0 paisa',
                'Full disclosure — see /judges',
              ].map((t) => (
                <div key={t} className="flex items-center gap-2.5">
                  <span className="w-1 h-1 rounded-full" style={{ background: 'var(--accent)' }} />
                  <span className="t-small">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ NUMBERS ════════════════════════════════ */}
      <section className="section section-rule">
        <div className="wrap">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {NUMBERS.map((n, i) => (
              <Reveal key={n.k} delay={i * 0.04}>
                <div
                  className="stat"
                  style={{
                    paddingLeft: i > 0 ? 'clamp(20px, 3vw, 44px)' : 0,
                    borderLeft: i > 0 ? '1px solid var(--rule)' : 'none',
                  }}
                >
                  <p className="stat-label">{n.k}</p>
                  <p className="stat-value t-num">{n.v}</p>
                  <p className="stat-hint">{n.hint}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PIPELINE ══════════════════════════════ */}
      <section className="section section-rule" style={{ background: 'var(--bg-raised)' }}>
        <div className="wrap py-section">
          <Reveal>
            <div className="split mb-16 md:mb-24">
              <p className="t-meta">// Pipeline</p>
              <div>
                <h2 className="t-h1 max-w-[24ch]">
                  <span style={{ color: 'var(--text-dim)' }}>Five steps.</span>{' '}
                  One deterministic path.
                </h2>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div
              className="grid grid-cols-1 md:grid-cols-5"
              style={{ borderTop: '1px solid var(--rule)', borderLeft: '1px solid var(--rule)' }}
            >
              {PIPELINE.map((s) => (
                <div
                  key={s.n}
                  className="p-6 md:p-7 transition-colors"
                  style={{
                    background: 'var(--bg-raised)',
                    borderRight: '1px solid var(--rule)',
                    borderBottom: '1px solid var(--rule)',
                  }}
                >
                  <p className="row-num mb-10">{s.n}</p>
                  <p className="t-h3 mb-3">{s.t}</p>
                  <p className="t-small">{s.d}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════ SECTIONS ══════════════════════════════ */}
      <section className="section section-rule">
        <div className="wrap py-section">
          <Reveal>
            <div className="split mb-16 md:mb-24">
              <p className="t-meta">// Read in order</p>
              <div>
                <h2 className="t-h1 max-w-[24ch]">
                  <span style={{ color: 'var(--text-dim)' }}>Three sections.</span>{' '}
                  Fifteen minutes.
                </h2>
              </div>
            </div>
          </Reveal>

          <div>
            {SECTIONS.map((s, i) => (
              <Reveal key={s.href} delay={i * 0.04}>
                <Link href={s.href} className="row group">
                  <span className="row-num">{s.n}</span>
                  <span className="t-h2">{s.label}</span>
                  <span className="t-body max-w-[54ch]">{s.desc}</span>
                  <span className="flex md:justify-end">
                    <ArrowUpRight
                      className="w-5 h-5 transition-all opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      style={{ color: 'var(--accent)' }}
                    />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ JUDGES ════════════════════════════════ */}
      <section className="section section-rule">
        <div className="wrap py-block">
          <Reveal>
            <div className="split">
              <p className="t-meta" style={{ color: 'var(--accent)' }}>// For judges</p>
              <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-6">
                <p className="t-h2 max-w-[30ch]">
                  Direct access.{' '}
                  <span style={{ color: 'var(--text-muted)' }}>
                    Every endpoint, every failure, every number.
                  </span>
                </p>
                <Link href="/judges" className="link-underline shrink-0">
                  Open judge view
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════ FOOTER ════════════════════════════════ */}
      <footer className="section section-rule" style={{ background: 'var(--bg-raised)' }}>
        <div className="wrap py-section">
          <p className="t-h1 max-w-[18ch]">
            <span style={{ color: 'var(--text-dim)' }}>Obligation-safe</span>{' '}
            investing.
          </p>

          <div
            className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-10 pt-10"
            style={{ borderTop: '1px solid var(--rule)' }}
          >
            <div>
              <p className="t-meta-sm mb-3">Repository</p>
              <a
                href="https://github.com/milindnivas27-bit/fintech-sprint-2603"
                target="_blank"
                rel="noopener noreferrer"
                className="t-small hover:text-[var(--accent)] transition-colors"
              >
                fintech-sprint-2603
              </a>
            </div>
            <div>
              <p className="t-meta-sm mb-3">Team</p>
              <p className="t-small">Milind Nivas</p>
              <p className="t-small">Yuvan Chennu</p>
            </div>
            <div>
              <p className="t-meta-sm mb-3">Event</p>
              <p className="t-small">FinTech Sprint &apos;26</p>
              <p className="t-small" style={{ color: 'var(--text-subtle)' }}>FS-2603</p>
            </div>
            <div>
              <p className="t-meta-sm mb-3">Disclosure</p>
              <Link href="/judges" className="t-small hover:text-[var(--accent)] transition-colors">
                Where this breaks →
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}