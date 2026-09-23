/**
 * use-password-policy/core
 *
 * Framework-free password validation. No React import, so it runs anywhere:
 * the browser, Node, Deno, Bun, edge functions — which lets you enforce the
 * exact same policy on the client and the server.
 */
import { COMMON_PASSWORDS } from './common-passwords';
import { checkPwnedPassword } from './pwned';
import type {
  BreachCheckOptions,
  BreachResult,
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
export { checkPwnedPassword };
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
  patternCheck: false,
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
   * at least 15 characters, allow up to 64, no composition rules, block common passwords
   * and predictable patterns. Add `breachCheck: true` to also check known breaches.
   */
  nist: {
    minLength: 15,
    maxLength: 64,
    lowercaseCheck: false,
    uppercaseCheck: false,
    numberCheck: false,
    specialCharCheck: false,
    commonPasswordCheck: true,
    patternCheck: true,
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
    patternCheck: true,
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
  noPattern: 'No repeats, sequences or keyboard patterns',
  notBreached: 'Not found in known data breaches',
  breachUnavailable: "Couldn't check known data breaches. Try again",
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

/** Length in Unicode code points, so an emoji counts as one character (as NIST specifies). */
export const passwordLength = (password: string): number => Array.from(password).length;

/** `true` when a letters-only string is made entirely of list words (e.g. "passworddragon"). */
function isCommonCombo(word: string, set: Set<string>): boolean {
  const n = word.length;
  if (n < 6) return false;
  const reachable: boolean[] = new Array(n + 1).fill(false);
  reachable[0] = true;
  for (let end = 3; end <= n; end++) {
    for (let start = Math.max(0, end - 20); start <= end - 3; start++) {
      if (reachable[start] && set.has(word.slice(start, end))) {
        reachable[end] = true;
        break;
      }
    }
  }
  return reachable[n];
}

/**
 * `true` if the password is on the list, is a list entry with simple decoration
 * (trailing digits/symbols "password123!", a leading number "123qwerty", leet swaps
 * "p@ssw0rd"), or is only list words joined together ("passwordpassword",
 * "dragon dragon dragon", "Summer2024!Summer").
 */
export function isCommonPassword(password: string, list: readonly string[] = COMMON_PASSWORDS): boolean {
  if (!password) return false;
  const set = getCommonSet(list);
  const lower = password.toLowerCase();
  const noTrailingSymbols = lower.replace(/[^a-z0-9]+$/, '');
  const trimmed = lower.replace(/[^a-z]+$/, '');
  const base = unleet(trimmed);
  const baseNoLeading = unleet(trimmed.replace(/^[^a-z]+/, ''));
  if ([lower, noTrailingSymbols, base, baseNoLeading].some((c) => c.length > 0 && set.has(c))) return true;
  const lettersOnly = lower.replace(/[^a-z]/g, '');
  const unleetedLetters = unleet(baseNoLeading).replace(/[^a-z]/g, '');
  return isCommonCombo(lettersOnly, set) || isCommonCombo(unleetedLetters, set);
}

const KEYBOARD_ROWS = ['1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm', 'abcdefghijklmnopqrstuvwxyz'];

function isStep(a: string, b: string): boolean {
  if (a === b) return false;
  for (const row of KEYBOARD_ROWS) {
    const i = row.indexOf(a);
    const j = row.indexOf(b);
    if (i >= 0 && j >= 0 && (Math.abs(i - j) === 1 || Math.abs(i - j) === row.length - 1)) return true;
  }
  return false;
}

/**
 * `true` for passwords that follow a predictable pattern: only whitespace, three or
 * fewer distinct characters ("aaaaaaaa", "abababab"), a repeated chunk ("abcabcabc",
 * "qwertyqwertyqwerty"), or mostly sequences and keyboard runs ("123456789012345",
 * "abcdefghijk", "qwertyuiop", "987654321").
 */
export function isPredictablePattern(password: string): boolean {
  if (!password) return false;
  if (password.trim() === '') return true;
  const chars = Array.from(password.toLowerCase());
  if (new Set(chars).size <= 3) return true;

  const compact = chars.filter((c) => /[a-z0-9]/.test(c) || c.toUpperCase() !== c).join('');
  for (const s of [compact, compact.replace(/\d+$/, '')]) {
    if (s.length >= 6 && /^(.+?)\1+$/.test(s)) return true;
  }

  if (chars.length >= 4) {
    let steps = 0;
    for (let i = 1; i < chars.length; i++) if (isStep(chars[i - 1], chars[i])) steps++;
    if (steps / (chars.length - 1) >= 0.75) return true;
  }
  return false;
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
    rules.push({ name: 'minLength', optionsKey: 'minLength', test: (p, o) => passwordLength(p) >= o.minLength });
  }
  if (options.maxLength > 0) {
    rules.push({ name: 'maxLength', optionsKey: 'maxLength', test: (p, o) => passwordLength(p) <= o.maxLength });
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
  if (options.patternCheck) {
    rules.push({
      name: 'noPattern',
      optionsKey: 'patternCheck',
      test: (p) => p.length > 0 && !isPredictablePattern(p),
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
// Breach check (Have I Been Pwned) as part of the result
// ---------------------------------------------------------------------------

function breachOptions(option: PasswordPolicyOptions['breachCheck']): BreachCheckOptions | null {
  if (!option) return null;
  return option === true ? {} : option;
}

/**
 * Fold a breach-check outcome into a validation result: adds a `notBreached`
 * requirement (pending while unanswered), makes `isValid` depend on it, and marks a
 * breached password Very Weak. The hook and `validatePasswordAsync` use this; you
 * only need it for custom flows.
 */
export function applyBreachResult(
  result: ValidationResult,
  breach: BreachResult,
  options: PasswordPolicyOptions = {},
): ValidationResult {
  const failOpen = (breachOptions(options.breachCheck) ?? {}).failOpen !== false;
  const resolved = resolveOptions(options);
  const message = resolveMessage({ name: 'notBreached', test: () => true }, resolved);
  const pending = breach.status === 'idle' || breach.status === 'checking';
  const passed = breach.status === 'safe' || (breach.status === 'error' && failOpen);

  const requirement: Requirement = pending
    ? { name: 'notBreached', passed: false, message, pending: true }
    : { name: 'notBreached', passed, message };
  const errors = [...result.errors];
  if (!pending && !passed) {
    errors.push(
      breach.status === 'error' ? resolveMessage({ name: 'breachUnavailable', test: () => true }, resolved) : message,
    );
  }
  const pwned = breach.status === 'pwned';
  return {
    ...result,
    isValid: result.isValid && passed,
    policyState: { ...result.policyState, notBreached: passed },
    requirements: [...result.requirements.filter((r) => r.name !== 'notBreached'), requirement],
    errors,
    strengthScore: result.strengthScore + (passed ? 1 : 0),
    strengthPercent: pwned ? 0 : result.strengthPercent,
    strengthLabel: pwned ? 'Very Weak' : result.strengthLabel,
    breach,
  };
}

/**
 * Like `validatePassword`, plus the Have I Been Pwned check when `breachCheck` is on.
 * The breach lookup only runs once every other rule passes. Use this on the server.
 *
 * ```ts
 * const { isValid, errors, breach } = await validatePasswordAsync(password, { ...presets.nist, breachCheck: true });
 * ```
 */
export async function validatePasswordAsync(
  password: string,
  options: PasswordPolicyOptions = {},
): Promise<ValidationResult> {
  const result = validatePassword(password, options);
  const b = breachOptions(options.breachCheck);
  if (!b) return result;
  if (!result.isValid) return applyBreachResult(result, { status: 'idle', count: 0 }, options);
  try {
    const count = await checkPwnedPassword(password ?? '', { fetch: b.fetch, endpoint: b.endpoint, padding: b.padding });
    return applyBreachResult(result, { status: count > 0 ? 'pwned' : 'safe', count }, options);
  } catch {
    return applyBreachResult(result, { status: 'error', count: 0 }, options);
  }
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
 * Async version of `zodPasswordRule` that also runs the breach check when
 * `breachCheck` is on. Use it with `safeParseAsync` / `parseAsync`.
 */
export function zodPasswordRuleAsync(options: PasswordPolicyOptions = {}, { allErrors = true } = {}) {
  return async (value: string, ctx: ZodLikeRefinementCtx): Promise<void> => {
    const { errors } = await validatePasswordAsync(value, options);
    for (const message of allErrors ? errors : errors.slice(0, 1)) {
      ctx.addIssue({ code: 'custom', message });
    }
  };
}

/**
 * Async version of `passwordValidator` that also runs the breach check when
 * `breachCheck` is on. react-hook-form accepts async `validate` functions.
 */
export function passwordValidatorAsync(options: PasswordPolicyOptions = {}) {
  return async (value: string): Promise<true | string> => {
    const { errors } = await validatePasswordAsync(value ?? '', options);
    return errors.length === 0 ? true : errors[0];
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
