import { NextResponse } from "next/server";
import { MongoServerError, ObjectId } from "mongodb";

import { getDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/lead-auth";
import { leadStatuses, type LeadStatus } from "@/types/lead";

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

// Validate lead data
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

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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

    const collection = db.collection<LeadDocument>("leads");

    // Temporary debug information
    const totalLeads = await collection.countDocuments();

    const myLeads = await collection.countDocuments({
      userId: user.id,
    });

    console.log("========== LEAD DEBUG ==========");
    console.log("Database:", db.databaseName);
    console.log("Logged-in User ID:", user.id);
    console.log("Total Database Leads:", totalLeads);
    console.log("Current User Leads:", myLeads);
    console.log("================================");

    // Fetch only the logged-in user's leads
    const leads = await collection
      .find({ userId: user.id })
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

    const collection = db.collection<LeadDocument>("leads");

    // Verify workspace ownership
    if (payload.workspaceId) {
      const workspace = await db
        .collection("workspaces")
        .findOne({
          _id: new ObjectId(payload.workspaceId),
          userId: user.id,
        });

      if (!workspace) {
        return NextResponse.json(
          {
            message:
              "Workspace not found or access denied",
          },
          { status: 404 }
        );
      }
    }

    // Prevent duplicate emails for the same user
    await collection.createIndex(
      {
        userId: 1,
        email: 1,
      },
      {
        unique: true,
      }
    );

    const newLead: LeadDocument = {
      ...payload,
      userId: user.id,
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