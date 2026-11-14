"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  RefreshCw,
  Trash2,
  Users,
  Layers3,
  Mail,
  Phone,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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

interface DuplicateLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  createdAt: string;
}

interface DuplicateGroup {
  type: "email" | "phone";
  value: string;
  leads: DuplicateLead[];
}

interface DuplicateResponse {
  totalLeads: number;
  duplicateLeads: number;
  duplicateGroups: number;
  groups: DuplicateGroup[];
}

export default function DuplicatesPage() {
  const [data, setData] = useState<DuplicateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadDuplicates = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/leads/duplicates", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load duplicates");
      }

      setData(result);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDuplicates();
  }, [loadDuplicates]);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);

      const response = await fetch(`/api/leads/${deleteId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete lead");
      }

      toast.success("Duplicate lead deleted successfully!");

      setDeleteId(null);
      await loadDuplicates();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Delete failed"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Duplicate Leads
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Find and manage leads with matching email addresses or phone numbers.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadDuplicates}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {[
            {
              label: "Total Leads",
              value: data.totalLeads,
              icon: Users,
              bg: "bg-teal-50",
              color: "text-teal-600",
            },
            {
              label: "Duplicate Leads",
              value: data.duplicateLeads,
              icon: AlertTriangle,
              bg: "bg-amber-50",
              color: "text-amber-600",
            },
            {
              label: "Duplicate Groups",
              value: data.duplicateGroups,
              icon: Layers3,
              bg: "bg-blue-50",
              color: "text-blue-600",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className={`mb-5 w-fit rounded-xl p-3 ${item.bg}`}>
                  <Icon size={22} className={item.color} />
                </div>

                <p className="text-sm text-slate-500">{item.label}</p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {item.value.toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl bg-white">
          <Loader2 size={32} className="animate-spin text-teal-600" />
        </div>
      )}

      {/* Empty State */}
      {!loading && data?.groups.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <ShieldCheck size={32} className="text-emerald-600" />
          </div>

          <h3 className="text-xl font-bold text-slate-900">
            No Duplicate Leads Found
          </h3>

          <p className="mx-auto mt-3 max-w-md text-sm text-slate-500">
            Your lead database looks clean. No matching email addresses or
            phone numbers were found.
          </p>

          <Link
            href="/dashboard/leads"
            className="mt-6 inline-flex items-center gap-2 font-semibold text-teal-600 hover:text-teal-700"
          >
            View All Leads
            <ArrowRight size={17} />
          </Link>
        </div>
      )}

      {/* Duplicate Groups */}
      {!loading &&
        data?.groups.map((group, index) => (
          <div
            key={`${group.type}-${group.value}`}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-50 p-3">
                  {group.type === "email" ? (
                    <Mail size={20} className="text-amber-600" />
                  ) : (
                    <Phone size={20} className="text-amber-600" />
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Duplicate Group #{index + 1}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Matching {group.type}: {group.value}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                {group.leads.length} matching leads
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Lead</th>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {group.leads.map((lead, leadIndex) => (
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

                        {leadIndex === 0 && (
                          <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            Oldest Record
                          </span>
                        )}
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

                      <td className="px-6 py-4 text-slate-500">
                        {lead.createdAt}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(lead.id)}
                          className="text-red-500 hover:bg-red-50 hover:text-red-600"
                          title="Delete lead"
                        >
                          <Trash2 size={17} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

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
              Delete Duplicate Lead?
            </AlertDialogTitle>

            <AlertDialogDescription>
              This will permanently delete the selected lead from MongoDB.
              This action cannot be undone.
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