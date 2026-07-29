import supabase from "../../supabase-client";
import type { Profile } from "../../types/database.types";

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export interface ProfilePatch {
  username: string;
  bio: string | null;
  avatar_url: string | null;
}

export async function updateProfile(
  userId: string,
  patch: ProfilePatch
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
