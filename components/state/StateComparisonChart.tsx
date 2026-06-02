"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

interface StateEntry {
  state: string;
  slug: string;
  total: number;
}

interface StateComparisonChartProps {
  data: StateEntry[];
  selectedSlug: string;
  fy: string;
}

export default function StateComparisonChart({
  data,
  selectedSlug,
  fy,
}: StateComparisonChartProps) {
  if (data.length === 0) return null;

  const top20 = data.slice(0, 20);

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        State Comparison · FY {fy}
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Annual domestic GST collection · ₹ crore · top 20 states
      </p>
      <ResponsiveContainer width="100%" height={560}>
        <BarChart
          layout="vertical"
          data={top20}
          margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="state"
            width={160}
            tick={(props) => {
              const { x, y, payload } = props as { x: number; y: number; payload: { value: string } };
              const isSelected = payload.value === top20.find(d => d.slug === selectedSlug)?.state;
              return (
                <text x={Number(x) - 4} y={Number(y)} textAnchor="end" dominantBaseline="central"
                      fontSize={11} fill={isSelected ? "#1d4ed8" : "#374151"}
                      fontWeight={isSelected ? 600 : 400}>
                  {payload.value}
                </text>
              );
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(v) => [
              typeof v === "number"
                ? `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })} cr`
                : String(v),
              "Annual GST",
            ]}
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
          />
          <Bar dataKey="total" radius={[0, 4, 4, 0]}>
            {top20.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.slug === selectedSlug ? "#2563eb" : "#bfdbfe"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
