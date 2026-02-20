export const redactPII = (text) => {
    if (!text) return text;

    let redacted = text;

    // 1. Emails
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    redacted = redacted.replace(emailRegex, "[REDACTED EMAIL]");

    // 2. Phone Numbers (Simple Colombian mobile format approx)
    // Matches: 3xx xxx xxxx, +57 3xx..., 3xxxxxxxxx
    const phoneRegex = /(?:\+57|57)?\s?3[0-9]{2}[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}/g;
    redacted = redacted.replace(phoneRegex, "[REDACTED PHONE]");

    // 3. Credit Cards (Luhn algorithm checks are complex, simple regex for 13-16 digits)
    const ccRegex = /\b(?:\d[ -]*?){13,16}\b/g;
    // Avoid matching simple numbers or dates if possible, but for strict compliance we aggressively mask long strings of digits
    // redacted = redacted.replace(ccRegex, "[REDACTED CARD]"); 
    // Commented out to avoid false positives on product codes or tracking numbers without more context.
    // Let's stick to emails and phones for now which are high risk.

    return redacted;
};
