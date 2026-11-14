import { NextResponse } from "next/server";
import { ObjectId, MongoServerError } from "mongodb";
import { getDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/lead-auth";
import { leadStatuses, type LeadStatus } from "@/types/lead";



type RouteContext = {
  params: Promise<{ id: string }>;
};

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
      typeof data.name === "string" ? data.name.trim() : "";
    const email =
      typeof data.email === "string"
        ? data.email.trim().toLowerCase()
        : "";

    if (
      !name ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !leadStatuses.some((status) => status === data.status)
    ) {
      return NextResponse.json(
        { message: "Valid name, email and status are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<LeadDocument>("leads");

    const updated = await collection.findOneAndUpdate(
      {
        _id: new ObjectId(id),
        userId: user.id,
      },
      {
        $set: {
          name,
          email,
          phone:
            typeof data.phone === "string" ? data.phone.trim() : "",
          company:
            typeof data.company === "string"
              ? data.company.trim()
              : "",
          status: data.status as LeadStatus,
          source:
            typeof data.source === "string" && data.source.trim()
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

    return NextResponse.json({
      id: updated._id.toString(),
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      company: updated.company,
      status: updated.status,
      source: updated.source,
      createdAt: updated.createdAt.toISOString().slice(0, 10),
    });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      return NextResponse.json(
        { message: "A lead with this email already exists" },
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

    const result = await db.collection<LeadDocument>("leads").deleteOne({
      _id: new ObjectId(id),
      userId: user.id,
    });

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