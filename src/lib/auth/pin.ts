/** Supabase stores the PIN as the account password (4 digits). */
export const PIN_LENGTH = 4;

export function normalizePinInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, PIN_LENGTH);
}

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

export function pinValidationMessage(): string {
  return "Enter a 4-digit PIN (numbers only).";
}
