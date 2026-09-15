"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ChartPoint = {
  date: string;
  accuracy: number;
};

export default function ScoreChart({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">
        まだ記録がありません。トレーニングを始めましょう。
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 12 }}
          stroke="#94a3b8"
          unit="%"
        />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="accuracy"
          name="正解率"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
