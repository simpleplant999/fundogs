export type CampaignStatus = 'Published' | 'Draft' | 'Archived' | 'Done';

export type CampaignApprovalStatus = 'pending' | 'approved' | 'rejected';

export type CampaignTypeId =
  | 'medical_emergency'
  | 'rescue_transport'
  | 'shelter_daily_care'
  | 'spay_neuter_tnr'
  | 'adoption_foster'
  | 'behavior_training'
  | 'memorial_tribute'
  | 'community_education'
  | 'other';

export type DonationVerification = 'verified' | 'pending' | 'rejected';

export interface Campaign {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  images?: string[];
  goalAmount: number;
  raisedAmount: number;
  campaignType?: CampaignTypeId;
  status: CampaignStatus;
  approvalStatus: CampaignApprovalStatus;
  recipientName: string;
  recipientNote: string;
  authorId?: string;
  author?: {
    id?: string;
    fullName: string;
    organization: { name: string; slug: string } | null;
  };
  createdAt?: string;
}

export interface Donor {
  id: string;
  name: string;
  amount: number | null;
  hideAmount?: boolean;
  verification: DonationVerification;
  date: string;
}

export interface Comment {
  id: string;
  author: string;
  body: string;
  status: 'visible' | 'pending' | 'rejected';
  createdAt: string;
}

export interface CampaignUpdate {
  id: string;
  title: string;
  body: string;
  images: string[];
  createdAt: string;
}
