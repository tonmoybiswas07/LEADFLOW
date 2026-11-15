import { NextRequest, NextResponse } from "next/server";
import { MongoServerError, ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/lead-auth";
import { getWorkspaceAccess } from "@/lib/workspace-access";
import { hasPermission } from "@/lib/team-permissions";
import { leadStatuses, type LeadStatus } from "@/types/lead";

interface ImportLead {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: LeadStatus;
  source?: string;
}

interface LeadDocument extends ImportLead {
  userId: string;
  workspaceId: string | null;
  createdAt: Date;
}

const MAX_LEADS = 1000;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const incoming = body?.leads;
    const requestedWorkspaceId = typeof body?.workspaceId === "string" ? body.workspaceId.trim() : null;

    if (!Array.isArray(incoming) || incoming.length === 0) {
      return NextResponse.json(
        { message: "Please provide leads to import." },
        { status: 400 }
      );
    }

    if (incoming.length > MAX_LEADS) {
      return NextResponse.json(
        { message: "Maximum 1000 leads per import." },
        { status: 400 }
      );
    }

    let targetWorkspaceId: string | null = null;
    let targetOwnerId = user.id;

    if (requestedWorkspaceId && requestedWorkspaceId !== "personal" && requestedWorkspaceId !== "unassigned") {
      if (!ObjectId.isValid(requestedWorkspaceId)) {
        return NextResponse.json(
          { message: "Invalid workspace ID provided." },
          { status: 400 }
        );
      }

      const access = await getWorkspaceAccess(requestedWorkspaceId);
      if (!access) {
        return NextResponse.json(
          { message: "Workspace not found or access denied." },
          { status: 404 }
        );
      }

      if (!hasPermission(access.role, "leads:create")) {
        return NextResponse.json(
          { message: "You do not have permission to import leads to this workspace." },
          { status: 403 }
        );
      }

      targetWorkspaceId = requestedWorkspaceId;
      targetOwnerId = access.workspace.userId;
    }

    const valid: ImportLead[] = [];
    const invalidRows: number[] = [];
    const seen = new Set<string>();

    let duplicatesInFile = 0;

    incoming.forEach((row, index) => {
      if (!row || typeof row !== "object") {
        invalidRows.push(index + 2);
        return;
      }

      const name =
        typeof row.name === "string" ? row.name.trim() : "";

      const email =
        typeof row.email === "string"
          ? row.email.trim().toLowerCase()
          : "";

      const status =
        typeof row.status === "string"
          ? row.status.trim()
          : "";

      if (
        !name ||
        !emailRegex.test(email) ||
        !leadStatuses.some((item) => item === status)
      ) {
        invalidRows.push(index + 2);
        return;
      }

      if (seen.has(email)) {
        duplicatesInFile++;
        return;
      }

      seen.add(email);

      valid.push({
        name,
        email,
        phone:
          typeof row.phone === "string" ? row.phone.trim() : "",
        company:
          typeof row.company === "string"
            ? row.company.trim()
            : "",
        status: status as LeadStatus,
        source:
          typeof row.source === "string"
            ? row.source.trim() || "CSV Import"
            : "CSV Import",
      });
    });

    const db = await getDatabase();
    const collection = db.collection<LeadDocument>("leads");

    const existing = await collection
      .find(
        {
          userId: targetOwnerId,
          ...(targetWorkspaceId
            ? { workspaceId: targetWorkspaceId }
            : {
                $or: [
                  { workspaceId: null },
                  { workspaceId: { $exists: false } },
                ],
              }),
          email: { $in: valid.map((lead) => lead.email) },
        },
        { projection: { email: 1 } }
      )
      .toArray();

    const existingEmails = new Set(
      existing.map((lead) => lead.email)
    );

    const newLeads = valid.filter(
      (lead) => !existingEmails.has(lead.email)
    );

    let imported = 0;
    let duplicateCount =
      duplicatesInFile + valid.length - newLeads.length;

    if (newLeads.length > 0) {
      const now = new Date();

      const operations = newLeads.map((lead) => ({
        updateOne: {
          filter: {
            userId: targetOwnerId,
            ...(targetWorkspaceId
              ? { workspaceId: targetWorkspaceId }
              : { workspaceId: null }),
            email: lead.email,
          },
          update: {
            $setOnInsert: {
              ...lead,
              userId: targetOwnerId,
              workspaceId: targetWorkspaceId,
              createdAt: now,
            },
          },
          upsert: true,
        },
      }));

      const result = await collection.bulkWrite(operations, {
        ordered: false,
      });

      imported = result.upsertedCount;
      duplicateCount += newLeads.length - imported;
    }

    return NextResponse.json({
      message: "Import completed successfully.",
      total: incoming.length,
      imported,
      duplicates: duplicateCount,
      invalid: invalidRows.length,
      invalidRows,
      workspaceId: targetWorkspaceId,
    });
  } catch (error) {
    console.error("Import leads error:", error);

    if (error instanceof MongoServerError && error.code === 11000) {
      return NextResponse.json(
        { message: "Duplicate email conflict. Please retry." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Failed to import leads." },
      { status: 500 }
    );
  }
}
