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
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#26262b" vertical={false} />
          <XAxis
            dataKey="idx"
            tick={{ fontSize: 10, fill: '#56565c' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#56565c' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 6,
              border: '1px solid #33333a',
              background: '#17171a',
              fontSize: 12,
              color: '#ebe9e4',
            }}
            labelStyle={{ color: '#8a8a8f', fontSize: 10, fontFamily: 'ui-monospace' }}
          />
          <ReferenceLine y={0} stroke="#33333a" strokeOpacity={0.7} />

          {/* P90 — top of the band, emerald */}
          <Line
            type="monotone"
            dataKey="p90"
            stroke="#10b981"
            strokeWidth={1.5}
            dot={false}
            name="P90"
          />
          {/* P50 — median, white */}
          <Line
            type="monotone"
            dataKey="p50"
            stroke="#ebe9e4"
            strokeWidth={2}
            dot={false}
            name="P50"
          />
          {/* P10 — bottom band, amber */}
          <Line
            type="monotone"
            dataKey="p10"
            stroke="#f59e0b"
            strokeWidth={1.5}
            dot={false}
            name="P10"
          />
          {/* P05 — worst case, red dashed */}
          <Line
            type="monotone"
            dataKey="p05"
            stroke="#e63946"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            name="P05"
          />

          <Legend
            wrapperStyle={{
              fontSize: 11,
              fontFamily: 'ui-monospace, monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              paddingTop: 12,
            }}
            iconType="line"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}