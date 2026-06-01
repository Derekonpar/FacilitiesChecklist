#!/usr/bin/env node
/**
 * Create derek@onparbar.com as admin (skips email confirmation).
 * Set DEREK_INITIAL_PIN=1234 in .env (exactly 4 digits).
 */
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const pin = process.env.DEREK_INITIAL_PIN?.trim();
const email = "derek@onparbar.com";

if (!url || !serviceKey) {
  console.error("Missing Supabase URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!/^\d{4}$/.test(pin ?? "")) {
  console.error("Add DEREK_INITIAL_PIN=1234 (exactly 4 digits) to .env, then re-run.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existing } = await supabase
  .from("profiles")
  .select("id, role")
  .eq("email", email)
  .maybeSingle();

if (existing) {
  if (existing.role !== "admin") {
    await supabase.from("profiles").update({ role: "admin" }).eq("id", existing.id);
    console.log("Updated existing account to admin.");
  } else {
    console.log("derek@onparbar.com already exists as admin.");
  }
  process.exit(0);
}

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password: pin,
  email_confirm: true,
  user_metadata: { display_name: "Derek", username: "derek" },
});

if (error) {
  console.error("Create user failed:", error.message);
  process.exit(1);
}

console.log("Created derek@onparbar.com as admin.");
console.log("Sign in at /login with that email and your 4-digit PIN.");
console.log("User id:", data.user?.id);
