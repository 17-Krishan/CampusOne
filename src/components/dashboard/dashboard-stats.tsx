"use client";

import {
  CalendarCheck,
  FileText,
  Zap,
  Briefcase,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatPercentage } from "@/lib/utils";
import type { PlacementStatus } from "@/types";

interface DashboardStatsProps {
  avgAttendance: number;
  pendingAssignments: number;
  avgQuizScore: number;
  placementStatus: PlacementStatus;
}

export function DashboardStats({
  avgAttendance,
  pendingAssignments,
  avgQuizScore,
  placementStatus,
}: DashboardStatsProps) {
  const placementLabel: Record<PlacementStatus, string> = {
    NOT_STARTED: "Not Started",
    IN_PROGRESS: "In Progress",
    PLACED: "Placed 🎉",
    NOT_PLACED: "Not Placed",
  };

  const stats = [
    {
      label: "Avg. Attendance",
      value: avgAttendance > 0 ? formatPercentage(avgAttendance) : "—",
      icon: CalendarCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      trend:
        avgAttendance >= 75
          ? { label: "Above threshold", positive: true }
          : avgAttendance > 0
          ? { label: "Below 75%", positive: false }
          : null,
    },
    {
      label: "Pending Tasks",
      value: pendingAssignments.toString(),
      icon: FileText,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      trend:
        pendingAssignments === 0
          ? { label: "All done!", positive: true }
          : pendingAssignments <= 2
          ? { label: "Almost clear", positive: true }
          : { label: "Action needed", positive: false },
    },
    {
      label: "Avg. Quiz Score",
      value: avgQuizScore > 0 ? formatPercentage(avgQuizScore) : "—",
      icon: Zap,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      trend:
        avgQuizScore >= 70
          ? { label: "Good performance", positive: true }
          : avgQuizScore > 0
          ? { label: "Keep practising", positive: false }
          : null,
    },
    {
      label: "Placement Status",
      value: placementLabel[placementStatus],
      icon: Briefcase,
      color: "text-brand-500",
      bg: "bg-brand-500/10",
      trend:
        placementStatus === "PLACED"
          ? { label: "Congratulations!", positive: true }
          : placementStatus === "IN_PROGRESS"
          ? { label: "Keep going", positive: true }
          : null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="hover:shadow-md transition-shadow duration-200"
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  stat.bg
                )}
              >
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              {stat.trend && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-[11px] font-medium",
                    stat.trend.positive ? "text-emerald-500" : "text-red-500"
                  )}
                >
                  {stat.trend.positive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                </span>
              )}
            </div>
            <p className="text-2xl font-display font-bold tracking-tight">
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            {stat.trend && (
              <p
                className={cn(
                  "text-[11px] mt-1 font-medium",
                  stat.trend.positive ? "text-emerald-500" : "text-red-500"
                )}
              >
                {stat.trend.label}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}