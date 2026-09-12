'use client';

import { useEffect, useRef, useState, CSSProperties } from 'react';

interface Props {
  text: string;
  duration?: number;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'div';
}

const CHARS = '!<>-_\\/[]{}—=+*^?#$%&@';

export function ScrambleText({
  text,
  duration = 1300,
  delay = 0,
  className = '',
  style,
  as: Tag = 'span',
}: Props) {
  // Start blank — the scramble IS the appearance
  const [display, setDisplay] = useState('');
  const raf = useRef(0);

  useEffect(() => {
    const total = text.length;
    const start = performance.now() + delay;

    const tick = (now: number) => {
      const elapsed = now - start;

      // Before the start time: show scrambled placeholder, not the real text
      if (elapsed < 0) {
        const scrambled = text
          .split('')
          .map((ch) =>
            ch === ' ' || ch === '\n'
              ? ch
              : CHARS[Math.floor(Math.random() * CHARS.length)]
          )
          .join('');
        setDisplay(scrambled);
        raf.current = requestAnimationFrame(tick);
        return;
      }

      const p = Math.min(elapsed / duration, 1);
      const revealed = Math.floor(p * total);
      const out: string[] = [];

      for (let i = 0; i < total; i++) {
        const ch = text[i];
        if (ch === ' ' || ch === '\n') {
          out.push(ch);
          continue;
        }
        if (i < revealed) {
          out.push(ch);
        } else if (i < revealed + 5) {
          out.push(CHARS[Math.floor(Math.random() * CHARS.length)]);
        } else {
          out.push(CHARS[Math.floor(Math.random() * CHARS.length)]);
        }
      }

      setDisplay(out.join(''));

      if (p < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        setDisplay(text);
      }
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [text, duration, delay]);

  return (
    <Tag className={className} style={style}>
      {display}
    </Tag>
  );
}