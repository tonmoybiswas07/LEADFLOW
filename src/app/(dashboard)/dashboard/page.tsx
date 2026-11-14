import { LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900">
          <LayoutDashboard className="text-teal-600" />
          LeadFlow Dashboard
        </h1>

        <p className="mt-2 text-slate-500">
          Welcome to your Lead Management Dashboard.
        </p>
      </div>

      <div className="rounded-xl border border-teal-100 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-teal-700">
          Dashboard is working!
        </h2>

        <p className="mt-2 text-slate-500">
          Your LeadFlow dashboard is ready.
        </p>
      </div>
    </div>
  );
}