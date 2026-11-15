
import { NextResponse } from "next/server";
import {
  MongoServerError,
  ObjectId,
  type Filter,
} from "mongodb";

import { getDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/lead-auth";
import { getWorkspaceAccess } from "@/lib/workspace-access";
import { hasPermission } from "@/lib/team-permissions";

import {
  leadStatuses,
  type LeadStatus,
} from "@/types/lead";

interface LeadDocument {
  userId: string;
  workspaceId: string | null;
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

interface MemberDocument {
  workspaceId: string;
  userId: string | null;
  status: "Pending" | "Active";
  role: "Owner" | "Admin" | "Member";
}

function validateLead(body: unknown) {
  if (!body || typeof body !== "object") {
    return null;
  }

  const data = body as Record<string, unknown>;

  const name =
    typeof data.name === "string"
      ? data.name.trim()
      : "";

  const email =
    typeof data.email === "string"
      ? data.email.trim().toLowerCase()
      : "";

  const validEmail =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validStatus = leadStatuses.some(
    (status) => status === data.status
  );

  if (!name || !validEmail || !validStatus) {
    return null;
  }

  const rawWorkspaceId = data.workspaceId;

  if (
    rawWorkspaceId !== undefined &&
    rawWorkspaceId !== null &&
    (
      typeof rawWorkspaceId !== "string" ||
      !ObjectId.isValid(rawWorkspaceId)
    )
  ) {
    return null;
  }

  return {
    name,
    email,

    phone:
      typeof data.phone === "string"
        ? data.phone.trim()
        : "",

    company:
      typeof data.company === "string"
        ? data.company.trim()
        : "",

    status: data.status as LeadStatus,

    source:
      typeof data.source === "string" &&
      data.source.trim()
        ? data.source.trim()
        : "Website",

    workspaceId:
      typeof rawWorkspaceId === "string"
        ? rawWorkspaceId
        : null,
  };
}

// GET /api/leads
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await getDatabase();

    const collection =
      db.collection<LeadDocument>("leads");

    // Workspaces created by the user
    const ownedWorkspaces = await db
      .collection<WorkspaceDocument>("workspaces")
      .find({ userId: user.id })
      .project({ _id: 1 })
      .toArray();

    const ownedIds = ownedWorkspaces.map(
      (workspace) => workspace._id.toString()
    );

    // Active workspace memberships
    const memberships = await db
      .collection<MemberDocument>("workspaceMembers")
      .find({
        userId: user.id,
        status: "Active",
        role: { $in: ["Admin", "Member"] },
      })
      .toArray();

    const memberIds = memberships.map(
      (member) => member.workspaceId
    );

    const accessibleWorkspaceIds = [
      ...new Set([...ownedIds, ...memberIds]),
    ];

    // Keep legacy personal leads accessible.
    // Shared workspace leads are matched by workspaceId.
    const filter: Filter<LeadDocument> = {
      $or: [
        {
          userId: user.id,
          $or: [
            { workspaceId: null },
            { workspaceId: { $exists: false } },
          ],
        },
        {
          workspaceId: {
            $in: accessibleWorkspaceIds,
          },
        },
      ],
    };

    const leads = await collection
      .find(filter)
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .toArray();

    const formattedLeads = leads.map((lead) => ({
      id: lead._id.toString(),
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      status: lead.status,
      source: lead.source,
      workspaceId: lead.workspaceId ?? null,
      createdAt: new Date(lead.createdAt)
        .toISOString()
        .slice(0, 10),
    }));

    return NextResponse.json(formattedLeads);
  } catch (error) {
    console.error("GET leads error:", error);

    return NextResponse.json(
      { message: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

// POST /api/leads
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const payload = validateLead(body);

    if (!payload) {
      return NextResponse.json(
        {
          message:
            "Valid name, email, status and workspace ID are required",
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const collection =
      db.collection<LeadDocument>("leads");

    // Default: personal lead
    let ownerId = user.id;

    if (payload.workspaceId) {
      const access = await getWorkspaceAccess(
        payload.workspaceId
      );

      if (
        !access ||
        !hasPermission(access.role, "leads:create")
      ) {
        return NextResponse.json(
          {
            message:
              "You do not have permission to create leads in this workspace",
          },
          { status: 403 }
        );
      }

  
      ownerId = access.workspace.userId;
    }

    const newLead: LeadDocument = {
      ...payload,
      userId: ownerId,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(newLead);

    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        ...payload,
        createdAt: newLead.createdAt
          .toISOString()
          .slice(0, 10),
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof MongoServerError &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          message:
            "A lead with this email already exists",
        },
        { status: 409 }
      );
    }

    console.error("POST lead error:", error);

    return NextResponse.json(
      { message: "Failed to create lead" },
      { status: 500 }
    );
  }
}
