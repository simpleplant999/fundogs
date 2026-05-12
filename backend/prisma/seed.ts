import {
  CampaignApprovalStatus,
  CampaignLifecycleStatus,
  CommentModerationStatus,
  DonationVerificationStatus,
  PrismaClient,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@fundogs.local';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';
  const adminName = process.env.ADMIN_NAME ?? 'Site Admin';

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
    console.log('Created admin:', adminEmail);
  }

  const demoEmail = 'demo@fundogs.local';
  const demoPass = 'demo123';
  let demo = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!demo) {
    demo = await prisma.user.create({
      data: {
        email: demoEmail,
        passwordHash: await bcrypt.hash(demoPass, 10),
        fullName: 'Demo Supporter',
        role: UserRole.USER,
      },
    });
    console.log('Created demo user:', demoEmail, '/', demoPass);
  }

  const existing = await prisma.campaign.count();
  if (existing > 0) {
    console.log('Campaigns already seeded, skipping.');
    return;
  }

  const c1 = await prisma.campaign.create({
    data: {
      slug: 'global-rescue-flight-manila',
      title: 'Emergency flight for 12 rescued dogs',
      description:
        'International rescue bringing abused dogs from overseas to rehabilitation in Manila before local forever homes. Covers crates, vet checks, and transport.',
      imageUrl:
        'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80',
      imageUrls: [
        'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80',
        'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&q=80',
      ],
      goalAmount: 450000,
      raisedAmount: 287500,
      lifecycleStatus: CampaignLifecycleStatus.PUBLISHED,
      approvalStatus: CampaignApprovalStatus.APPROVED,
      recipientName: 'FunDogs Rescue Operations',
      recipientNote:
        'Deposits are reconciled manually. Please keep your branch receipt and tracking number.',
      authorId: admin.id,
    },
  });

  const c2 = await prisma.campaign.create({
    data: {
      slug: 'cebu-shelter-medical-fund',
      title: 'Cebu shelter medical & spay/neuter drive',
      description:
        'Community-supported shelter expanding veterinary capacity for incoming rescues and local rehoming support.',
      imageUrl:
        'https://images.unsplash.com/photo-1548199973-03cce0f87e55?w=800&q=80',
      goalAmount: 180000,
      raisedAmount: 180000,
      lifecycleStatus: CampaignLifecycleStatus.DONE,
      approvalStatus: CampaignApprovalStatus.APPROVED,
      recipientName: 'Cebu Paws Collective',
      recipientNote: 'Milestone reached — funds released per campaign terms.',
      authorId: admin.id,
    },
  });

  const c3 = await prisma.campaign.create({
    data: {
      slug: 'community-food-program',
      title: 'Quarterly food support for foster network',
      description:
        'Keeps foster families stocked while animals await adoption. Transparent reporting monthly.',
      imageUrl:
        'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80',
      goalAmount: 95000,
      raisedAmount: 41200,
      lifecycleStatus: CampaignLifecycleStatus.PUBLISHED,
      approvalStatus: CampaignApprovalStatus.APPROVED,
      recipientName: 'FunDogs Community Programs',
      recipientNote:
        'Use your bank’s reference field for the fundraising ID when possible.',
      authorId: admin.id,
    },
  });

  await prisma.campaign.create({
    data: {
      slug: 'internal-draft-example',
      title: 'Draft: New intake center (not public)',
      description: 'Shown to demonstrate Draft status in admin views.',
      imageUrl:
        'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&q=80',
      goalAmount: 600000,
      raisedAmount: 0,
      lifecycleStatus: CampaignLifecycleStatus.DRAFT,
      approvalStatus: CampaignApprovalStatus.PENDING,
      recipientName: '—',
      recipientNote: '—',
      authorId: demo.id,
    },
  });

  await prisma.comment.createMany({
    data: [
      {
        campaignId: c1.id,
        authorId: demo.id,
        body: 'Sharing with my running group — the transparency here makes it easy to trust the process.',
        moderationStatus: CommentModerationStatus.VISIBLE,
      },
      {
        campaignId: c1.id,
        authorId: demo.id,
        body: 'Can we sponsor a single crate? (pending moderator review)',
        moderationStatus: CommentModerationStatus.PENDING,
      },
    ],
  });

  await prisma.donation.createMany({
    data: [
      {
        campaignId: c1.id,
        donorDisplayName: 'Ana R.',
        amount: 5000,
        verificationStatus: DonationVerificationStatus.VERIFIED,
      },
      {
        campaignId: c1.id,
        donorDisplayName: 'Miguel T.',
        amount: 12000,
        verificationStatus: DonationVerificationStatus.VERIFIED,
      },
      {
        campaignId: c1.id,
        donorDisplayName: 'Community Circle',
        amount: 25000,
        verificationStatus: DonationVerificationStatus.PENDING,
      },
      {
        campaignId: c2.id,
        donorDisplayName: 'J. Santos',
        amount: 15000,
        verificationStatus: DonationVerificationStatus.VERIFIED,
      },
      {
        campaignId: c2.id,
        donorDisplayName: 'Barkada Giveback',
        amount: 45000,
        verificationStatus: DonationVerificationStatus.VERIFIED,
      },
      {
        campaignId: c3.id,
        donorDisplayName: 'L. Cruz',
        amount: 3000,
        verificationStatus: DonationVerificationStatus.VERIFIED,
      },
    ],
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
