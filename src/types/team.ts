
export const teamRoles = [
  "Owner",
  "Admin",
  "Member",
] as const;

export type TeamRole = (typeof teamRoles)[number];

export const memberStatuses = [
  "Pending",
  "Active",
] as const;

export type MemberStatus =
  (typeof memberStatuses)[number];

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string | null;
  email: string;
  role: TeamRole;
  status: MemberStatus;
  invitedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMemberDocument {
  workspaceId: string;
  userId: string | null;
  email: string;
  role: TeamRole;
  status: MemberStatus;
  invitedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
