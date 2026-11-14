import DashboardStats from "@/components/dashboard/DashboardStats/DashboardStats";
import LeadChart from "@/components/dashboard/LeadChart/LeadChart";
import LeadStatusChart from "@/components/dashboard/LeadStatusChart/LeadStatusChart";
import RecentLeads from "@/components/dashboard/RecentLeads/RecentLeads";


export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Dashboard Overview
        </h1>
        <p className="mt-2 text-slate-500">
          Welcome to your LeadFlow Dashboard.
        </p>
      </div>

      {/* Statistics Cards */}
      <DashboardStats />

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <LeadChart/>
        </div>

        <div className="min-w-0">
          <LeadStatusChart />
        </div>
      </div>
      <div>
        <RecentLeads/>
      </div>
    </div>
  );
}