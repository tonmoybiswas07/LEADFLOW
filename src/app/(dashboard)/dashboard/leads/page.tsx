"use client";

import { useMemo, useState, type FormEvent } from "react";
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
} from "lucide-react";

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

type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Converted"
  | "Lost";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: LeadStatus;
  source: string;
  createdAt: string;
}

type LeadForm = Pick<
  Lead,
  "name" | "email" | "phone" | "company" | "status" | "source"
>;

const initialLeads: Lead[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john@example.com",
    phone: "+1 202 555 0101",
    company: "Acme Inc.",
    status: "New",
    source: "Website",
    createdAt: "2026-11-14",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "+1 202 555 0102",
    company: "TechCorp",
    status: "Qualified",
    source: "LinkedIn",
    createdAt: "2026-11-13",
  },
  {
    id: "3",
    name: "Michael Brown",
    email: "michael@example.com",
    phone: "+1 202 555 0103",
    company: "StartupX",
    status: "Contacted",
    source: "Referral",
    createdAt: "2026-11-12",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily@example.com",
    phone: "+1 202 555 0104",
    company: "DesignHub",
    status: "Converted",
    source: "Facebook",
    createdAt: "2026-11-11",
  },
  {
    id: "5",
    name: "David Wilson",
    email: "david@example.com",
    phone: "+1 202 555 0105",
    company: "GrowthLab",
    status: "Lost",
    source: "Website",
    createdAt: "2026-11-10",
  },
  {
    id: "6",
    name: "Jessica Miller",
    email: "jessica@example.com",
    phone: "+1 202 555 0106",
    company: "BrightTech",
    status: "New",
    source: "LinkedIn",
    createdAt: "2026-11-09",
  },
];

const emptyForm: LeadForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  status: "New",
  source: "Website",
};

const statusStyles: Record<LeadStatus, string> = {
  New: "bg-teal-50 text-teal-700",
  Contacted: "bg-blue-50 text-blue-700",
  Qualified: "bg-violet-50 text-violet-700",
  Converted: "bg-emerald-50 text-emerald-700",
  Lost: "bg-red-50 text-red-700",
};

const statuses: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Converted",
  "Lost",
];

const PAGE_SIZE = 5;

export default function AllLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<LeadForm>(emptyForm);

  const filteredLeads = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesSearch = [
        lead.name,
        lead.email,
        lead.company,
        lead.phone,
      ].some((value) => value.toLowerCase().includes(keyword));

      const matchesStatus =
        statusFilter === "all" || lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

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
    setEditingId(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEditModal = (lead: Lead) => {
    setEditingId(lead.id);
    setForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      status: lead.status,
      source: lead.source,
    });
    setModalOpen(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = form.email.trim().toLowerCase();

    if (!form.name.trim() || !normalizedEmail) return;

    const duplicate = leads.some(
      (lead) =>
        lead.email.toLowerCase() === normalizedEmail &&
        lead.id !== editingId
    );

    if (duplicate) {
      alert("A lead with this email already exists.");
      return;
    }

    const payload: LeadForm = {
      ...form,
      name: form.name.trim(),
      email: normalizedEmail,
      phone: form.phone.trim(),
      company: form.company.trim(),
    };

    if (editingId) {
      setLeads((previous) =>
        previous.map((lead) =>
          lead.id === editingId
            ? { ...lead, ...payload }
            : lead
        )
      );
    } else {
      const newLead: Lead = {
        ...payload,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString().slice(0, 10),
      };

      setLeads((previous) => [newLead, ...previous]);
    }

    setPage(1);
    setModalOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const handleDelete = () => {
    if (!deleteId) return;

    setLeads((previous) =>
      previous.filter((lead) => lead.id !== deleteId)
    );

    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
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

        <Button
          onClick={openAddModal}
          className="rounded-xl bg-teal-600 hover:bg-teal-700"
        >
          <Plus size={18} className="mr-2" />
          Add New Lead
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            title: "Total Leads",
            value: leads.length,
            color: "text-slate-900",
          },
          {
            title: "New Leads",
            value: leads.filter((lead) => lead.status === "New").length,
            color: "text-teal-600",
          },
          {
            title: "Qualified",
            value: leads.filter((lead) => lead.status === "Qualified").length,
            color: "text-violet-600",
          },
          {
            title: "Converted",
            value: leads.filter((lead) => lead.status === "Converted").length,
            color: "text-emerald-600",
          },
        ].map((stat) => (
          <div
            key={stat.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{stat.title}</p>
            <h2 className={`mt-2 text-3xl font-bold ${stat.color}`}>
              {stat.value}
            </h2>
          </div>
        ))}
      </div>

      {/* Filters */}
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
            setStatusFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leads Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedLeads.map((lead) => (
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
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[lead.status]}`}
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

                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Delete ${lead.name}`}
                        onClick={() => setDeleteId(lead.id)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {paginatedLeads.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-16 text-center text-slate-500"
                  >
                    No leads found. Try another search or add a lead.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
          <p className="text-sm text-slate-500">
            Showing {filteredLeads.length === 0
              ? 0
              : (currentPage - 1) * PAGE_SIZE + 1}
            {" - "}
            {Math.min(currentPage * PAGE_SIZE, filteredLeads.length)}
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

      {/* Add / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Lead" : "Add New Lead"}
            </DialogTitle>

            <DialogDescription>
              {editingId
                ? "Update the information for this lead."
                : "Enter the details to create a new lead."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lead-name">Full Name *</Label>
                <Input
                  id="lead-name"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="John Smith"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead-email">Email *</Label>
                <Input
                  id="lead-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead-phone">Phone</Label>
                <Input
                  id="lead-phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  placeholder="+880 1XXXXXXXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead-company">Company</Label>
                <Input
                  id="lead-company"
                  value={form.company}
                  onChange={(e) =>
                    setForm({ ...form, company: e.target.value })
                  }
                  placeholder="Company name"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      status: value as LeadStatus,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
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
                  onValueChange={(value) =>
                    setForm({ ...form, source: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {["Website", "LinkedIn", "Facebook", "Referral", "Other"].map(
                      (source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700"
              >
                {editingId ? "Save Changes" : "Add Lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the lead from the current list.
              This action cannot be undone in this session.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}