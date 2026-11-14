"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Layers3,
  Loader2,
  FolderKanban,
  RefreshCw,
  CalendarDays,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

import type {
  Workspace,
  WorkspaceInput,
} from "@/types/workspace";

const COLORS = [
  "#0d9488",
  "#2563eb",
  "#7c3aed",
  "#ea580c",
  "#db2777",
  "#059669",
];

const emptyForm: WorkspaceInput = {
  name: "",
  description: "",
  color: COLORS[0],
};

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState<WorkspaceInput>(emptyForm);

  const loadWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/workspaces", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load workspaces");
      }

      setWorkspaces(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (workspace: Workspace) => {
    setEditingId(workspace.id);
    setForm({
      name: workspace.name,
      description: workspace.description,
      color: workspace.color,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    try {
      setSaving(true);

      const url = editingId
        ? `/api/workspaces/${editingId}`
        : "/api/workspaces";

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save workspace");
      }

      toast.success(
        editingId
          ? "Workspace updated successfully!"
          : "Workspace created successfully!"
      );

      setDialogOpen(false);
      setEditingId(null);
      setForm({ ...emptyForm });

      await loadWorkspaces();
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

      const response = await fetch(
        `/api/workspaces/${deleteId}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete workspace");
      }

      toast.success("Workspace deleted successfully!");

      setDeleteId(null);
      await loadWorkspaces();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Delete failed"
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
            Workspaces
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Organize your projects and manage workspaces.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadWorkspaces}
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
            New Workspace
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 w-fit rounded-xl bg-teal-50 p-3">
            <Layers3 size={22} className="text-teal-600" />
          </div>
          <p className="text-sm text-slate-500">Total Workspaces</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900">
            {workspaces.length}
          </h3>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2
            size={32}
            className="animate-spin text-teal-600"
          />
        </div>
      ) : workspaces.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
            <FolderKanban size={30} className="text-teal-600" />
          </div>

          <h3 className="text-xl font-bold text-slate-900">
            No Workspaces Yet
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Create your first workspace to organize your leads.
          </p>

          <Button
            onClick={openCreate}
            className="mt-6 bg-teal-600 hover:bg-teal-700"
          >
            <Plus size={17} className="mr-2" />
            Create Workspace
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div
                className="h-2"
                style={{ backgroundColor: workspace.color }}
              />

              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${workspace.color}15`,
                      color: workspace.color,
                    }}
                  >
                    <FolderKanban size={24} />
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(workspace)}
                    >
                      <Pencil size={17} />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleteId(workspace.id)}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={17} />
                    </Button>
                  </div>
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  {workspace.name}
                </h3>

                <p className="mt-2 min-h-[44px] text-sm leading-relaxed text-slate-500">
                  {workspace.description || "No description provided."}
                </p>

                <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-400">
                  <CalendarDays size={14} />
                  Created{" "}
                  {new Date(workspace.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Workspace" : "Create Workspace"}
            </DialogTitle>

            <DialogDescription>
              Add a name, description and color for your workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-3">
            <div className="space-y-2">
              <Label>Workspace Name</Label>
              <Input
                value={form.name}
                maxLength={80}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
                placeholder="e.g. Sales Team"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                maxLength={500}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description: event.target.value,
                  })
                }
                placeholder="Describe this workspace..."
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <Label>Workspace Color</Label>

              <div className="flex flex-wrap gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, color })}
                    className={`h-9 w-9 rounded-full border-4 transition-transform hover:scale-110 ${
                      form.color === color
                        ? "border-slate-300"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
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
              disabled={saving || !form.name.trim()}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {saving && (
                <Loader2 size={16} className="mr-2 animate-spin" />
              )}

              {editingId ? "Save Changes" : "Create Workspace"}
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
              Delete Workspace?
            </AlertDialogTitle>

            <AlertDialogDescription>
              This will permanently delete the selected workspace.
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
              {deleting ? "Deleting..." : "Delete Workspace"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}