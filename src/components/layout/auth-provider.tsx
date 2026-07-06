"use client";

import { useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth.store";
import type { AuthUser } from "@/types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, setInitialized, clearUser } = useAuthStore();
  const supabase = createSupabaseBrowserClient();
  const isFetchingRef = useRef(false);

  async function fetchUser() {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user as AuthUser);
      } else {
        clearUser();
      }
    } catch {
      clearUser();
    } finally {
      isFetchingRef.current = false;
    }
  }

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      setLoading(true);
      try {
        const {
          data: { user: supabaseUser },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (supabaseUser) {
          await fetchUser();
        } else {
          clearUser();
        }
      } catch {
        if (mounted) clearUser();
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    }

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_IN" && session?.user) {
        // Only fetch on actual sign-in, not token refreshes
        await fetchUser();
      }

      if (event === "SIGNED_OUT") {
        clearUser();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}