#!/usr/bin/env node
/** Verify profiles RLS allows reading your own row after sign-in. */
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
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const email = process.argv[2] || "derek@onparbar.com";
const pin = process.argv[3] || process.env.DEREK_INITIAL_PIN;

if (!url || !anonKey) {
  console.error("Missing Supabase URL or anon key in .env");
  process.exit(1);
}
if (!/^\d{6}$/.test(pin ?? "")) {
  console.error("Usage: DEREK_INITIAL_PIN=123456 npm run verify:rls");
  console.error("   or: npm run verify:rls derek@onparbar.com 123456");
  process.exit(1);
}

const anon = createClient(url, anonKey);
const { error: signErr } = await anon.auth.signInWithPassword({
  email,
  password: pin,
});
if (signErr) {
  console.error("Sign-in failed:", signErr.message);
  process.exit(1);
}

const { data, error } = await anon
  .from("profiles")
  .select("role, email")
  .eq("id", (await anon.auth.getUser()).data.user.id)
  .single();

if (error) {
  console.error("✗ Profile read failed:", error.message);
  if (error.message.includes("infinite recursion")) {
    console.error("  → Run: npm run apply:rls-006 and paste SQL in Supabase");
  }
  process.exit(1);
}

console.log("✓ Profile read OK:", data.email, "role =", data.role);
