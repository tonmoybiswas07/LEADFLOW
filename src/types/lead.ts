export const leadStatuses = [
  "New",
  "Contacted",
  "Qualified",
  "Converted",
  "Lost",
] as const;

export type LeadStatus = (typeof leadStatuses)[number];

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: LeadStatus;
  source: string;
  createdAt: string;
}

export type LeadInput = Pick<
  Lead,
  "name" | "email" | "phone" | "company" | "status" | "source"
>;