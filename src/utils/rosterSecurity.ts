/**
 * Roster Security Utilities
 * Uses Web Crypto API and CompressionStream
 */

// Key derivation using raw SHA-256 digest for maximum transparency and reliability
export async function deriveRosterKey(agencyUserId: string, serverSecret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const data = encoder.encode(agencyUserId + serverSecret);
  const hash = await crypto.subtle.digest('SHA-256', data);
  

  return crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Compress JSON array using browser-native CompressionStream
export async function compressRoster(data: any[]): Promise<Uint8Array> {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(JSON.stringify(data)));
      controller.close();
    },
  }).pipeThrough(new CompressionStream('gzip'));

  const response = new Response(stream);
  const blob = await response.blob();
  return new Uint8Array(await blob.arrayBuffer());
}

// Decompress GZIP'd Uint8Array back to JSON array
export async function decompressRoster(blob: Uint8Array): Promise<any[]> {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(blob);
      controller.close();
    },
  }).pipeThrough(new DecompressionStream('gzip'));

  const response = new Response(stream);
  return await response.json();
}

// Encrypt Uint8Array using AES-256-GCM
export async function encryptRoster(blob: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    blob as any
  );

  // Prepend IV to the encrypted data
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encrypted), iv.length);
  return result;
}

export function ensureUint8Array(data: any): Uint8Array {
  if (!data) throw new Error("ensureUint8Array: Data is null or undefined");
  
  // 1. If already Uint8Array, return as is
  if (data instanceof Uint8Array) return data;
  
  // 2. If it's a string, treat as Base64
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (!trimmed) throw new Error("ensureUint8Array: String is empty");
    try {
      return base64ToUint8(trimmed);
    } catch (e) {
      throw new Error(`ensureUint8Array: Failed to decode Base64 string: ${e}`);
    }
  }
  
  throw new Error(`ensureUint8Array: Unsupported data type: ${typeof data}`);
}

// Decrypt Uint8Array using AES-256-GCM
export async function decryptRoster(encryptedData: any, key: CryptoKey): Promise<Uint8Array> {

  const encryptedBlob = ensureUint8Array(encryptedData);
  
  if (encryptedBlob.length < 28) {
    throw new Error(`Invalid or corrupted roster data (too small: ${encryptedBlob.length} bytes)`);
  }

  const iv = encryptedBlob.slice(0, 12);
  const data = encryptedBlob.slice(12);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data as any
    );
    return new Uint8Array(decrypted);
  } catch (err) {
    console.error("Decryption OperationError Details:", {
      blobLength: encryptedBlob.length,
      ivHex: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
      dataSample: Array.from(data.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''),
      error: err
    });
    throw err;
  }
}
