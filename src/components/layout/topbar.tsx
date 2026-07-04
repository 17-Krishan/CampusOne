"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Moon, Sun, Bell, Search, LogOut, User, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn, getInitials } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notification.store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import type { User as UserType, Profile } from "@/types";

// Maps pathname segments to readable breadcrumb labels
const BREADCRUMB_MAP: Record<string, string> = {
  dashboard: "Dashboard",
  academic: "Academics",
  attendance: "Attendance",
  timetable: "Timetable",
  assignments: "Assignments",
  notes: "Notes",
  quiz: "Quiz Arena",
  career: "Career Mentor",
  placement: "Placement Hub",
  community: "Community",
  clubs: "Clubs & Events",
  marketplace: "Marketplace",
  "lost-found": "Lost & Found",
  hostel: "Hostel",
  network: "Network",
  settings: "Settings",
  notifications: "Notifications",
  ai: "AI Assistant",
};

interface TopbarProps {
  user: UserType & { profile: Profile | null };
}

export function Topbar({ user }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { unreadCount } = useNotificationStore();

  const profile = user.profile;
  const displayName =
    profile?.displayName ??
    `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();
  const initials = getInitials(
    profile?.firstName ?? user.email[0],
    profile?.lastName
  );

  // Build breadcrumbs from pathname
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, idx) => ({
    label: BREADCRUMB_MAP[seg] ?? seg,
    href: "/" + segments.slice(0, idx + 1).join("/"),
    isLast: idx === segments.length - 1,
  }));

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

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((crumb, idx) => (
            <li key={crumb.href} className="flex items-center gap-1.5">
              {idx > 0 && (
                <span className="text-muted-foreground/50 text-xs">/</span>
              )}
              {crumb.isLast ? (
                <span className="font-semibold text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Right side actions */}
      <div className="flex items-center gap-1">
        {/* Search */}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground relative"
          asChild
        >
          <Link href="/dashboard/notifications" aria-label="Notifications">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span
                className={cn(
                  "absolute top-1.5 right-1.5 flex items-center justify-center",
                  "min-w-[16px] h-4 rounded-full bg-primary text-[10px] text-primary-foreground font-bold px-1"
                )}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 gap-2 pl-2 pr-3 ml-1"
              aria-label="User menu"
            >
              <Avatar className="w-7 h-7">
                {profile?.avatar && (
                  <AvatarImage src={profile.avatar} alt={displayName} />
                )}
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium max-w-[120px] truncate hidden sm:block">
                {displayName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}