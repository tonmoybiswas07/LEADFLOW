import { NextResponse } from "next/server";
import { MongoServerError } from "mongodb";
import { getDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/lead-auth";
import { leadStatuses, type LeadStatus } from "@/types/lead";



interface LeadDocument {
  userId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: LeadStatus;
  source: string;
  createdAt: Date;
}

function validateLead(body: unknown) {
  if (!body || typeof body !== "object") return null;

  const data = body as Record<string, unknown>;

  const name = typeof data.name === "string" ? data.name.trim() : "";
  const email =
    typeof data.email === "string"
      ? data.email.trim().toLowerCase()
      : "";

  if (
    !name ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !leadStatuses.some((status) => status === data.status)
  ) {
    return null;
  }

  return {
    name,
    email,
    phone: typeof data.phone === "string" ? data.phone.trim() : "",
    company:
      typeof data.company === "string" ? data.company.trim() : "",
    status: data.status as LeadStatus,
    source:
      typeof data.source === "string" && data.source.trim()
        ? data.source.trim()
        : "Website",
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

    const leads = await db
      .collection<LeadDocument>("leads")
      .find({ userId: user.id })
      .sort({ createdAt: -1, _id: -1 })
      .toArray();

    return NextResponse.json(
      leads.map((lead) => ({
        id: lead._id.toString(),
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        status: lead.status,
        source: lead.source,
        createdAt: lead.createdAt.toISOString().slice(0, 10),
      }))
    );
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
        { message: "Valid name, email and status are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<LeadDocument>("leads");

    // One lead per email for each user
    await collection.createIndex(
      { userId: 1, email: 1 },
      { unique: true }
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
        createdAt: newLead.createdAt.toISOString().slice(0, 10),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      return NextResponse.json(
        { message: "A lead with this email already exists" },
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