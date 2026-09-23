/**
 * use-password-policy/core
 *
 * Framework-free password validation. No React import, so it runs anywhere:
 * the browser, Node, Deno, Bun, edge functions — which lets you enforce the
 * exact same policy on the client and the server.
 */
import { COMMON_PASSWORDS } from './common-passwords';
import type {
  PasswordPolicyOptions,
  PolicyRule,
  ResolvedPolicyOptions,
  RuleMessage,
  StrengthEstimate,
  StrengthEstimator,
  StrengthLabel,
  ValidationResult,
  Requirement,
  PasswordPolicyState,
} from './types';

export { COMMON_PASSWORDS };
export { checkPwnedPassword } from './pwned';
export type { CheckPwnedOptions } from './pwned';
export type * from './types';

// ---------------------------------------------------------------------------
// Defaults & presets
// ---------------------------------------------------------------------------

export const DEFAULT_OPTIONS: ResolvedPolicyOptions = {
  minLength: 8,
  maxLength: 0,
  lowercaseCheck: true,
  uppercaseCheck: true,
  numberCheck: true,
  specialCharCheck: true,
  commonPasswordCheck: false,
  commonPasswords: COMMON_PASSWORDS,
  customRules: [],
  messages: {},
  lowercaseRegex: /[a-z]/,
  uppercaseRegex: /[A-Z]/,
  numberRegex: /\d/,
  specialCharRegex: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/,
};

/**
 * Ready-made policies. Spread one and override what you need:
 * `usePasswordPolicy({ ...presets.nist, password })`
 */
export const presets = {
  /** The classic checklist (these are also the defaults): 8+ chars, upper, lower, number, symbol. */
  classic: {
    minLength: 8,
    lowercaseCheck: true,
    uppercaseCheck: true,
    numberCheck: true,
    specialCharCheck: true,
  },
  /**
   * NIST SP 800-63B-4 (Aug 2025) for passwords used on their own:
   * at least 15 characters, allow up to 64, no composition rules, block common passwords.
   */
  nist: {
    minLength: 15,
    maxLength: 64,
    lowercaseCheck: false,
    uppercaseCheck: false,
    numberCheck: false,
    specialCharCheck: false,
    commonPasswordCheck: true,
  },
  /** NIST SP 800-63B-4 when the password is one factor of MFA: at least 8 characters. */
  nistMfa: {
    minLength: 8,
    maxLength: 64,
    lowercaseCheck: false,
    uppercaseCheck: false,
    numberCheck: false,
    specialCharCheck: false,
    commonPasswordCheck: true,
  },
} satisfies Record<string, PasswordPolicyOptions>;

export const DEFAULT_MESSAGES: Record<string, RuleMessage> = {
  minLength: (o) => `At least ${o.minLength} characters`,
  maxLength: (o) => `At most ${o.maxLength} characters`,
  uppercase: 'An uppercase letter',
  lowercase: 'A lowercase letter',
  number: 'A number',
  specialChar: 'A special character',
  notCommon: 'Not a commonly used password',
  match: 'Passwords match',
  strength: 'Hard to guess',
};

const STRENGTH_LABELS: readonly StrengthLabel[] = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Merge user options over the defaults, ignoring keys set to `undefined`. */
export function resolveOptions(options: PasswordPolicyOptions = {}): ResolvedPolicyOptions {
  const merged: Record<string, unknown> = { ...DEFAULT_OPTIONS };
  for (const [key, value] of Object.entries(options)) {
    if (key !== 'password' && value !== undefined) merged[key] = value;
  }
  return merged as ResolvedPolicyOptions;
}

const LEET: Record<string, string> = { '@': 'a', '4': 'a', '8': 'b', '3': 'e', '1': 'i', '!': 'i', '0': 'o', '$': 's', '5': 's', '7': 't' };
const unleet = (s: string) => s.replace(/[@483!1$057]/g, (c) => LEET[c] ?? c);

const commonSetCache = new WeakMap<readonly string[], Set<string>>();
function getCommonSet(list: readonly string[]): Set<string> {
  let set = commonSetCache.get(list);
  if (!set) {
    set = new Set(list.map((p) => p.toLowerCase()));
    commonSetCache.set(list, set);
  }
  return set;
}

/**
 * `true` if the password is on the list, or is a list entry with simple
 * decoration: trailing digits/symbols ("password123!"), a leading number
 * ("123qwerty") or leet swaps ("p@ssw0rd").
 */
export function isCommonPassword(password: string, list: readonly string[] = COMMON_PASSWORDS): boolean {
  if (!password) return false;
  const set = getCommonSet(list);
  const lower = password.toLowerCase();
  const noTrailingSymbols = lower.replace(/[^a-z0-9]+$/, '');
  const trimmed = lower.replace(/[^a-z]+$/, '');
  const base = unleet(trimmed);
  const baseNoLeading = unleet(trimmed.replace(/^[^a-z]+/, ''));
  return [lower, noTrailingSymbols, base, baseNoLeading].some((c) => c.length > 0 && set.has(c));
}

const prettify = (name: string) =>
  name.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();

function resolveMessage(rule: PolicyRule, options: ResolvedPolicyOptions): string {
  const msg = options.messages[rule.name] ?? rule.message ?? DEFAULT_MESSAGES[rule.name];
  if (typeof msg === 'function') return msg(options);
  return msg ?? prettify(rule.name);
}

function builtInRules(options: ResolvedPolicyOptions, estimate?: StrengthEstimate): PolicyRule[] {
  const rules: PolicyRule[] = [];
  if (options.minLength > 0) {
    rules.push({ name: 'minLength', optionsKey: 'minLength', test: (p, o) => p.length >= o.minLength });
  }
  if (options.maxLength > 0) {
    rules.push({ name: 'maxLength', optionsKey: 'maxLength', test: (p, o) => p.length <= o.maxLength });
  }
  if (options.uppercaseCheck) {
    rules.push({ name: 'uppercase', optionsKey: 'uppercaseCheck', test: (p, o) => o.uppercaseRegex.test(p) });
  }
  if (options.lowercaseCheck) {
    rules.push({ name: 'lowercase', optionsKey: 'lowercaseCheck', test: (p, o) => o.lowercaseRegex.test(p) });
  }
  if (options.numberCheck) {
    rules.push({ name: 'number', optionsKey: 'numberCheck', test: (p, o) => o.numberRegex.test(p) });
  }
  if (options.specialCharCheck) {
    rules.push({ name: 'specialChar', optionsKey: 'specialCharCheck', test: (p, o) => o.specialCharRegex.test(p) });
  }
  if (options.commonPasswordCheck) {
    rules.push({
      name: 'notCommon',
      optionsKey: 'commonPasswordCheck',
      test: (p, o) => p.length > 0 && !isCommonPassword(p, o.commonPasswords),
    });
  }
  if (options.confirmPassword !== undefined) {
    rules.push({
      name: 'match',
      optionsKey: 'confirmPassword',
      test: (p, o) => p.length > 0 && p === o.confirmPassword,
    });
  }
  if (estimate && options.minStrength !== undefined) {
    const min = options.minStrength;
    rules.push({ name: 'strength', optionsKey: 'minStrength', test: () => estimate.score >= min });
  }
  return rules;
}

// ---------------------------------------------------------------------------
// Main API
// ---------------------------------------------------------------------------

/**
 * Validate a password against a policy. Pure and synchronous.
 *
 * ```ts
 * import { validatePassword, presets } from 'use-password-policy/core';
 * const { isValid, errors } = validatePassword(req.body.password, presets.nist);
 * ```
 */
export function validatePassword(password: string, options: PasswordPolicyOptions = {}): ValidationResult {
  const pw = password ?? '';
  const resolved = resolveOptions(options);
  const estimate = resolved.strengthEstimator ? resolved.strengthEstimator(pw) : undefined;
  const rules = [...builtInRules(resolved, estimate), ...resolved.customRules];

  const policyState: PasswordPolicyState = {};
  const requirements: Requirement[] = [];
  const errors: string[] = [];
  let passedCount = 0;

  for (const rule of rules) {
    const passed = Boolean(rule.test(pw, resolved));
    const message = resolveMessage(rule, resolved);
    policyState[rule.name] = passed;
    requirements.push({ name: rule.name, passed, message });
    if (passed) passedCount++;
    else errors.push(message);
  }

  const total = rules.length;
  let strengthPercent: number;
  let strengthLabel: StrengthLabel;

  if (estimate) {
    const score = Math.max(0, Math.min(4, Math.round(estimate.score))) as StrengthEstimate['score'];
    strengthPercent = pw.length === 0 ? 0 : score / 4;
    strengthLabel = STRENGTH_LABELS[score];
  } else {
    strengthPercent = total > 0 ? passedCount / total : 0;
    if (strengthPercent >= 1) strengthLabel = 'Very Strong';
    else if (strengthPercent >= 0.75) strengthLabel = 'Strong';
    else if (strengthPercent >= 0.5) strengthLabel = 'Medium';
    else if (strengthPercent > 0) strengthLabel = 'Weak';
    else strengthLabel = 'Very Weak';
  }

  return {
    isValid: total > 0 && passedCount === total,
    policyState,
    requirements,
    errors,
    strengthScore: passedCount,
    strengthPercent,
    strengthLabel,
    ...(estimate ? { estimate } : {}),
  };
}

// ---------------------------------------------------------------------------
// Integrations (zero dependencies — they only rely on each library's shape)
// ---------------------------------------------------------------------------

/** Anything shaped like the result of `zxcvbn(password)` or `@zxcvbn-ts/core`'s `zxcvbn(password)`. */
export interface ZxcvbnLikeResult {
  score: number;
  feedback?: { warning?: string | null; suggestions?: readonly string[] };
}

type ZxcvbnFn = (password: string, userInputs?: (string | number)[]) => ZxcvbnLikeResult;

/**
 * Wrap zxcvbn as a `strengthEstimator`. Accepts either a function
 * (`zxcvbn` package, @zxcvbn-ts v3) or an object with `check`
 * (@zxcvbn-ts v4's `new ZxcvbnFactory(options)`).
 *
 * ```ts
 * import { ZxcvbnFactory } from '@zxcvbn-ts/core';
 * const zxcvbn = new ZxcvbnFactory(options);
 * usePasswordPolicy({ password, strengthEstimator: fromZxcvbn(zxcvbn), minStrength: 3 });
 * ```
 */
export function fromZxcvbn(
  zxcvbn: ZxcvbnFn | { check: ZxcvbnFn },
  userInputs?: (string | number)[],
): StrengthEstimator {
  const run: ZxcvbnFn = typeof zxcvbn === 'function' ? zxcvbn : (pw, inputs) => zxcvbn.check(pw, inputs);
  return (password) => {
    const result = run(password, userInputs);
    const score = Math.max(0, Math.min(4, Math.round(result.score))) as StrengthEstimate['score'];
    const feedback = result.feedback?.warning || result.feedback?.suggestions?.[0] || undefined;
    return feedback ? { score, feedback } : { score };
  };
}

/** Minimal shape of Zod's refinement context (works with Zod 3 and 4). */
export interface ZodLikeRefinementCtx {
  addIssue(issue: { code: 'custom'; message: string }): void;
}

/**
 * Use your policy inside a Zod schema:
 *
 * ```ts
 * const schema = z.object({ password: z.string().superRefine(zodPasswordRule(policy)) });
 * ```
 * Adds one issue per failed rule (or only the first with `{ allErrors: false }`).
 */
export function zodPasswordRule(options: PasswordPolicyOptions = {}, { allErrors = true } = {}) {
  return (value: string, ctx: ZodLikeRefinementCtx): void => {
    const { errors } = validatePassword(value, options);
    for (const message of allErrors ? errors : errors.slice(0, 1)) {
      ctx.addIssue({ code: 'custom', message });
    }
  };
}

/**
 * A validate function that returns `true` or the first error message.
 * Drops straight into react-hook-form's `validate`, and works with anything
 * that uses the same convention.
 *
 * ```ts
 * register('password', { validate: passwordValidator(policy) })
 * ```
 */
export function passwordValidator(options: PasswordPolicyOptions = {}) {
  return (value: string): true | string => {
    const { errors } = validatePassword(value ?? '', options);
    return errors.length === 0 ? true : errors[0];
  };
}
