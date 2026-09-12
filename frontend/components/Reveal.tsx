'use client';

import { useEffect, useRef, ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Props {
  children: ReactNode;
  delay?: number;
  y?: number;
  x?: number;
  blur?: boolean;
  className?: string;
}

export function Reveal({
  children,
  delay = 0,
  y = 24,
  x = 0,
  blur = false,
  className = '',
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.set(el, {
      opacity: 0,
      y,
      x,
      filter: blur ? 'blur(10px)' : 'blur(0px)',
    });

    const tw = gsap.to(el, {
      opacity: 1,
      y: 0,
      x: 0,
      filter: 'blur(0px)',
      duration: 1.0,
      delay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        once: true,
      },
    });

    return () => {
      if (tw.scrollTrigger) tw.scrollTrigger.kill();
      tw.kill();
    };
  }, [delay, y, x, blur]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}