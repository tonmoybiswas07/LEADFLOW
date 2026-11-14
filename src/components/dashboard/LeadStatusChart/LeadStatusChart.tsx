"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartPie, ArrowUpRight } from "lucide-react";

const leadStatusData = [
  { name: "New", value: 35, color: "#0d9488" },
  { name: "Contacted", value: 25, color: "#3b82f6" },
  { name: "Qualified", value: 20, color: "#8b5cf6" },
  { name: "Converted", value: 15, color: "#10b981" },
  { name: "Lost", value: 5, color: "#f59e0b" },
];

const total = leadStatusData.reduce(
  (sum, item) => sum + item.value,
  0
);

export default function LeadStatusChart() {
  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

      {/* Header */}
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

      {/* Donut Chart */}
      <div className="relative mt-6 h-[250px] w-full">
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

        {/* Center Label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900">
            {total}
          </span>

          <span className="mt-1 text-xs font-medium text-slate-400">
            Total Leads
          </span>
        </div>
      </div>

      {/* Status Legend */}
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
                  style={{ backgroundColor: item.color }}
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

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
        <div>
          <p className="text-xs text-slate-400">
            Conversion Rate
          </p>

          <p className="mt-1 text-xl font-bold text-teal-600">
            {total > 0
              ? ((leadStatusData.find(
                  (item) => item.name === "Converted"
                )?.value ?? 0) / total * 100).toFixed(1)
              : "0.0"}%
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