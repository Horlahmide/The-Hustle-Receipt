import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { TipStatus } from "@/lib/tips";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [tips, stats] = await prisma.$transaction([
    prisma.tip.findMany({
      where: {
        creatorId: user.id,
        status: TipStatus.VERIFIED,
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to recent 100 tips for performance
      select: {
        id: true,
        tipperName: true,
        tipperEmail: true,
        amount: true,
        message: true,
        createdAt: true,
      },
    }),
    prisma.tip.aggregate({
      where: {
        creatorId: user.id,
        status: TipStatus.VERIFIED,
      },
      _sum: {
        amount: true,
      },
      _count: true,
    }),
  ]);

  return NextResponse.json({
    tips,
    totalTips: stats._count,
    totalAmount: stats._sum.amount || 0,
  });
}
