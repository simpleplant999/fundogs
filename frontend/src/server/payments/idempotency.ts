import { prisma } from "../db";
import { isPrismaUniqueConflict } from "../prisma-errors";

/**
 * Atomically claim a payment id so webhook + client sync cannot both record it.
 * Returns false if already claimed.
 */
export async function claimPaymentIdempotency(key: string): Promise<boolean> {
  try {
    await prisma.paymentIdempotencyKey.create({ data: { id: key } });
    return true;
  } catch (e) {
    if (isPrismaUniqueConflict(e)) return false;
    throw e;
  }
}

export async function releasePaymentIdempotency(key: string): Promise<void> {
  await prisma.paymentIdempotencyKey.delete({ where: { id: key } }).catch(() => undefined);
}
