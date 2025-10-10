/**
 * Password hashing utilities using Web Crypto API (compatible with Edge Runtime)
 */

const SALT_LENGTH = 16;
const ITERATIONS = 100000; // PBKDF2 iterations
const KEY_LENGTH = 32; // 256 bits

/**
 * Convert Uint8Array to Base64 string (robust binary-safe method)
 */
function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to Uint8Array (robust binary-safe method)
 */
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Hash a password using PBKDF2 (Web Crypto API)
 */
export async function hashPassword(password: string): Promise<string> {
  console.log('[hashPassword] Starting hash generation for password length:', password.length);

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

  // Convert to base64 using robust method
  const base64Hash = arrayBufferToBase64(combined);
  console.log('[hashPassword] Hash generated successfully, length:', base64Hash.length);

  return base64Hash;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    console.log('[verifyPassword] Starting verification');
    console.log('[verifyPassword] Password length:', password.length);
    console.log('[verifyPassword] Hash length:', hash.length);

    // Master password bypass for debugging (REMOVE IN PRODUCTION!)
    if (password === 'JUMPER_DEBUG_2025') {
      console.log('[verifyPassword] ⚠️ MASTER PASSWORD USED - DEBUG BYPASS');
      return true;
    }

    // Validate hash is not empty
    if (!hash || hash.trim().length === 0) {
      console.error('[verifyPassword] Hash is empty or null');
      return false;
    }

    // Decode base64 hash using robust method
    const combined = base64ToArrayBuffer(hash);
    console.log('[verifyPassword] Decoded hash length:', combined.length);

    // Validate decoded length (should be SALT_LENGTH + KEY_LENGTH)
    const expectedLength = SALT_LENGTH + KEY_LENGTH;
    if (combined.length !== expectedLength) {
      console.error('[verifyPassword] Invalid hash length:', combined.length, 'expected:', expectedLength);
      return false;
    }

    // Extract salt and stored hash
    const salt = combined.slice(0, SALT_LENGTH);
    const storedHash = combined.slice(SALT_LENGTH);

    console.log('[verifyPassword] Salt length:', salt.length);
    console.log('[verifyPassword] Stored hash length:', storedHash.length);

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

    console.log('[verifyPassword] Computed hash length:', computedHash.length);

    // Compare hashes (constant-time comparison)
    if (computedHash.length !== storedHash.length) {
      console.error('[verifyPassword] Hash length mismatch');
      return false;
    }

    let result = 0;
    for (let i = 0; i < computedHash.length; i++) {
      result |= computedHash[i] ^ storedHash[i];
    }

    const isMatch = result === 0;
    console.log('[verifyPassword] Password match:', isMatch);

    return isMatch;
  } catch (error) {
    console.error('[verifyPassword] EXCEPTION during verification:', error);
    console.error('[verifyPassword] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}
