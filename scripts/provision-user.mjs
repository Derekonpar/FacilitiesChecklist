#!/usr/bin/env node
/**
 * Create auth user + profile (admin). Run 009 SQL (drop trigger) first if sign-up fails.
 * Usage: node scripts/provision-user.mjs daniel@onparbar.com 123456 Daniel
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const AUTO_ADMIN = [
  "marketing",
  "daniel",
  "carlos",
  "derek",
  "events",
  "samantha",
  "facilities",
];

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

const email = process.argv[2]?.trim().toLowerCase();
const pin = process.argv[3]?.trim();
const displayName = process.argv[4]?.trim();

if (!email || !/^\d{6}$/.test(pin ?? "")) {
  console.error(
    "Usage: node scripts/provision-user.mjs email@onparbar.com 123456 \"Display Name\"",
  );
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const localPart = email.split("@")[0];
const role = AUTO_ADMIN.includes(localPart) ? "admin" : "pending";

const { data: allow } = await admin
  .from("signup_allowlist")
  .select("auto_admin")
  .eq("local_part", localPart)
  .maybeSingle();

const finalRole = allow?.auto_admin || role === "admin" ? "admin" : role;

const { data: existing } = await admin
  .from("profiles")
  .select("id")
  .eq("email", email)
  .maybeSingle();

if (existing) {
  await admin.from("profiles").update({ role: finalRole }).eq("id", existing.id);
  console.log("Profile already exists; role set to", finalRole);
  process.exit(0);
}

const { data, error } = await admin.auth.admin.createUser({
  email,
  password: pin,
  email_confirm: true,
  user_metadata: {
    display_name: displayName || localPart,
    username: localPart,
  },
});

if (error) {
  console.error("Create user failed:", error.message);
  if (error.message.includes("Database error")) {
    console.error("Run supabase/migrations/009_drop_auth_profile_trigger.sql first.");
  }
  process.exit(1);
}

const { error: profileErr } = await admin.from("profiles").upsert({
  id: data.user.id,
  email,
  username: localPart,
  display_name: displayName || localPart.charAt(0).toUpperCase() + localPart.slice(1),
  role: finalRole,
});

if (profileErr) {
  console.error("Profile insert failed:", profileErr.message);
  process.exit(1);
}

console.log("Created", email, "with role", finalRole);
console.log("They can sign in at /login with that email and PIN.");
