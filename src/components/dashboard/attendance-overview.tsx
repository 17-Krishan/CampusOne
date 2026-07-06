"use client";

import Link from "next/link";
import { ArrowRight, CalendarCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  cn,
  formatPercentage,
  getAttendanceBgColor,
} from "@/lib/utils";
import type { AttendanceStats } from "@/types";

interface AttendanceOverviewProps {
  stats: AttendanceStats[];
}

export function AttendanceOverview({ stats }: AttendanceOverviewProps) {
  if (stats.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-primary" />
            Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <CalendarCheck className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">No attendance data yet</p>
            <p className="text-xs text-muted-foreground mb-4">
              Start marking attendance to see your stats here.
            </p>
            <Button size="sm" asChild>
              <Link href="/dashboard/academic/attendance">Mark Attendance</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort: danger first, then warning, then safe
  const sorted = [...stats].sort((a, b) => {
    const order = { DANGER: 0, WARNING: 1, SAFE: 2 };
    return order[a.status] - order[b.status];
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-primary" />
            Attendance
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
            <Link href="/dashboard/academic/attendance">
              View all
              <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sorted.map((stat) => (
          <div key={stat.subject.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium truncate">
                  {stat.subject.name}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {stat.subject.code}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-xs text-muted-foreground">
                  {stat.attendedClasses}/{stat.totalClasses}
                </span>
                <Badge
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 h-auto",
                    getAttendanceBgColor(stat.status)
                  )}
                >
                  {formatPercentage(stat.percentage, 0)}
                </Badge>
              </div>
            </div>
            <Progress
              value={stat.percentage}
              className="h-1.5"
              indicatorClassName={cn(
                stat.status === "SAFE" && "bg-emerald-500",
                stat.status === "WARNING" && "bg-amber-500",
                stat.status === "DANGER" && "bg-red-500"
              )}
            />
            {stat.safeBunks > 0 && (
              <p className="text-[11px] text-muted-foreground">
                ✓ Can safely miss{" "}
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {stat.safeBunks} more class{stat.safeBunks > 1 ? "es" : ""}
                </span>
              </p>
            )}
            {stat.status === "DANGER" && (
              <p className="text-[11px] text-red-500 font-medium">
                ⚠ Critical — attend all upcoming classes
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}