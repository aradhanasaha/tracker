"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MonthRecord {
  month: string;
  total: number;
}

interface FYSeries {
  fy: string;
  series: MonthRecord[];
}

interface YoYChartProps {
  data: FYSeries[];
  stateName: string;
}

const FY_MONTHS = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];
const COLORS = ["#2563eb", "#16a34a", "#d97706", "#9333ea"];

function fmt(v: number) {
  return `₹${(v / 1000).toFixed(1)}k cr`;
}

export default function YoYChart({ data, stateName }: YoYChartProps) {
  if (data.length === 0) return null;

  // Build pivot: one entry per FY-month position, columns for each FY year
  const pivot = FY_MONTHS.map((abbr) => {
    const entry: Record<string, number | string> = { month: abbr };
    for (const { fy, series } of data) {
      const rec = series.find((r) => r.month.startsWith(abbr));
      if (rec) entry[`FY ${fy}`] = Math.round(rec.total);
    }
    return entry;
  }).filter((e) => Object.keys(e).length > 1);

  const fyKeys = data.map((d) => `FY ${d.fy}`);

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        Year-on-Year Comparison
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        {stateName} monthly total · ₹ crore
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={pivot} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            formatter={(v, name) => [typeof v === "number" ? fmt(v) : String(v), String(name)]}
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
          />
          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
          {fyKeys.map((key, i) => (
            <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
