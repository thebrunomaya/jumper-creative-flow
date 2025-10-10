/**
 * Password hashing utilities using Web Crypto API (compatible with Edge Runtime)
 */

const SALT_LENGTH = 16;
const ITERATIONS = 100000; // PBKDF2 iterations
const KEY_LENGTH = 32; // 256 bits

/**
 * Hash a password using PBKDF2 (Web Crypto API)
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  // Convert password to Uint8Array
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  // Import password as key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
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
    keyMaterial,
    KEY_LENGTH * 8
  );

  // Combine salt + hash and encode as base64
  const hashArray = new Uint8Array(hashBuffer);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);

  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    // Decode base64 hash
    const combined = Uint8Array.from(atob(hash), c => c.charCodeAt(0));

    // Extract salt and stored hash
    const salt = combined.slice(0, SALT_LENGTH);
    const storedHash = combined.slice(SALT_LENGTH);

    // Convert password to Uint8Array
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    // Import password as key
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
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
      keyMaterial,
      KEY_LENGTH * 8
    );

    const computedHash = new Uint8Array(hashBuffer);

    // Compare hashes (constant-time comparison)
    if (computedHash.length !== storedHash.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < computedHash.length; i++) {
      result |= computedHash[i] ^ storedHash[i];
    }

    return result === 0;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}
