
import Link from "next/link";
import {
  ArrowUpRight,
  Users,
  Eye,
  CalendarDays,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";
import type { DashboardData } from "@/types/dashboard";

interface Props {
  leads: DashboardData["recentLeads"];
}

const statusStyles: Record<string, string> = {
  New: "bg-teal-50 text-teal-700 border-teal-100",
  Contacted: "bg-blue-50 text-blue-700 border-blue-100",
  Qualified: "bg-violet-50 text-violet-700 border-violet-100",
  Converted:
    "bg-emerald-50 text-emerald-700 border-emerald-100",
  Lost: "bg-red-50 text-red-700 border-red-100",
};

export default function RecentLeads({ leads }: Props) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-50 p-3 text-teal-600">
            <Users size={21} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Recent Leads
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Latest leads in your selected workspace
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          asChild
          className="rounded-xl"
        >
          <Link href="/leads">
            View All Leads
            <ArrowUpRight size={16} className="ml-2" />
          </Link>
        </Button>
      </div>

      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
            <Users size={30} />
          </div>

          <h3 className="mt-4 font-semibold text-slate-800">
            No leads found
          </h3>

          <p className="mt-2 max-w-sm text-sm text-slate-500">
            There are no leads to display for this workspace.
          </p>

          <Button asChild className="mt-5 bg-teal-600 hover:bg-teal-700">
            <Link href="/leads">Manage Leads</Link>
          </Button>
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-y border-slate-100 bg-slate-50">
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-4 font-semibold">
                  Lead
                </th>
                <th className="px-6 py-4 font-semibold">
                  Company
                </th>
                <th className="px-6 py-4 font-semibold">
                  Status
                </th>
                <th className="px-6 py-4 font-semibold">
                  Source
                </th>
                <th className="px-6 py-4 font-semibold">
                  Added Date
                </th>
                <th className="px-6 py-4 text-right font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-slate-100 transition-colors last:border-0 hover:bg-teal-50/30"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-teal-100 font-semibold text-teal-700">
                          {lead.name
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <p className="font-semibold text-slate-800">
                          {lead.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {lead.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-medium text-slate-600">
                    {lead.company || "—"}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                        statusStyles[lead.status] ||
                        "bg-slate-50 text-slate-700"
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {lead.source || "—"}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <CalendarDays size={15} />
                      {lead.createdAt}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-teal-600 hover:bg-teal-50 hover:text-teal-700"
                    >
                      <Link href="/leads">
                        <Eye size={16} className="mr-1" />
                        View
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
        <p className="text-xs text-slate-500">
          Showing {leads.length} recent leads
        </p>

        <Link
          href="/leads"
          className="flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700"
        >
          Manage All Leads
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </section>
  );
}
