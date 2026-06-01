#!/usr/bin/env node
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(
  resolve(__dirname, "../supabase/migrations/009_drop_auth_profile_trigger.sql"),
  "utf8",
);

console.log(
  "Run this in Supabase → SQL Editor (fixes Daniel sign-up + auto-admin):\n",
);
console.log("---");
console.log(sql);
console.log("---");
console.log(
  "\nThen deploy the latest app to Vercel (git push) so sign-up can finish creating the profile.",
);
console.log(
  "After deploy, Daniel uses Create account at /login with daniel@onparbar.com + 6-digit PIN.",
);
