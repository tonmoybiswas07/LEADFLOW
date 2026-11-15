import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/lead-auth";
import { getWorkspaceAccess } from "@/lib/workspace-access";
import { hasPermission } from "@/lib/team-permissions";
import { leadStatuses, type LeadStatus } from "@/types/lead";

type Context = {
  params: Promise<{ id: string }>;
};

interface LeadDocument {
  userId: string;
  workspaceId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: LeadStatus;
  source: string;
  createdAt: Date;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(_request: Request, context: Context) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid workspace ID" },
        { status: 400 }
      );
    }

    const access = await getWorkspaceAccess(id);

    if (!access) {
      return NextResponse.json(
        { message: "Workspace not found" },
        { status: 404 }
      );
    }

    if (!hasPermission(access.role, "leads:read")) {
      return NextResponse.json(
        { message: "Access denied" },
        { status: 403 }
      );
    }

    const db = await getDatabase();

    const leads = await db
      .collection<LeadDocument>("leads")
      .find({
        workspaceId: id,
      })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(
      leads.map((lead) => ({
        id: lead._id.toString(),
        workspaceId: lead.workspaceId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        status: lead.status,
        source: lead.source,
        createdAt: new Date(lead.createdAt)
          .toISOString()
          .slice(0, 10),
      }))
    );
  } catch (error) {
    console.error("Workspace leads GET error:", error);

    return NextResponse.json(
      { message: "Failed to load workspace leads" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid workspace ID" },
        { status: 400 }
      );
    }

    const access = await getWorkspaceAccess(id);

    if (!access) {
      return NextResponse.json(
        { message: "Workspace not found" },
        { status: 404 }
      );
    }

    if (!hasPermission(access.role, "leads:create")) {
      return NextResponse.json(
        { message: "You do not have permission to create leads in this workspace" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);

    const name =
      typeof body?.name === "string" ? body.name.trim() : "";

    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const phone =
      typeof body?.phone === "string" ? body.phone.trim() : "";

    const company =
      typeof body?.company === "string"
        ? body.company.trim()
        : "";

    const status =
      typeof body?.status === "string"
        ? body.status.trim()
        : "New";

    const source =
      typeof body?.source === "string"
        ? body.source.trim()
        : "Manual";

    if (
      !name ||
      !emailRegex.test(email) ||
      !leadStatuses.some((value) => value === status)
    ) {
      return NextResponse.json(
        { message: "Invalid lead information" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<LeadDocument>("leads");

    const existing = await collection.findOne({
      userId: access.workspace.userId,
      email,
    });

    if (existing) {
      return NextResponse.json(
        { message: "A lead with this email already exists" },
        { status: 409 }
      );
    }

    const now = new Date();

    const lead: LeadDocument = {
      userId: access.workspace.userId,
      workspaceId: id,
      name,
      email,
      phone,
      company,
      status: status as LeadStatus,
      source,
      createdAt: now,
    };

    const result = await collection.insertOne(lead);

    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        workspaceId: id,
        name,
        email,
        phone,
        company,
        status,
        source,
        createdAt: now.toISOString().slice(0, 10),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Workspace leads POST error:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { message: "A lead with this email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Failed to create workspace lead" },
      { status: 500 }
    );
  }
}
