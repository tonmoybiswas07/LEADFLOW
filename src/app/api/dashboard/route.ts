import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/lead-auth";
import type { LeadStatus } from "@/types/lead";

interface LeadDocument {
  userId: string;
  name: string;
  email: string;
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
      .sort({ createdAt: -1 })
      .toArray();

    const totalLeads = leads.length;

    const newLeads = leads.filter(
      (lead) => lead.status === "New"
    ).length;

    const convertedLeads = leads.filter(
      (lead) => lead.status === "Converted"
    ).length;

    const conversionRate =
      totalLeads > 0
        ? Number(((convertedLeads / totalLeads) * 100).toFixed(1))
        : 0;

    const statuses: LeadStatus[] = [
      "New",
      "Contacted",
      "Qualified",
      "Converted",
      "Lost",
    ];

    const statusDistribution = statuses.map((status) => ({
      name: status,
      value: leads.filter((lead) => lead.status === status).length,
    }));

    // Monthly growth for the last 12 months
    const now = new Date();

    const monthlyGrowth = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + index, 1)
      );

      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();

      const monthlyLeads = leads.filter((lead) => {
        const created = new Date(lead.createdAt);

        return (
          created.getUTCFullYear() === year &&
          created.getUTCMonth() === month
        );
      });

      return {
        month: date.toLocaleString("en-US", {
          month: "short",
          timeZone: "UTC",
        }),
        year,
        leads: monthlyLeads.length,
        converted: monthlyLeads.filter(
          (lead) => lead.status === "Converted"
        ).length,
      };
    });

    const recentLeads = leads.slice(0, 5).map((lead) => ({
      id: lead._id.toString(),
      name: lead.name,
      email: lead.email,
      company: lead.company,
      status: lead.status,
      source: lead.source,
      createdAt: new Date(lead.createdAt).toISOString().slice(0, 10),
    }));

    return NextResponse.json({
      stats: {
        totalLeads,
        newLeads,
        convertedLeads,
        conversionRate,
      },
      monthlyGrowth,
      statusDistribution,
      recentLeads,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);

    return NextResponse.json(
      { message: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}