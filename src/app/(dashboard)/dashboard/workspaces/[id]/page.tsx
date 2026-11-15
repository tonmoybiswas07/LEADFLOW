"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Search,
  Trash2,
  Pencil,
  Loader2,
  Users,
  RefreshCw,
  FolderKanban,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  leadStatuses,
  type Lead,
  type LeadStatus,
} from "@/types/lead";

type PageProps = {
  params: Promise<{ id: string }>;
};

type LeadForm = {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: LeadStatus;
  source: string;
};

const emptyForm: LeadForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  status: "New",
  source: "Manual",
};

export default function WorkspaceDetailsPage({ params }: PageProps) {
  const { id } = use(params);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [workspaceName, setWorkspaceName] = useState("Workspace");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<LeadForm>(emptyForm);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [workspaceRes, leadsRes] = await Promise.all([
        fetch("/api/workspaces", { cache: "no-store" }),
        fetch(`/api/workspaces/${id}/leads`, {
          cache: "no-store",
        }),
      ]);

      const workspaceData = await workspaceRes.json();
      const leadsData = await leadsRes.json();

      if (!workspaceRes.ok || !leadsRes.ok) {
        throw new Error(
          leadsData.message ||
          workspaceData.message ||
          "Failed to load workspace"
        );
      }

      const workspace = workspaceData.find(
        (item: { id: string; name: string }) => item.id === id
      );

      setWorkspaceName(workspace?.name || "Workspace");
      setLeads(leadsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditingId(lead.id);
    setForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      status: lead.status,
      source: lead.source,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    try {
      setSaving(true);

      const url = editingId
        ? `/api/leads/${editingId}`
        : `/api/workspaces/${id}/leads`;

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save lead");
      }

      toast.success(
        editingId
          ? "Lead updated successfully!"
          : "Lead added to workspace!"
      );

      setDialogOpen(false);
      setEditingId(null);
      setForm({ ...emptyForm });
      await loadData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Save failed"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);

      const response = await fetch(`/api/leads/${deleteId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Delete failed");
      }

      toast.success("Lead deleted successfully!");
      setDeleteId(null);
      await loadData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Delete failed"
      );
    } finally {
      setDeleting(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const query = search.toLowerCase();

    const matchesSearch =
      lead.name.toLowerCase().includes(query) ||
      lead.email.toLowerCase().includes(query) ||
      lead.company.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "All" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/workspaces"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-teal-600"
        >
          <ArrowLeft size={16} />
          Back to Workspaces
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-teal-50 p-4">
              <FolderKanban size={28} className="text-teal-600" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {workspaceName}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage leads inside this workspace
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
            </Button>

            <Button
              onClick={openCreate}
              className="gap-2 bg-teal-600 hover:bg-teal-700"
            >
              <Plus size={17} />
              Add Lead
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {[
          {
            label: "Total Leads",
            value: leads.length,
          },
          {
            label: "New Leads",
            value: leads.filter((lead) => lead.status === "New").length,
          },
          {
            label: "Converted Leads",
            value: leads.filter(
              (lead) => lead.status === "Converted"
            ).length,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 w-fit rounded-xl bg-teal-50 p-3">
              <Users size={21} className="text-teal-600" />
            </div>

            <p className="text-sm text-slate-500">{item.label}</p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search workspace leads..."
            className="pl-10"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(val) => {
            if (val) setStatusFilter(val);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            {leadStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Leads Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[250px] items-center justify-center">
            <Loader2
              size={30}
              className="animate-spin text-teal-600"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4">Lead</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">
                        {lead.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {lead.email}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {lead.company || "—"}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {lead.phone || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
                        {lead.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {lead.source}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(lead)}
                        >
                          <Pencil size={16} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(lead.id)}
                          className="text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredLeads.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-slate-500"
                    >
                      No leads found in this workspace.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Lead" : "Add Workspace Lead"}
            </DialogTitle>

            <DialogDescription>
              Enter the lead information below.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
            {(
              [
                ["name", "Full Name"],
                ["email", "Email Address"],
                ["phone", "Phone Number"],
                ["company", "Company"],
                ["source", "Lead Source"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  value={form[key]}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      [key]: event.target.value,
                    })
                  }
                  placeholder={label}
                />
              </div>
            ))}

            <div className="space-y-2">
              <Label>Lead Status</Label>

              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    status: value as LeadStatus,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {leadStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {saving && (
                <Loader2
                  size={16}
                  className="mr-2 animate-spin"
                />
              )}

              {editingId ? "Save Changes" : "Add Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Lead?
            </AlertDialogTitle>

            <AlertDialogDescription>
              This lead will be permanently removed from MongoDB.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete Lead"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}