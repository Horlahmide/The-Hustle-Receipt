import { NextResponse } from "next/server";
import { cleanupStaleTips } from "@/lib/tips";

export async function POST(req: Request) {
  try {
    // 1. Simple Security Check
    // In production, you'd use a secret header or a Cron-specific token
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Perform Cleanup
    const cleanedCount = await cleanupStaleTips();

    return NextResponse.json({ 
      status: "success", 
      message: `Cleaned up ${cleanedCount} stale tips.` 
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
