import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[Cron] CRON_SECRET not configured");
    return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error("[Cron] Unauthorized cron request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const TEN_MINUTES_AGO = new Date(Date.now() - 10 * 60 * 1000);

    const result = await prisma.booking.updateMany({
      where: {
        paymentStatus: "PENDING",
        createdAt: { lt: TEN_MINUTES_AGO },
      },
      data: {
        status: "CANCELLED",
        paymentStatus: null,
      },
    });

    console.log(`[Cron] Cleaned up ${result.count} expired pending bookings`);

    return NextResponse.json({
      success: true,
      cleanedUp: result.count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Error cleaning up pending bookings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
