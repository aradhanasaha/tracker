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
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  total: number;
}

interface GSTChartProps {
  series: MonthRecord[];
}

const COLORS = {
  cgst: "#2563eb",
  sgst: "#16a34a",
  igst: "#d97706",
  cess: "#9333ea",
};

function formatCrore(value: number) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L cr`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k cr`;
  return `₹${value} cr`;
}

export default function GSTChart({ series }: GSTChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={series} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip
          formatter={(value, name) => [
            typeof value === "number" ? formatCrore(value) : String(value),
            String(name).toUpperCase(),
          ]}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            fontSize: 13,
          }}
        />
        <Legend
          iconType="square"
          iconSize={10}
          formatter={(v) => v.toUpperCase()}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="cgst" stackId="a" fill={COLORS.cgst} radius={[0, 0, 0, 0]} />
        <Bar dataKey="sgst" stackId="a" fill={COLORS.sgst} radius={[0, 0, 0, 0]} />
        <Bar dataKey="igst" stackId="a" fill={COLORS.igst} radius={[0, 0, 0, 0]} />
        <Bar dataKey="cess" stackId="a" fill={COLORS.cess} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
