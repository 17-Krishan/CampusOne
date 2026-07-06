"use client";

import { Zap, Bell, Trophy, Target } from "lucide-react";
import { formatTimeAgo, formatPercentage } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { QuizAttempt, Quiz, Notification } from "@/types";

interface RecentActivityProps {
  quizAttempts: (QuizAttempt & { quiz: Quiz })[];
  notifications: Notification[];
}

export function RecentActivity({ quizAttempts, notifications }: RecentActivityProps) {
  type ActivityItem =
    | { type: "quiz"; data: QuizAttempt & { quiz: Quiz }; time: Date }
    | { type: "notification"; data: Notification; time: Date };

  const items: ActivityItem[] = [
    ...quizAttempts.map((a) => ({
      type: "quiz" as const,
      data: a,
      time: new Date(a.completedAt),
    })),
    ...notifications.map((n) => ({
      type: "notification" as const,
      data: n,
      time: new Date(n.createdAt),
    })),
  ]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 6);

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            No recent activity yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, idx) => {
          if (item.type === "quiz") {
            const attempt = item.data;
            const pct = (attempt.score / attempt.totalMarks) * 100;
            const passed = pct >= 60;
            return (
              <div key={`quiz-${attempt.id}`} className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                    passed ? "bg-violet-500/10" : "bg-muted"
                  )}
                >
                  {passed ? (
                    <Trophy className="w-4 h-4 text-violet-500" />
                  ) : (
                    <Target className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {attempt.quiz.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      variant={passed ? "success" : "warning"}
                      className="text-[10px] px-1.5 py-0 h-4"
                    >
                      {formatPercentage(pct, 0)}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {formatTimeAgo(item.time)}
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          // notification
          const notif = item.data;
          return (
            <div key={`notif-${notif.id}`} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{notif.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {formatTimeAgo(item.time)}
                </p>
              </div>
              {!notif.isRead && (
                <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}