/**
 * Smart phone number formatter.
 * Detects if input is a phone number and formats it with spaces for readability.
 * If the input contains letters or @, it's treated as email and returned as-is.
 */
export function formatPhoneDisplay(raw: string): string {
  // If input contains a letter or @, it's an email — don't format
  if (/[a-zA-Z@]/.test(raw)) return raw;

  // Strip everything except digits and the leading +
  const cleaned = raw.replace(/[^\d+]/g, "");

  // Format Indian numbers (+91) with spaces: +91 XXXXX XXXXX
  if (cleaned.startsWith("+91") && cleaned.length > 3) {
    const digits = cleaned.slice(3);
    const part1 = digits.slice(0, 5);
    const part2 = digits.slice(5, 10);
    return `+91 ${part1}${part2 ? " " + part2 : ""}`;
  }

  return cleaned;
}

/**
 * Strips all whitespace from identifier before sending to API.
 */
export function cleanIdentifier(value: string): string {
  return value.replace(/\s/g, "");
}
