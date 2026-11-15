
import { NextRequest, NextResponse } from "next/server";
import { ObjectId, type Filter } from "mongodb";

import { getDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/lead-auth";
import { getWorkspaceAccess } from "@/lib/workspace-access";
import { hasPermission } from "@/lib/team-permissions";
import { leadStatuses, type LeadStatus } from "@/types/lead";

interface LeadDocument {
  userId: string;
  workspaceId?: string | null;
  name: string;
  email: string;
  status: LeadStatus;
  source: string;
  createdAt: Date | string;
}

interface WorkspaceDocument {
  userId: string;
  name: string;
}

interface WorkspaceMemberDocument {
  workspaceId: string;
  userId: string | null;
  role: "Owner" | "Admin" | "Member";
  status: "Pending" | "Active";
}

const allowedRanges = [
  "7d",
  "30d",
  "90d",
  "12m",
  "all",
] as const;

type DateRange = (typeof allowedRanges)[number];

function getStartDate(range: DateRange): Date | null {
  if (range === "all") return null;

  const start = new Date();

  switch (range) {
    case "7d":
      start.setUTCDate(start.getUTCDate() - 7);
      break;
    case "30d":
      start.setUTCDate(start.getUTCDate() - 30);
      break;
    case "90d":
      start.setUTCDate(start.getUTCDate() - 90);
      break;
    case "12m":
      start.setUTCMonth(start.getUTCMonth() - 12);
      break;
  }

  return start;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;

    const workspaceId =
      searchParams.get("workspaceId") || "all";

    const requestedRange =
      searchParams.get("range") || "12m";

    if (
      !allowedRanges.includes(
        requestedRange as DateRange
      )
    ) {
      return NextResponse.json(
        { message: "Invalid date range" },
        { status: 400 }
      );
    }

    const range = requestedRange as DateRange;
    const db = await getDatabase();

    const filter: Filter<LeadDocument> = {};

    // 1. Personal Leads
    if (workspaceId === "unassigned") {
      filter.userId = user.id;
      filter.workspaceId = null;
    }

    // 2. All accessible Leads
    else if (workspaceId === "all") {
      const ownedWorkspaces = await db
        .collection<WorkspaceDocument>("workspaces")
        .find({ userId: user.id })
        .project({ _id: 1 })
        .toArray();

      const memberships = await db
        .collection<WorkspaceMemberDocument>(
          "workspaceMembers"
        )
        .find({
          userId: user.id,
          status: "Active",
          role: { $in: ["Admin", "Member"] },
        })
        .toArray();

      const workspaceIds = [
        ...new Set([
          ...ownedWorkspaces.map((workspace) =>
            workspace._id.toString()
          ),
          ...memberships
            .map((member) => member.workspaceId)
            .filter((id) => ObjectId.isValid(id)),
        ]),
      ];

      // Only include memberships for existing workspaces
      const existingWorkspaces = await db
        .collection<WorkspaceDocument>("workspaces")
        .find({
          _id: {
            $in: workspaceIds.map(
              (id) => new ObjectId(id)
            ),
          },
        })
        .project({ _id: 1 })
        .toArray();

      const accessibleIds = existingWorkspaces.map(
        (workspace) => workspace._id.toString()
      );

      filter.$or = [
        {
          userId: user.id,
          workspaceId: null,
        },
        {
          workspaceId: { $in: accessibleIds },
        },
      ];
    }

    // 3. Selected Workspace
    else {
      if (!ObjectId.isValid(workspaceId)) {
        return NextResponse.json(
          { message: "Invalid workspace ID" },
          { status: 400 }
        );
      }

      const access = await getWorkspaceAccess(
        workspaceId
      );

      if (!access) {
        return NextResponse.json(
          { message: "Workspace not found or access denied" },
          { status: 403 }
        );
      }

      if (!hasPermission(access.role, "leads:read")) {
        return NextResponse.json(
          { message: "Permission denied" },
          { status: 403 }
        );
      }

      filter.workspaceId = workspaceId;
    }

    const leads = await db
      .collection<LeadDocument>("leads")
      .find(filter)
      .toArray();

    const startDate = getStartDate(range);
    const now = new Date();

    const filteredLeads = leads.filter((lead) => {
      const date = new Date(lead.createdAt);

      if (Number.isNaN(date.getTime())) {
        return false;
      }

      if (date > now) {
        return false;
      }

      return !startDate || date >= startDate;
    });

    // Statistics
    const totalLeads = filteredLeads.length;

    const convertedLeads = filteredLeads.filter(
      (lead) => lead.status === "Converted"
    ).length;

    const lostLeads = filteredLeads.filter(
      (lead) => lead.status === "Lost"
    ).length;

    const activeLeads =
      totalLeads - convertedLeads - lostLeads;

    const conversionRate = totalLeads
      ? Number(
          (
            (convertedLeads / totalLeads) *
            100
          ).toFixed(1)
        )
      : 0;

    // Status Distribution
    const statusDistribution = leadStatuses.map(
      (status) => ({
        name: status,
        value: filteredLeads.filter(
          (lead) => lead.status === status
        ).length,
      })
    );

    // Source Distribution
    const sourceMap = new Map<string, number>();

    filteredLeads.forEach((lead) => {
      const source =
        lead.source?.trim() || "Unknown";

      sourceMap.set(
        source,
        (sourceMap.get(source) || 0) + 1
      );
    });

    const sourceDistribution = Array.from(
      sourceMap.entries()
    )
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);

    // Monthly Growth
    const validDates = filteredLeads.map((lead) => ({
      ...lead,
      parsedDate: new Date(lead.createdAt),
    }));

    const earliestDate =
      validDates.length > 0
        ? new Date(
            Math.min(
              ...validDates.map((lead) =>
                lead.parsedDate.getTime()
              )
            )
          )
        : now;

    const chartStart =
      range === "all"
        ? earliestDate
        : startDate ?? now;

    const startMonth = Date.UTC(
      chartStart.getUTCFullYear(),
      chartStart.getUTCMonth(),
      1
    );

    const endMonth = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      1
    );

    const monthlyGrowth: {
      label: string;
      leads: number;
      converted: number;
    }[] = [];

    const cursor = new Date(startMonth);

    while (cursor.getTime() <= endMonth) {
      const year = cursor.getUTCFullYear();
      const monthIndex = cursor.getUTCMonth();

      const monthlyLeads = validDates.filter(
        (lead) =>
          lead.parsedDate.getUTCFullYear() === year &&
          lead.parsedDate.getUTCMonth() === monthIndex
      );

      monthlyGrowth.push({
        label: cursor.toLocaleString("en-US", {
          month: "short",
          year: "2-digit",
          timeZone: "UTC",
        }),
        leads: monthlyLeads.length,
        converted: monthlyLeads.filter(
          (lead) => lead.status === "Converted"
        ).length,
      });

      cursor.setUTCMonth(
        cursor.getUTCMonth() + 1
      );
    }

    return NextResponse.json({
      filters: {
        workspaceId,
        range,
      },
      stats: {
        totalLeads,
        convertedLeads,
        activeLeads,
        lostLeads,
        conversionRate,
      },
      monthlyGrowth,
      statusDistribution,
      sourceDistribution,
    });
  } catch (error) {
    console.error("Analytics API error:", error);

    return NextResponse.json(
      { message: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
