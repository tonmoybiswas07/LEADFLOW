
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getCurrentUser } from "@/lib/lead-auth";
import { getDatabase } from "@/lib/db";
import { getWorkspaceAccess } from "@/lib/workspace-access";
import { hasPermission } from "@/lib/team-permissions";

import type {
  WorkspaceMemberDocument,
} from "@/types/team";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const workspaceId =
      request.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId || !ObjectId.isValid(workspaceId)) {
      return NextResponse.json(
        { message: "Invalid workspace ID" },
        { status: 400 }
      );
    }

    const access = await getWorkspaceAccess(workspaceId);

    if (
      !access ||
      !hasPermission(access.role, "members:read")
    ) {
      return NextResponse.json(
        { message: "Access denied" },
        { status: 403 }
      );
    }

    const db = await getDatabase();

    const members = await db
      .collection<WorkspaceMemberDocument>(
        "workspaceMembers"
      )
      .find({ workspaceId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      workspaceId,
      currentUserRole: access.role,
      members: members.map((member) => ({
        id: member._id.toString(),
        workspaceId: member.workspaceId,
        userId: member.userId,
        email: member.email,
        role: member.role,
        status: member.status,
        invitedBy: member.invitedBy,
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET team members error:", error);

    return NextResponse.json(
      { message: "Failed to load members" },
      { status: 500 }
    );
  }
}
