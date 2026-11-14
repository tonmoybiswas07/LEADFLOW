"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileUp,
  CopyCheck,
  Building2,
  ChartNoAxesCombined,
  UserRoundCog,
  Settings,
  Layers3,
  LogOut,
} from "lucide-react";

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
    name: "Team Members",
    href: "/dashboard/team",
    icon: UserRoundCog,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

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