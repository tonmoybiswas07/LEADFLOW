"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Layers3,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnalyticsData {
  stats: {
    totalLeads: number;
    convertedLeads: number;
    activeLeads: number;
    lostLeads: number;
    conversionRate: number;
  };

  monthlyGrowth: {
    label: string;
    leads: number;
    converted: number;
  }[];

  statusDistribution: {
    name: string;
    value: number;
  }[];

  sourceDistribution: {
    name: string;
    value: number;
  }[];
}

interface Workspace {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

type AnalyticsRange =
  | "7d"
  | "30d"
  | "90d"
  | "12m"
  | "all";

const COLORS = [
  "#0d9488",
  "#2563eb",
  "#7c3aed",
  "#f59e0b",
  "#ef4444",
  "#0891b2",
  "#db2777",
];

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [workspaceId, setWorkspaceId] = useState("all");

  const [range, setRange] =
    useState<AnalyticsRange>("12m");

  // Workspaces
  const [workspaces, setWorkspaces] = useState<
    Workspace[]
  >([]);

  const [workspacesLoading, setWorkspacesLoading] =
    useState(true);

  const [workspaceError, setWorkspaceError] =
    useState("");

  // Fetch analytics with selected filters
  const fetchAnalytics = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          workspaceId,
          range,
        });

        const response = await fetch(
          `/api/analytics?${params.toString()}`,
          {
            cache: "no-store",
            signal,
          }
        );

        if (!response.ok) {
          const result = await response
            .json()
            .catch(() => null);

          throw new Error(
            result?.message ||
              "Failed to load analytics"
          );
        }

        const result: AnalyticsData =
          await response.json();

        if (!signal?.aborted) {
          setData(result);
        }
      } catch (err) {
        if (signal?.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong"
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [workspaceId, range]
  );

  // Load workspaces
  useEffect(() => {
    const controller = new AbortController();

    async function loadWorkspaces() {
      try {
        setWorkspacesLoading(true);
        setWorkspaceError("");

        const response = await fetch(
          "/api/workspaces",
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load workspaces"
          );
        }

        const result: Workspace[] =
          await response.json();

        if (!controller.signal.aborted) {
          setWorkspaces(result);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setWorkspaceError(
          err instanceof Error
            ? err.message
            : "Failed to load workspaces"
        );
      } finally {
        if (!controller.signal.aborted) {
          setWorkspacesLoading(false);
        }
      }
    }

    void loadWorkspaces();

    return () => controller.abort();
  }, []);

  // Refetch analytics when filters change
  useEffect(() => {
    const controller = new AbortController();

    void fetchAnalytics(controller.signal);

    return () => controller.abort();
  }, [fetchAnalytics]);

  // Loading screen
  if (loading && !data) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" />

          <p className="mt-4 text-sm text-slate-500">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  // Error screen
  if (!data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle
          size={40}
          className="text-red-500"
        />

        <p className="text-slate-600">
          {error || "Something went wrong"}
        </p>

        <Button
          onClick={() => void fetchAnalytics()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Stats cards
  const stats = [
    {
      title: "Total Leads",
      value: data.stats.totalLeads,
      icon: Users,
      color: "bg-teal-50 text-teal-600",
    },
    {
      title: "Converted Leads",
      value: data.stats.convertedLeads,
      icon: CheckCircle2,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Conversion Rate",
      value: `${data.stats.conversionRate}%`,
      icon: TrendingUp,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Active Leads",
      value: data.stats.activeLeads,
      icon: Activity,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  const hasStatusData =
    data.statusDistribution.some(
      (item) => item.value > 0
    );

  const hasSourceData =
    data.sourceDistribution.length > 0;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Analytics Overview
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Track your lead performance, sources,
            and conversion insights.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => void fetchAnalytics()}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw
            size={16}
            className={
              loading ? "animate-spin" : ""
            }
          />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Workspace Filter */}
          <div className="flex items-center gap-2">
            <Layers3
              size={18}
              className="shrink-0 text-teal-600"
            />

            {workspacesLoading ? (
              <div className="flex h-10 min-w-44 items-center gap-2 text-sm text-slate-500">
                <Loader2
                  size={16}
                  className="animate-spin"
                />
                Loading workspaces...
              </div>
            ) : (
              <Select
                value={workspaceId}
                onValueChange={setWorkspaceId}
              >
                <SelectTrigger className="w-full min-w-44 bg-slate-50 sm:w-52">
                  <SelectValue placeholder="Select Workspace" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    All Workspaces
                  </SelectItem>

                  <SelectItem value="unassigned">
                    Unassigned Leads
                  </SelectItem>

                  {workspaces.map((workspace) => (
                    <SelectItem
                      key={workspace.id}
                      value={workspace.id}
                    >
                      {workspace.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <CalendarDays
              size={18}
              className="shrink-0 text-teal-600"
            />

            <Select
              value={range}
              onValueChange={(value) =>
                setRange(value as AnalyticsRange)
              }
            >
              <SelectTrigger className="w-full min-w-40 bg-slate-50 sm:w-48">
                <SelectValue placeholder="Select Date Range" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="7d">
                  Last 7 Days
                </SelectItem>

                <SelectItem value="30d">
                  Last 30 Days
                </SelectItem>

                <SelectItem value="90d">
                  Last 90 Days
                </SelectItem>

                <SelectItem value="12m">
                  Last 12 Months
                </SelectItem>

                <SelectItem value="all">
                  All Time
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            setWorkspaceId("all");
            setRange("12m");
          }}
          disabled={
            workspaceId === "all" &&
            range === "12m"
          }
          className="w-full sm:w-auto"
        >
          Reset Filters
        </Button>
      </div>

      {workspaceError && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
          {workspaceError}
        </p>
      )}

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  {stat.title}
                </p>

                <div
                  className={`rounded-xl p-2.5 ${stat.color}`}
                >
                  <Icon size={20} />
                </div>
              </div>

              <h2 className="mt-4 text-3xl font-bold text-slate-900">
                {stat.value}
              </h2>
            </div>
          );
        })}
      </div>

      {/* Lead Growth Chart */}
      <ChartCard
        title="Lead Growth"
        description="Monthly lead acquisition and currently converted leads for the selected period."
      >
        <div className="h-[320px] w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart data={data.monthlyGrowth}>
              <defs>
                <linearGradient
                  id="leadGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#0d9488"
                    stopOpacity={0.25}
                  />

                  <stop
                    offset="100%"
                    stopColor="#0d9488"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />

              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
              />

              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12 }}
              />

              <Tooltip />
              <Legend />

              <Area
                type="monotone"
                dataKey="leads"
                name="Total Leads"
                stroke="#0d9488"
                strokeWidth={3}
                fill="url(#leadGradient)"
              />

              <Area
                type="monotone"
                dataKey="converted"
                name="Converted Leads"
                stroke="#2563eb"
                strokeWidth={2}
                fill="transparent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Distribution Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Status Distribution */}
        <ChartCard
          title="Lead Status Distribution"
          description="Current leads grouped by pipeline status."
        >
          {hasStatusData ? (
            <div className="h-[320px] w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={data.statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={3}
                  >
                    {data.statusDistribution.map(
                      (entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={
                            COLORS[
                              index % COLORS.length
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-20 text-center text-sm text-slate-500">
              No status data available.
            </p>
          )}
        </ChartCard>

        {/* Lead Sources */}
        <ChartCard
          title="Lead Sources"
          description="See which channels generate the most leads."
        >
          {hasSourceData ? (
            <div className="h-[320px] w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={data.sourceDistribution}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 35,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    angle={-30}
                    textAnchor="end"
                    height={70}
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis allowDecimals={false} />
                  <Tooltip />

                  <Bar
                    dataKey="value"
                    name="Leads"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={55}
                  >
                    {data.sourceDistribution.map(
                      (entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={
                            COLORS[
                              index % COLORS.length
                            ]
                          }
                        />
                      )
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-20 text-center text-sm text-slate-500">
              No source data available.
            </p>
          )}
        </ChartCard>
      </div>
    </div>
  );
}