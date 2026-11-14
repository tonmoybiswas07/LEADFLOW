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
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "All Leads", href: "/dashboard/leads", icon: Users },
  { label: "Import Leads", href: "/dashboard/import", icon: FileUp },
  { label: "Duplicates", href: "/dashboard/duplicates", icon: CopyCheck },
  { label: "Workspaces", href: "/dashboard/workspaces", icon: Building2 },
  { label: "Analytics", href: "/dashboard/analytics", icon: ChartNoAxesCombined },
  { label: "Team Members", href: "/dashboard/team", icon: UserRoundCog },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col bg-white">
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
        <div className="rounded-xl bg-teal-600 p-2.5 text-white">
          <Layers3 size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">LeadFlow</h1>
          <p className="text-xs text-slate-400">Lead Management SaaS</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
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
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-teal-700"
              }`}
            >
              <Icon size={19} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-5">
        <p className="text-xs text-slate-400">
          © 2026 LeadFlow
        </p>
      </div>
    </aside>
  );
}