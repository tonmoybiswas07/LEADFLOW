
"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Loader2,
  AlertCircle,
  Trophy,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

interface WorkspaceStats {
  workspaceId: string;
  name: string;
  color: string;
  totalLeads: number;
  convertedLeads: number;
  activeLeads: number;
  lostLeads: number;
  conversionRate: number;
}

interface ComparisonResponse {
  range: string;
  comparison: WorkspaceStats[];
}

interface Props {
  range: "7d" | "30d" | "90d" | "12m" | "all";
}

export default function WorkspaceComparison({
  range,
}: Props) {
  const [data, setData] =
    useState<ComparisonResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchComparison() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({ range });

        const response = await fetch(
          `/api/analytics/comparison?${params.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          const result = await response
            .json()
            .catch(() => null);

          throw new Error(
            result?.message ||
              "Failed to load comparison"
          );
        }

        const result: ComparisonResponse =
          await response.json();

        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong"
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchComparison();

    return () => controller.abort();
  }, [range]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2
            size={20}
            className="animate-spin text-teal-600"
          />
          Loading workspace comparison...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-600">
        <AlertCircle size={20} />
        {error}
      </div>
    );
  }

  const comparison = data?.comparison ?? [];

  const totalLeads = comparison.reduce(
    (sum, item) => sum + item.totalLeads,
    0
  );

  const totalConverted = comparison.reduce(
    (sum, item) => sum + item.convertedLeads,
    0
  );

  const overallConversionRate = totalLeads
    ? ((totalConverted / totalLeads) * 100).toFixed(1)
    : "0.0";

  const bestWorkspace = [...comparison]
    .filter(
      (item) =>
        item.workspaceId !== "unassigned" &&
        item.totalLeads > 0
    )
    .sort(
      (a, b) =>
        b.conversionRate - a.conversionRate ||
        b.convertedLeads - a.convertedLeads
    )[0];

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-50 p-3 text-teal-600">
            <BarChart3 size={23} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Workspace Comparison
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Compare lead performance across your
              workspaces.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Total Leads
            </p>
            <Users className="text-teal-600" size={20} />
          </div>

          <h3 className="mt-3 text-3xl font-bold text-slate-900">
            {totalLeads}
          </h3>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Overall Conversion
            </p>
            <TrendingUp
              className="text-blue-600"
              size={20}
            />
          </div>

          <h3 className="mt-3 text-3xl font-bold text-slate-900">
            {overallConversionRate}%
          </h3>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Best Conversion Rate
            </p>
            <Trophy
              className="text-amber-500"
              size={20}
            />
          </div>

          <h3 className="mt-3 truncate text-xl font-bold text-slate-900">
            {bestWorkspace?.name || "No data"}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {bestWorkspace
              ? `${bestWorkspace.conversionRate}% conversion`
              : "No leads available"}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-lg font-bold text-slate-900">
          Leads by Workspace
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Total leads and converted leads comparison.
        </p>

        {totalLeads > 0 ? (
          <div className="mt-6 h-[350px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={comparison}
                margin={{
                  top: 10,
                  right: 10,
                  left: -20,
                  bottom: 50,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  angle={-25}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fontSize: 11 }}
                />

                <YAxis allowDecimals={false} />

                <Tooltip />
                <Legend />

                <Bar
                  dataKey="totalLeads"
                  name="Total Leads"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                >
                  {comparison.map((item) => (
                    <Cell
                      key={item.workspaceId}
                      fill={item.color}
                    />
                  ))}
                </Bar>

                <Bar
                  dataKey="convertedLeads"
                  name="Converted"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-20 text-center text-sm text-slate-500">
            No lead data available for this period.
          </p>
        )}
      </div>

      {/* Comparison Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h3 className="text-lg font-bold text-slate-900">
            Workspace Performance
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Detailed performance breakdown.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">
                  Workspace
                </th>
                <th className="px-5 py-4 font-semibold">
                  Total
                </th>
                <th className="px-5 py-4 font-semibold">
                  Converted
                </th>
                <th className="px-5 py-4 font-semibold">
                  Active
                </th>
                <th className="px-5 py-4 font-semibold">
                  Lost
                </th>
                <th className="px-5 py-4 font-semibold">
                  Conversion
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {comparison.map((item) => (
                <tr
                  key={item.workspaceId}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor: item.color,
                        }}
                      />

                      <span className="font-semibold text-slate-900">
                        {item.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    {item.totalLeads}
                  </td>

                  <td className="px-5 py-4 text-blue-600">
                    {item.convertedLeads}
                  </td>

                  <td className="px-5 py-4 text-amber-600">
                    {item.activeLeads}
                  </td>

                  <td className="px-5 py-4 text-red-600">
                    {item.lostLeads}
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-teal-50 px-3 py-1 font-semibold text-teal-700">
                      {item.conversionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
