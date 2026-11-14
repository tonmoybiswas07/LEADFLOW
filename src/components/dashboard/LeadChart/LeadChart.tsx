"use client";

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

const chartData = [
  { month: "Jan", leads: 420, converted: 180 },
  { month: "Feb", leads: 580, converted: 240 },
  { month: "Mar", leads: 490, converted: 210 },
  { month: "Apr", leads: 720, converted: 320 },
  { month: "May", leads: 650, converted: 290 },
  { month: "Jun", leads: 890, converted: 420 },
  { month: "Jul", leads: 780, converted: 370 },
  { month: "Aug", leads: 1050, converted: 490 },
  { month: "Sep", leads: 940, converted: 440 },
  { month: "Oct", leads: 1200, converted: 580 },
  { month: "Nov", leads: 1350, converted: 640 },
  { month: "Dec", leads: 1500, converted: 720 },
];

export default function LeadChart() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {/* Header */}
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
          Yearly Overview
        </div>
      </div>

      {/* Legend */}
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

      {/* Chart */}
      <div className="h-[300px] w-full min-w-0 sm:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="leadsGradient"
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
                id="convertedGradient"
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
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />

            <Tooltip
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
              fill="url(#leadsGradient)"
            />

            <Area
              type="monotone"
              dataKey="converted"
              name="Converted Leads"
              stroke="#3b82f6"
              strokeWidth={3}
              fill="url(#convertedGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}