import type {
  Campaign,
  CampaignLifecycleStatus,
  Comment,
  Donation,
  User,
} from '@prisma/client';

export type ApiCampaign = {
  id: string;
  slug: string;
  title: string;
  description: string;
  /** First image URL (legacy + convenience) */
  imageUrl: string;
  /** Ordered gallery URLs (1–12); always non-empty in API responses */
  images: string[];
  goalAmount: number;
  raisedAmount: number;
  status: 'Published' | 'Draft' | 'Archived' | 'Done';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  recipientName: string;
  recipientNote: string;
  /** Present when API includes author relation */
  author?: {
    id: string;
    fullName: string;
    organization: { name: string; slug: string } | null;
  };
};

export type ApiComment = {
  id: string;
  author: string;
  body: string;
  status: 'visible' | 'pending' | 'rejected';
  createdAt: string;
};

export type ApiDonor = {
  id: string;
  name: string;
  amount: number;
  verification: 'verified' | 'pending' | 'rejected';
  date: string;
};

function lifecycleToStatus(s: CampaignLifecycleStatus): ApiCampaign['status'] {
  const m: Record<CampaignLifecycleStatus, ApiCampaign['status']> = {
    DRAFT: 'Draft',
    PUBLISHED: 'Published',
    ARCHIVED: 'Archived',
    DONE: 'Done',
  };
  return m[s];
}

function galleryUrls(c: Campaign): string[] {
  if (c.imageUrls?.length) return [...c.imageUrls];
  return [c.imageUrl];
}

type CampaignWithAuthorOpt = Campaign & {
  author?: {
    id: string;
    fullName: string;
    organization: { name: string; slug: string } | null;
  } | null;
};

export function mapCampaign(c: CampaignWithAuthorOpt): ApiCampaign {
  const images = galleryUrls(c);
  const author =
    c.author && typeof c.author === 'object'
      ? {
          id: c.author.id,
          fullName: c.author.fullName,
          organization: c.author.organization
            ? { name: c.author.organization.name, slug: c.author.organization.slug }
            : null,
        }
      : undefined;
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    imageUrl: images[0] ?? c.imageUrl,
    images,
    goalAmount: c.goalAmount,
    raisedAmount: c.raisedAmount,
    status: lifecycleToStatus(c.lifecycleStatus),
    approvalStatus: c.approvalStatus.toLowerCase() as ApiCampaign['approvalStatus'],
    recipientName: c.recipientName,
    recipientNote: c.recipientNote,
    ...(author ? { author } : {}),
  };
}

export function mapComment(c: Comment & { author?: User | null }): ApiComment {
  const st = c.moderationStatus.toLowerCase() as ApiComment['status'];
  return {
    id: c.id,
    author: c.author?.fullName ?? 'User',
    body: c.body,
    status: st,
    createdAt: c.createdAt.toISOString(),
  };
}

export function mapDonation(d: Donation): ApiDonor {
  const v = d.verificationStatus.toLowerCase() as ApiDonor['verification'];
  return {
    id: d.id,
    name: d.donorDisplayName,
    amount: d.amount,
    verification: v === 'verified' ? 'verified' : v === 'rejected' ? 'rejected' : 'pending',
    date: d.createdAt.toISOString(),
  };
}
