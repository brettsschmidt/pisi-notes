const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/**
 * A 12-character random public id for /i/<slug> (~70 bits). Unguessable, so a
 * rotator's URL can't be enumerated, and free of look-alike characters.
 */
export function generateSlug(length = 12): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export const SLUG_PATTERN = /^[A-Za-z0-9]{8,32}$/;
