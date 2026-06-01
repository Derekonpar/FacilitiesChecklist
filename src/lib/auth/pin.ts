/** Supabase stores the PIN as the account password (6 digits). */
export const PIN_LENGTH = 6;

export function normalizePinInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, PIN_LENGTH);
}

export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

export function pinValidationMessage(): string {
  return "Enter a 6-digit PIN (numbers only).";
}
