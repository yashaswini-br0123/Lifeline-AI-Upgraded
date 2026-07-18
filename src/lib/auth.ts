import crypto from "crypto";

const SECRET = process.env.JWT_SECRET || "lifeline-ai-super-secret-key-123456";

function base64url(str: string | Buffer): string {
  const buf = Buffer.isBuffer(str) ? str : Buffer.from(str);
  return buf.toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, originalHash] = stored.split(":");
  if (!salt || !originalHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === originalHash;
}

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  exp: number;
}

export function signSession(payload: Omit<SessionPayload, "exp">): string {
  // Session valid for 7 days
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  const fullPayload: SessionPayload = { ...payload, exp };
  
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const data = base64url(JSON.stringify(fullPayload));
  
  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(`${header}.${data}`);
  const signature = base64url(hmac.digest());
  
  return `${header}.${data}.${signature}`;
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, data, signature] = parts;
    
    // Verify signature
    const hmac = crypto.createHmac("sha256", SECRET);
    hmac.update(`${header}.${data}`);
    const expectedSignature = base64url(hmac.digest());
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(base64urlDecode(data)) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    
    return payload;
  } catch {
    return null;
  }
}
