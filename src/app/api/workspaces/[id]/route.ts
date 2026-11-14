import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/lead-auth";

interface WorkspaceDocument {
  userId: string;
  name: string;
  description: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

type Context = {
  params: Promise<{ id: string }>;
};

const colors = [
  "#0d9488",
  "#2563eb",
  "#7c3aed",
  "#ea580c",
  "#db2777",
  "#059669",
];

export async function PATCH(request: Request, context: Context) {
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

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 }
      );
    }

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const color =
      typeof body.color === "string" ? body.color : "";

    if (
      !name ||
      name.length > 80 ||
      description.length > 500 ||
      !colors.includes(color)
    ) {
      return NextResponse.json(
        { message: "Invalid workspace information" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const updated = await db
      .collection<WorkspaceDocument>("workspaces")
      .findOneAndUpdate(
        {
          _id: new ObjectId(id),
          userId: user.id,
        },
        {
          $set: {
            name,
            description,
            color,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" }
      );

    if (!updated) {
      return NextResponse.json(
        { message: "Workspace not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: updated._id.toString(),
      name: updated.name,
      description: updated.description,
      color: updated.color,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("PATCH workspace error:", error);

    return NextResponse.json(
      { message: "Failed to update workspace" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
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

    const db = await getDatabase();

    const result = await db
      .collection<WorkspaceDocument>("workspaces")
      .deleteOne({
        _id: new ObjectId(id),
        userId: user.id,
      });

    if (!result.deletedCount) {
      return NextResponse.json(
        { message: "Workspace not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Workspace deleted successfully",
    });
  } catch (error) {
    console.error("DELETE workspace error:", error);

    return NextResponse.json(
      { message: "Failed to delete workspace" },
      { status: 500 }
    );
  }
}