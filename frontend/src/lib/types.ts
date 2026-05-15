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
  authorId?: string;
  /** Present when API includes author (e.g. public list). */
  author?: {
    id?: string;
    fullName: string;
    organization: { name: string; slug: string } | null;
  };
  /** Present on /campaigns/me responses */
  createdAt?: string;
}

export interface Donor {
  id: string;
  name: string;
  /** Null when the donor chose to hide the amount on the public list. */
  amount: number | null;
  /** When true, the public donor list shows a masked amount instead of PHP. */
  hideAmount?: boolean;
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

export interface CampaignUpdate {
  id: string;
  title: string;
  body: string;
  /** Image URLs from the server (may be empty). */
  images: string[];
  createdAt: string;
}
