import * as crypto from 'crypto';

/**
 * Encryption-at-rest for tenant Odoo passwords.
 *
 * Format: `enc:v1:<iv>:<authTag>:<ciphertext>` (each part base64), AES-256-GCM.
 * Values without the `enc:v1:` prefix are treated as legacy plaintext and
 * passed through unchanged on decrypt — so existing rows keep working and get
 * encrypted the next time they are saved (or by the boot-time migration).
 *
 * The key derives from TENANT_ENCRYPTION_KEY, falling back to JWT_SECRET, with
 * a context prefix so it never collides with JWT signing. Set a dedicated
 * TENANT_ENCRYPTION_KEY and do not change it once tenants are stored.
 */
const PREFIX = 'enc:v1:';

function deriveKey(): Buffer {
  const secret =
    process.env.TENANT_ENCRYPTION_KEY || process.env.JWT_SECRET || '';
  return crypto.createHash('sha256').update(`tenant-enc:${secret}`).digest();
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function encryptSecret(plain: string | null | undefined): string {
  if (plain == null || plain === '' || isEncrypted(plain)) {
    return plain as string;
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plain, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return (
    PREFIX + [iv, tag, ciphertext].map((b) => b.toString('base64')).join(':')
  );
}

export function decryptSecret(stored: string | null | undefined): string {
  if (stored == null || stored === '' || !isEncrypted(stored)) {
    // Legacy plaintext (or empty) — return as-is.
    return stored as string;
  }
  const [ivB64, tagB64, ctB64] = stored.slice(PREFIX.length).split(':');
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      deriveKey(),
      Buffer.from(ivB64, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(ctB64, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    throw new Error(
      'Failed to decrypt tenant secret — check that TENANT_ENCRYPTION_KEY/JWT_SECRET has not changed since it was stored.',
    );
  }
}
