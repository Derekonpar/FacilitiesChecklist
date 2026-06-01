"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Profile } from "@/lib/types/profile";

type AuthUser = { id: string; email: string };

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser?.email) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    setUser({ id: authUser.id, email: authUser.email });

    const { data: row } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    setProfile((row as Profile) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();

    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  return { user, profile, loading, refresh: loadProfile };
}
