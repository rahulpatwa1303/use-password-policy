import { useEffect, useMemo, useState } from 'react';
import { validatePassword } from './core';
import { checkPwnedPassword, type CheckPwnedOptions } from './pwned';
import type { PasswordPolicyOptions, HookReturnValue } from './types';

/**
 * Validate a password as the user types.
 *
 * Tip: if you pass an expensive `strengthEstimator` (like zxcvbn), memoize
 * your options object so it is only recomputed when the password changes.
 */
export const usePasswordPolicy = (options: PasswordPolicyOptions = {}): HookReturnValue => {
  const { password = '' } = options;
  const result = useMemo(() => validatePassword(password, options), [password, options]);
  return { password, ...result };
};

export type PwnedStatus = 'idle' | 'checking' | 'safe' | 'pwned' | 'error';

export interface UsePwnedPasswordOptions extends Omit<CheckPwnedOptions, 'signal'> {
  /** Turn the check on/off (e.g. only once the policy passes). Default `true`. */
  enabled?: boolean;
  /** Wait this long after the last keystroke before checking. Default `500` ms. */
  debounceMs?: number;
}

export interface UsePwnedPasswordResult {
  status: PwnedStatus;
  /** Times seen in breaches (0 when safe or unknown). */
  count: number;
  isPwned: boolean;
  error?: Error;
}

/**
 * Check the password against Have I Been Pwned while the user types
 * (debounced, cancels stale requests). Only a 5-character hash prefix is sent.
 */
export function usePwnedPassword(password: string, options: UsePwnedPasswordOptions = {}): UsePwnedPasswordResult {
  const { enabled = true, debounceMs = 500, fetch: customFetch, endpoint, padding } = options;
  const [state, setState] = useState<UsePwnedPasswordResult>({ status: 'idle', count: 0, isPwned: false });

  useEffect(() => {
    if (!enabled || !password) {
      setState({ status: 'idle', count: 0, isPwned: false });
      return;
    }
    const controller = new AbortController();
    setState((s) => (s.status === 'checking' ? s : { status: 'checking', count: 0, isPwned: false }));
    const timer = setTimeout(() => {
      checkPwnedPassword(password, { signal: controller.signal, fetch: customFetch, endpoint, padding })
        .then((count) => {
          if (!controller.signal.aborted) {
            setState({ status: count > 0 ? 'pwned' : 'safe', count, isPwned: count > 0 });
          }
        })
        .catch((error: Error) => {
          if (!controller.signal.aborted) setState({ status: 'error', count: 0, isPwned: false, error });
        });
    }, debounceMs);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [password, enabled, debounceMs, customFetch, endpoint, padding]);

  return state;
}
