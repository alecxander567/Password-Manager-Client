/**
 * Crypto utility module for the password manager.
 *
 * Uses the Web Crypto API (SubtleCrypto) for all operations.
 *
 * Key derivation: PBKDF2 with SHA-256
 * Symmetric encryption: AES-GCM (256-bit)
 *
 * Data format:
 *   - salt: random 16 bytes, hex-encoded
 *   - iv/nonce: random 12 bytes, hex-encoded
 *   - encrypted data: base64-encoded ciphertext
 */

// ── Helpers ──────────────────────────────────────────────

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bufToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuf(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

function bufToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuf(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ── Public API ──────────────────────────────────────────

/**
 * Derive a 256-bit AES key from a password and salt using PBKDF2.
 *
 * @param {string} password - The master password.
 * @param {string} saltHex - Hex-encoded salt (16 bytes).
 * @returns {Promise<CryptoKey>} - The derived AES-GCM key.
 */
export async function deriveKey(password, saltHex) {
  const salt = hexToBuf(saltHex);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 600_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Generate a random salt (16 bytes) and return it as hex.
 *
 * @returns {string} Hex-encoded salt.
 */
export function generateSalt() {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return bufToHex(salt.buffer);
}

/**
 * Generate a random 256-bit vault key (AES-GCM key), exported as hex.
 *
 * @returns {Promise<string>} Hex-encoded vault key bytes.
 */
export async function generateVaultKey() {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  const raw = await crypto.subtle.exportKey("raw", key);
  return bufToHex(raw);
}

/**
 * Import a vault key from its hex representation.
 *
 * @param {string} vaultKeyHex - Hex-encoded vault key bytes.
 * @returns {Promise<CryptoKey>}
 */
export async function importVaultKey(vaultKeyHex) {
  return crypto.subtle.importKey(
    "raw",
    hexToBuf(vaultKeyHex),
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypt a vault key (as hex) with a derived key, returning the encrypted hex.
 *
 * @param {string} vaultKeyHex - The vault key in hex to encrypt.
 * @param {CryptoKey} wrappingKey - The AES-GCM key used to wrap it.
 * @returns {Promise<{encryptedVaultKey: string, iv: string}>}
 */
export async function encryptVaultKey(vaultKeyHex, wrappingKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    wrappingKey,
    encoder.encode(vaultKeyHex),
  );
  return {
    encryptedVaultKey: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: bufToHex(iv.buffer),
  };
}

/**
 * Decrypt a vault key (encrypted + iv) with a derived key.
 *
 * @param {string} encryptedB64 - Base64-encoded ciphertext.
 * @param {string} ivHex - Hex-encoded IV (12 bytes).
 * @param {CryptoKey} wrappingKey - The AES-GCM key used to unwrap.
 * @returns {Promise<string>} Hex-encoded vault key.
 */
export async function decryptVaultKey(encryptedB64, ivHex, wrappingKey) {
  const iv = hexToBuf(ivHex);
  const encrypted = base64ToBuf(encryptedB64);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    wrappingKey,
    encrypted,
  );
  return decoder.decode(decrypted);
}

/**
 * Encrypt arbitrary data (string) with the vault key.
 *
 * @param {string} plaintext - The data to encrypt.
 * @param {CryptoKey} vaultKey - The vault AES-GCM key.
 * @returns {Promise<{ciphertext: string, iv: string}>}
 */
export async function encrypt(plaintext, vaultKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    vaultKey,
    encoder.encode(plaintext),
  );
  return {
    ciphertext: bufToBase64(encrypted),
    iv: bufToHex(iv.buffer),
  };
}

/**
 * Decrypt data with the vault key.
 *
 * @param {string} ciphertextB64 - Base64-encoded ciphertext.
 * @param {string} ivHex - Hex-encoded IV (12 bytes).
 * @param {CryptoKey} vaultKey - The vault AES-GCM key.
 * @returns {Promise<string>} Decrypted plaintext.
 */
export async function decrypt(ciphertextB64, ivHex, vaultKey) {
  const iv = hexToBuf(ivHex);
  const encrypted = base64ToBuf(ciphertextB64);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    vaultKey,
    encrypted,
  );
  return decoder.decode(decrypted);
}