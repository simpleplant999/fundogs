import type { Campaign, Comment, Donor } from "./types";

export const campaigns: Campaign[] = [
  {
    id: "1",
    slug: "global-rescue-flight-manila",
    title: "Emergency flight for 12 rescued dogs",
    description:
      "International rescue bringing abused dogs from overseas to rehabilitation in Manila before local forever homes. Covers crates, vet checks, and transport.",
    imageUrl:
      "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80",
      "https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&q=80",
    ],
    goalAmount: 450000,
    raisedAmount: 287500,
    campaignType: 'rescue_transport',
    status: "Published",
    approvalStatus: "approved",
    recipientName: "FunDogs Rescue Operations",
    recipientNote:
      "Deposits are reconciled manually. Please keep your branch receipt and tracking number.",
  },
  {
    id: "2",
    slug: "cebu-shelter-medical-fund",
    title: "Cebu shelter medical & spay/neuter drive",
    description:
      "Community-supported shelter expanding veterinary capacity for incoming rescues and local rehoming support.",
    imageUrl:
      "https://images.unsplash.com/photo-1548199973-03cce0f87e55?w=800&q=80",
    goalAmount: 180000,
    raisedAmount: 180000,
    campaignType: 'spay_neuter_tnr',
    status: "Done",
    approvalStatus: "approved",
    recipientName: "Cebu Paws Collective",
    recipientNote: "Milestone reached — funds released per campaign terms.",
  },
  {
    id: "3",
    slug: "community-food-program",
    title: "Quarterly food support for foster network",
    description:
      "Keeps foster families stocked while animals await adoption. Transparent reporting monthly.",
    imageUrl:
      "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80",
    goalAmount: 95000,
    raisedAmount: 41200,
    campaignType: 'shelter_daily_care',
    status: "Published",
    approvalStatus: "approved",
    recipientName: "FunDogs Community Programs",
    recipientNote: "Use your bank’s reference field for the fundraising ID when possible.",
  },
  {
    id: "4",
    slug: "internal-draft-example",
    title: "Draft: New intake center (not public)",
    description: "Shown to demonstrate Draft status in admin views.",
    imageUrl:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&q=80",
    goalAmount: 600000,
    raisedAmount: 0,
    campaignType: 'other',
    status: "Draft",
    approvalStatus: "pending",
    recipientName: "—",
    recipientNote: "—",
  },
];

export const donorsBySlug: Record<string, Donor[]> = {
  "global-rescue-flight-manila": [
    {
      id: "d1",
      name: "Ana R.",
      amount: 5000,
      verification: "verified",
      date: "2026-05-02",
    },
    {
      id: "d2",
      name: "Miguel T.",
      amount: 12000,
      verification: "verified",
      date: "2026-05-04",
    },
    {
      id: "d3",
      name: "Community Circle",
      amount: 25000,
      verification: "pending",
      date: "2026-05-10",
    },
  ],
  "cebu-shelter-medical-fund": [
    {
      id: "d4",
      name: "J. Santos",
      amount: 15000,
      verification: "verified",
      date: "2026-04-18",
    },
    {
      id: "d5",
      name: "Barkada Giveback",
      amount: 45000,
      verification: "verified",
      date: "2026-04-22",
    },
  ],
  "community-food-program": [
    {
      id: "d6",
      name: "L. Cruz",
      amount: 3000,
      verification: "verified",
      date: "2026-05-08",
    },
  ],
};

export const commentsBySlug: Record<string, Comment[]> = {
  "global-rescue-flight-manila": [
    {
      id: "c1",
      author: "Volunteer Marco",
      body: "Sharing with my running group — the transparency here makes it easy to trust the process.",
      status: "visible",
      createdAt: "2026-05-03T10:00:00",
    },
    {
      id: "c2",
      author: "New supporter",
      body: "Can we sponsor a single crate? (pending moderator review)",
      status: "pending",
      createdAt: "2026-05-11T14:20:00",
    },
  ],
};

export function getCampaignBySlug(slug: string): Campaign | undefined {
  return campaigns.find((c) => c.slug === slug);
}

export function getPublishedAndDoneCampaigns(): Campaign[] {
  return campaigns.filter(
    (c) => c.status === "Published" || c.status === "Done",
  );
}

export function getDonorsForCampaign(slug: string): Donor[] {
  return donorsBySlug[slug] ?? [];
}

export function getCommentsForCampaign(slug: string): Comment[] {
  return commentsBySlug[slug] ?? [];
}
