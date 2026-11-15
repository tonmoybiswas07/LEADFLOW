
import type { TeamRole } from "@/types/team";

export type TeamPermission =
  | "workspace:read"
  | "workspace:update"
  | "workspace:delete"
  | "leads:read"
  | "leads:create"
  | "leads:update"
  | "leads:delete"
  | "members:read"
  | "members:invite"
  | "members:update"
  | "members:remove";

const permissions: Record<
  TeamRole,
  readonly TeamPermission[]
> = {
  Owner: [
    "workspace:read",
    "workspace:update",
    "workspace:delete",
    "leads:read",
    "leads:create",
    "leads:update",
    "leads:delete",
    "members:read",
    "members:invite",
    "members:update",
    "members:remove",
  ],

  Admin: [
    "workspace:read",
    "leads:read",
    "leads:create",
    "leads:update",
    "leads:delete",
    "members:read",
    "members:invite",
  ],

  Member: [
    "workspace:read",
    "leads:read",
    "leads:create",
    "leads:update",
  ],
};

export function hasPermission(
  role: TeamRole,
  permission: TeamPermission
): boolean {
  return permissions[role].includes(permission);
}
