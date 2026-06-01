#!/usr/bin/env node
/**
 * Prints migration 006 SQL — paste into Supabase → SQL → New query → Run.
 * Fixes: infinite recursion detected in policy for relation "profiles"
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(
  resolve(__dirname, "../supabase/migrations/006_fix_profiles_rls_recursion.sql"),
  "utf8",
);

console.log("Copy everything below into Supabase SQL Editor and click Run:\n");
console.log("---");
console.log(sql);
console.log("---");
console.log("\nThen run: npm run verify:rls");
