'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  text: string;
  duration?: number;
  delay?: number;
  className?: string;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'div';
}

const CHARS = '!<>-_\\/[]{}—=+*^?#$%&@';

export function ScrambleText({
  text,
  duration = 1300,
  delay = 0,
  className = '',
  as: Tag = 'span',
}: Props) {
  const [display, setDisplay] = useState(text);
  const raf = useRef(0);

  useEffect(() => {
    const total = text.length;
    const start = performance.now() + delay;

    const tick = (now: number) => {
      const elapsed = now - start;
      if (elapsed < 0) {
        raf.current = requestAnimationFrame(tick);
        return;
      }
      const p = Math.min(elapsed / duration, 1);
      const revealed = Math.floor(p * total);
      const out: string[] = [];
      for (let i = 0; i < total; i++) {
        const ch = text[i];
        if (ch === ' ' || ch === '\n') { out.push(ch); continue; }
        if (i < revealed) out.push(ch);
        else if (i < revealed + 5) out.push(CHARS[Math.floor(Math.random() * CHARS.length)]);
        else out.push(ch);
      }
      setDisplay(out.join(''));
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setDisplay(text);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [text, duration, delay]);

  return <Tag className={className}>{display}</Tag>;
}