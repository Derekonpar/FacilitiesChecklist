#!/usr/bin/env node
/** Quick check that migration 004 and Supabase Auth are ready. */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  try {
    const raw = readFileSync(resolve(root, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* optional */
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

let ok = true;

const profilesRes = await fetch(`${url}/rest/v1/profiles?select=count`, {
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    Prefer: "count=exact",
  },
});

if (profilesRes.status !== 200) {
  console.error("✗ profiles table missing — run supabase/migrations/004_auth_profiles.sql");
  ok = false;
} else {
  const count = profilesRes.headers.get("content-range")?.split("/")[1] ?? "?";
  console.log(`✓ profiles table OK (${count} users)`);
}

const settingsRes = await fetch(`${url}/auth/v1/settings`, {
  headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
});
const settings = await settingsRes.json();
if (settings.mailer_autoconfirm) {
  console.log("✓ Email confirmation off (sign-up goes straight to dashboard)");
} else {
  console.warn(
    "⚠ Email confirmation still ON — run: npm run disable:email-confirm",
  );
  console.warn(
    "   Or: Supabase → Authentication → Providers → Email → turn OFF Confirm email",
  );
}

if (anonKey) {
  console.log("✓ Anon/publishable key configured");
} else {
  console.warn("⚠ Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
}

console.log("\nNext: http://localhost:3000/login → Create account as derek@onparbar.com");
console.log("Admin team: http://localhost:3000/admin/team");

process.exit(ok ? 0 : 1);
