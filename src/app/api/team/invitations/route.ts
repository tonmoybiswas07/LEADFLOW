
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/lead-auth";
import type { WorkspaceMemberDocument } from "@/types/team";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

   

    const db = await getDatabase();

    const invitations = await db
      .collection<WorkspaceMemberDocument>("workspaceMembers")
      .find({
        email: user.email.trim().toLowerCase(),
        status: "Pending",
        role: { $in: ["Admin", "Member"] },
      })
      .sort({ createdAt: -1 })
      .toArray();

    const workspaceIds = invitations
      .map((invitation) => invitation.workspaceId);

    const { ObjectId } = await import("mongodb");

    const validIds = workspaceIds
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    const workspaces = await db
      .collection("workspaces")
      .find({ _id: { $in: validIds } })
      .project({ name: 1 })
      .toArray();

    const names = new Map(
      workspaces.map((workspace) => [
        workspace._id.toString(),
        workspace.name,
      ])
    );

    return NextResponse.json(
      invitations
        .filter((invitation) =>
          names.has(invitation.workspaceId)
        )
        .map((invitation) => ({
          id: invitation._id.toString(),
          workspaceId: invitation.workspaceId,
          workspaceName:
            names.get(invitation.workspaceId) ?? "Workspace",
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          createdAt: invitation.createdAt.toISOString(),
        }))
    );
  } catch (error) {
    console.error("GET invitations error:", error);

    return NextResponse.json(
      { message: "Failed to load invitations" },
      { status: 500 }
    );
  }
}
