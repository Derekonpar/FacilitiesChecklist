import { createServiceClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/profile";

/** Load profile by auth user id (service role — avoids broken RLS recursion on profiles). */
export async function loadProfileByUserId(
  userId: string,
): Promise<Profile | null> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) return null;
    return data as Profile;
  } catch {
    return null;
  }
}
