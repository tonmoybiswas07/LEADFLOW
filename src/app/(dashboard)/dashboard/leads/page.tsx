
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  Plus,
  Search,
  Users,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Building2,
  Phone,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  type LeadInput,
  type LeadStatus,
} from "@/types/lead";

type WorkspaceRole = "Owner" | "Admin" | "Member";

interface Workspace {
  id: string;
  name: string;
  role: WorkspaceRole;
  isShared: boolean;
}

type WorkspaceLead = Lead & {
  workspaceId?: string | null;
};

const STORAGE_KEY = "leadflow-active-workspace";
const PERSONAL = "personal";
const PAGE_SIZE = 5;

const emptyForm: LeadInput = {
  name: "",
  email: "",
  phone: "",
  company: "",
  status: "New",
  source: "Website",
  workspaceId: null,
};

const statusStyles: Record<LeadStatus, string> = {
  New: "bg-teal-50 text-teal-700",
  Contacted: "bg-blue-50 text-blue-700",
  Qualified: "bg-violet-50 text-violet-700",
  Converted: "bg-emerald-50 text-emerald-700",
  Lost: "bg-red-50 text-red-700",
};

const sources = [
  "Website",
  "LinkedIn",
  "Facebook",
  "Referral",
  "Other",
];

async function readResponse(response: Response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Something went wrong");
  }

  return data;
}

export default function AllLeadsPage() {
  const [leads, setLeads] = useState<WorkspaceLead[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  const [selectedWorkspaceId, setSelectedWorkspaceId] =
    useState<string | null>(null);

  const [scopeReady, setScopeReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<LeadInput>({ ...emptyForm });

  const [refreshKey, setRefreshKey] = useState(0);

  // Load available workspaces and selected workspace
  const loadWorkspaces = useCallback(async () => {
    try {
      const response = await fetch("/api/workspaces", {
        cache: "no-store",
      });

      const data = await readResponse(response);

      if (!Array.isArray(data)) {
        throw new Error("Invalid workspace response");
      }

      const list = data as Workspace[];
      setWorkspaces(list);

      const savedId = localStorage.getItem(STORAGE_KEY);

      const validWorkspace = list.find(
        (workspace) => workspace.id === savedId
      );

      setSelectedWorkspaceId(
        validWorkspace?.id ?? list[0]?.id ?? PERSONAL
      );
    } catch (err) {
      setWorkspaces([]);
      setSelectedWorkspaceId(null);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load workspaces"
      );
    } finally {
      setScopeReady(true);
    }
  }, []);

  useEffect(() => {
    void loadWorkspaces();

    const handleWorkspaceChange = () => {
      setPage(1);
      setSearch("");
      setStatusFilter("all");
      setModalOpen(false);
      setDeleteId(null);

      void loadWorkspaces();
    };

    window.addEventListener(
      "workspace-changed",
      handleWorkspaceChange
    );

    return () => {
      window.removeEventListener(
        "workspace-changed",
        handleWorkspaceChange
      );
    };
  }, [loadWorkspaces]);

  // Fetch accessible leads
  useEffect(() => {
    const controller = new AbortController();

    async function fetchLeads() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/leads", {
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await readResponse(response);

        if (!controller.signal.aborted) {
          setLeads(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load leads"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchLeads();

    return () => controller.abort();
  }, [refreshKey, selectedWorkspaceId]);

  const activeWorkspace = workspaces.find(
    (workspace) => workspace.id === selectedWorkspaceId
  );

  const isPersonal = selectedWorkspaceId === PERSONAL;

  const canDelete =
    isPersonal ||
    activeWorkspace?.role === "Owner" ||
    activeWorkspace?.role === "Admin";

  // Filter leads by workspace
  const workspaceLeads = useMemo(() => {
    if (!scopeReady || !selectedWorkspaceId) return [];

    return leads.filter((lead) => {
      if (isPersonal) {
        return !lead.workspaceId;
      }

      return lead.workspaceId === selectedWorkspaceId;
    });
  }, [leads, selectedWorkspaceId, isPersonal, scopeReady]);

  const filteredLeads = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return workspaceLeads.filter((lead) => {
      const matchesSearch = [
        lead.name,
        lead.email,
        lead.company,
        lead.phone,
      ].some((value) =>
        (value ?? "").toLowerCase().includes(keyword)
      );

      const matchesStatus =
        statusFilter === "all" ||
        lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [workspaceLeads, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLeads.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const openAddModal = () => {
    if (!selectedWorkspaceId) return;

    setEditingId(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEditModal = (lead: WorkspaceLead) => {
    setEditingId(lead.id);

    setForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      status: lead.status,
      source: lead.source,
      workspaceId: lead.workspaceId,
    });

    setModalOpen(true);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (saving || !selectedWorkspaceId) return;

    try {
      setSaving(true);

      const isEditing = Boolean(editingId);

      const url = isEditing
        ? `/api/leads/${editingId}`
        : "/api/leads";

      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        company: form.company.trim(),
      };

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isEditing
            ? payload
            : {
                ...payload,
                workspaceId: isPersonal
                  ? null
                  : selectedWorkspaceId,
              }
        ),
      });

      await readResponse(response);

      toast.success(
        isEditing
          ? "Lead updated successfully!"
          : "New lead added successfully!"
      );

      setModalOpen(false);
      setEditingId(null);
      setForm({ ...emptyForm });
      setPage(1);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to save lead"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || deleting || !canDelete) return;

    try {
      setDeleting(true);

      const response = await fetch(
        `/api/leads/${deleteId}`,
        { method: "DELETE" }
      );

      await readResponse(response);

      setLeads((previous) =>
        previous.filter((lead) => lead.id !== deleteId)
      );

      toast.success("Lead deleted successfully!");
      setDeleteId(null);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to delete lead"
      );
    } finally {
      setDeleting(false);
    }
  };

  const stats = [
    {
      title: "Total Leads",
      value: workspaceLeads.length,
      color: "text-slate-900",
    },
    {
      title: "New Leads",
      value: workspaceLeads.filter(
        (lead) => lead.status === "New"
      ).length,
      color: "text-teal-600",
    },
    {
      title: "Qualified",
      value: workspaceLeads.filter(
        (lead) => lead.status === "Qualified"
      ).length,
      color: "text-violet-600",
    },
    {
      title: "Converted",
      value: workspaceLeads.filter(
        (lead) => lead.status === "Converted"
      ).length,
      color: "text-emerald-600",
    },
  ];

  const changeScope = (value: string) => {
    if (value === PERSONAL) {
      setSelectedWorkspaceId(PERSONAL);
    } else {
      const workspace = workspaces.find(
        (item) => item.id === value
      );

      if (!workspace) return;

      setSelectedWorkspaceId(workspace.id);
      localStorage.setItem(STORAGE_KEY, workspace.id);

      window.dispatchEvent(
        new CustomEvent("workspace-changed", {
          detail: { workspaceId: workspace.id },
        })
      );
    }

    setPage(1);
    setSearch("");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-teal-600">
            <Users size={18} />
            Lead Management
          </div>

          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            All Leads
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage, track and organize your business leads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setRefreshKey((key) => key + 1)
            }
            disabled={loading}
            aria-label="Refresh leads"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
          </Button>

          <Button
            onClick={openAddModal}
            disabled={!scopeReady || !selectedWorkspaceId}
            className="rounded-xl bg-teal-600 hover:bg-teal-700"
          >
            <Plus size={18} className="mr-2" />
            Add New Lead
          </Button>
        </div>
      </div>

      {/* Selected Workspace */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-teal-100 bg-teal-50/50 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-100 p-3 text-teal-700">
            <Building2 size={22} />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">
              Current Lead Scope
            </p>

            <h3 className="font-semibold text-slate-900">
              {isPersonal
                ? "Personal Leads"
                : activeWorkspace?.name ?? "Select Workspace"}
            </h3>

            <p className="text-xs text-teal-700">
              {isPersonal
                ? "Private leads"
                : activeWorkspace
                  ? `${activeWorkspace.role} ${
                      activeWorkspace.isShared ? "· Shared" : ""
                    }`
                  : "No workspace selected"}
            </p>
          </div>
        </div>

        <Select
          value={selectedWorkspaceId ?? ""}
          onValueChange={(val) => {
            if (val) changeScope(val);
          }}
          disabled={!scopeReady}
        >
          <SelectTrigger className="w-full bg-white sm:w-60">
            <SelectValue placeholder="Select workspace" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value={PERSONAL}>
              Personal Leads
            </SelectItem>

            {workspaces.map((workspace) => (
              <SelectItem
                key={workspace.id}
                value={workspace.id}
              >
                {workspace.name} ({workspace.role})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">
              {stat.title}
            </p>

            <h2
              className={`mt-2 text-3xl font-bold ${stat.color}`}
            >
              {loading || !scopeReady ? "..." : stat.value}
            </h2>
          </div>
        ))}
      </div>

      {/* Search and Status Filter */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, company..."
            className="pl-10"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            if (value) {
              setStatusFilter(value);
              setPage(1);
            }
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              All Statuses
            </SelectItem>

            {leadStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leads Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {error && (
          <div
            role="alert"
            className="border-b border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Lead</th>
                <th className="px-5 py-4">Company</th>
                <th className="px-5 py-4">Phone</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Source</th>
                <th className="px-5 py-4">Added</th>
                <th className="px-5 py-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading || !scopeReady ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <Loader2
                      size={30}
                      className="mx-auto animate-spin text-teal-600"
                    />
                    <p className="mt-3 text-slate-500">
                      Loading leads...
                    </p>
                  </td>
                </tr>
              ) : paginatedLeads.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-16 text-center text-slate-500"
                  >
                    {error
                      ? "Unable to load leads. Please retry."
                      : "No leads found in this workspace."}
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {lead.name}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <Mail size={13} />
                        {lead.email}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="flex items-center gap-2 text-slate-600">
                        <Building2 size={15} />
                        {lead.company || "—"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="flex items-center gap-2 text-slate-600">
                        <Phone size={14} />
                        {lead.phone || "—"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusStyles[lead.status]
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {lead.source}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {lead.createdAt}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label={`Edit ${lead.name}`}
                          onClick={() => openEditModal(lead)}
                        >
                          <Pencil size={16} />
                        </Button>

                        {canDelete && (
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label={`Delete ${lead.name}`}
                            onClick={() => setDeleteId(lead.id)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}

                        {!canDelete && (
                          <span
                            title="Members cannot delete workspace leads"
                            className="flex items-center text-slate-400"
                          >
                            <ShieldCheck size={17} />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
          <p className="text-sm text-slate-500">
            Showing{" "}
            {filteredLeads.length === 0
              ? 0
              : (currentPage - 1) * PAGE_SIZE + 1}
            {" - "}
            {Math.min(
              currentPage * PAGE_SIZE,
              filteredLeads.length
            )}
            {" of "}
            {filteredLeads.length} leads
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft size={17} />
            </Button>

            <span className="px-2 text-sm font-medium">
              {currentPage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight size={17} />
            </Button>
          </div>
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!saving) setModalOpen(open);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Lead" : "Add New Lead"}
            </DialogTitle>

            <DialogDescription>
              {editingId
                ? "Update the information for this lead."
                : `Create a lead in ${
                    isPersonal
                      ? "Personal Leads"
                      : activeWorkspace?.name ?? "this workspace"
                  }.`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lead-name">
                  Full Name *
                </Label>
                <Input
                  id="lead-name"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="John Smith"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead-email">
                  Email *
                </Label>
                <Input
                  id="lead-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead-phone">
                  Phone
                </Label>
                <Input
                  id="lead-phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value,
                    })
                  }
                  placeholder="+880 1XXXXXXXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead-company">
                  Company
                </Label>
                <Input
                  id="lead-company"
                  value={form.company}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      company: e.target.value,
                    })
                  }
                  placeholder="Company name"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>

                <Select
                  value={form.status}
                  onValueChange={(value) => {
                    if (value) {
                      setForm({
                        ...form,
                        status: value as LeadStatus,
                      });
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {leadStatuses.map((status) => (
                      <SelectItem
                        key={status}
                        value={status}
                      >
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Source</Label>

                <Select
                  value={form.source}
                  onValueChange={(value) => {
                    if (value) {
                      setForm({
                        ...form,
                        source: value,
                      });
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {sources.map((source) => (
                      <SelectItem
                        key={source}
                        value={source}
                      >
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={saving}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {saving && (
                  <Loader2
                    size={16}
                    className="mr-2 animate-spin"
                  />
                )}

                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Add Lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this lead?
            </AlertDialogTitle>

            <AlertDialogDescription>
              This will permanently delete the lead from
              MongoDB. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting && (
                <Loader2
                  size={16}
                  className="mr-2 animate-spin"
                />
              )}

              {deleting ? "Deleting..." : "Delete Lead"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
