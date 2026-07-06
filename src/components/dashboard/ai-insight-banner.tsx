"use client";

import { Bot, X, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AttendanceStats, Assignment, Subject } from "@/types";

interface AIInsightBannerProps {
  attendanceStats: AttendanceStats[];
  avgAttendance: number;
  assignments: (Assignment & { subject: Subject })[];
}

export function AIInsightBanner({
  attendanceStats,
  avgAttendance,
  assignments,
}: AIInsightBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const insight = generateInsight(attendanceStats, avgAttendance, assignments);
  if (!insight) return null;

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-2xl border",
        "bg-gradient-to-r from-primary/5 via-violet-500/5 to-transparent",
        "border-primary/20"
      )}
    >
      {/* Icon */}
      <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
        <Bot className="w-4 h-4 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            AI Insight
          </span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{insight}</p>
      </div>

      {/* Dismiss */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground shrink-0"
        onClick={() => setDismissed(true)}
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

function generateInsight(
  stats: AttendanceStats[],
  avgAttendance: number,
  assignments: (Assignment & { subject: Subject })[]
): string | null {
  // Priority 1: danger attendance
  const dangerSubjects = stats.filter((s) => s.status === "DANGER");
  if (dangerSubjects.length > 0) {
    const names = dangerSubjects
      .map((s) => s.subject.name)
      .slice(0, 2)
      .join(", ");
    return `⚠️ Your attendance in ${names} is critically low. You need to attend the next several classes consecutively to recover. Consider speaking to your faculty.`;
  }

  // Priority 2: safe bunks
  const safeBunkSubject = stats
    .filter((s) => s.safeBunks > 0)
    .sort((a, b) => b.safeBunks - a.safeBunks)[0];
  if (safeBunkSubject) {
    return `✅ You can safely miss ${safeBunkSubject.safeBunks} more ${safeBunkSubject.subject.name} lecture${safeBunkSubject.safeBunks > 1 ? "s" : ""} and still maintain 75% attendance. Your overall average is ${avgAttendance.toFixed(1)}%.`;
  }

  // Priority 3: upcoming assignment due soon
  const urgentAssignment = assignments.find((a) => {
    const daysLeft =
      (new Date(a.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysLeft <= 2;
  });
  if (urgentAssignment) {
    return `📋 "${urgentAssignment.title}" (${urgentAssignment.subject.name}) is due very soon. Make sure you submit it on time to avoid an overdue penalty.`;
  }

  // Priority 4: generic positive
  if (avgAttendance >= 85) {
    return `🌟 Excellent! Your average attendance is ${avgAttendance.toFixed(1)}%. You're in great shape. Use today's free slots to review your notes or practice some quizzes.`;
  }

  return null;
}