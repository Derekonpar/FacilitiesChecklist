#!/usr/bin/env node
/**
 * Seed maintenance_items from src/data/maintenance-seed.json
 * Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env
 * Run after applying supabase/migrations/003_maintenance.sql
 */
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const seed = JSON.parse(
  readFileSync(resolve(root, "src/data/maintenance-seed.json"), "utf8"),
);

const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(url, key);

const { count } = await supabase
  .from("maintenance_items")
  .select("*", { count: "exact", head: true });

if (count && count > 0) {
  console.log(`maintenance_items already has ${count} rows — skipping seed.`);
  console.log("Delete rows in Supabase SQL editor to re-seed.");
  process.exit(0);
}

const { data, error } = await supabase.from("maintenance_items").insert(seed).select("id");

if (error) {
  console.error("Seed failed:", error.message);
  process.exit(1);
}

console.log(`Seeded ${data.length} maintenance items.`);
