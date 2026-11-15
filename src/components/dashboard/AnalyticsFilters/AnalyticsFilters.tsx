"use client";

import {
  CalendarDays,
  Layers3,
  Loader2,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Workspace } from "@/types/workspace";

export type AnalyticsRange =
  | "7d"
  | "30d"
  | "90d"
  | "12m"
  | "all";

interface AnalyticsFiltersProps {
  workspaceId: string;
  range: AnalyticsRange;
  workspaces: Workspace[];
  loading: boolean;
  onWorkspaceChange: (value: string) => void;
  onRangeChange: (value: AnalyticsRange) => void;
}

export default function AnalyticsFilters({
  workspaceId,
  range,
  workspaces,
  loading,
  onWorkspaceChange,
  onRangeChange,
}: AnalyticsFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
        <Layers3
          size={17}
          className="shrink-0 text-teal-600"
        />

        {loading ? (
          <div className="flex h-10 w-44 items-center gap-2 text-sm text-slate-500">
            <Loader2
              size={15}
              className="animate-spin"
            />
            Loading...
          </div>
        ) : (
          <Select
            value={workspaceId}
            onValueChange={(val) => {
              if (val) onWorkspaceChange(val);
            }}
          >
            <SelectTrigger className="w-full min-w-44 border-0 shadow-none focus-visible:ring-0">
              <SelectValue placeholder="All Workspaces" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                All Workspaces
              </SelectItem>

              <SelectItem value="unassigned">
                Unassigned Leads
              </SelectItem>

              {workspaces.map((workspace) => (
                <SelectItem
                  key={workspace.id}
                  value={workspace.id}
                >
                  {workspace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
        <CalendarDays
          size={17}
          className="shrink-0 text-teal-600"
        />

        <Select
          value={range}
          onValueChange={(value) => {
            if (value) onRangeChange(value as AnalyticsRange);
          }}
        >
          <SelectTrigger className="w-full min-w-40 border-0 shadow-none focus-visible:ring-0">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="7d">
              Last 7 Days
            </SelectItem>
            <SelectItem value="30d">
              Last 30 Days
            </SelectItem>
            <SelectItem value="90d">
              Last 90 Days
            </SelectItem>
            <SelectItem value="12m">
              Last 12 Months
            </SelectItem>
            <SelectItem value="all">
              All Time
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}