export interface ConsentSettings {
  analytics: boolean;
  advertising: boolean;
}

const CONSENT_STORAGE_KEY = 'postchars-consent-v1';
const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

/** Pure validator for stored consent. Rejects future, expired and malformed timestamps. */
export function parseStoredConsent(raw: string, now = Date.now()): ConsentSettings | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    if (!('analytics' in parsed) || !('advertising' in parsed) || !('updatedAt' in parsed)) return null;
    if (typeof parsed.analytics !== 'boolean' || typeof parsed.advertising !== 'boolean' ||
        typeof parsed.updatedAt !== 'number' || !Number.isFinite(parsed.updatedAt)) return null;
    const age = now - parsed.updatedAt;
    // Fail closed for tampered/future-dated records, even if not yet expired.
    if (age < 0 || age > CONSENT_MAX_AGE_MS) return null;
    return { analytics: parsed.analytics, advertising: parsed.advertising };
  } catch { return null; }
}

export function readConsent(): ConsentSettings | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;

    return parseStoredConsent(raw);
  } catch {
    return null;
  }
}

export function saveConsent(settings: ConsentSettings): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ ...settings, updatedAt: Date.now() }));
  } catch {
    // If storage is unavailable, the current-page choice still applies in memory.
  }
}
