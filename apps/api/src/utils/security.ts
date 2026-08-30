// WebCrypto-based JWT and sanitization utilities (Cloudflare Edge compatible)

export async function signJwt(
  payload: Record<string, any>,
  secret: string
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );

  const encodedSignature = base64UrlEncodeArrayBuffer(signature);
  return `${data}.${encodedSignature}`;
}

export async function verifyJwt<T = Record<string, any>>(
  token: string,
  secret: string
): Promise<{ valid: boolean; payload?: T }> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return { valid: false };

    const [header, payload, signature] = parts;
    const data = `${header}.${payload}`;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBuffer = base64UrlDecodeToArrayBuffer(signature);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBuffer,
      new TextEncoder().encode(data)
    );

    if (!isValid) return { valid: false };

    const parsedPayload = JSON.parse(
      new TextDecoder().decode(base64UrlDecodeToArrayBuffer(payload))
    );

    // Check expiration if present
    if (parsedPayload.exp && Date.now() / 1000 > parsedPayload.exp) {
      return { valid: false };
    }

    return { valid: true, payload: parsedPayload };
  } catch {
    return { valid: false };
  }
}

// Basic HTML sanitization for XSS prevention (preserves slashes for normal text/paths)
export function sanitizeText(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function sanitizeUrl(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return "";
}

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  return base64UrlEncodeArrayBuffer(bytes.buffer as ArrayBuffer);
}

function base64UrlEncodeArrayBuffer(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecodeToArrayBuffer(base64url: string): ArrayBuffer {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
