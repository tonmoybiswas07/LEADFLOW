
import { NextRequest, NextResponse } from "next/server";
import { type Filter } from "mongodb";

import { getDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/lead-auth";
import type { LeadStatus } from "@/types/lead";

interface WorkspaceDocument {
  userId: string;
  name: string;
  color: string;
}

interface LeadDocument {
  userId: string;
  workspaceId?: string | null;
  status: LeadStatus;
  createdAt: Date | string;
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

    const requestedRange =
      request.nextUrl.searchParams.get("range") || "12m";

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
    const startDate = getStartDate(range);
    const now = new Date();

    const db = await getDatabase();

    const workspaces = await db
      .collection<WorkspaceDocument>("workspaces")
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    const filter: Filter<LeadDocument> = {
      userId: user.id,
    };

    const leads = await db
      .collection<LeadDocument>("leads")
      .find(filter)
      .toArray();

    const filteredLeads = leads.filter((lead) => {
      const date = new Date(lead.createdAt);

      if (Number.isNaN(date.getTime())) return false;
      if (date > now) return false;

      return !startDate || date >= startDate;
    });

    const getStats = (
      workspaceId: string,
      name: string,
      color: string
    ) => {
      const workspaceLeads = filteredLeads.filter(
        (lead) =>
          workspaceId === "unassigned"
            ? lead.workspaceId == null
            : lead.workspaceId === workspaceId
      );

      const totalLeads = workspaceLeads.length;

      const convertedLeads = workspaceLeads.filter(
        (lead) => lead.status === "Converted"
      ).length;

      const lostLeads = workspaceLeads.filter(
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

      return {
        workspaceId,
        name,
        color,
        totalLeads,
        convertedLeads,
        activeLeads,
        lostLeads,
        conversionRate,
      };
    };

    const comparison = workspaces.map((workspace) =>
      getStats(
        workspace._id.toString(),
        workspace.name,
        workspace.color
      )
    );

    comparison.push(
      getStats(
        "unassigned",
        "Unassigned Leads",
        "#64748b"
      )
    );

    comparison.sort(
      (a, b) => b.totalLeads - a.totalLeads
    );

    return NextResponse.json({
      range,
      comparison,
    });
  } catch (error) {
    console.error("Workspace comparison error:", error);

    return NextResponse.json(
      { message: "Failed to load comparison" },
      { status: 500 }
    );
  }
}
