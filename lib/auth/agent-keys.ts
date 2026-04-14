/**
 * Agent API Key utilities
 * Timing-safe key comparison (adapted from GODMOD3)
 */
import { timingSafeEqual, createHash, randomUUID } from 'crypto';

/** Generate a new API key with prefix for identifiability */
export function generateApiKey(): { keyId: string; apiKey: string; keyHash: string } {
  const keyId = randomUUID();
  const rawKey = randomUUID().replace(/-/g, '');
  const apiKey = `sk_souq_${rawKey}`;
  const keyHash = hashKey(apiKey);
  return { keyId, apiKey, keyHash };
}

/** Hash a key for storage (never store raw keys) */
export function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/** Timing-safe key comparison — prevents timing attacks */
export function safeKeyCompare(provided: string, stored: string): boolean {
  const hashA = createHash('sha256').update(provided).digest();
  const hashB = createHash('sha256').update(stored).digest();
  if (hashA.length !== hashB.length) return false;
  return timingSafeEqual(hashA, hashB);
}

/** Validate a key format */
export function isValidKeyFormat(key: string): boolean {
  return key.startsWith('sk_souq_') && key.length >= 40;
}

/** Agent key scopes */
export const AGENT_SCOPES = {
  read: 'read',
  write: 'write',
  purchase: 'purchase',
  admin: 'admin',
} as const;

export type AgentScope = typeof AGENT_SCOPES[keyof typeof AGENT_SCOPES];

/** Check if a scope array includes a required scope */
export function hasScope(scopes: string[], required: string): boolean {
  if (scopes.includes('admin')) return true; // admin scope grants all
  return scopes.includes(required);
}