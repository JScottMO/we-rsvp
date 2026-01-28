/**
 * End-to-End Encryption utilities using Web Crypto API
 * 
 * The encryption key is stored in the URL hash (fragment) which is never sent to the server.
 * Only those with the full URL can decrypt the event data.
 */

// Generate a random 256-bit key and return it as a base64url string
export async function generateEncryptionKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  const rawKey = await crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64Url(rawKey);
}

// Import a base64url key string into a CryptoKey
async function importKey(keyBase64: string): Promise<CryptoKey> {
  const rawKey = base64UrlToArrayBuffer(keyBase64);
  return crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt a string and return the ciphertext as base64url (includes IV)
export async function encryptText(plaintext: string, keyBase64: string): Promise<string> {
  if (!plaintext) return '';
  
  const key = await importKey(keyBase64);
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  // Generate random 12-byte IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  // Prepend IV to ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return arrayBufferToBase64Url(combined.buffer);
}

// Decrypt a base64url ciphertext (with prepended IV) back to a string
export async function decryptText(ciphertext: string, keyBase64: string): Promise<string> {
  if (!ciphertext) return '';
  
  try {
    const key = await importKey(keyBase64);
    const combined = base64UrlToArrayBuffer(ciphertext);
    const combinedArray = new Uint8Array(combined);
    
    // Extract IV (first 12 bytes) and actual ciphertext
    const iv = combinedArray.slice(0, 12);
    const data = combinedArray.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data. The encryption key may be incorrect.');
  }
}

// Check if a string appears to be encrypted (base64url format with reasonable length)
export function isEncrypted(text: string): boolean {
  if (!text || text.length < 28) return false; // Minimum: 12-byte IV + some data
  // Check for base64url characters only
  return /^[A-Za-z0-9_-]+$/.test(text);
}

// Extract encryption key from URL hash
export function getKeyFromHash(): string | null {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return null;
  return hash.slice(1); // Remove the '#' prefix
}

// Set encryption key in URL hash without triggering navigation
export function setKeyInHash(key: string): void {
  const newUrl = `${window.location.pathname}${window.location.search}#${key}`;
  window.history.replaceState(null, '', newUrl);
}

// Utility: ArrayBuffer to base64url string
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Utility: base64url string to ArrayBuffer
function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
