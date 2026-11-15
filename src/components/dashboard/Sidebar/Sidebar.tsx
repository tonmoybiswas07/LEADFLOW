
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileUp,
  CopyCheck,
  Building2,
  ChartNoAxesCombined,
  Settings,
  Layers3,
  MailOpen,
  ChevronDown,
  Check,
  Crown,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  description: string;
  color: string;
  role: "Owner" | "Admin" | "Member";
  isOwner: boolean;
  isShared: boolean;
}

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "All Leads",
    href: "/dashboard/leads",
    icon: Users,
  },
  {
    name: "Import Leads",
    href: "/dashboard/import",
    icon: FileUp,
  },
  {
    name: "Duplicates",
    href: "/dashboard/duplicates",
    icon: CopyCheck,
  },
  {
    name: "Workspaces",
    href: "/dashboard/workspaces",
    icon: Building2,
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: ChartNoAxesCombined,
  },
  {
    name: "Team",
    href: "/team",
    icon: Users,
  },
  {
    name: "Invitations",
    href: "/invitations",
    icon: MailOpen,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

const STORAGE_KEY = "leadflow-active-workspace";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] =
    useState<string | null>(null);

  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState("");

  const loadWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      setWorkspaceError("");

      const response = await fetch("/api/workspaces", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load workspaces"
        );
      }

      if (!Array.isArray(data)) {
        throw new Error("Invalid workspace response");
      }

      const workspaceList = data as Workspace[];
      setWorkspaces(workspaceList);

      const savedId = localStorage.getItem(STORAGE_KEY);

      const selectedWorkspace =
        workspaceList.find((w) => w.id === savedId) ??
        workspaceList[0];

      const nextId = selectedWorkspace?.id ?? null;

      setActiveWorkspaceId(nextId);

      if (nextId) {
        localStorage.setItem(STORAGE_KEY, nextId);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }

      window.dispatchEvent(
        new CustomEvent("workspace-changed", {
          detail: { workspaceId: nextId },
        })
      );
    } catch (error) {
      setWorkspaceError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  const selectWorkspace = (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    setWorkspaceOpen(false);

    localStorage.setItem(STORAGE_KEY, workspaceId);

    window.dispatchEvent(
      new CustomEvent("workspace-changed", {
        detail: { workspaceId },
      })
    );

    router.refresh();
  };

  const activeWorkspace = workspaces.find(
    (workspace) => workspace.id === activeWorkspaceId
  );

  return (
    <aside className="flex h-full flex-col bg-white">
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
        <div className="rounded-xl bg-teal-600 p-2.5 text-white">
          <Layers3 size={24} />
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900">
            LeadFlow
          </h1>
          <p className="text-xs text-slate-400">
            Lead Management SaaS
          </p>
        </div>
      </div>

      {/* Workspace Selector */}
      <div className="border-b border-slate-100 p-4">
        <div className="mb-3 flex items-center justify-between px-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Current Workspace
          </p>

          <button
            type="button"
            onClick={loadWorkspaces}
            disabled={loading}
            title="Refresh workspaces"
            className="text-slate-400 transition hover:text-teal-600 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
            <Loader2 size={17} className="animate-spin" />
            Loading workspaces...
          </div>
        ) : workspaceError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {workspaceError}
          </div>
        ) : workspaces.length === 0 ? (
          <Link
            href="/dashboard/workspaces"
            className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 hover:border-teal-500 hover:text-teal-600"
          >
            <Building2 size={18} />
            Create a Workspace
          </Link>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setWorkspaceOpen(!workspaceOpen)}
              aria-expanded={workspaceOpen}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-teal-300 hover:bg-teal-50"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
                style={{
                  backgroundColor:
                    activeWorkspace?.color ?? "#0d9488",
                }}
              >
                <Building2 size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {activeWorkspace?.name ?? "Select Workspace"}
                </p>

                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  {activeWorkspace?.isOwner && (
                    <Crown size={12} className="text-amber-500" />
                  )}
                  <span>{activeWorkspace?.role}</span>
                  {activeWorkspace?.isShared && (
                    <span className="text-teal-600">· Shared</span>
                  )}
                </div>
              </div>

              <ChevronDown
                size={17}
                className={`shrink-0 text-slate-400 transition-transform ${
                  workspaceOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {workspaceOpen && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <p className="px-3 py-2 text-xs font-medium text-slate-400">
                  Your Workspaces
                </p>

                {workspaces.map((workspace) => {
                  const selected =
                    workspace.id === activeWorkspaceId;

                  return (
                    <button
                      key={workspace.id}
                      type="button"
                      onClick={() => selectWorkspace(workspace.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${
                        selected
                          ? "bg-teal-50"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className="h-8 w-8 shrink-0 rounded-lg"
                        style={{
                          backgroundColor: workspace.color,
                        }}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {workspace.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {workspace.role}
                          {workspace.isShared ? " · Shared" : ""}
                        </p>
                      </div>

                      {selected && (
                        <Check
                          size={17}
                          className="shrink-0 text-teal-600"
                        />
                      )}
                    </button>
                  );
                })}

                <div className="mt-2 border-t border-slate-100 pt-2">
                  <Link
                    href="/dashboard/workspaces"
                    onClick={() => setWorkspaceOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-teal-600 hover:bg-teal-50"
                  >
                    <Building2 size={15} />
                    Manage Workspaces
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Main Menu
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                active
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-teal-700"
              }`}
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-4">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
        >
          <Settings size={19} />
          Account Settings
        </Link>

        <p className="mt-4 px-4 text-xs text-slate-400">
          © 2026 LeadFlow
        </p>
      </div>
    </aside>
  );
}
