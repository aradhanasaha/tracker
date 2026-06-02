"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TaxBreakdownPieProps {
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  month: string;
}

const SLICES = [
  { key: "cgst", label: "CGST",          color: "#2563eb" },
  { key: "sgst", label: "SGST",          color: "#16a34a" },
  { key: "igst", label: "IGST (settled)",color: "#d97706" },
  { key: "cess", label: "Cess",          color: "#9333ea" },
];

function fmt(v: number) {
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })} cr`;
}

function renderCustomLabel({
  cx, cy, midAngle, outerRadius, percent,
}: {
  cx?: number; cy?: number; midAngle?: number;
  outerRadius?: number; percent?: number;
}) {
  if (!cx || !cy || !midAngle || !outerRadius || !percent || percent < 0.04) return null;
  const R = Math.PI / 180;
  const x = cx + (outerRadius + 18) * Math.cos(-midAngle * R);
  const y = cy + (outerRadius + 18) * Math.sin(-midAngle * R);
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
          fontSize={12} fill="#374151">
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
}

export default function TaxBreakdownPie({
  cgst, sgst, igst, cess, month,
}: TaxBreakdownPieProps) {
  const raw = { cgst, sgst, igst, cess };
  const data = SLICES
    .map((s) => ({ name: s.label, value: raw[s.key as keyof typeof raw], color: s.color }))
    .filter((d) => d.value > 0);

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        {month} — Tax Breakdown
      </h2>
      <p className="text-sm text-gray-500 mb-4">Domestic GST by component</p>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="48%"
            innerRadius={60}
            outerRadius={95}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => [typeof v === "number" ? fmt(v) : String(v), ""]}
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
          />
          <Legend
            iconType="square"
            iconSize={10}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
      {cess === 0 && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          Cess not reported in FY 2025-26 source file
        </p>
      )}
    </div>
  );
}
