
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

type RouteContext = {
  params: Promise<{ id: string }>;
};

// PATCH /api/team/members/:id
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
        { message: "Invalid member ID" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);

    const role: TeamRole | null =
      body?.role === "Admin" || body?.role === "Member"
        ? body.role
        : null;

    if (!role) {
      return NextResponse.json(
        { message: "Invalid role" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const members = db.collection<WorkspaceMemberDocument>(
      "workspaceMembers"
    );

    const member = await members.findOne({
      _id: new ObjectId(id),
    });

    if (!member) {
      return NextResponse.json(
        { message: "Member not found" },
        { status: 404 }
      );
    }

    const access = await getWorkspaceAccess(
      member.workspaceId
    );

    if (
      !access ||
      !hasPermission(access.role, "members:update")
    ) {
      return NextResponse.json(
        { message: "Permission denied" },
        { status: 403 }
      );
    }

    if (member.role === "Owner") {
      return NextResponse.json(
        { message: "Owner role cannot be changed" },
        { status: 403 }
      );
    }

    await members.updateOne(
      {
        _id: member._id,
        workspaceId: member.workspaceId,
        role: { $ne: "Owner" },
      },
      {
        $set: {
          role,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      message: "Member role updated successfully",
    });
  } catch (error) {
    console.error("Update member error:", error);

    return NextResponse.json(
      { message: "Failed to update member" },
      { status: 500 }
    );
  }
}

// DELETE /api/team/members/:id
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
        { message: "Invalid member ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const members = db.collection<WorkspaceMemberDocument>(
      "workspaceMembers"
    );

    const member = await members.findOne({
      _id: new ObjectId(id),
    });

    if (!member) {
      return NextResponse.json(
        { message: "Member not found" },
        { status: 404 }
      );
    }

    const access = await getWorkspaceAccess(
      member.workspaceId
    );

    if (
      !access ||
      !hasPermission(access.role, "members:remove")
    ) {
      return NextResponse.json(
        { message: "Permission denied" },
        { status: 403 }
      );
    }

    if (member.role === "Owner") {
      return NextResponse.json(
        { message: "Owner cannot be removed" },
        { status: 403 }
      );
    }

    const result = await members.deleteOne({
      _id: member._id,
      workspaceId: member.workspaceId,
      role: { $ne: "Owner" },
    });

    if (!result.deletedCount) {
      return NextResponse.json(
        { message: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Remove member error:", error);

    return NextResponse.json(
      { message: "Failed to remove member" },
      { status: 500 }
    );
  }
}
