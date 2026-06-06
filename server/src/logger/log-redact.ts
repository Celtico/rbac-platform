// Redaction for log entries. Logs are persisted and exposed via GET /api/logs
// and the SSE stream, so any secret that reaches a log line would be readable
// by anyone with read:logsystem. Scrub known-sensitive shapes before storing.

const SENSITIVE_KEY =
  /(pass(word)?|token|secret|authorization|^auth$|api[_-]?key|odoopassword|credential|cookie)/i;

const REDACTED = '[REDACTED]';

/** Scrub secrets that appear inside a free-text string. */
export function redactString(input: string): string {
  return (
    input
      // Authorization: Bearer <jwt/opaque>
      .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
      // Bare JWTs (header.payload.signature)
      .replace(/eyJ[A-Za-z0-9._-]{10,}/g, '[REDACTED_JWT]')
      // key=value / "key": "value" for sensitive keys
      .replace(
        /("?(?:password|pass|token|secret|authorization|api[_-]?key|odoopassword|credential|cookie)"?\s*[:=]\s*)("?)([^"\s,&}]+)/gi,
        `$1$2${REDACTED}`,
      )
  );
}

/** Recursively redact a metadata value: sensitive keys are masked, strings scrubbed. */
export function redactValue(val: unknown): unknown {
  if (typeof val === 'string') return redactString(val);
  if (Array.isArray(val)) return val.map(redactValue);
  if (val && typeof val === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEY.test(k) ? REDACTED : redactValue(v);
    }
    return out;
  }
  return val;
}
