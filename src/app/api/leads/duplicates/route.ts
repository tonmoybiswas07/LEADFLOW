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
  phone: string;
  company: string;
  status: LeadStatus;
  source: string;
  createdAt: Date;
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
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const workspaceId = searchParams.get("workspaceId") || "all";

    const db = await getDatabase();
    let filter: Filter<LeadDocument>;

    if (workspaceId === "unassigned" || workspaceId === "personal") {
      filter = {
        userId: user.id,
        $or: [
          { workspaceId: null },
          { workspaceId: { $exists: false } },
        ],
      };
    } else if (ObjectId.isValid(workspaceId)) {
      const access = await getWorkspaceAccess(workspaceId);
      if (!access || !hasPermission(access.role, "leads:read")) {
        return NextResponse.json(
          { message: "Access denied to workspace" },
          { status: 403 }
        );
      }
      filter = { workspaceId };
    } else {
      // "all" - find all accessible workspaces
      const ownedWorkspaces = await db
        .collection<WorkspaceDocument>("workspaces")
        .find({ userId: user.id })
        .project({ _id: 1 })
        .toArray();

      const ownedIds = ownedWorkspaces.map((w) => w._id.toString());

      const memberships = await db
        .collection<WorkspaceMemberDocument>("workspaceMembers")
        .find({
          userId: user.id,
          status: "Active",
          role: { $in: ["Admin", "Member"] },
        })
        .toArray();

      const memberIds = memberships.map((m) => m.workspaceId);
      const accessibleWorkspaceIds = [
        ...new Set([...ownedIds, ...memberIds]),
      ];

      filter = {
        $or: [
          {
            userId: user.id,
            $or: [
              { workspaceId: null },
              { workspaceId: { $exists: false } },
            ],
          },
          {
            workspaceId: { $in: accessibleWorkspaceIds },
          },
        ],
      };
    }

    const leads = await db
      .collection<LeadDocument>("leads")
      .find(filter)
      .sort({ createdAt: 1, _id: 1 })
      .toArray();

    const emailMap = new Map<string, string[]>();
    const phoneMap = new Map<string, string[]>();

    for (const lead of leads) {
      const id = lead._id.toString();
      const email = (lead.email || "").trim().toLowerCase();
      const phone = (lead.phone || "").replace(/[^\d+]/g, "");

      if (email) {
        emailMap.set(email, [...(emailMap.get(email) || []), id]);
      }

      if (phone && phone.replace(/\D/g, "").length >= 7) {
        phoneMap.set(phone, [...(phoneMap.get(phone) || []), id]);
      }
    }

    const groups: {
      type: "email" | "phone";
      value: string;
      leads: {
        id: string;
        name: string;
        email: string;
        phone: string;
        company: string;
        status: LeadStatus;
        workspaceId: string | null;
        createdAt: string;
      }[];
    }[] = [];

    for (const [type, map] of [
      ["email", emailMap],
      ["phone", phoneMap],
    ] as const) {
      for (const [value, ids] of map) {
        if (ids.length < 2) continue;

        const idSet = new Set(ids);

        groups.push({
          type,
          value,
          leads: leads
            .filter((lead) => idSet.has(lead._id.toString()))
            .map((lead) => ({
              id: lead._id.toString(),
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              company: lead.company,
              status: lead.status,
              workspaceId: lead.workspaceId ?? null,
              createdAt: new Date(lead.createdAt)
                .toISOString()
                .slice(0, 10),
            })),
        });
      }
    }

    const duplicateIds = new Set(
      groups.flatMap((group) => group.leads.map((lead) => lead.id))
    );

    return NextResponse.json({
      totalLeads: leads.length,
      duplicateLeads: duplicateIds.size,
      duplicateGroups: groups.length,
      groups,
    });
  } catch (error) {
    console.error("GET duplicate leads error:", error);

    return NextResponse.json(
      { message: "Failed to detect duplicate leads." },
      { status: 500 }
    );
  }
}
