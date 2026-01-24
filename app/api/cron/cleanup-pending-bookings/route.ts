import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/cron/cleanup-pending-bookings
 *
 * Cron job to clean up expired pending bookings.
 * Implements Security Observation #4: Limpieza de Bookings PENDING Expirados.
 *
 * Vercel Cron Configuration (add to vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-pending-bookings",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  // Verify cron secret from Authorization header
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
    // Cancel bookings that have been pending for more than 2 hours
    const TWO_HOURS_AGO = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const result = await prisma.booking.updateMany({
      where: {
        paymentStatus: "PENDING",
        createdAt: { lt: TWO_HOURS_AGO },
      },
      data: {
        status: "CANCELLED",
        paymentStatus: null, // Clear payment status
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
