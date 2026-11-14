import { Suspense } from "react";
import Navbar from "@/components/dashboard/Navbar/Navbar";
import Sidebar from "@/components/dashboard/Sidebar/Sidebar";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

async function DashboardContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 lg:block">
        <Sidebar />
      </div>

      <div className="min-w-0 lg:pl-64">
        <Navbar />

        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" />

            <p className="text-sm font-medium text-slate-500">
              Loading dashboard...
            </p>
          </div>
        </div>
      }
    >
      <DashboardContent>{children}</DashboardContent>
    </Suspense>
  );
}