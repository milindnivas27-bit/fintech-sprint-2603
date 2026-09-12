'use client';

import { useEffect, useState } from 'react';

export function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const update = () => {
      const h = document.documentElement;
      const st = h.scrollTop || document.body.scrollTop;
      const sh = (h.scrollHeight || document.body.scrollHeight) - h.clientHeight;
      setP(sh <= 0 ? 0 : (st / sh) * 100);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return (
    <div aria-hidden className="fixed top-0 left-0 right-0 h-[2px] z-[90] pointer-events-none">
      <div
        className="h-full bg-[var(--accent)]"
        style={{
          width: `${p}%`,
          transition: 'width 100ms linear',
          boxShadow: '0 0 12px rgba(229,72,77,0.5)',
        }}
      />
    </div>
  );
}