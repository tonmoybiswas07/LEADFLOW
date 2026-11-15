
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
  Download,
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
import WorkspaceComparison from "@/components/analytics/WorkspaceComparison";

type AnalyticsRange = "7d" | "30d" | "90d" | "12m" | "all";

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
  role: "Owner" | "Admin" | "Member";
  isOwner: boolean;
  isShared: boolean;
}

const STORAGE_KEY = "leadflow-active-workspace";

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
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const [workspaceId, setWorkspaceId] = useState("all");
  const [range, setRange] = useState<AnalyticsRange>("12m");

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspacesLoading, setWorkspacesLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState("");
  const [initialized, setInitialized] = useState(false);

  const activeWorkspace = workspaces.find(
    (workspace) => workspace.id === workspaceId
  );

  // Load accessible workspaces and synchronize sidebar selection.
  useEffect(() => {
    const controller = new AbortController();

    async function loadWorkspaces() {
      try {
        setWorkspacesLoading(true);
        setWorkspaceError("");

        const response = await fetch("/api/workspaces", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load workspaces");
        }

        const result: Workspace[] = await response.json();

        if (controller.signal.aborted) return;

        setWorkspaces(result);

        const saved = localStorage.getItem(STORAGE_KEY);

        if (
          saved === "personal" ||
          saved === "unassigned"
        ) {
          setWorkspaceId("unassigned");
        } else if (
          saved &&
          result.some((workspace) => workspace.id === saved)
        ) {
          setWorkspaceId(saved);
        } else {
          setWorkspaceId("all");
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
          setInitialized(true);
        }
      }
    }

    void loadWorkspaces();

    return () => controller.abort();
  }, []);

  // Listen for changes made from the sidebar.
  useEffect(() => {
    function handleWorkspaceChange(event: Event) {
      const customEvent = event as CustomEvent<{
        workspaceId?: string;
      }>;

      const selected =
        customEvent.detail?.workspaceId ||
        localStorage.getItem(STORAGE_KEY);

      if (!selected) return;

      if (
        selected === "personal" ||
        selected === "unassigned"
      ) {
        setWorkspaceId("unassigned");
      } else if (
        selected === "all" ||
        workspaces.some((workspace) => workspace.id === selected)
      ) {
        setWorkspaceId(selected);
      }
    }

    window.addEventListener(
      "workspace-changed",
      handleWorkspaceChange
    );

    return () => {
      window.removeEventListener(
        "workspace-changed",
        handleWorkspaceChange
      );
    };
  }, [workspaces]);

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
          const result = await response.json().catch(() => null);

          throw new Error(
            result?.message || "Failed to load analytics"
          );
        }

        const result: AnalyticsData = await response.json();

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

        setData(null);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [workspaceId, range]
  );

  useEffect(() => {
    if (!initialized) return;

    const controller = new AbortController();

    void fetchAnalytics(controller.signal);

    return () => controller.abort();
  }, [fetchAnalytics, initialized]);

  const handleWorkspaceChange = (value: string) => {
    setWorkspaceId(value);
    setExportError("");

    // Keep the existing sidebar storage convention.
    if (value === "unassigned") {
      localStorage.setItem(STORAGE_KEY, "personal");
    } else if (value !== "all") {
      localStorage.setItem(STORAGE_KEY, value);
    }

    // "all" is an analytics-only view. Do not write it
    // as a workspace ID to sidebar storage.
    if (value !== "all") {
      window.dispatchEvent(
        new CustomEvent("workspace-changed", {
          detail: {
            workspaceId:
              value === "unassigned" ? "personal" : value,
          },
        })
      );
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      setExportError("");

      const params = new URLSearchParams({
        workspaceId,
        range,
      });

      const response = await fetch(
        `/api/analytics/export?${params.toString()}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        const result = await response.json().catch(() => null);

        throw new Error(
          result?.message || "Failed to export CSV"
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `leadflow-leads-${workspaceId}-${range}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : "Export failed"
      );
    } finally {
      setExporting(false);
    }
  };

  if (!initialized || (loading && !data)) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-teal-600" />
          <p className="mt-4 text-sm text-slate-500">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle size={40} className="text-red-500" />
        <p className="text-slate-600">
          {error || "Something went wrong"}
        </p>
        <Button onClick={() => void fetchAnalytics()}>
          Try Again
        </Button>
      </div>
    );
  }

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

  const hasStatusData = data.statusDistribution.some(
    (item) => item.value > 0
  );

  const hasSourceData = data.sourceDistribution.length > 0;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Analytics Overview
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Track your lead performance, sources, and conversion insights.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => void handleExportCSV()}
            disabled={exporting || loading}
            className="gap-2 bg-teal-600 text-white hover:bg-teal-700"
          >
            {exporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>

          <Button
            variant="outline"
            onClick={() => void fetchAnalytics()}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Workspace context */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-100 bg-teal-50/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white p-2.5 text-teal-600">
            <Layers3 size={20} />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">
              Current Analytics Scope
            </p>
            <h3 className="font-semibold text-slate-900">
              {workspaceId === "all"
                ? "All Accessible Workspaces"
                : workspaceId === "unassigned"
                  ? "Personal Leads"
                  : activeWorkspace?.name || "Workspace"}
            </h3>
          </div>
        </div>

        {activeWorkspace && (
          <span className="rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-semibold text-teal-700">
            {activeWorkspace.role}
            {activeWorkspace.isShared ? " · Shared" : ""}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Layers3 size={18} className="shrink-0 text-teal-600" />

            {workspacesLoading ? (
              <div className="flex h-10 min-w-44 items-center gap-2 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin" />
                Loading...
              </div>
            ) : (
              <Select
                value={workspaceId}
                onValueChange={handleWorkspaceChange}
              >
                <SelectTrigger className="w-full min-w-44 bg-slate-50 sm:w-52">
                  <SelectValue placeholder="Select Workspace" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    All Workspaces
                  </SelectItem>

                  <SelectItem value="unassigned">
                    Personal Leads
                  </SelectItem>

                  {workspaces.map((workspace) => (
                    <SelectItem
                      key={workspace.id}
                      value={workspace.id}
                    >
                      {workspace.name} ({workspace.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

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
          disabled={workspaceId === "all" && range === "12m"}
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

      {exportError && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-600"
        >
          {exportError}
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

                <div className={`rounded-xl p-2.5 ${stat.color}`}>
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

      {/* Lead Growth */}
      <ChartCard
        title="Lead Growth"
        description="Monthly lead acquisition and converted leads for the selected period."
      >
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
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
        <ChartCard
          title="Lead Status Distribution"
          description="Current leads grouped by pipeline status."
        >
          {hasStatusData ? (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
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
                          fill={COLORS[index % COLORS.length]}
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

        <ChartCard
          title="Lead Sources"
          description="See which channels generate the most leads."
        >
          {hasSourceData ? (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
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
                          fill={COLORS[index % COLORS.length]}
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

      {/* Workspace Comparison */}
      <WorkspaceComparison range={range} />
    </div>
  );
}
