"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Bell,
  CalendarCheck,
  Clock,
  FileText,
  BookOpen,
  Zap,
  TrendingUp,
  Briefcase,
  Users,
  Star,
  ShoppingBag,
  Search,
  Home,
  Network,
  Settings,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn, getInitials } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";
import { useNotificationStore } from "@/stores/notification.store";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { User, Profile } from "@/types";

const NAV_SECTIONS = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
      { title: "AI Assistant", href: "/ai", icon: Bot },
      { title: "Notifications", href: "/notifications", icon: Bell, badge: "unread" },
    ],
  },
  {
    title: "Academics",
    items: [
      { title: "Attendance", href: "/academic/attendance", icon: CalendarCheck },
      { title: "Timetable", href: "/academic/timetable", icon: Clock },
      { title: "Assignments", href: "/academic/assignments", icon: FileText },
    ],
  },
  {
    title: "Learning",
    items: [
      { title: "Notes", href: "/notes", icon: BookOpen },
      { title: "Quiz Arena", href: "/quiz", icon: Zap },
      { title: "Career Mentor", href: "/career", icon: TrendingUp },
    ],
  },
  {
    title: "Placement",
    items: [
      { title: "Placement Hub", href: "/placement", icon: Briefcase },
    ],
  },
  {
    title: "Campus",
    items: [
      { title: "Community", href: "/community", icon: Users },
      { title: "Clubs & Events", href: "/clubs", icon: Star },
      { title: "Marketplace", href: "/marketplace", icon: ShoppingBag },
      { title: "Lost & Found", href: "/lost-found", icon: Search },
      { title: "Hostel", href: "/hostel", icon: Home },
      { title: "Network", href: "/network", icon: Network },
    ],
  },
] as const;

interface SidebarProps {
  user: User & { profile: Profile | null };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { unreadCount } = useNotificationStore();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to log out");
    }
  }

  const profile = user.profile;
  const displayName = profile?.displayName ?? `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();
  const initials = getInitials(profile?.firstName ?? user.email[0], profile?.lastName);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen z-40 flex flex-col",
          "border-r border-border bg-[hsl(var(--sidebar-background))]",
          "transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-[64px]" : "w-[240px]",
          // Mobile: full hidden off-screen (add drawer toggle later)
          "max-lg:hidden"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "h-16 flex items-center border-b border-border shrink-0",
            sidebarCollapsed ? "px-[18px] justify-center" : "px-4 gap-3"
          )}
        >
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shadow-sm shrink-0">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-base font-display font-bold tracking-tight truncate">
                CampusOne
              </span>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
          {NAV_SECTIONS.map((section, sectionIdx) => (
            <div key={section.title} className={cn(sectionIdx > 0 && "mt-1")}>
              {/* Section title */}
              {!sidebarCollapsed && (
                <p className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              {sidebarCollapsed && sectionIdx > 0 && (
                <Separator className="my-2" />
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href, "exact" in item ? item.exact : false);
                  const badge = "badge" in item && item.badge === "unread" ? unreadCount : undefined;

                  const navItem = (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all",
                        "hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]",
                        sidebarCollapsed
                          ? "h-9 w-9 justify-center mx-auto"
                          : "px-2.5 py-2 w-full",
                        active
                          ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))] font-semibold"
                          : "text-[hsl(var(--sidebar-foreground))]"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "shrink-0 transition-colors",
                          sidebarCollapsed ? "w-5 h-5" : "w-4 h-4",
                          active
                            ? "text-[hsl(var(--sidebar-primary))]"
                            : "text-muted-foreground"
                        )}
                      />
                      {!sidebarCollapsed && (
                        <>
                          <span className="truncate flex-1">{item.title}</span>
                          {badge && badge > 0 && (
                            <Badge
                              variant="default"
                              className="h-4 min-w-4 px-1 text-[10px] leading-none"
                            >
                              {badge > 99 ? "99+" : badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  );

                  if (sidebarCollapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {item.title}
                          {badge && badge > 0 && ` (${badge})`}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return navItem;
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: settings + user */}
        <div className="shrink-0 border-t border-border p-2 space-y-0.5">
          {/* Settings */}
          {sidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard/settings"
                  className={cn(
                    "flex items-center justify-center h-9 w-9 mx-auto rounded-lg transition-all",
                    "hover:bg-[hsl(var(--sidebar-accent))]",
                    isActive("/dashboard/settings")
                      ? "text-[hsl(var(--sidebar-primary))]"
                      : "text-muted-foreground"
                  )}
                >
                  <Settings className="w-5 h-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/dashboard/settings"
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all w-full",
                "hover:bg-[hsl(var(--sidebar-accent))]",
                isActive("/dashboard/settings")
                  ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))]"
                  : "text-[hsl(var(--sidebar-foreground))]"
              )}
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span>Settings</span>
            </Link>
          )}

          <Separator className="my-1" />

          {/* User */}
          <div
            className={cn(
              "flex items-center rounded-lg transition-all",
              sidebarCollapsed ? "justify-center py-1" : "gap-2.5 px-2 py-1.5"
            )}
          >
            <Avatar className="w-7 h-7 shrink-0">
              {profile?.avatar && <AvatarImage src={profile.avatar} alt={displayName} />}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate leading-tight">
                  {displayName}
                </p>
                <p className="text-[11px] text-muted-foreground truncate leading-tight">
                  {user.email}
                </p>
              </div>
            )}
            {!sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive shrink-0"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "absolute -right-3 top-20 z-50",
            "flex items-center justify-center w-6 h-6 rounded-full",
            "bg-background border border-border shadow-sm",
            "hover:bg-accent transition-colors"
          )}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </aside>
    </TooltipProvider>
  );
}