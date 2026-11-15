
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  LayoutDashboard,
  ArrowUpRight,
  Plus,
  ChartNoAxesCombined,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import DashboardStats from "@/components/dashboard/DashboardStats/DashboardStats";
import LeadChart from "@/components/dashboard/LeadChart/LeadChart";
import LeadStatusChart from "@/components/dashboard/LeadStatusChart/LeadStatusChart";
import RecentLeads from "@/components/dashboard/RecentLeads/RecentLeads";

import { Button } from "@/components/ui/button";
import type { DashboardData } from "@/types/dashboard";

const STORAGE_KEY = "leadflow-active-workspace";

function getActiveWorkspace() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved || saved === "personal") {
    return saved === "personal" ? "unassigned" : "all";
  }

  return saved;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [workspaceId, setWorkspaceId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setWorkspaceId(getActiveWorkspace());

    const handleWorkspaceChanged = () => {
      setWorkspaceId(getActiveWorkspace());
      setRefreshKey((previous) => previous + 1);
    };

    window.addEventListener(
      "workspace-changed",
      handleWorkspaceChanged
    );

    return () => {
      window.removeEventListener(
        "workspace-changed",
        handleWorkspaceChanged
      );
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          workspaceId,
        });

        const response = await fetch(
          `/api/dashboard?${params.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message ||
              "Failed to load dashboard data"
          );
        }

        if (!controller.signal.aborted) {
          setData(result as DashboardData);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setData(null);
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

    void loadDashboard();

    return () => controller.abort();
  }, [workspaceId, refreshKey]);

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-7 pb-10">
      {/* Header */}
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-teal-600">
            <LayoutDashboard size={18} />
            Dashboard
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard Overview
          </h1>

          <p className="text-sm leading-relaxed text-slate-500 sm:text-base">
            Monitor your leads, track performance, and manage
            your sales pipeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/analytics">
              <ChartNoAxesCombined size={17} />
              Analytics
              <ArrowUpRight size={15} />
            </Link>
          </Button>

          <Button
            asChild
            className="gap-2 bg-teal-600 text-white hover:bg-teal-700"
          >
            <Link href="/leads">
              <Plus size={17} />
              Manage Leads
            </Link>
          </Button>
        </div>
      </header>

      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-500 p-6 text-white shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
            <Sparkles size={14} />
            LeadFlow Workspace
          </div>

          <h2 className="text-xl font-bold sm:text-2xl">
            Your business, at a glance.
          </h2>

          <p className="mt-3 text-sm leading-6 text-teal-50 sm:text-base">
            Stay organized, follow up with prospects, and
            turn opportunities into successful conversions.
          </p>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-5"
        >
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle size={20} />
            {error}
          </div>

          <Button
            variant="outline"
            onClick={() =>
              setRefreshKey((previous) => previous + 1)
            }
          >
            <RefreshCw size={16} className="mr-2" />
            Retry
          </Button>
        </div>
      )}

      {loading && !data ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      ) : data ? (
        <>
          {/* Statistics */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Performance Overview
            </h2>

            <DashboardStats
              stats={data.stats}
              loading={loading}
            />
          </section>

          {/* Charts */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Lead Analytics
            </h2>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="min-w-0 xl:col-span-2">
                <LeadChart data={data.monthlyGrowth} />
              </div>

              <div className="min-w-0">
                <LeadStatusChart
                  data={data.statusDistribution}
                />
              </div>
            </div>
          </section>

          {/* Recent Leads */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Recent Activity
            </h2>

            <RecentLeads leads={data.recentLeads} />
          </section>
        </>
      ) : null}
    </main>
  );
}
