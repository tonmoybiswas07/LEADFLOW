"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Workspace } from "@/types/workspace";

interface WorkspaceSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export default function WorkspaceSelect({
  value,
  onChange,
  disabled = false,
}: WorkspaceSelectProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadWorkspaces() {
      try {
        const response = await fetch("/api/workspaces", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load workspaces");
        }

        const data: Workspace[] = await response.json();
        setWorkspaces(data);
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load workspaces"
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadWorkspaces();

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm text-slate-500">
        <Loader2 size={15} className="animate-spin" />
        Loading workspaces...
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600" role="alert">
        {error}
      </p>
    );
  }

  return (
    <Select
      value={value ?? "unassigned"}
      onValueChange={(selected) =>
        onChange(selected === "unassigned" ? null : selected)
      }
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select Workspace" />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="unassigned">
          Unassigned
        </SelectItem>

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
  );
}