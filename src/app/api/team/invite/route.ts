
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/lead-auth";
import { getWorkspaceAccess } from "@/lib/workspace-access";
import { hasPermission } from "@/lib/team-permissions";

import type {
  WorkspaceMemberDocument,
  TeamRole,
} from "@/types/team";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    const workspaceId =
      typeof body?.workspaceId === "string"
        ? body.workspaceId
        : "";

    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const role: TeamRole =
      body?.role === "Admin" ? "Admin" : "Member";

    if (
      !ObjectId.isValid(workspaceId) ||
      !EMAIL_REGEX.test(email)
    ) {
      return NextResponse.json(
        { message: "Invalid workspace or email" },
        { status: 400 }
      );
    }

    if (body?.role !== "Admin" && body?.role !== "Member") {
      return NextResponse.json(
        { message: "Invalid team role" },
        { status: 400 }
      );
    }

    const access = await getWorkspaceAccess(workspaceId);

    if (
      !access ||
      !hasPermission(access.role, "members:invite")
    ) {
      return NextResponse.json(
        { message: "Permission denied" },
        { status: 403 }
      );
    }

    if (role === "Admin" && access.role !== "Owner") {
      return NextResponse.json(
        { message: "Only Owner can invite Admins" },
        { status: 403 }
      );
    }

    if (email === user.email.toLowerCase()) {
      return NextResponse.json(
        { message: "You cannot invite yourself" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Prevent inviting the workspace creator.
    const owner = await db.collection("user").findOne({
      $or: [
        { id: access.workspace.userId },
        { _id: access.workspace.userId } as Record<string, unknown>,
      ],
    });

    if (
      owner &&
      typeof owner.email === "string" &&
      owner.email.toLowerCase() === email
    ) {
      return NextResponse.json(
        { message: "Workspace Owner is already a member" },
        { status: 409 }
      );
    }

    const members = db.collection<WorkspaceMemberDocument>(
      "workspaceMembers"
    );

    const existing = await members.findOne({
      workspaceId,
      email,
    });

    if (existing) {
      return NextResponse.json(
        { message: "This email is already invited" },
        { status: 409 }
      );
    }

    const now = new Date();

    const result = await members.insertOne({
      workspaceId,
      userId: null,
      email,
      role,
      status: "Pending",
      invitedBy: user.id,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        message: "Invitation created successfully",
        invitation: {
          id: result.insertedId.toString(),
          workspaceId,
          email,
          role,
          status: "Pending",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Invite member error:", error);

    return NextResponse.json(
      { message: "Failed to invite member" },
      { status: 500 }
    );
  }
}
