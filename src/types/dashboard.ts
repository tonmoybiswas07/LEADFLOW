import type { LeadStatus } from "@/types/lead";

export interface DashboardData {
  stats: {
    totalLeads: number;
    newLeads: number;
    convertedLeads: number;
    conversionRate: number;
  };

  monthlyGrowth: {
    month: string;
    year: number;
    leads: number;
    converted: number;
  }[];

  statusDistribution: {
    name: LeadStatus;
    value: number;
  }[];

  recentLeads: {
    id: string;
    name: string;
    email: string;
    company: string;
    status: LeadStatus;
    source: string;
    createdAt: string;
  }[];
}