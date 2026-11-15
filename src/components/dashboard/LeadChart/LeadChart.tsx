
"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";

import type { DashboardData } from "@/types/dashboard";

interface Props {
  data: DashboardData["monthlyGrowth"];
}

export default function LeadChart({ data }: Props) {
  const chartId = useId().replace(/:/g, "");
  const leadsGradient = `leads-${chartId}`;
  const convertedGradient = `converted-${chartId}`;

  const total = data.reduce(
    (sum, item) => sum + item.leads,
    0
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Lead Growth Overview
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Lead acquisition and conversion trends
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700">
          <TrendingUp size={17} />
          Last 12 Months
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-5 text-xs font-medium text-slate-600">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-teal-600" />
          Total Leads
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          Converted Leads
        </div>
      </div>

      {total === 0 ? (
        <div className="flex h-[300px] flex-col items-center justify-center text-center sm:h-[350px]">
          <TrendingUp
            size={34}
            className="text-slate-300"
          />
          <p className="mt-4 font-semibold text-slate-700">
            No growth data yet
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Add leads to see your monthly trends.
          </p>
        </div>
      ) : (
        <div className="h-[300px] w-full min-w-0 sm:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 10,
                left: -20,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient
                  id={leadsGradient}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#0d9488"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor="#0d9488"
                    stopOpacity={0}
                  />
                </linearGradient>

                <linearGradient
                  id={convertedGradient}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#3b82f6"
                    stopOpacity={0.15}
                  />
                  <stop
                    offset="95%"
                    stopColor="#3b82f6"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="#e2e8f0"
              />

              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: "#94a3b8",
                  fontSize: 12,
                }}
              />

              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: "#94a3b8",
                  fontSize: 12,
                }}
              />

              <Tooltip
                labelFormatter={(label, payload) => {
                  const year = payload?.[0]?.payload?.year;
                  return year ? `${label} ${year}` : String(label);
                }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                }}
              />

              <Area
                type="monotone"
                dataKey="leads"
                name="Total Leads"
                stroke="#0d9488"
                strokeWidth={3}
                fill={`url(#${leadsGradient})`}
              />

              <Area
                type="monotone"
                dataKey="converted"
                name="Converted Leads"
                stroke="#3b82f6"
                strokeWidth={3}
                fill={`url(#${convertedGradient})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
