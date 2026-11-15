
import { NextRequest, NextResponse } from "next/server";
import { ObjectId, type Filter } from "mongodb";

import { getDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/lead-auth";
import type { LeadStatus } from "@/types/lead";

interface LeadDocument {
  userId: string;
  workspaceId?: string | null;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: LeadStatus;
  source: string;
  notes?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

const allowedRanges = [
  "7d",
  "30d",
  "90d",
  "12m",
  "all",
] as const;

type DateRange = (typeof allowedRanges)[number];

function getStartDate(range: DateRange): Date | null {
  if (range === "all") return null;

  const start = new Date();

  switch (range) {
    case "7d":
      start.setUTCDate(start.getUTCDate() - 7);
      break;
    case "30d":
      start.setUTCDate(start.getUTCDate() - 30);
      break;
    case "90d":
      start.setUTCDate(start.getUTCDate() - 90);
      break;
    case "12m":
      start.setUTCMonth(start.getUTCMonth() - 12);
      break;
  }

  return start;
}

// Escape CSV values and prevent spreadsheet formula injection
function escapeCSV(value: unknown): string {
  let text = String(value ?? "");

  if (/^[\s\uFEFF]*[=+\-@\t\r]/u.test(text)) {
    text = "'" + text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function formatDate(value?: Date | string): string {
  if (!value) return "";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? ""
    : date.toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;

    const workspaceId =
      searchParams.get("workspaceId") || "all";

    const requestedRange =
      searchParams.get("range") || "12m";

    if (
      !allowedRanges.includes(
        requestedRange as DateRange
      )
    ) {
      return NextResponse.json(
        { message: "Invalid date range" },
        { status: 400 }
      );
    }

    const range = requestedRange as DateRange;
    const db = await getDatabase();

    // Validate workspace ownership
    if (
      workspaceId !== "all" &&
      workspaceId !== "unassigned"
    ) {
      if (!ObjectId.isValid(workspaceId)) {
        return NextResponse.json(
          { message: "Invalid workspace ID" },
          { status: 400 }
        );
      }

      const workspace = await db
        .collection("workspaces")
        .findOne({
          _id: new ObjectId(workspaceId),
          userId: user.id,
        });

      if (!workspace) {
        return NextResponse.json(
          { message: "Workspace not found" },
          { status: 404 }
        );
      }
    }

    const filter: Filter<LeadDocument> = {
      userId: user.id,
    };

    if (workspaceId === "unassigned") {
      filter.workspaceId = null;
    } else if (workspaceId !== "all") {
      filter.workspaceId = workspaceId;
    }

    const leads = await db
      .collection<LeadDocument>("leads")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    const startDate = getStartDate(range);
    const now = new Date();

    const filteredLeads = leads.filter((lead) => {
      const date = new Date(lead.createdAt);

      if (Number.isNaN(date.getTime())) return false;
      if (date > now) return false;

      return !startDate || date >= startDate;
    });

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Company",
      "Status",
      "Source",
      "Workspace ID",
      "Notes",
      "Created At",
      "Updated At",
    ];

    const rows = filteredLeads.map((lead) => [
      lead.name,
      lead.email,
      lead.phone,
      lead.company,
      lead.status,
      lead.source,
      lead.workspaceId ?? "Unassigned",
      lead.notes,
      formatDate(lead.createdAt),
      formatDate(lead.updatedAt),
    ]);

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) =>
        row.map(escapeCSV).join(",")
      ),
    ].join("\r\n");

    const filename =
      `leadflow-leads-${range}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    return new NextResponse("\uFEFF" + csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("CSV Export error:", error);

    return NextResponse.json(
      { message: "Failed to export leads" },
      { status: 500 }
    );
  }
}
