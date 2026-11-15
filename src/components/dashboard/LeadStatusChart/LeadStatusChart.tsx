
"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartPie, ArrowUpRight } from "lucide-react";

import type { DashboardData } from "@/types/dashboard";

interface Props {
  data: DashboardData["statusDistribution"];
}

const statusColors: Record<string, string> = {
  New: "#0d9488",
  Contacted: "#3b82f6",
  Qualified: "#8b5cf6",
  Converted: "#10b981",
  Lost: "#f59e0b",
};

export default function LeadStatusChart({ data }: Props) {
  const leadStatusData = data.map((item) => ({
    ...item,
    color: statusColors[item.name] || "#64748b",
  }));

  const total = leadStatusData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const converted =
    leadStatusData.find(
      (item) => item.name === "Converted"
    )?.value ?? 0;

  const conversionRate =
    total > 0
      ? ((converted / total) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Lead Distribution
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Overview of leads by status
          </p>
        </div>

        <div className="rounded-xl bg-teal-50 p-2.5 text-teal-600">
          <ChartPie size={21} />
        </div>
      </div>

      <div className="relative mt-6 h-[250px] w-full">
        {total > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={leadStatusData}
                cx="50%"
                cy="50%"
                innerRadius={72}
                outerRadius={100}
                paddingAngle={4}
                cornerRadius={5}
                dataKey="value"
                nameKey="name"
                stroke="none"
              >
                {leadStatusData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(value, name) => [
                  `${value} leads`,
                  name,
                ]}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  fontSize: "13px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="h-[190px] w-[190px] rounded-full border-[25px] border-slate-100" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900">
            {total}
          </span>

          <span className="mt-1 text-xs font-medium text-slate-400">
            Total Leads
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {leadStatusData.map((item) => {
          const percentage =
            total > 0
              ? ((item.value / total) * 100).toFixed(1)
              : "0.0";

          return (
            <div
              key={item.name}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: item.color,
                  }}
                />

                <span className="text-sm font-medium text-slate-600">
                  {item.name}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-800">
                  {item.value}
                </span>

                <span className="w-14 text-right text-xs text-slate-400">
                  {percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
        <div>
          <p className="text-xs text-slate-400">
            Conversion Rate
          </p>

          <p className="mt-1 text-xl font-bold text-teal-600">
            {conversionRate}%
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700">
          <ArrowUpRight size={15} />
          Lead Insights
        </div>
      </div>
    </div>
  );
}
