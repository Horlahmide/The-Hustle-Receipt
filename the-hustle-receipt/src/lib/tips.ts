import { prisma } from "@/lib/prisma";
import { verifyFlutterwaveTransaction } from "@/lib/flutterwave";

export const TipStatus = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  FAILED: "FAILED",
} as const;

export async function processTipVerification(txRef: string, source: "REDIRECT" | "WEBHOOK") {
  // 1. Find the tip in our database
  const tip = await prisma.tip.findUnique({
    where: { flutterwaveTxRef: txRef },
  });

  if (!tip) {
    throw new Error("Tip not found");
  }

  // 2. Idempotency check: If already verified, do nothing
  if (tip.status === TipStatus.VERIFIED) {
    return { status: "already_verified", tip };
  }

  // 3. Re-query Flutterwave for the ground truth
  const verification = await verifyFlutterwaveTransaction(txRef);

  if (
    verification.status !== "success" ||
    verification.data.status !== "successful"
  ) {
    await prisma.tip.update({
      where: { id: tip.id },
      data: { status: TipStatus.FAILED },
    });
    return { status: "failed", error: "Payment verification failed" };
  }

  // 3.5 Security Cross-Checks (Principle: Don't just trust the status)
  const paidAmountInCents = Math.round(verification.data.amount * 100);
  const expectedAmountInCents = tip.amount;

  if (paidAmountInCents !== expectedAmountInCents) {
    await prisma.tip.update({
      where: { id: tip.id },
      data: { status: TipStatus.FAILED },
    });
    return { 
      status: "failed", 
      error: `Amount mismatch. Expected ${expectedAmountInCents}, but got ${paidAmountInCents}` 
    };
  }

  if (verification.data.currency !== "NGN") {
    await prisma.tip.update({
      where: { id: tip.id },
      data: { status: TipStatus.FAILED },
    });
    return { status: "failed", error: "Currency mismatch. Only NGN is supported." };
  }

  // 4. Update the database atomically
  // We use the status check in the 'where' clause to prevent race conditions (Principle #2)
  const updatedTip = await prisma.tip.update({
    where: { 
      id: tip.id,
      status: TipStatus.PENDING // Only update if it's still pending
    },
    data: {
      status: TipStatus.VERIFIED,
      flutterwaveTxId: verification.data.id,
      amount: Math.round(verification.data.amount * 100), // Store in cents/kobo
      verifiedAt: new Date(),
      verificationSource: source,
    },
  });

  return { status: "success", tip: updatedTip };
}

/**
 * Marks PENDING tips older than 24 hours as FAILED to keep the database clean.
 * This should be triggered by a cron job or admin action.
 */
export async function cleanupStaleTips() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const result = await prisma.tip.updateMany({
    where: {
      status: TipStatus.PENDING,
      createdAt: {
        lt: twentyFourHoursAgo,
      },
    },
    data: {
      status: TipStatus.FAILED,
    },
  });

  return result.count;
}
