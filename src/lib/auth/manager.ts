import { MANAGER_SESSION_COOKIE } from "@/lib/constants";

export function isValidManagerPin(pin: string): boolean {
  const expected = process.env.MANAGER_PIN;
  if (!expected) return false;
  return pin === expected;
}

export { MANAGER_SESSION_COOKIE };
