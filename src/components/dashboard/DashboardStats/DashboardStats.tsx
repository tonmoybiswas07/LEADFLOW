import {
  Users,
  UserPlus,
  Target,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const stats = [
  {
    title: "Total Leads",
    value: "12,450",
    change: "+12.8%",
    trend: "up",
    description: "vs. previous month",
    icon: Users,
    bg: "bg-teal-50",
    color: "text-teal-600",
  },
  {
    title: "New Leads",
    value: "2,840",
    change: "+8.2%",
    trend: "up",
    description: "vs. previous month",
    icon: UserPlus,
    bg: "bg-blue-50",
    color: "text-blue-600",
  },
  {
    title: "Converted Leads",
    value: "1,280",
    change: "+18.4%",
    trend: "up",
    description: "vs. previous month",
    icon: Target,
    bg: "bg-violet-50",
    color: "text-violet-600",
  },
  {
    title: "Conversion Rate",
    value: "10.3%",
    change: "-2.1%",
    trend: "down",
    description: "vs. previous month",
    icon: TrendingUp,
    bg: "bg-orange-50",
    color: "text-orange-600",
  },
];

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isUp = stat.trend === "up";

        return (
          <div
            key={stat.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className={`rounded-xl p-3 ${stat.bg} ${stat.color}`}>
                <Icon size={23} />
              </div>

              <div
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  isUp
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-slate-500">
                {stat.title}
              </p>

              <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {stat.value}
              </h3>

              <p className="mt-2 text-xs text-slate-400">
                {stat.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}