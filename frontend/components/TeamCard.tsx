'use client';

import Image from 'next/image';

interface Props {
  name: string;
  role: string;
  image: string;
  bio: string;
}

export function TeamCard({ name, role, image, bio }: Props) {
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden card-hover" style={{ background: 'var(--surface)' }}>
      <div className="relative aspect-square w-full">
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(10,10,12,0.85) 0%, rgba(10,10,12,0) 45%)',
          }}
        />
      </div>
      <div className="p-6">
        <h3 className="font-serif text-2xl tracking-tight">{name}</h3>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
          {role}
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">{bio}</p>
      </div>
    </div>
  );
}