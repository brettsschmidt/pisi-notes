import "server-only";

// Minimal Web Push (RFC 8030 + RFC 8291) sender. Uses Web Crypto so it runs
// in both Node 22 and Cloudflare Workers. Implements aes128gcm content
// encoding with VAPID auth.
//
// You don't normally want to hand-roll this — it exists so the project has
// zero native deps. If something here misbehaves and you don't care about
// the Workers runtime, swap in the `web-push` npm package on Node.

export interface PushSubscription {
  endpoint: string;
  p256dh: string; // base64url, uncompressed P-256 point
  auth: string;   // base64url, 16 bytes
}

export interface VapidKeys {
  publicKey: string;  // base64url uncompressed P-256 point (65 bytes)
  privateKey: string; // base64url 32-byte scalar
  subject: string;    // mailto:foo@bar or https://example.com
}

export interface SendResult {
  ok: boolean;
  status: number;
  /** 404 / 410 from the push service: the subscription is dead. */
  gone: boolean;
  body?: string;
}

export async function sendPush(
  sub: PushSubscription,
  payload: string,
  vapid: VapidKeys,
  opts: { ttl?: number; urgency?: "very-low" | "low" | "normal" | "high" } = {},
): Promise<SendResult> {
  const ttl = opts.ttl ?? 60 * 60 * 24; // 24h
  const urgency = opts.urgency ?? "normal";

  const audience = new URL(sub.endpoint).origin;
  const jwt = await signVapidJwt(audience, vapid);
  const encrypted = await encryptPayload(payload, sub);

  const headers: Record<string, string> = {
    "TTL": String(ttl),
    "Urgency": urgency,
    "Content-Encoding": "aes128gcm",
    "Content-Type": "application/octet-stream",
    "Authorization": `vapid t=${jwt}, k=${vapid.publicKey}`,
  };

  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers,
    body: toAB(encrypted),
  });

  const gone = res.status === 404 || res.status === 410;
  return {
    ok: res.ok,
    status: res.status,
    gone,
    body: res.ok ? undefined : await res.text().catch(() => undefined),
  };
}

// --- VAPID -----------------------------------------------------------------

async function signVapidJwt(audience: string, vapid: VapidKeys): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 11; // < 24h
  const payload = { aud: audience, exp, sub: vapid.subject };
  const signingInput = `${b64urlJson(header)}.${b64urlJson(payload)}`;

  const key = await importVapidPrivateKey(vapid.privateKey, vapid.publicKey);
  const sig = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      toAB(new TextEncoder().encode(signingInput)),
    ),
  );
  return `${signingInput}.${b64url(sig)}`;
}

async function importVapidPrivateKey(privBase64Url: string, pubBase64Url: string): Promise<CryptoKey> {
  // Web Crypto needs JWK form for ECDSA private keys.
  const pubRaw = b64urlDecode(pubBase64Url);
  if (pubRaw.length !== 65 || pubRaw[0] !== 0x04) {
    throw new Error("VAPID public key must be 65-byte uncompressed P-256");
  }
  const x = pubRaw.slice(1, 33);
  const y = pubRaw.slice(33, 65);
  const d = b64urlDecode(privBase64Url);
  if (d.length !== 32) throw new Error("VAPID private key must be 32 bytes");

  const jwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x: b64url(x),
    y: b64url(y),
    d: b64url(d),
    ext: true,
  };
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
}

// --- Payload encryption (aes128gcm, RFC 8188 / 8291) -----------------------

async function encryptPayload(plaintext: string, sub: PushSubscription): Promise<Uint8Array> {
  const data = new TextEncoder().encode(plaintext);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Ephemeral sender key pair.
  const senderKp = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  const senderPubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", senderKp.publicKey));

  const uaPubRaw = b64urlDecode(sub.p256dh);
  const uaAuth = b64urlDecode(sub.auth);

  const uaPubKey = await crypto.subtle.importKey(
    "raw",
    toAB(uaPubRaw),
    { name: "ECDH", namedCurve: "P-256" },
    true,
    [],
  );

  // ECDH shared secret.
  const ecdh = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: uaPubKey }, senderKp.privateKey, 256),
  );

  // PRK_key = HMAC-SHA-256(auth, ecdh)
  const prkKey = await hmac(uaAuth, ecdh);
  // key_info = "WebPush: info\0" || ua_public || as_public
  const keyInfo = concat(
    new TextEncoder().encode("WebPush: info\0"),
    uaPubRaw,
    senderPubRaw,
  );
  // IKM = HMAC(PRK_key, key_info || 0x01)
  const ikm = await hmac(prkKey, concat(keyInfo, new Uint8Array([0x01])));

  // PRK = HMAC(salt, IKM)
  const prk = await hmac(salt, ikm);

  // CEK = HMAC(PRK, "Content-Encoding: aes128gcm\0" || 0x01) [:16]
  const cek = (
    await hmac(prk, concat(new TextEncoder().encode("Content-Encoding: aes128gcm\0"), new Uint8Array([0x01])))
  ).slice(0, 16);
  // NONCE = HMAC(PRK, "Content-Encoding: nonce\0" || 0x01) [:12]
  const nonce = (
    await hmac(prk, concat(new TextEncoder().encode("Content-Encoding: nonce\0"), new Uint8Array([0x01])))
  ).slice(0, 12);

  // Pad with 0x02 trailer (single chunk).
  const padded = concat(data, new Uint8Array([0x02]));

  const cekKey = await crypto.subtle.importKey("raw", toAB(cek), { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: toAB(nonce) }, cekKey, toAB(padded)),
  );

  // RFC 8188 header: salt(16) || rs(4 BE) || idlen(1) || keyid
  const rs = 4096;
  const header = new Uint8Array(16 + 4 + 1 + senderPubRaw.length);
  header.set(salt, 0);
  // rs as big-endian uint32
  header[16] = (rs >>> 24) & 0xff;
  header[17] = (rs >>> 16) & 0xff;
  header[18] = (rs >>> 8) & 0xff;
  header[19] = rs & 0xff;
  header[20] = senderPubRaw.length;
  header.set(senderPubRaw, 21);

  return concat(header, ciphertext);
}

// --- Helpers ---------------------------------------------------------------

/** Copy a Uint8Array into a fresh ArrayBuffer so it satisfies BufferSource. */
function toAB(u: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u.byteLength);
  new Uint8Array(ab).set(u);
  return ab;
}

async function hmac(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey(
    "raw",
    toAB(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, toAB(data)));
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlJson(obj: unknown): string {
  return b64url(new TextEncoder().encode(JSON.stringify(obj)));
}

export function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}
