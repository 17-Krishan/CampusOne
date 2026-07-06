import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { AttendanceClient } from "@/components/academic/attendance-client";
import {
  calculateAttendancePercentage,
  calculateSafeBunks,
  getAttendanceStatus,
} from "@/lib/utils";
import type { AttendanceStats } from "@/types";

export const metadata: Metadata = { title: "Attendance" };

export default async function AttendancePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: { profile: true },
  });

  if (!user) redirect("/login");

  // Fetch all subjects (would normally be scoped to student's branch/semester)
  const subjects = await prisma.subject.findMany({
    where: user.profile?.branch
      ? { branch: user.profile.branch }
      : undefined,
    orderBy: { name: "asc" },
  });

  // Fetch all attendance records for this user
  const attendanceRecords = await prisma.attendance.findMany({
    where: { userId: user.id },
    include: { subject: true },
    orderBy: { date: "desc" },
  });

  // Build stats per subject
  const statsMap = new Map<
    string,
    {
      subject: (typeof subjects)[0];
      total: number;
      attended: number;
      records: typeof attendanceRecords;
    }
  >();

  // Initialize with all subjects
  for (const subject of subjects) {
    statsMap.set(subject.id, {
      subject,
      total: 0,
      attended: 0,
      records: [],
    });
  }

  // Populate from records
  for (const record of attendanceRecords) {
    const entry = statsMap.get(record.subjectId);
    if (entry) {
      entry.total += 1;
      if (record.status === "PRESENT" || record.status === "LATE") {
        entry.attended += 1;
      }
      entry.records.push(record);
    } else {
      // Subject not in current list — still show it
      statsMap.set(record.subjectId, {
        subject: record.subject,
        total: 1,
        attended:
          record.status === "PRESENT" || record.status === "LATE" ? 1 : 0,
        records: [record],
      });
    }
  }

  const attendanceStats: AttendanceStats[] = Array.from(statsMap.values())
    .filter((s) => s.total > 0 || subjects.some((sub) => sub.id === s.subject.id))
    .map(({ subject, total, attended }) => {
      const percentage = calculateAttendancePercentage(attended, total);
      return {
        subject,
        totalClasses: total,
        attendedClasses: attended,
        percentage,
        safeBunks: calculateSafeBunks(attended, total),
        status: getAttendanceStatus(percentage),
      };
    });

  return (
    <AttendanceClient
      initialStats={attendanceStats}
      subjects={subjects}
      userId={user.id}
      recentRecords={attendanceRecords.slice(0, 30)}
    />
  );
}