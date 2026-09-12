'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts';

interface DayPoint {
  date: string;
  p05: number;
  p10: number;
  p50: number;
  p90: number;
}

export function FanChart({ days }: { days: DayPoint[] }) {
  const data = days.map((d, i) => ({
    idx: i,
    p05: d.p05,
    p10: d.p10,
    p50: d.p50,
    p90: d.p90,
  }));

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="idx"
            tick={{ fontSize: 10, fill: 'var(--muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--muted)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              fontSize: 12,
            }}
          />
          <ReferenceLine y={0} stroke="var(--muted)" strokeOpacity={0.4} />
          <Line type="monotone" dataKey="p90" stroke="var(--good)" strokeWidth={1.5} dot={false} name="P90" />
          <Line type="monotone" dataKey="p50" stroke="var(--text)" strokeWidth={2} dot={false} name="P50" />
          <Line type="monotone" dataKey="p10" stroke="var(--warn)" strokeWidth={1.5} dot={false} name="P10" />
          <Line
            type="monotone"
            dataKey="p05"
            stroke="var(--accent)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            name="P05"
          />
          <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'ui-monospace' }} iconType="line" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}