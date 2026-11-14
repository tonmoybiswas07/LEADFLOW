import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/lead-auth";
import type { LeadStatus } from "@/types/lead";

interface LeadDocument {
  userId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: LeadStatus;
  source: string;
  createdAt: Date;
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await getDatabase();

    const leads = await db
      .collection<LeadDocument>("leads")
      .find({ userId: user.id })
      .sort({ createdAt: 1, _id: 1 })
      .toArray();

    const emailMap = new Map<string, string[]>();
    const phoneMap = new Map<string, string[]>();

    for (const lead of leads) {
      const id = lead._id.toString();
      const email = (lead.email || "").trim().toLowerCase();

      // Remove formatting characters from phone numbers
      const phone = (lead.phone || "").replace(/[^\d+]/g, "");

      if (email) {
        emailMap.set(email, [...(emailMap.get(email) || []), id]);
      }

      if (phone && phone.replace(/\D/g, "").length >= 7) {
        phoneMap.set(phone, [...(phoneMap.get(phone) || []), id]);
      }
    }

    const groups: {
      type: "email" | "phone";
      value: string;
      leads: {
        id: string;
        name: string;
        email: string;
        phone: string;
        company: string;
        status: LeadStatus;
        createdAt: string;
      }[];
    }[] = [];

    for (const [type, map] of [
      ["email", emailMap],
      ["phone", phoneMap],
    ] as const) {
      for (const [value, ids] of map) {
        if (ids.length < 2) continue;

        const idSet = new Set(ids);

        groups.push({
          type,
          value,
          leads: leads
            .filter((lead) => idSet.has(lead._id.toString()))
            .map((lead) => ({
              id: lead._id.toString(),
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              company: lead.company,
              status: lead.status,
              createdAt: new Date(lead.createdAt)
                .toISOString()
                .slice(0, 10),
            })),
        });
      }
    }

    const duplicateIds = new Set(
      groups.flatMap((group) => group.leads.map((lead) => lead.id))
    );

    return NextResponse.json({
      totalLeads: leads.length,
      duplicateLeads: duplicateIds.size,
      duplicateGroups: groups.length,
      groups,
    });
  } catch (error) {
    console.error("Duplicate detection error:", error);

    return NextResponse.json(
      { message: "Failed to detect duplicate leads" },
      { status: 500 }
    );
  }
}