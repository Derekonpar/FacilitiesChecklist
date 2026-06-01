export const ONPAR_EMAIL_DOMAIN = "onparbar.com";

/** Local-parts allowed to register (name@onparbar.com). Keep in sync with migration 004. */
export const ALLOWED_EMAIL_LOCAL_PARTS = [
  "marketing",
  "daniel",
  "carlos",
  "derek",
  "events",
  "samantha",
  "facilities",
] as const;

export type AllowedLocalPart = (typeof ALLOWED_EMAIL_LOCAL_PARTS)[number];

export function buildOnparEmail(localPart: string): string {
  return `${localPart.trim().toLowerCase()}@${ONPAR_EMAIL_DOMAIN}`;
}

export function parseLoginIdentifier(input: string): {
  email: string;
  username: string;
} {
  const raw = input.trim().toLowerCase();
  if (raw.includes("@")) {
    return { email: raw, username: raw.split("@")[0] ?? raw };
  }
  return { email: buildOnparEmail(raw), username: raw };
}

export function isAllowedOnparEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const [local, domain] = normalized.split("@");
  if (domain !== ONPAR_EMAIL_DOMAIN || !local) return false;
  return (ALLOWED_EMAIL_LOCAL_PARTS as readonly string[]).includes(local);
}

export function allowedEmailsHint(): string {
  return ALLOWED_EMAIL_LOCAL_PARTS.map((p) => `${p}@${ONPAR_EMAIL_DOMAIN}`).join(
    ", ",
  );
}
