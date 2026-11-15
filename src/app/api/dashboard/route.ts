
import { NextRequest, NextResponse } from "next/server";
import { ObjectId, type Filter } from "mongodb";

import { getDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/lead-auth";
import { getWorkspaceAccess } from "@/lib/workspace-access";
import { hasPermission } from "@/lib/team-permissions";

import type { LeadStatus } from "@/types/lead";

interface LeadDocument {
  userId: string;
  workspaceId?: string | null;
  name: string;
  email: string;
  company: string;
  status: LeadStatus;
  source: string;
  createdAt: Date | string;
}

interface WorkspaceDocument {
  userId: string;
}

interface WorkspaceMemberDocument {
  workspaceId: string;
  userId: string | null;
  role: "Owner" | "Admin" | "Member";
  status: "Pending" | "Active";
}

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const workspaceId =
      request.nextUrl.searchParams.get("workspaceId") ||
      "all";

    const db = await getDatabase();

    let filter: Filter<LeadDocument>;

    // Personal leads
    if (workspaceId === "unassigned") {
      filter = {
        userId: user.id,
        workspaceId: null,
      };
    }

    // All accessible leads
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

      const sharedIds = [
        ...new Set(
          memberships
            .map((member) => member.workspaceId)
            .filter((id) => ObjectId.isValid(id))
        ),
      ];

      const existingSharedWorkspaces =
        sharedIds.length > 0
          ? await db
              .collection<WorkspaceDocument>("workspaces")
              .find({
                _id: {
                  $in: sharedIds.map(
                    (id) => new ObjectId(id)
                  ),
                },
              })
              .project({ _id: 1 })
              .toArray()
          : [];

      const accessibleIds = [
        ...new Set([
          ...ownedWorkspaces.map(
            (workspace) => workspace._id.toString()
          ),
          ...existingSharedWorkspaces.map(
            (workspace) => workspace._id.toString()
          ),
        ]),
      ];

      filter = {
        $or: [
          {
            userId: user.id,
            workspaceId: null,
          },
          {
            workspaceId: {
              $in: accessibleIds,
            },
          },
        ],
      };
    }

    // Specific workspace
    else {
      if (!ObjectId.isValid(workspaceId)) {
        return NextResponse.json(
          { message: "Invalid workspace ID" },
          { status: 400 }
        );
      }

      const access = await getWorkspaceAccess(workspaceId);

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

      filter = { workspaceId };
    }

    // Fetch leads
    const leads = await db
      .collection<LeadDocument>("leads")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    // Statistics
    const totalLeads = leads.length;

    const newLeads = leads.filter(
      (lead) => lead.status === "New"
    ).length;

    const convertedLeads = leads.filter(
      (lead) => lead.status === "Converted"
    ).length;

    const conversionRate =
      totalLeads > 0
        ? Number(
            (
              (convertedLeads / totalLeads) *
              100
            ).toFixed(1)
          )
        : 0;

    // Status distribution
    const statuses: LeadStatus[] = [
      "New",
      "Contacted",
      "Qualified",
      "Converted",
      "Lost",
    ];

    const statusDistribution = statuses.map((status) => ({
      name: status,
      value: leads.filter((lead) => lead.status === status)
        .length,
    }));

    // Monthly growth (last 12 months)
    const now = new Date();

    const monthlyGrowth = Array.from(
      { length: 12 },
      (_, index) => {
        const date = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth() - 11 + index,
            1
          )
        );

        const year = date.getUTCFullYear();
        const month = date.getUTCMonth();

        const monthlyLeads = leads.filter((lead) => {
          const created = new Date(lead.createdAt);

          return (
            !Number.isNaN(created.getTime()) &&
            created.getUTCFullYear() === year &&
            created.getUTCMonth() === month
          );
        });

        return {
          month: date.toLocaleString("en-US", {
            month: "short",
            timeZone: "UTC",
          }),
          year,
          leads: monthlyLeads.length,
          converted: monthlyLeads.filter(
            (lead) => lead.status === "Converted"
          ).length,
        };
      }
    );

    // Recent leads
    const recentLeads = leads
      .slice(0, 5)
      .map((lead) => ({
        id: lead._id.toString(),
        name: lead.name,
        email: lead.email,
        company: lead.company,
        status: lead.status,
        source: lead.source,
        createdAt: new Date(lead.createdAt)
          .toISOString()
          .slice(0, 10),
      }));

    return NextResponse.json({
      stats: {
        totalLeads,
        newLeads,
        convertedLeads,
        conversionRate,
      },
      monthlyGrowth,
      statusDistribution,
      recentLeads,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);

    return NextResponse.json(
      { message: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
