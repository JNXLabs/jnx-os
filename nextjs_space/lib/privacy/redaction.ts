/**
 * PII Redaction Utilities
 * For GDPR compliance and data privacy
 */

// Patterns for common PII
const EMAIL_PATTERN = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
const PHONE_PATTERN = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const SSN_PATTERN = /\d{3}-\d{2}-\d{4}/g;
const CREDIT_CARD_PATTERN = /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g;

/**
 * Redact email addresses
 */
export function redactEmail(text: string): string {
  return text.replace(EMAIL_PATTERN, (match) => {
    const [local, domain] = match.split('@');
    if (local.length <= 2) {
      return `**@${domain}`;
    }
    return `${local.substring(0, 2)}***@${domain}`;
  });
}

/**
 * Redact phone numbers
 */
export function redactPhone(text: string): string {
  return text.replace(PHONE_PATTERN, '***-***-****');
}

/**
 * Redact SSN
 */
export function redactSSN(text: string): string {
  return text.replace(SSN_PATTERN, '***-**-****');
}

/**
 * Redact credit card numbers
 */
export function redactCreditCard(text: string): string {
  return text.replace(CREDIT_CARD_PATTERN, '****-****-****-****');
}

/**
 * Redact all PII from text
 */
export function redactAll(text: string): string {
  let redacted = text;
  redacted = redactEmail(redacted);
  redacted = redactPhone(redacted);
  redacted = redactSSN(redacted);
  redacted = redactCreditCard(redacted);
  return redacted;
}

/**
 * Redact PII from objects (recursively)
 */
export function redactObject(obj: any): any {
  if (typeof obj === 'string') {
    return redactAll(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(redactObject);
  }

  if (obj && typeof obj === 'object') {
    const redacted: any = {};
    for (const key in obj) {
      // Skip redacting certain keys that are safe
      if (['id', 'user_id', 'org_id', 'created_at', 'updated_at'].includes(key)) {
        redacted[key] = obj[key];
      } else {
        redacted[key] = redactObject(obj[key]);
      }
    }
    return redacted;
  }

  return obj;
}

/**
 * List of sensitive field names to redact completely
 */
const SENSITIVE_FIELDS = [
  'password',
  'secret',
  'token',
  'api_key',
  'private_key',
  'ssn',
  'social_security',
  'credit_card',
  'card_number',
];

/**
 * Redact sensitive fields from an object
 */
export function redactSensitiveFields(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveFields);
  }

  if (obj && typeof obj === 'object') {
    const redacted: any = {};
    for (const key in obj) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_FIELDS.some((field) => lowerKey.includes(field));

      if (isSensitive) {
        redacted[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        redacted[key] = redactSensitiveFields(obj[key]);
      } else {
        redacted[key] = obj[key];
      }
    }
    return redacted;
  }

  return obj;
}
