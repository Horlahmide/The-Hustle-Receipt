import { NextResponse } from "next/server";
import { processTipVerification } from "@/lib/tips";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 0. Rate Limiting (10 requests per minute)
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for") || "unknown";
    const limiter = rateLimit(`verify_${ip}`, 10, 60 * 1000);
    
    if (!limiter.isAllowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429 }
      );
    }

    const { txRef } = await req.json();

    if (!txRef) {
      return NextResponse.json(
        { error: "Missing transaction reference" },
        { status: 400 }
      );
    }

    const result = await processTipVerification(txRef, "REDIRECT");

    if (result.status === "failed") {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: result.status === "already_verified" 
        ? "Payment already verified" 
        : "Payment verified successfully",
    });
  } catch (error: any) {
    console.error("Tip verify error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
