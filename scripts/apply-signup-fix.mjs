#!/usr/bin/env node
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(
  resolve(__dirname, "../supabase/migrations/008_fix_signup_profile_trigger.sql"),
  "utf8",
);

console.log(
  "Daniel's sign-up error is fixed by running this SQL in Supabase → SQL Editor:\n",
);
console.log("---");
console.log(sql);
console.log("---");
console.log(
  "\nAfter Run succeeds, have Daniel try Create account again at /login.",
);
