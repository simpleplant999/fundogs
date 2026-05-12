export type CampaignStatus = "Published" | "Draft" | "Archived" | "Done";

export type CampaignApprovalStatus = "pending" | "approved" | "rejected";

export type DonationVerification = "verified" | "pending" | "rejected";

export interface Campaign {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  /** Gallery URLs when provided by the API (ordered; first is primary). */
  images?: string[];
  goalAmount: number;
  raisedAmount: number;
  status: CampaignStatus;
  approvalStatus: CampaignApprovalStatus;
  recipientName: string;
  recipientNote: string;
  /** Present on /campaigns/me responses */
  createdAt?: string;
}

export interface Donor {
  id: string;
  name: string;
  amount: number;
  verification: DonationVerification;
  date: string;
}

export interface Comment {
  id: string;
  author: string;
  body: string;
  status: "visible" | "pending" | "rejected";
  createdAt: string;
}
