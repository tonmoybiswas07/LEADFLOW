
import {
  Users,
  UserPlus,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

import type { DashboardData } from "@/types/dashboard";

interface Props {
  stats?: DashboardData["stats"];
  loading?: boolean;
}

export default function DashboardStats({
  stats,
  loading = false,
}: Props) {
  const safeStats = stats ?? {
    totalLeads: 0,
    newLeads: 0,
    convertedLeads: 0,
    conversionRate: 0,
  };

  const cards = [
    {
      title: "Total Leads",
      value: safeStats.totalLeads.toLocaleString(),
      icon: Users,
      color: "text-teal-600",
      background: "bg-teal-50",
      border: "hover:border-teal-200",
    },
    {
      title: "New Leads",
      value: safeStats.newLeads.toLocaleString(),
      icon: UserPlus,
      color: "text-blue-600",
      background: "bg-blue-50",
      border: "hover:border-blue-200",
    },
    {
      title: "Converted Leads",
      value: safeStats.convertedLeads.toLocaleString(),
      icon: CheckCircle2,
      color: "text-emerald-600",
      background: "bg-emerald-50",
      border: "hover:border-emerald-200",
    },
    {
      title: "Conversion Rate",
      value: `${safeStats.conversionRate}%`,
      icon: TrendingUp,
      color: "text-violet-600",
      background: "bg-violet-50",
      border: "hover:border-violet-200",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="h-12 w-12 rounded-xl bg-slate-100" />

            <div className="mt-5 h-4 w-24 rounded bg-slate-100" />

            <div className="mt-3 h-9 w-28 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className={`group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${card.border}`}
          >
            <div
              className={`w-fit rounded-xl p-3 ${card.background}`}
            >
              <Icon size={22} className={card.color} />
            </div>

            <p className="mt-5 text-sm font-medium text-slate-500">
              {card.title}
            </p>

            <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {card.value}
            </h3>
          </div>
        );
      })}
    </div>
  );
}
