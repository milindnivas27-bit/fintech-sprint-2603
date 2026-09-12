import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '@/components/Nav';
import { SmoothScroll } from '@/components/SmoothScroll';
import { ScrollProgress } from '@/components/ScrollProgress';
import { HeroCanvas } from '@/components/HeroCanvas';

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'FS-2603 — An investment engine that never misses a bill',
  description:
    'An investment engine for banks and wealth apps. Decides how much of a household’s idle cash can be safely invested — without ever missing a fixed obligation.',
  openGraph: {
    title: 'FS-2603 — An investment engine that never misses a bill',
    description: 'Probabilistic cashflow forecast + a pre-trade guard that never breaches an obligation.',
    images: ['/og.png'],
  },
  twitter: { card: 'summary_large_image', images: ['/og.png'] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="relative">
        <div className="blueprint-grid" aria-hidden />
        <div className="backdrop-glow" aria-hidden />
        <div className="backdrop-glow-2" aria-hidden />
        <div className="backdrop-canvas" aria-hidden>
          <HeroCanvas />
        </div>

        <SmoothScroll />
        <ScrollProgress />
        <div className="grain-overlay" aria-hidden />

        <div className="relative z-10">
          <Nav />
          {children}
        </div>
      </body>
    </html>
  );
}