"use client";

import { useRouter } from "next/navigation";

interface DashboardSelectorsProps {
  states: string[];
  years: string[];
  currentState: string;
  currentFY: string;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .replace(/\s+/g, "-");
}

export default function DashboardSelectors({
  states,
  years,
  currentState,
  currentFY,
}: DashboardSelectorsProps) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex flex-col gap-0.5">
        <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">State / UT</label>
        <select
          value={currentState}
          onChange={(e) => router.push(`/state/${toSlug(e.target.value)}?fy=${currentFY}`)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
        >
          {states.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-0.5">
        <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Financial Year</label>
        <select
          value={currentFY}
          onChange={(e) => router.push(`/state/${toSlug(currentState)}?fy=${e.target.value}`)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {years.map((y) => (
            <option key={y} value={y}>FY {y}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
