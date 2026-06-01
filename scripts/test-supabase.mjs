/**
 * Quick Supabase connectivity test (run: node scripts/test-supabase.mjs)
 * Loads .env from project root — does not print secrets.
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../.env");

function loadEnv() {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("FAIL: Missing URL or publishable/anon key in .env");
  process.exit(1);
}

const supabase = createClient(url, key);

console.log("1. Select issues…");
const { data: rows, error: selectErr } = await supabase
  .from("issues")
  .select("id, department, submitted_by, created_at")
  .order("created_at", { ascending: false })
  .limit(5);

if (selectErr) {
  console.error("FAIL select:", selectErr.message);
  process.exit(1);
}
console.log("   OK —", rows?.length ?? 0, "issue(s) in DB");

console.log("2. Insert test issue…");
const testId = crypto.randomUUID().slice(0, 8);
const { data: inserted, error: insertErr } = await supabase
  .from("issues")
  .insert({
    department: "kitchen",
    comment: `Connection test ${testId} — safe to delete`,
    submitted_by: "System Test",
    priority: "normal",
    status: "open",
    workflow_status: "open",
  })
  .select("id")
  .single();

if (insertErr) {
  console.error("FAIL insert:", insertErr.message);
  process.exit(1);
}
console.log("   OK — inserted id:", inserted.id);

console.log("3. Delete test issue…");
const { error: delErr } = await supabase.from("issues").delete().eq("id", inserted.id);
if (delErr) {
  console.warn("WARN delete:", delErr.message, "(test row may remain)");
} else {
  console.log("   OK — cleaned up test row");
}

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
if (!serviceKey) {
  console.log("\nNote: SUPABASE_SERVICE_ROLE_KEY not set — manager Complete/Recall API will fail until added.");
} else {
  console.log("\nService role key present — manager updates should work.");
}

console.log("\nAll client tests passed. Start app: npm run dev");
