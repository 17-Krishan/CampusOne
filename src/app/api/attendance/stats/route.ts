import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import {
  calculateAttendancePercentage,
  calculateSafeBunks,
  getAttendanceStatus,
} from "@/lib/utils";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const records = await prisma.attendance.findMany({
      where: { userId: user.id },
      include: { subject: true },
    });

    const statsMap = new Map<
      string,
      { subject: (typeof records)[0]["subject"]; total: number; attended: number }
    >();

    for (const record of records) {
      const existing = statsMap.get(record.subjectId);
      if (existing) {
        existing.total += 1;
        if (record.status === "PRESENT" || record.status === "LATE") {
          existing.attended += 1;
        }
      } else {
        statsMap.set(record.subjectId, {
          subject: record.subject,
          total: 1,
          attended:
            record.status === "PRESENT" || record.status === "LATE" ? 1 : 0,
        });
      }
    }

    const stats = Array.from(statsMap.values()).map(
      ({ subject, total, attended }) => {
        const percentage = calculateAttendancePercentage(attended, total);
        return {
          subject,
          totalClasses: total,
          attendedClasses: attended,
          percentage,
          safeBunks: calculateSafeBunks(attended, total),
          status: getAttendanceStatus(percentage),
        };
      }
    );

    return NextResponse.json({ data: stats });
  } catch (err) {
    console.error("[GET /api/attendance/stats]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}