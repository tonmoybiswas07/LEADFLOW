
import { NextRequest, NextResponse } from "next/server";
import { ObjectId, type Filter } from "mongodb";

import { getDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/lead-auth";
import type { LeadStatus } from "@/types/lead";

type TeamRole = "Owner" | "Admin" | "Member";

interface WorkspaceDocument {
  userId: string;
  name: string;
  color: string;
  createdAt?: Date;
}

interface WorkspaceMemberDocument {
  workspaceId: string;
  userId: string | null;
  role: TeamRole;
  status: "Pending" | "Active";
}

interface LeadDocument {
  userId: string;
  workspaceId?: string | null;
  status: LeadStatus;
  createdAt: Date | string;
}

interface AccessibleWorkspace {
  workspaceId: string;
  name: string;
  color: string;
  role: TeamRole;
  isShared: boolean;
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
    // 1. Authentication
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Validate date range
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

    // 3. Find workspaces owned by current user
    const ownedWorkspaces = await db
      .collection<WorkspaceDocument>("workspaces")
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    // 4. Find active shared memberships
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

    // 5. Validate shared workspace IDs
    const sharedWorkspaceIds = [
      ...new Set(
        memberships
          .map((member) => member.workspaceId)
          .filter((id) => ObjectId.isValid(id))
      ),
    ];

    // 6. Fetch existing shared workspaces
    const sharedWorkspaces =
      sharedWorkspaceIds.length > 0
        ? await db
            .collection<WorkspaceDocument>("workspaces")
            .find({
              _id: {
                $in: sharedWorkspaceIds.map(
                  (id) => new ObjectId(id)
                ),
              },
            })
            .toArray()
        : [];

    // 7. Build accessible workspace list
    const accessibleWorkspaces: AccessibleWorkspace[] =
      [];

    const seenWorkspaceIds = new Set<string>();

    for (const workspace of ownedWorkspaces) {
      const id = workspace._id.toString();

      seenWorkspaceIds.add(id);

      accessibleWorkspaces.push({
        workspaceId: id,
        name: workspace.name,
        color: workspace.color || "#0d9488",
        role: "Owner",
        isShared: false,
      });
    }

    for (const workspace of sharedWorkspaces) {
      const id = workspace._id.toString();

      // Avoid duplicates and do not downgrade owners
      if (seenWorkspaceIds.has(id)) {
        continue;
      }

      const membership = memberships.find(
        (member) => member.workspaceId === id
      );

      if (!membership) {
        continue;
      }

      seenWorkspaceIds.add(id);

      accessibleWorkspaces.push({
        workspaceId: id,
        name: workspace.name,
        color: workspace.color || "#0d9488",
        role: membership.role,
        isShared: true,
      });
    }

    // 8. Query only accessible leads
    const workspaceIds = accessibleWorkspaces.map(
      (workspace) => workspace.workspaceId
    );

    const filter: Filter<LeadDocument> = {
      $or: [
        {
          userId: user.id,
          workspaceId: null,
        },
        {
          workspaceId: {
            $in: workspaceIds,
          },
        },
      ],
    };

    const leads = await db
      .collection<LeadDocument>("leads")
      .find(filter)
      .toArray();

    // 9. Apply date range
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

    // 10. Calculate statistics for each workspace
    const getStats = (
      workspaceId: string,
      name: string,
      color: string,
      role?: TeamRole,
      isShared = false
    ) => {
      const workspaceLeads = filteredLeads.filter(
        (lead) =>
          workspaceId === "unassigned"
            ? lead.userId === user.id &&
              lead.workspaceId == null
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
        role,
        isShared,
      };
    };

    // 11. Workspace comparison
    const comparison = accessibleWorkspaces.map(
      (workspace) =>
        getStats(
          workspace.workspaceId,
          workspace.name,
          workspace.color,
          workspace.role,
          workspace.isShared
        )
    );

    // 12. Personal / unassigned leads
    comparison.push(
      getStats(
        "unassigned",
        "Personal Leads",
        "#64748b"
      )
    );

    // 13. Sort by total leads
    comparison.sort(
      (a, b) => b.totalLeads - a.totalLeads
    );

    return NextResponse.json({
      range,
      comparison,
    });
  } catch (error) {
    console.error(
      "Workspace comparison error:",
      error
    );

    return NextResponse.json(
      { message: "Failed to load comparison" },
      { status: 500 }
    );
  }
}
