// services/security.ts

/**
 * PII Redaction for Privacy by Design
 * Removes potential phone numbers and emails before data leaves the client.
 */
export const scrubPII = (text: string): string => {
  // Redact Emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  let scrubbed = text.replace(emailRegex, '[EMAIL_REDACTED]');

  // Redact Phone Numbers (Basic international support)
  // Matches formats like +1-555-555-5555, (555) 555-5555, 555 555 5555
  const phoneRegex = /(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?/g;
  scrubbed = scrubbed.replace(phoneRegex, '[PHONE_REDACTED]');

  return scrubbed;
};

/**
 * SHA-256 Hashing for Password Verification
 * Used to store the login password securely without plain text.
 */
export const hashString = async (message: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Client-Side Encryption Service
 * Uses Web Crypto API (SubtleCrypto) to encrypt data at rest in LocalStorage.
 */

const SALT_Length = 16;
const IV_Length = 12; // AES-GCM standard

// Derive a key from the user's password using PBKDF2
const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

export const encryptData = async (data: any, password: string): Promise<string> => {
  const enc = new TextEncoder();
  const text = JSON.stringify(data);
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_Length));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_Length));
  
  const key = await deriveKey(password, salt);
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(text)
  );

  // Combine salt + iv + encrypted data into a single buffer for storage
  const buffer = new Uint8Array(salt.byteLength + iv.byteLength + encrypted.byteLength);
  buffer.set(salt, 0);
  buffer.set(iv, salt.byteLength);
  buffer.set(new Uint8Array(encrypted), salt.byteLength + iv.byteLength);

  // Convert to Base64 for LocalStorage
  return btoa(String.fromCharCode(...buffer));
};

export const decryptData = async (base64Data: string, password: string): Promise<any> => {
  try {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Extract parts
    const salt = bytes.slice(0, SALT_Length);
    const iv = bytes.slice(SALT_Length, SALT_Length + IV_Length);
    const data = bytes.slice(SALT_Length + IV_Length);

    const key = await deriveKey(password, salt);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );

    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decrypted));
  } catch (e) {
    throw new Error("Invalid password or corrupted data");
  }
};