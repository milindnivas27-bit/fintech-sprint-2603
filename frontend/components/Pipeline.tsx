'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Step {
  n: string;
  title: string;
  desc: string;
  tag: string;
}

const STEPS: Step[] = [
  {
    n: '01',
    title: 'Ingest',
    desc: 'Normalize messy bank statements — mixed date formats, currencies, duplicates, reversals, joint-account noise.',
    tag: 'python',
  },
  {
    n: '02',
    title: 'Forecast',
    desc: 'Bootstrap 1000 paths from 90 days of history. Produce P10 / P50 / P90 for each of the next 60 days.',
    tag: 'numpy',
  },
  {
    n: '03',
    title: 'Guard',
    desc: 'Before any trade: check the worst-case P5 path against every obligation in the horizon. Block on breach.',
    tag: 'deterministic',
  },
  {
    n: '04',
    title: 'Execute',
    desc: 'Split the safe amount across 3 instruments. Model T+2 settlement. Track FIFO tax lots.',
    tag: 'config-driven',
  },
  {
    n: '05',
    title: 'Reconcile',
    desc: 'Audit the blotter against the ledger. Diff must be exactly zero paisa. Publish the number.',
    tag: 'audit',
  },
];

export function Pipeline() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const totalScroll = Math.max(track.scrollWidth - window.innerWidth, 0);

    const tw = gsap.to(track, {
      x: -totalScroll,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${totalScroll}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });

    return () => {
      if (tw.scrollTrigger) tw.scrollTrigger.kill();
      tw.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-t border-[var(--border)]"
      style={{ height: '100vh' }}
    >
      <div className="absolute top-12 left-6 md:left-10 z-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
          // HOW IT WORKS
        </p>
        <h2 className="font-serif text-2xl md:text-3xl mt-3 max-w-md">
          Five steps. One deterministic pipeline.
        </h2>
      </div>

      <div className="h-full flex items-center">
        <div ref={trackRef} className="flex gap-6 pl-[5vw] pr-[20vw]">
          {STEPS.map((s, i) => (
            <article
              key={s.n}
              className="w-[78vw] md:w-[420px] h-[52vh] md:h-[420px] flex-shrink-0 border border-[var(--border)] rounded-lg p-8 flex flex-col justify-between card-hover"
              style={{ background: 'var(--surface)' }}
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs text-[var(--accent)] tracking-widest">
                  {s.n}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--subtle)] border border-[var(--border)] rounded-full px-2 py-0.5">
                  {s.tag}
                </span>
              </div>

              <div>
                <h3 className="font-serif text-3xl md:text-4xl tracking-tight">
                  {s.title}
                </h3>
                <p className="mt-5 text-sm leading-relaxed text-[var(--muted)]">
                  {s.desc}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {STEPS.map((_, j) => (
                  <span
                    key={j}
                    className="h-[2px] flex-1 rounded-full transition-colors"
                    style={{
                      background: j <= i ? 'var(--accent)' : 'var(--border)',
                    }}
                  />
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--subtle)]">
        scroll →
      </div>
    </section>
  );
}