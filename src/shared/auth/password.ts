import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 };

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH, SCRYPT_OPTIONS).toString(
    "hex",
  );
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string | null): boolean {
  if (!storedHash) return false;
  const [scheme, salt, expectedHash] = storedHash.split("$");
  if (scheme !== "scrypt" || !salt || !expectedHash) return false;

  const actual = Buffer.from(
    scryptSync(password, salt, KEY_LENGTH, SCRYPT_OPTIONS).toString("hex"),
    "hex",
  );
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
