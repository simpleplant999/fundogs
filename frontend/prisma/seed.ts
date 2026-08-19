import {
  CampaignApprovalStatus,
  CampaignLifecycleStatus,
  CampaignType,
  CommentModerationStatus,
  DonationVerificationStatus,
  Prisma,
  PrismaClient,
  UserRole,
} from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@fundogs.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
  const adminName = process.env.ADMIN_NAME ?? "Site Admin";

  const adminHash = await bcrypt.hash(adminPassword, 10);
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: adminHash,
        fullName: adminName,
        role: UserRole.ADMIN,
      },
    });
    console.log("Created admin:", adminEmail);
  }

  const demoEmail = "demo@fundogs.local";
  const demoPass = "demo123";
  let demo = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!demo) {
    demo = await prisma.user.create({
      data: {
        email: demoEmail,
        passwordHash: await bcrypt.hash(demoPass, 10),
        fullName: "Demo Supporter",
        role: UserRole.USER,
      },
    });
    console.log("Created demo user:", demoEmail, "/", demoPass);
  }

  const platform = await prisma.campaign.findUnique({
    where: { slug: "fundogs-platform-support" },
  });
  if (!platform) {
    await prisma.campaign.create({
      data: {
        slug: "fundogs-platform-support",
        title: "FunDogs platform support",
        description:
          "Contributions that keep FunDogs online and help us reach more animals in need.",
        imageUrl:
          "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80",
        goalAmount: 1_000_000,
        raisedAmount: 0,
        lifecycleStatus: CampaignLifecycleStatus.PUBLISHED,
        approvalStatus: CampaignApprovalStatus.APPROVED,
        recipientName: "FunDogs",
        recipientNote: "Platform operations and animal rescue support.",
        authorId: admin.id,
        campaignType: CampaignType.OTHER,
      },
    });
  }

  const demoCampaigns: Prisma.CampaignUncheckedCreateInput[] = [
    {
      slug: "global-rescue-flight-manila",
      title: "Emergency flight for 12 rescued dogs",
      description:
        "International rescue bringing abused dogs from overseas to rehabilitation in Manila before local forever homes. Covers crates, vet checks, and transport.",
      imageUrl:
        "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80",
      imageUrls: [
        "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80",
        "https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&q=80",
      ],
      goalAmount: 450000,
      raisedAmount: 287500,
      lifecycleStatus: CampaignLifecycleStatus.PUBLISHED,
      approvalStatus: CampaignApprovalStatus.APPROVED,
      recipientName: "FunDogs Rescue Operations",
      recipientNote:
        "Deposits are reconciled manually. Please keep your branch receipt and tracking number.",
      authorId: admin.id,
      campaignType: CampaignType.RESCUE_TRANSPORT,
    },
    {
      slug: "cebu-shelter-medical-fund",
      title: "Cebu shelter medical & spay/neuter drive",
      description:
        "Community-supported shelter expanding veterinary capacity for incoming rescues and local rehoming support.",
      imageUrl:
        "https://images.unsplash.com/photo-1548199973-03cce0f87e55?w=800&q=80",
      imageUrls: [],
      goalAmount: 180000,
      raisedAmount: 180000,
      lifecycleStatus: CampaignLifecycleStatus.DONE,
      approvalStatus: CampaignApprovalStatus.APPROVED,
      recipientName: "Cebu Paws Collective",
      recipientNote: "Milestone reached — funds released per campaign terms.",
      authorId: admin.id,
      campaignType: CampaignType.SPAY_NEUTER_TNR,
    },
    {
      slug: "community-food-program",
      title: "Quarterly food support for foster network",
      description:
        "Keeps foster families stocked while animals await adoption. Transparent reporting monthly.",
      imageUrl:
        "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80",
      imageUrls: [],
      goalAmount: 95000,
      raisedAmount: 41200,
      lifecycleStatus: CampaignLifecycleStatus.PUBLISHED,
      approvalStatus: CampaignApprovalStatus.APPROVED,
      recipientName: "FunDogs Community Programs",
      recipientNote:
        "Use your bank’s reference field for the fundraising ID when possible.",
      authorId: admin.id,
      campaignType: CampaignType.SHELTER_DAILY_CARE,
    },
  ];

  const createdIds: Record<string, string> = {};
  for (const data of demoCampaigns) {
    const existing = await prisma.campaign.findUnique({ where: { slug: data.slug } });
    if (existing) {
      createdIds[data.slug] = existing.id;
      console.log("Demo campaign already exists:", data.slug);
      continue;
    }
    const row = await prisma.campaign.create({ data: { ...data } });
    createdIds[data.slug] = row.id;
    console.log("Created demo campaign:", data.slug);
  }

  const draft = await prisma.campaign.findUnique({
    where: { slug: "internal-draft-example" },
  });
  if (!draft) {
    await prisma.campaign.create({
      data: {
        slug: "internal-draft-example",
        title: "Draft: New intake center (not public)",
        description: "Shown to demonstrate Draft status in admin views.",
        imageUrl:
          "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&q=80",
        goalAmount: 600000,
        raisedAmount: 0,
        lifecycleStatus: CampaignLifecycleStatus.DRAFT,
        approvalStatus: CampaignApprovalStatus.PENDING,
        recipientName: "—",
        recipientNote: "—",
        authorId: demo.id,
        campaignType: CampaignType.OTHER,
      },
    });
  } else if (
    draft.approvalStatus === CampaignApprovalStatus.APPROVED &&
    draft.title.startsWith("Draft:")
  ) {
    // Keep demo draft out of the public list if it was accidentally approved.
    await prisma.campaign.update({
      where: { id: draft.id },
      data: {
        lifecycleStatus: CampaignLifecycleStatus.DRAFT,
        approvalStatus: CampaignApprovalStatus.PENDING,
      },
    });
    console.log("Reset internal-draft-example to pending draft");
  }

  const c1Id = createdIds["global-rescue-flight-manila"];
  if (c1Id) {
    const commentCount = await prisma.comment.count({ where: { campaignId: c1Id } });
    if (commentCount === 0) {
      await prisma.comment.createMany({
        data: [
          {
            campaignId: c1Id,
            authorId: demo.id,
            body: "Sharing with my running group — the transparency here makes it easy to trust the process.",
            moderationStatus: CommentModerationStatus.VISIBLE,
          },
          {
            campaignId: c1Id,
            authorId: demo.id,
            body: "Can we sponsor a single crate? (pending moderator review)",
            moderationStatus: CommentModerationStatus.PENDING,
          },
        ],
      });
    }
  }

  for (const [slug, donations] of [
    [
      "global-rescue-flight-manila",
      [
        { donorDisplayName: "Ana R.", amount: 5000, verificationStatus: DonationVerificationStatus.VERIFIED },
        { donorDisplayName: "Miguel T.", amount: 12000, verificationStatus: DonationVerificationStatus.VERIFIED },
        { donorDisplayName: "Community Circle", amount: 25000, verificationStatus: DonationVerificationStatus.PENDING },
      ],
    ],
    [
      "cebu-shelter-medical-fund",
      [
        { donorDisplayName: "J. Santos", amount: 15000, verificationStatus: DonationVerificationStatus.VERIFIED },
        { donorDisplayName: "Barkada Giveback", amount: 45000, verificationStatus: DonationVerificationStatus.VERIFIED },
      ],
    ],
    [
      "community-food-program",
      [{ donorDisplayName: "L. Cruz", amount: 3000, verificationStatus: DonationVerificationStatus.VERIFIED }],
    ],
  ] as const) {
    const campaignId = createdIds[slug];
    if (!campaignId) continue;
    const donationCount = await prisma.donation.count({ where: { campaignId } });
    if (donationCount > 0) continue;
    // MongoDB unique indexes on optional payment ids reject multiple omitted/null values.
    // Skip demo donors if that constraint blocks inserts; campaigns themselves are enough for UI.
    try {
      for (const d of donations) {
        await prisma.donation.create({
          data: {
            campaignId,
            donorDisplayName: d.donorDisplayName,
            amount: d.amount,
            verificationStatus: d.verificationStatus,
          },
        });
      }
    } catch (e) {
      console.warn("Skipping demo donations for", slug, "-", e instanceof Error ? e.message : e);
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
