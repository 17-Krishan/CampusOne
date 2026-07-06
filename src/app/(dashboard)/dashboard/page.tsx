import { Suspense } from "react";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { AttendanceOverview } from "@/components/dashboard/attendance-overview";
import { UpcomingAssignments } from "@/components/dashboard/upcoming-assignments";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { AIInsightBanner } from "@/components/dashboard/ai-insight-banner";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Skeleton } from "@/components/ui/skeleton";
import {
  calculateAttendancePercentage,
  calculateSafeBunks,
  getAttendanceStatus,
} from "@/lib/utils";
import type { AttendanceStats } from "@/types";

export const metadata: Metadata = { title: "Dashboard" };

async function getDashboardData(userId: string) {
  const [
    attendanceData,
    assignments,
    events,
    notifications,
    quizAttempts,
    placement,
  ] = await Promise.all([
    // Attendance grouped by subject
    prisma.attendance.findMany({
      where: { userId },
      include: { subject: true },
      orderBy: { date: "desc" },
    }),
    // Upcoming assignments (next 7 days)
    prisma.assignment.findMany({
      where: {
        assignedTo: { some: { id: userId } },
        dueDate: { gte: new Date() },
      },
      include: {
        subject: true,
        submissions: { where: { userId } },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    // Upcoming events
    prisma.event.findMany({
      where: { startDate: { gte: new Date() }, isPublic: true },
      include: {
        club: true,
        registrations: { where: { userId } },
        _count: { select: { registrations: true } },
      },
      orderBy: { startDate: "asc" },
      take: 4,
    }),
    // Unread notifications
    prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // Recent quiz attempts
    prisma.quizAttempt.findMany({
      where: { userId },
      include: { quiz: true },
      orderBy: { completedAt: "desc" },
      take: 5,
    }),
    // Placement status
    prisma.placement.findUnique({
      where: { userId },
    }),
  ]);

  // Compute per-subject attendance stats
  const subjectMap = new Map<string, { subject: typeof attendanceData[0]["subject"]; total: number; attended: number }>();
  for (const record of attendanceData) {
    const existing = subjectMap.get(record.subjectId);
    if (existing) {
      existing.total += 1;
      if (record.status === "PRESENT" || record.status === "LATE") {
        existing.attended += 1;
      }
    } else {
      subjectMap.set(record.subjectId, {
        subject: record.subject,
        total: 1,
        attended: record.status === "PRESENT" || record.status === "LATE" ? 1 : 0,
      });
    }
  }

  const attendanceStats: AttendanceStats[] = Array.from(subjectMap.values()).map(
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

  const avgAttendance =
    attendanceStats.length > 0
      ? attendanceStats.reduce((sum, s) => sum + s.percentage, 0) /
        attendanceStats.length
      : 0;

  const avgQuizScore =
    quizAttempts.length > 0
      ? quizAttempts.reduce(
          (sum, a) => sum + (a.score / a.totalMarks) * 100,
          0
        ) / quizAttempts.length
      : 0;

  return {
    attendanceStats,
    avgAttendance,
    assignments,
    events,
    notifications,
    quizAttempts,
    avgQuizScore,
    placement,
  };
}

export default async function DashboardPage() {
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

  const data = await getDashboardData(user.id);
  const firstName = user.profile?.firstName ?? "Student";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">
            Good {getGreeting()},{" "}
            <span className="gradient-text">{firstName}</span> 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Here&apos;s what&apos;s happening on your campus today.
          </p>
        </div>
      </div>

      {/* AI Insight Banner */}
      <Suspense fallback={<Skeleton className="h-16 w-full rounded-2xl" />}>
        <AIInsightBanner
          attendanceStats={data.attendanceStats}
          avgAttendance={data.avgAttendance}
          assignments={data.assignments}
        />
      </Suspense>

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats row */}
      <DashboardStats
        avgAttendance={data.avgAttendance}
        pendingAssignments={data.assignments.filter(
          (a) => a.submissions.length === 0
        ).length}
        avgQuizScore={data.avgQuizScore}
        placementStatus={data.placement?.status ?? "NOT_STARTED"}
      />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
            <AttendanceOverview stats={data.attendanceStats} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-48 w-full rounded-2xl" />}>
            <UpcomingAssignments assignments={data.assignments} />
          </Suspense>
        </div>

        {/* Right col — 1/3 */}
        <div className="space-y-6">
          <Suspense fallback={<Skeleton className="h-48 w-full rounded-2xl" />}>
            <UpcomingEvents events={data.events} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-48 w-full rounded-2xl" />}>
            <RecentActivity quizAttempts={data.quizAttempts} notifications={data.notifications} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}