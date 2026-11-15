
import { ObjectId } from "mongodb";

import { getDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/lead-auth";

import {
  hasPermission,
  type TeamPermission,
} from "@/lib/team-permissions";

import type {
  TeamRole,
  WorkspaceMemberDocument,
} from "@/types/team";

interface WorkspaceDocument {
  userId: string;
  name: string;
}

export async function getWorkspaceAccess(
  workspaceId: string
) {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  if (!ObjectId.isValid(workspaceId)) {
    return null;
  }

  const db = await getDatabase();

  const workspace = await db
    .collection<WorkspaceDocument>("workspaces")
    .findOne({
      _id: new ObjectId(workspaceId),
    });

  if (!workspace) {
    return null;
  }

  // Workspace creator is always Owner
  if (workspace.userId === user.id) {
    return {
      user,
      workspace,
      role: "Owner" as TeamRole,
    };
  }

  const member = await db
    .collection<WorkspaceMemberDocument>(
      "workspaceMembers"
    )
    .findOne({
      workspaceId,
      userId: user.id,
      status: "Active",
    });

  if (!member) {
    return null;
  }

  // Owner role cannot be assigned through invitation
  if (member.role === "Owner") {
    return null;
  }

  return {
    user,
    workspace,
    role: member.role,
  };
}

export async function canAccessWorkspace(
  workspaceId: string,
  permission: TeamPermission
) {
  const access = await getWorkspaceAccess(workspaceId);

  if (!access) {
    return false;
  }

  return hasPermission(access.role, permission);
}
