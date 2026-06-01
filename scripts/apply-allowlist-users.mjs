#!/usr/bin/env node
/** Seed brooke + taylor in Supabase (run 007 SQL first if signup_allowed_emails is missing). */
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
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { error: brookeErr } = await supabase
  .from("signup_allowlist")
  .upsert({ local_part: "brooke", auto_admin: false }, { onConflict: "local_part" });

if (brookeErr) {
  console.error("brooke allowlist:", brookeErr.message);
  console.error("Run supabase/migrations/007_allowed_external_emails.sql in SQL Editor.");
  process.exit(1);
}

const { error: taylorErr } = await supabase
  .from("signup_allowed_emails")
  .upsert(
    { email: "taylorhouseman20@gmail.com", auto_admin: false },
    { onConflict: "email" },
  );

if (taylorErr) {
  console.error("taylor allowlist:", taylorErr.message);
  console.error("Run supabase/migrations/007_allowed_external_emails.sql in SQL Editor.");
  process.exit(1);
}

console.log("✓ brooke@onparbar.com allowed (signup_allowlist)");
console.log("✓ taylorhouseman20@gmail.com allowed (signup_allowed_emails)");
