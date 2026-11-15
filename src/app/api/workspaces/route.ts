
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

interface WorkspaceMemberDocument {
  workspaceId: string;
  userId: string | null;
  email: string;
  role: "Owner" | "Admin" | "Member";
  status: "Pending" | "Active";
  invitedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const colors = [
  "#0d9488",
  "#2563eb",
  "#7c3aed",
  "#ea580c",
  "#db2777",
  "#059669",
];

function validateWorkspace(body: unknown) {
  if (!body || typeof body !== "object") return null;

  const input = body as Record<string, unknown>;

  const name =
    typeof input.name === "string"
      ? input.name.trim()
      : "";

  const description =
    typeof input.description === "string"
      ? input.description.trim()
      : "";

  const color =
    typeof input.color === "string"
      ? input.color
      : "";

  if (
    !name ||
    name.length > 80 ||
    description.length > 500
  ) {
    return null;
  }

  if (!colors.includes(color)) {
    return null;
  }

  return { name, description, color };
}

// GET — Owned + Shared Workspaces
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

    // 1. Workspaces created by current user
    const ownedWorkspaces = await db
      .collection<WorkspaceDocument>("workspaces")
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    // 2. Active memberships only
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

    // 3. Load existing shared workspaces
    const sharedWorkspaces = await db
      .collection<WorkspaceDocument>("workspaces")
      .find({
        _id: {
          $in: sharedIds.map((id) => new ObjectId(id)),
        },
        userId: { $ne: user.id },
      })
      .sort({ createdAt: -1 })
      .toArray();

    // 4. Resolve membership roles
    const roleMap = new Map<
      string,
      "Admin" | "Member"
    >();

    for (const membership of memberships) {
      if (
        membership.role === "Admin" ||
        membership.role === "Member"
      ) {
        roleMap.set(
          membership.workspaceId,
          membership.role
        );
      }
    }

    // 5. Return owned workspaces
    const owned = ownedWorkspaces.map((workspace) => ({
      id: workspace._id.toString(),
      name: workspace.name,
      description: workspace.description,
      color: workspace.color,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
      role: "Owner" as const,
      isOwner: true,
      isShared: false,
    }));

    // 6. Return shared workspaces
    const shared = sharedWorkspaces
      .filter((workspace) =>
        roleMap.has(workspace._id.toString())
      )
      .map((workspace) => ({
        id: workspace._id.toString(),
        name: workspace.name,
        description: workspace.description,
        color: workspace.color,
        createdAt: workspace.createdAt.toISOString(),
        updatedAt: workspace.updatedAt.toISOString(),
        role: roleMap.get(workspace._id.toString())!,
        isOwner: false,
        isShared: true,
      }));

    return NextResponse.json([
      ...owned,
      ...shared,
    ]);
  } catch (error) {
    console.error("GET workspaces error:", error);

    return NextResponse.json(
      { message: "Failed to load workspaces" },
      { status: 500 }
    );
  }
}

// POST — Create Workspace
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
    const input = validateWorkspace(body);

    if (!input) {
      return NextResponse.json(
        { message: "Invalid workspace information" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const collection =
      db.collection<WorkspaceDocument>("workspaces");

    const now = new Date();

    const workspace: WorkspaceDocument = {
      ...input,
      userId: user.id,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(workspace);

    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        ...input,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        role: "Owner",
        isOwner: true,
        isShared: false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST workspace error:", error);

    return NextResponse.json(
      { message: "Failed to create workspace" },
      { status: 500 }
    );
  }
}
