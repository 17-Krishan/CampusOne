"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth.store";
import type { AuthUser } from "@/types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, setInitialized, clearUser } = useAuthStore();
  const [supabase] = useState(() => createSupabaseBrowserClient());

  useEffect(() => {
    async function getInitialSession() {
      setLoading(true);
      try {
        const {
          data: { user: supabaseUser },
        } = await supabase.auth.getUser();

        if (supabaseUser) {
          const response = await fetch("/api/auth/me");
          if (response.ok) {
            const data = await response.json();
            setUser(data.user as AuthUser);
          } else {
            clearUser();
          }
        } else {
          clearUser();
        }
      } catch {
        clearUser();
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    }

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        try {
          const response = await fetch("/api/auth/me");
          if (response.ok) {
            const data = await response.json();
            setUser(data.user as AuthUser);
          }
        } catch {
          clearUser();
        }
      }

      if (event === "SIGNED_OUT") {
        clearUser();
      }

      if (event === "TOKEN_REFRESHED" && session?.user) {
        // Token refreshed, no need to refetch user profile
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, setUser, setLoading, setInitialized, clearUser]);

  return <>{children}</>;
}
