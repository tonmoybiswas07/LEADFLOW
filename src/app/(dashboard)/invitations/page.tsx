
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MailOpen,
  Check,
  Clock3,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Invitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  email: string;
  role: "Admin" | "Member";
  status: "Pending";
  createdAt: string;
}

export default function InvitationsPage() {
  const [invitations, setInvitations] =
    useState<Invitation[]>([]);

  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] =
    useState<string | null>(null);
  const [error, setError] = useState("");

  const loadInvitations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/team/invitations",
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load invitations"
        );
      }

      setInvitations(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInvitations();
  }, [loadInvitations]);

  const acceptInvitation = async (id: string) => {
    try {
      setAcceptingId(id);

      const response = await fetch(
        "/api/team/invitations/accept",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invitationId: id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to accept invitation"
        );
      }

      toast.success("Invitation accepted successfully!");

      await loadInvitations();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to accept invitation"
      );
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-teal-600">
              <MailOpen className="h-4 w-4" />
              Workspace Invitations
            </div>

            <h1 className="text-3xl font-bold text-slate-900">
              My Invitations
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Accept invitations to join your teammates.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={loadInvitations}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        ) : invitations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-20 text-center">
              <MailOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" />

              <h2 className="text-lg font-semibold">
                No Pending Invitations
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Your workspace invitations will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5">
            {invitations.map((invitation) => (
              <Card
                key={invitation.id}
                className="border-slate-200 shadow-sm"
              >
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="text-lg">
                      {invitation.workspaceName}
                    </CardTitle>

                    <Badge
                      variant="secondary"
                      className="gap-1"
                    >
                      <Clock3 className="h-3 w-3" />
                      Pending
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <ShieldCheck className="h-4 w-4 text-teal-600" />
                      Invited as {invitation.role}
                    </div>

                    <p className="text-xs text-slate-400">
                      Invited on{" "}
                      {new Date(
                        invitation.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <Button
                    disabled={acceptingId !== null}
                    onClick={() =>
                      acceptInvitation(invitation.id)
                    }
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {acceptingId === invitation.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Accept Invitation
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
