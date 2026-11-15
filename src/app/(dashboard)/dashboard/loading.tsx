
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-7 pb-10">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>

        <div className="flex gap-3">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      {/* Welcome Banner */}
      <Skeleton className="h-44 w-full rounded-2xl" />

      {/* Statistics */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-36 rounded-2xl"
            />
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />

        <div className="grid gap-6 xl:grid-cols-3">
          <Skeleton className="h-96 rounded-2xl xl:col-span-2" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>

      {/* Recent Leads */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
