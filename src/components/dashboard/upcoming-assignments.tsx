"use client";

import Link from "next/link";
import { ArrowRight, FileText, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { format, formatDistanceToNow, isPast, differenceInDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, getPriorityColor } from "@/lib/utils";
import type { Assignment, AssignmentSubmission, Subject } from "@/types";

interface UpcomingAssignmentsProps {
  assignments: (Assignment & {
    subject: Subject;
    submissions: AssignmentSubmission[];
  })[];
}

export function UpcomingAssignments({ assignments }: UpcomingAssignmentsProps) {
  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs text-muted-foreground mt-1">
              No upcoming assignments right now.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Assignments
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
            <Link href="/dashboard/academic/assignments">
              View all
              <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {assignments.map((assignment) => {
          const dueDate = new Date(assignment.dueDate);
          const isSubmitted = assignment.submissions.length > 0;
          const isOverdue = isPast(dueDate) && !isSubmitted;
          const daysLeft = differenceInDays(dueDate, new Date());
          const isUrgent = daysLeft <= 1 && !isSubmitted;

          return (
            <Link
              key={assignment.id}
              href="/dashboard/academic/assignments"
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all",
                "hover:border-primary/30 hover:bg-accent/50",
                isOverdue
                  ? "border-red-200 bg-red-500/5 dark:border-red-800"
                  : isUrgent
                  ? "border-amber-200 bg-amber-500/5 dark:border-amber-800"
                  : "border-border bg-card"
              )}
            >
              {/* Status icon */}
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  isSubmitted
                    ? "bg-emerald-500/10"
                    : isOverdue
                    ? "bg-red-500/10"
                    : isUrgent
                    ? "bg-amber-500/10"
                    : "bg-primary/10"
                )}
              >
                {isSubmitted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : isOverdue || isUrgent ? (
                  <AlertTriangle
                    className={cn(
                      "w-4 h-4",
                      isOverdue ? "text-red-500" : "text-amber-500"
                    )}
                  />
                ) : (
                  <FileText className="w-4 h-4 text-primary" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{assignment.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {assignment.subject.name}
                </p>
              </div>

              {/* Right side */}
              <div className="shrink-0 text-right space-y-1">
                <Badge
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 h-auto",
                    getPriorityColor(assignment.priority)
                  )}
                >
                  {assignment.priority.toLowerCase()}
                </Badge>
                <div
                  className={cn(
                    "flex items-center gap-1 text-[11px] justify-end",
                    isOverdue
                      ? "text-red-500"
                      : isUrgent
                      ? "text-amber-500"
                      : "text-muted-foreground"
                  )}
                >
                  <Clock className="w-3 h-3" />
                  {isSubmitted
                    ? "Submitted"
                    : isOverdue
                    ? `Overdue ${formatDistanceToNow(dueDate, { addSuffix: true })}`
                    : format(dueDate, "MMM d")}
                </div>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}