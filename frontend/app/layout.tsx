import type { Metadata } from 'next';
import './globals.css';
import { SmoothScroll } from '@/components/SmoothScroll';
import { ScrollProgress } from '@/components/ScrollProgress';

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'FS-2603 — An investment engine that never misses a bill',
  description:
    'Probabilistic cashflow forecast + a pre-trade guard that blocks any investment which would push the worst-case path below an upcoming obligation.',
  openGraph: {
    title: 'FS-2603 — An investment engine that never misses a bill',
    description:
      'Probabilistic cashflow forecast + a pre-trade guard that never breaches an obligation.',
    images: ['/og.png'],
  },
  twitter: { card: 'summary_large_image', images: ['/og.png'] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SmoothScroll />
        <ScrollProgress />
        <div className="grain-overlay" />
        {children}
      </body>
    </html>
  );
}