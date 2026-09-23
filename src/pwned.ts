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

// Recent range responses, per fetch implementation, so the hook and a second
// check of the same prefix (e.g. client lane + server lane) don't refetch.
const CACHE_LIMIT = 100;
const responseCache = new WeakMap<object, Map<string, string>>();
// Requests in flight, shared so simultaneous checks of one prefix make one request.
const inflight = new WeakMap<object, Map<string, Promise<string>>>();
function inflightFor(fetchFn: object): Map<string, Promise<string>> {
  let map = inflight.get(fetchFn);
  if (!map) {
    map = new Map();
    inflight.set(fetchFn, map);
  }
  return map;
}
function cacheFor(fetchFn: object): Map<string, string> {
  let cache = responseCache.get(fetchFn);
  if (!cache) {
    cache = new Map();
    responseCache.set(fetchFn, cache);
  }
  return cache;
}

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

  const url = `${options.endpoint ?? HIBP_RANGE}${prefix}`;
  const cache = cacheFor(doFetch);
  let body = cache.get(url);
  if (body === undefined) {
    const pending = inflightFor(doFetch);
    let request = pending.get(url);
    if (!request) {
      request = (async () => {
        const res = await doFetch(url, { headers: options.padding ? { 'Add-Padding': 'true' } : undefined });
        if (!res.ok) throw new Error(`use-password-policy: breach check failed (HTTP ${res.status}).`);
        const text = await res.text();
        cache.set(url, text);
        if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
        return text;
      })().finally(() => pending.delete(url));
      pending.set(url, request);
    }
    body = await request;
    if (options.signal?.aborted) throw new DOMException('The check was cancelled.', 'AbortError');
  }

  for (const line of body.split('\n')) {
    const [lineSuffix, count] = line.trim().split(':');
    if (lineSuffix === suffix) return parseInt(count, 10) || 0;
  }
  return 0;
}
