import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { initiateFlutterwavePayment } from "@/lib/flutterwave";
import { z } from "zod";
import { TipStatus } from "@/lib/tips";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const initiateSchema = z.object({
  slug: z.string().min(1, "Creator slug is required"),
  tipperName: z.string().optional(),
  tipperEmail: z.string().email("Invalid email address"),
  amount: z.number().min(100, "Minimum tip amount is 100 NGN"),
  message: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    // 0. Rate Limiting (5 requests per minute)
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for") || "unknown";
    const limiter = rateLimit(`initiate_${ip}`, 5, 60 * 1000);
    
    if (!limiter.isAllowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429 }
      );
    }

    const body = await req.json();
    
    // 1. Validate input data
    const validation = initiateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { slug, tipperName, tipperEmail, amount, message } = validation.data;

    const creator = await prisma.user.findUnique({ where: { slug } });
    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      );
    }

    const txRef = `tip_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    const origin = req.headers.get("origin") || req.headers.get("host") || "http://localhost:3000";
    const baseUrl = origin.startsWith("http") ? origin : `http://${origin}`;
    const redirectUrl = `${baseUrl}/tip/${slug}/success?tx_ref=${txRef}`;

    const payment = await initiateFlutterwavePayment({
      amount,
      email: tipperEmail,
      name: tipperName,
      txRef,
      redirectUrl,
    });

    if (payment.status !== "success") {
      return NextResponse.json(
        { error: "Payment initiation failed" },
        { status: 500 }
      );
    }

    await prisma.tip.create({
      data: {
        creatorId: creator.id,
        tipperName: tipperName || null,
        tipperEmail,
        amount: Math.round(amount * 100),
        message: message || null,
        flutterwaveTxRef: txRef,
        status: TipStatus.PENDING,
      },
    });

    return NextResponse.json({
      paymentLink: payment.data.link,
      txRef,
    });
  } catch (error) {
    console.error("Tip initiate error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
