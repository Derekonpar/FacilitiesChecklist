#!/usr/bin/env node
/** Create profile rows for auth users that have no profile (after sign-up). */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const raw = readFileSync(resolve(root, ".env"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

loadEnv();

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
const users = list?.users ?? [];

let repaired = 0;
for (const u of users) {
  if (!u.email) continue;
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", u.id)
    .maybeSingle();
  if (profile) continue;

  const email = u.email.toLowerCase();
  const localPart = email.split("@")[0];
  const { error } = await admin.from("profiles").upsert({
    id: u.id,
    email,
    username: localPart,
    display_name:
      (u.user_metadata?.display_name as string) ||
      localPart.charAt(0).toUpperCase() + localPart.slice(1),
    role: "pending",
  });
  if (error) {
    console.error("Failed", email, error.message);
  } else {
    console.log("Created profile:", email, "(pending)");
    repaired++;
  }
}

console.log(repaired ? `\n✓ Repaired ${repaired} account(s)` : "\n✓ No missing profiles");
