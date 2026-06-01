#!/usr/bin/env node
/**
 * Turn off sign-up confirmation emails (instant sign-in after Create account).
 *
 * Option A — Dashboard (no token):
 *   Supabase → Authentication → Providers → Email → ON "Confirm email" → turn OFF → Save
 *
 * Option B — This script (needs a personal access token):
 *   1. https://supabase.com/dashboard/account/tokens → Generate token
 *   2. Add to .env: SUPABASE_ACCESS_TOKEN=sbp_...
 *   3. npm run disable:email-confirm
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

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

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const projectRef =
  process.env.SUPABASE_PROJECT_ID?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.match(
    /https:\/\/([^.]+)\.supabase\.co/,
  )?.[1];

if (!token || !projectRef) {
  console.log("No SUPABASE_ACCESS_TOKEN in .env — use the dashboard:\n");
  console.log("  1. Open https://supabase.com/dashboard");
  console.log(`  2. Project → Authentication → Sign In / Providers → Email`);
  console.log('  3. Turn OFF "Confirm email" (confirm sign-ups without email)');
  console.log("  4. Save\n");
  console.log(
    "Optional: add SUPABASE_ACCESS_TOKEN to .env and re-run npm run disable:email-confirm",
  );
  process.exit(0);
}

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

const getRes = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
  { headers },
);

if (!getRes.ok) {
  console.error("Could not read auth config:", getRes.status, await getRes.text());
  process.exit(1);
}

const config = await getRes.json();
const before = config.mailer_autoconfirm;

const patchRes = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
  {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      ...config,
      mailer_autoconfirm: true,
    }),
  },
);

if (!patchRes.ok) {
  console.error("Update failed:", patchRes.status, await patchRes.text());
  process.exit(1);
}

const after = await patchRes.json();
console.log("mailer_autoconfirm:", before, "→", after.mailer_autoconfirm);
if (after.mailer_autoconfirm) {
  console.log("✓ Email confirmation disabled — new sign-ups go straight to the app.");
} else {
  console.log("⚠ Setting may not have applied; use the dashboard steps above.");
}
