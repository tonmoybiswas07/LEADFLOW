
import { NextResponse } from "next/server";
import {
  ObjectId,
  MongoServerError,
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

type RouteContext = {
  params: Promise<{ id: string }>;
};

interface LeadDocument {
  userId: string;
  workspaceId?: string | null;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: LeadStatus;
  source: string;
  createdAt: Date | string;
}

function formatLead(lead: LeadDocument & { _id: ObjectId }) {
  return {
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
  };
}

// PATCH /api/leads/:id
export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid lead ID" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 }
      );
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
      return NextResponse.json(
        {
          message:
            "Valid name, email and status are required",
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<LeadDocument>("leads");

    const leadId = new ObjectId(id);

    // Find the lead before checking permissions
    const existingLead = await collection.findOne({
      _id: leadId,
    });

    if (!existingLead) {
      return NextResponse.json(
        { message: "Lead not found" },
        { status: 404 }
      );
    }

    // Personal leads remain private to their creator
    if (!existingLead.workspaceId) {
      if (existingLead.userId !== user.id) {
        return NextResponse.json(
          { message: "Access denied" },
          { status: 403 }
        );
      }
    } else {
      const access = await getWorkspaceAccess(
        existingLead.workspaceId
      );

      if (
        !access ||
        !hasPermission(access.role, "leads:update")
      ) {
        return NextResponse.json(
          {
            message:
              "You do not have permission to update this lead",
          },
          { status: 403 }
        );
      }

      // Ensure the lead belongs to the workspace owner
      if (existingLead.userId !== access.workspace.userId) {
        return NextResponse.json(
          { message: "Access denied" },
          { status: 403 }
        );
      }
    }

    // Restrict update to the authorized lead record
    const filter: Filter<LeadDocument> = {
      _id: leadId,
      userId: existingLead.userId,
      workspaceId: existingLead.workspaceId ?? null,
    };

    const updated = await collection.findOneAndUpdate(
      filter,
      {
        $set: {
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
        },
      },
      { returnDocument: "after" }
    );

    if (!updated) {
      return NextResponse.json(
        { message: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(formatLead(updated));
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

    console.error("PATCH lead error:", error);

    return NextResponse.json(
      { message: "Failed to update lead" },
      { status: 500 }
    );
  }
}

// DELETE /api/leads/:id
export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid lead ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<LeadDocument>("leads");

    const leadId = new ObjectId(id);

    const existingLead = await collection.findOne({
      _id: leadId,
    });

    if (!existingLead) {
      return NextResponse.json(
        { message: "Lead not found" },
        { status: 404 }
      );
    }

    // Personal lead
    if (!existingLead.workspaceId) {
      if (existingLead.userId !== user.id) {
        return NextResponse.json(
          { message: "Access denied" },
          { status: 403 }
        );
      }
    } else {
      // Workspace lead
      const access = await getWorkspaceAccess(
        existingLead.workspaceId
      );

      if (
        !access ||
        !hasPermission(access.role, "leads:delete")
      ) {
        return NextResponse.json(
          {
            message:
              "You do not have permission to delete this lead",
          },
          { status: 403 }
        );
      }

      if (existingLead.userId !== access.workspace.userId) {
        return NextResponse.json(
          { message: "Access denied" },
          { status: 403 }
        );
      }
    }

    const filter: Filter<LeadDocument> = {
      _id: leadId,
      userId: existingLead.userId,
      workspaceId: existingLead.workspaceId ?? null,
    };

    const result = await collection.deleteOne(filter);

    if (!result.deletedCount) {
      return NextResponse.json(
        { message: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Lead deleted successfully",
    });
  } catch (error) {
    console.error("DELETE lead error:", error);

    return NextResponse.json(
      { message: "Failed to delete lead" },
      { status: 500 }
    );
  }
}
