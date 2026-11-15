
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/lead-auth";

import type { WorkspaceMemberDocument } from "@/types/team";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);

    const invitationId =
      typeof body?.invitationId === "string"
        ? body.invitationId
        : "";

    if (!ObjectId.isValid(invitationId)) {
      return NextResponse.json(
        { message: "Invalid invitation ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const members =
      db.collection<WorkspaceMemberDocument>(
        "workspaceMembers"
      );

    const email = user.email.trim().toLowerCase();

    const invitation = await members.findOne({
      _id: new ObjectId(invitationId),
      email,
      status: "Pending",
    });

    if (!invitation) {
      return NextResponse.json(
        { message: "Invitation not found" },
        { status: 404 }
      );
    }

    if (!ObjectId.isValid(invitation.workspaceId)) {
      return NextResponse.json(
        { message: "Invalid workspace ID" },
        { status: 400 }
      );
    }

    const workspace = await db
      .collection("workspaces")
      .findOne({
        _id: new ObjectId(invitation.workspaceId),
      });

    if (!workspace) {
      return NextResponse.json(
        { message: "Workspace no longer exists" },
        { status: 404 }
      );
    }

    if (
      invitation.role !== "Admin" &&
      invitation.role !== "Member"
    ) {
      return NextResponse.json(
        { message: "Invalid invitation role" },
        { status: 403 }
      );
    }

    // Workspace owner cannot join as a member
    if (workspace.userId === user.id) {
      return NextResponse.json(
        { message: "You already own this workspace" },
        { status: 409 }
      );
    }

    const result = await members.updateOne(
      {
        _id: invitation._id,
        email,
        status: "Pending",
      },
      {
        $set: {
          userId: user.id,
          status: "Active",
          updatedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { message: "Invitation already processed" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: "Invitation accepted successfully",
      workspaceId: invitation.workspaceId,
    });
  } catch (error) {
    console.error("Accept invitation error:", error);

    return NextResponse.json(
      { message: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}
