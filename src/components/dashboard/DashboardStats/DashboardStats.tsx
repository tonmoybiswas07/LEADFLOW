import {
  Users,
  UserPlus,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

import type { DashboardData } from "@/types/dashboard";

interface Props {
  stats?: DashboardData["stats"];
}

export default function DashboardStats({ stats }: Props) {
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
    },
    {
      title: "New Leads",
      value: safeStats.newLeads.toLocaleString(),
      icon: UserPlus,
      color: "text-blue-600",
      background: "bg-blue-50",
    },
    {
      title: "Converted Leads",
      value: safeStats.convertedLeads.toLocaleString(),
      icon: CheckCircle2,
      color: "text-emerald-600",
      background: "bg-emerald-50",
    },
    {
      title: "Conversion Rate",
      value: `${safeStats.conversionRate}%`,
      icon: TrendingUp,
      color: "text-violet-600",
      background: "bg-violet-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className={`w-fit rounded-xl p-3 ${card.background}`}>
              <Icon size={22} className={card.color} />
            </div>

            <p className="mt-5 text-sm font-medium text-slate-500">
              {card.title}
            </p>

            <h3 className="mt-2 text-3xl font-bold text-slate-900">
              {card.value}
            </h3>
          </div>
        );
      })}
    </div>
  );
}