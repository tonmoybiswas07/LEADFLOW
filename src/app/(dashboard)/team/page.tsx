
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Clock3,
  Trash2,
  Loader2,
  RefreshCw,
  Mail,
  Crown,
  AlertCircle,
  CheckCircle2,
  UserRound,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Badge,
} from "@/components/ui/badge";

type TeamRole = "Owner" | "Admin" | "Member";

interface Workspace {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface Member {
  id: string;
  workspaceId: string;
  userId: string | null;
  email: string;
  role: TeamRole;
  status: "Pending" | "Active";
  invitedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface MembersResponse {
  workspaceId: string;
  currentUserRole: TeamRole;
  members: Member[];
}

async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Something went wrong"
    );
  }

  return data as T;
}

export default function TeamManagementPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [currentRole, setCurrentRole] =
    useState<TeamRole>("Member");

  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] =
    useState<"Admin" | "Member">("Member");

  const [deleteMember, setDeleteMember] =
    useState<Member | null>(null);

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] =
    useState<string | null>(null);

  const [error, setError] = useState("");

  const loadWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest<Workspace[]>(
        "/api/workspaces"
      );

      setWorkspaces(data);

      setWorkspaceId((previous) => {
        if (data.some((workspace) => workspace.id === previous)) {
          return previous;
        }

        return data[0]?.id || "";
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load workspaces"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMembers = useCallback(
    async (selectedWorkspaceId: string) => {
      if (!selectedWorkspaceId) {
        setMembers([]);
        return;
      }

      try {
        setMembersLoading(true);
        setError("");

        const data = await apiRequest<MembersResponse>(
          `/api/team/members?workspaceId=${selectedWorkspaceId}`
        );

        setMembers(data.members);
        setCurrentRole(data.currentUserRole);
      } catch (error) {
        setMembers([]);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load team members"
        );
      } finally {
        setMembersLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    void loadMembers(workspaceId);
  }, [workspaceId, loadMembers]);

  const handleInvite = async () => {
    if (!workspaceId) return;

    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    try {
      setInviteLoading(true);

      await apiRequest("/api/team/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
        }),
      });

      toast.success("Invitation created successfully");

      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("Member");

      await loadMembers(workspaceId);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to invite member"
      );
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (
    memberId: string,
    role: "Admin" | "Member"
  ) => {
    try {
      setUpdatingMemberId(memberId);

      await apiRequest(`/api/team/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      toast.success("Member role updated");

      await loadMembers(workspaceId);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update role"
      );
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemove = async () => {
    if (!deleteMember) return;

    try {
      setDeleteLoading(true);

      await apiRequest(
        `/api/team/members/${deleteMember.id}`,
        {
          method: "DELETE",
        }
      );

      toast.success("Member removed successfully");

      setDeleteMember(null);

      await loadMembers(workspaceId);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to remove member"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const activeMembers = members.filter(
    (member) => member.status === "Active"
  );

  const pendingMembers = members.filter(
    (member) => member.status === "Pending"
  );

  const canInvite =
    currentRole === "Owner" ||
    currentRole === "Admin";

  const isOwner = currentRole === "Owner";

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-teal-600">
              <Users className="h-4 w-4" />
              Workspace Collaboration
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Team Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Invite teammates, manage roles and collaborate
              across your workspaces.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => loadMembers(workspaceId)}
              disabled={membersLoading || !workspaceId}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  membersLoading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button>

            {canInvite && workspaceId && (
              <Dialog
                open={inviteOpen}
                onOpenChange={setInviteOpen}
              >
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-teal-600 text-white hover:bg-teal-700">
                    <UserPlus className="h-4 w-4" />
                    Invite Member
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      Invite Team Member
                    </DialogTitle>

                    <DialogDescription>
                      Add someone to your workspace by email.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-5 py-3">
                    <div className="space-y-2">
                      <Label>Email Address</Label>

                      <Input
                        type="email"
                        placeholder="teammate@example.com"
                        value={inviteEmail}
                        onChange={(event) =>
                          setInviteEmail(event.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Team Role</Label>

                      <Select
                        value={inviteRole}
                        onValueChange={(value) =>
                          setInviteRole(
                            value as "Admin" | "Member"
                          )
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="Member">
                            Member
                          </SelectItem>

                          {isOwner && (
                            <SelectItem value="Admin">
                              Admin
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="rounded-xl border border-teal-100 bg-teal-50 p-3 text-xs leading-5 text-teal-800">
                      Invitations are saved as Pending.
                      The invited user must sign in and
                      accept the invitation to join.
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setInviteOpen(false)}
                    >
                      Cancel
                    </Button>

                    <Button
                      disabled={inviteLoading}
                      onClick={handleInvite}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      {inviteLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-4 w-4" />
                      )}
                      Send Invite
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Workspace Selector */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Current Workspace
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Select the workspace whose team you want to manage.
              </p>
            </div>

            <Select
              value={workspaceId}
              onValueChange={setWorkspaceId}
            >
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="Select workspace" />
              </SelectTrigger>

              <SelectContent>
                {workspaces.map((workspace) => (
                  <SelectItem
                    key={workspace.id}
                    value={workspace.id}
                  >
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {!workspaceId ? (
          <Card className="border-dashed py-16 text-center">
            <CardContent>
              <Users className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <h3 className="font-semibold">
                No Workspace Found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Create a workspace to start managing your team.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                title="Total Invitations"
                value={members.length}
                icon={Users}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                description="Invited workspace members"
              />

              <StatCard
                title="Active Members"
                value={activeMembers.length}
                icon={ShieldCheck}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                description="Accepted invitations"
              />

              <StatCard
                title="Pending Invites"
                value={pendingMembers.length}
                icon={Clock3}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                description="Waiting for acceptance"
              />
            </div>

            {/* Members Table */}
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">
                      Workspace Members
                    </CardTitle>

                    <p className="mt-1 text-sm text-slate-500">
                      Manage access and permissions for your team.
                    </p>
                  </div>

                  <Badge variant="secondary">
                    <Crown className="mr-1 h-3.5 w-3.5" />
                    Your Role: {currentRole}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {membersLoading ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="h-7 w-7 animate-spin text-teal-600" />
                  </div>
                ) : members.length === 0 ? (
                  <div className="px-6 py-20 text-center">
                    <UserRound className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                    <h3 className="font-semibold text-slate-800">
                      No Team Members Yet
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Invite your first teammate to collaborate.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-6 py-4 font-semibold">
                            Member
                          </th>
                          <th className="px-6 py-4 font-semibold">
                            Role
                          </th>
                          <th className="px-6 py-4 font-semibold">
                            Status
                          </th>
                          <th className="px-6 py-4 font-semibold">
                            Invited
                          </th>
                          <th className="px-6 py-4 text-right font-semibold">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {members.map((member) => (
                          <tr
                            key={member.id}
                            className="transition hover:bg-slate-50/80"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 font-bold text-teal-700">
                                  {member.email
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div>
                                  <p className="font-medium text-slate-900">
                                    {member.email}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    Team Member
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              {isOwner ? (
                                <Select
                                  value={member.role}
                                  disabled={
                                    updatingMemberId === member.id
                                  }
                                  onValueChange={(value) =>
                                    handleRoleChange(
                                      member.id,
                                      value as "Admin" | "Member"
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-9 w-32">
                                    <SelectValue />
                                  </SelectTrigger>

                                  <SelectContent>
                                    <SelectItem value="Member">
                                      Member
                                    </SelectItem>
                                    <SelectItem value="Admin">
                                      Admin
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge variant="outline">
                                  {member.role}
                                </Badge>
                              )}
                            </td>

                            <td className="px-6 py-4">
                              {member.status === "Active" ? (
                                <Badge className="gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge className="gap-1 bg-amber-50 text-amber-700 hover:bg-amber-50">
                                  <Clock3 className="h-3.5 w-3.5" />
                                  Pending
                                </Badge>
                              )}
                            </td>

                            <td className="px-6 py-4 text-slate-500">
                              {new Date(
                                member.createdAt
                              ).toLocaleDateString()}
                            </td>

                            <td className="px-6 py-4 text-right">
                              {isOwner ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setDeleteMember(member)
                                  }
                                  className="text-slate-400 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : (
                                <span className="text-xs text-slate-400">
                                  No actions
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Remove Confirmation */}
      <AlertDialog
        open={!!deleteMember}
        onOpenChange={(open) => {
          if (!open && !deleteLoading) {
            setDeleteMember(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove Team Member?
            </AlertDialogTitle>

            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{deleteMember?.email}</strong>?
              They will lose access to this workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={deleteLoading}
              onClick={(event) => {
                event.preventDefault();
                void handleRemove();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  description: string;
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  description,
}: StatCardProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-start justify-between p-6">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="mt-3 text-3xl font-bold text-slate-900">
            {value}
          </h3>

          <p className="mt-2 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${iconBg}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}
