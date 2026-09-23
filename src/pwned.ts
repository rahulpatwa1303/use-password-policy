export interface CheckPwnedOptions {
  /** Abort the request (e.g. when the user keeps typing). */
  signal?: AbortSignal;
  /** Custom fetch implementation. Defaults to the global `fetch`. */
  fetch?: typeof fetch;
  /** Range API base URL. Defaults to Have I Been Pwned. */
  endpoint?: string;
  /**
   * Ask HIBP to pad the response so its size doesn't hint at the result.
   * Sends an `Add-Padding` header. Default `false`.
   */
  padding?: boolean;
}

const HIBP_RANGE = 'https://api.pwnedpasswords.com/range/';

async function sha1Hex(input: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error(
      'use-password-policy: crypto.subtle is not available. It needs a secure context (https or localhost) in browsers, or Node 20+.',
    );
  }
  const digest = await subtle.digest('SHA-1', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * How many times this password appears in known data breaches, using the
 * Have I Been Pwned range API (k-anonymity). Only the first 5 characters of
 * the password's SHA-1 hash leave the device — never the password itself.
 *
 * Resolves to `0` when the password was not found.
 */
export async function checkPwnedPassword(password: string, options: CheckPwnedOptions = {}): Promise<number> {
  if (!password) return 0;
  const doFetch = options.fetch ?? globalThis.fetch;
  if (!doFetch) throw new Error('use-password-policy: no fetch implementation available.');

  const hash = await sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const res = await doFetch(`${options.endpoint ?? HIBP_RANGE}${prefix}`, {
    signal: options.signal,
    headers: options.padding ? { 'Add-Padding': 'true' } : undefined,
  });
  if (!res.ok) throw new Error(`use-password-policy: breach check failed (HTTP ${res.status}).`);

  const body = await res.text();
  for (const line of body.split('\n')) {
    const [lineSuffix, count] = line.trim().split(':');
    if (lineSuffix === suffix) return parseInt(count, 10) || 0;
  }
  return 0;
}
