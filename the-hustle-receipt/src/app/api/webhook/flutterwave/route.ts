import { NextResponse } from "next/server";
import { processTipVerification } from "@/lib/tips";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Signature Verification (First line of defense)
    const signature = req.headers.get("verif-hash");
    const secretHash = process.env.FLW_SECRET_HASH;

    if (!signature || signature !== secretHash) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Extract transaction details
    const payload = await req.json();
    const txRef = payload["txRef"] || payload["tx_ref"]; // Flutterwave uses both sometimes

    if (!txRef) {
      return NextResponse.json({ error: "No reference found" }, { status: 400 });
    }

    // 3. Process the verification (Handles DB check, re-query, and idempotency)
    // We don't await this if we want to respond fast, but for simple logic, awaiting is safer.
    await processTipVerification(txRef, "WEBHOOK");

    // 4. Always respond with 200 OK to acknowledge receipt
    return NextResponse.json({ status: "acknowledged" });
  } catch (error) {
    console.error("Webhook error:", error);
    // Still return 200 to stop retries if it's a structural error, 
    // but maybe 500 if it's a temporary DB failure.
    return NextResponse.json({ error: "Webhook failed" }, { status: 200 });
  }
}
