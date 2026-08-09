// ISO-3166 alpha-2 codes of issuing countries we cannot accept ID documents from.
// Keep this list here so it is easy to update in one place.
export const SANCTIONED_ISSUING_COUNTRIES = [
  "CU", // Cuba
  "IR", // Iran
  "KP", // North Korea
  "SY", // Syria
  "RU", // Russia
  "BY", // Belarus
  "AF", // Afghanistan
  "VE", // Venezuela
  "MM", // Myanmar
  "SD", // Sudan
  "SS", // South Sudan
  "SO", // Somalia
  "LY", // Libya
  "YE", // Yemen
  "CD", // Democratic Republic of Congo
  "CF", // Central African Republic
  "ML", // Mali
  "NI", // Nicaragua
] as const;

// Single generic, user-facing failure message. Every rejection reason must use
// this exact wording so failures are indistinguishable from one another.
export const GENERIC_VERIFICATION_FAILURE_MESSAGE =
  "We couldn't verify this document. Please try again or contact support.";

export function isSanctionedIssuingCountry(country: unknown): boolean {
  if (typeof country !== "string") return false;
  const code = country.trim().toUpperCase();
  return (SANCTIONED_ISSUING_COUNTRIES as readonly string[]).includes(code);
}
