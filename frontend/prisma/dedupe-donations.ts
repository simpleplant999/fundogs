/**
 * One-shot: remove duplicate PayMongo/Stripe donations (same payment id)
 * and recompute campaign raisedAmount from remaining verified donations.
 *
 *   cd frontend && npx tsx prisma/dedupe-donations.ts
 */
import { DonationVerificationStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function dedupeByField(
  field: "paymongoPaymentIntentId" | "stripePaymentIntentId" | "stripeCheckoutSessionId",
) {
  const rows = await prisma.donation.findMany({
    where: { [field]: { not: null } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      amount: true,
      campaignId: true,
      createdAt: true,
      [field]: true,
    },
  });

  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = row[field];
    if (typeof key !== "string" || !key.trim()) continue;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  let removed = 0;
  for (const [key, list] of groups) {
    if (list.length < 2) continue;
    const [, ...dupes] = list;
    console.log(`  ${field}=${key}: keeping ${list[0].id}, deleting ${dupes.length} duplicate(s)`);
    for (const d of dupes) {
      await prisma.donation.delete({ where: { id: d.id } });
      removed += 1;
    }
  }
  return removed;
}

async function recomputeRaised() {
  const campaigns = await prisma.campaign.findMany({ select: { id: true, slug: true } });
  for (const c of campaigns) {
    const agg = await prisma.donation.aggregate({
      where: {
        campaignId: c.id,
        verificationStatus: DonationVerificationStatus.VERIFIED,
      },
      _sum: { amount: true },
    });
    const raised = agg._sum.amount ?? 0;
    await prisma.campaign.update({
      where: { id: c.id },
      data: { raisedAmount: raised },
    });
    console.log(`  ${c.slug}: raisedAmount → ${raised}`);
  }
}

async function backfillIdempotencyKeys() {
  const paymongo = await prisma.donation.findMany({
    where: { paymongoPaymentIntentId: { not: null } },
    select: { paymongoPaymentIntentId: true },
  });
  let n = 0;
  for (const d of paymongo) {
    const id = d.paymongoPaymentIntentId;
    if (!id) continue;
    try {
      await prisma.paymentIdempotencyKey.create({ data: { id: `paymongo:${id}` } });
      n += 1;
    } catch {
      /* already claimed */
    }
  }
  console.log(`  claimed ${n} new paymongo keys (of ${paymongo.length})`);
}

async function main() {
  console.log("Deduping by paymongoPaymentIntentId…");
  const a = await dedupeByField("paymongoPaymentIntentId");
  console.log("Deduping by stripePaymentIntentId…");
  const b = await dedupeByField("stripePaymentIntentId");
  console.log("Deduping by stripeCheckoutSessionId…");
  const c = await dedupeByField("stripeCheckoutSessionId");
  console.log(`Removed ${a + b + c} duplicate donation(s).`);

  console.log("Recomputing campaign raisedAmount…");
  await recomputeRaised();

  console.log("Backfilling payment idempotency keys…");
  await backfillIdempotencyKeys();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
