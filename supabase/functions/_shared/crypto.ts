/**
 * Password hashing utilities using Web Crypto API (Edge Runtime compatible)
 * No Workers required - pure Web Standards
 */

const ITERATIONS = 100000;
const HASH_LENGTH = 32;
const SALT_LENGTH = 16;

/**
 * Hash a password using PBKDF2
 * @param password - Plain text password
 * @returns Promise<string> - Base64 encoded salt:hash
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  // Convert password to buffer
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import password as key
  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  // Derive hash using PBKDF2
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    HASH_LENGTH * 8
  );

  // Convert to base64
  const hashArray = new Uint8Array(hashBuffer);
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...hashArray));

  return `${saltB64}:${hashB64}`;
}

/**
 * Verify a password against a hash
 * @param password - Plain text password to verify
 * @param storedHash - Previously hashed password (salt:hash format)
 * @returns Promise<boolean> - True if password matches
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    // Split stored hash
    const [saltB64, hashB64] = storedHash.split(':');
    if (!saltB64 || !hashB64) {
      return false;
    }

    // Decode salt
    const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));

    // Convert password to buffer
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key
    const key = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    // Derive hash using same salt
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: ITERATIONS,
        hash: 'SHA-256',
      },
      key,
      HASH_LENGTH * 8
    );

    // Convert to base64 and compare
    const hashArray = new Uint8Array(hashBuffer);
    const computedHashB64 = btoa(String.fromCharCode(...hashArray));

    return computedHashB64 === hashB64;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}
