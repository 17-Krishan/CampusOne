"use client";

import Link from "next/link";
import {
  CalendarCheck,
  BookOpen,
  Zap,
  Briefcase,
  Users,
  Bot,
  Plus,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ACTIONS = [
  {
    label: "Mark Attendance",
    href: "/dashboard/academic/attendance",
    icon: CalendarCheck,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 hover:bg-emerald-500/20",
  },
  {
    label: "Upload Notes",
    href: "/dashboard/notes",
    icon: BookOpen,
    color: "text-blue-500",
    bg: "bg-blue-500/10 hover:bg-blue-500/20",
  },
  {
    label: "Play Quiz",
    href: "/dashboard/quiz",
    icon: Zap,
    color: "text-violet-500",
    bg: "bg-violet-500/10 hover:bg-violet-500/20",
  },
  {
    label: "AI Assistant",
    href: "/dashboard/ai",
    icon: Bot,
    color: "text-primary",
    bg: "bg-primary/10 hover:bg-primary/20",
  },
  {
    label: "Placement Hub",
    href: "/dashboard/placement",
    icon: Briefcase,
    color: "text-amber-500",
    bg: "bg-amber-500/10 hover:bg-amber-500/20",
  },
  {
    label: "Community",
    href: "/dashboard/community",
    icon: Users,
    color: "text-pink-500",
    bg: "bg-pink-500/10 hover:bg-pink-500/20",
  },
  {
    label: "Assignments",
    href: "/dashboard/academic/assignments",
    icon: FileText,
    color: "text-orange-500",
    bg: "bg-orange-500/10 hover:bg-orange-500/20",
  },
  {
    label: "New Post",
    href: "/dashboard/community?new=true",
    icon: Plus,
    color: "text-teal-500",
    bg: "bg-teal-500/10 hover:bg-teal-500/20",
  },
];

export function QuickActions() {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Quick Actions
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {ACTIONS.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
              "border border-transparent hover:border-border",
              action.bg
            )}
          >
            <div
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center",
                "bg-background shadow-sm"
              )}
            >
              <action.icon className={cn("w-4 h-4", action.color)} />
            </div>
            <span className="text-[11px] font-medium text-center leading-tight text-muted-foreground">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}