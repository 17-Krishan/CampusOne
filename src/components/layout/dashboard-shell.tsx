"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";
import type { User, Profile } from "@/types";

interface DashboardShellProps {
  children: React.ReactNode;
  user: User & { profile: Profile | null };
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const { sidebarCollapsed } = useUIStore();
  const { setUser } = useAuthStore();

  useEffect(() => {
    setUser({
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile,
    });
  }, [user, setUser]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main area */}
      <div
        className={cn(
          "flex flex-col flex-1 min-w-0 overflow-hidden transition-all duration-300",
          sidebarCollapsed ? "ml-[64px]" : "ml-[240px]",
          // Mobile: no margin, sidebar is overlay
          "max-lg:ml-0"
        )}
      >
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="container max-w-7xl mx-auto p-6 page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}