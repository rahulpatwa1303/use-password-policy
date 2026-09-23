/** Built-in strength labels, weakest to strongest. */
export type StrengthLabel = 'Very Weak' | 'Weak' | 'Medium' | 'Strong' | 'Very Strong';

/** Text for a rule: a plain string, or a function of the resolved options (handy for i18n). */
export type RuleMessage = string | ((options: ResolvedPolicyOptions) => string);

/**
 * A single validation rule. Used for both built-in and custom rules.
 */
export interface PolicyRule {
  /** Unique key. Appears in `policyState` and `requirements`. */
  name: string;
  /** For built-in rules: the option that switches the rule on. */
  optionsKey?: keyof PasswordPolicyOptions;
  /** Return `true` when the password passes. */
  test: (password: string, options: ResolvedPolicyOptions) => boolean;
  /** Human-readable requirement, e.g. "No spaces". Falls back to a prettified `name`. */
  message?: RuleMessage;
}

/**
 * Result of a strength estimator such as zxcvbn.
 * `score` uses the zxcvbn scale: 0 (too guessable) … 4 (very unguessable).
 */
export interface StrengthEstimate {
  score: 0 | 1 | 2 | 3 | 4;
  /** Optional hint to show the user, e.g. "This is a very common password". */
  feedback?: string;
}

export type StrengthEstimator = (password: string) => StrengthEstimate;

/** Every option is optional. Omitted options fall back to the defaults. */
export interface PasswordPolicyOptions {
  /** The password to validate (hook only — `validatePassword` takes it as the first argument). */
  password?: string;

  /** Minimum length. Default `8`. */
  minLength?: number;
  /** Maximum length. Default `0` (no maximum). */
  maxLength?: number;
  /** Require a lowercase letter. Default `true`. */
  lowercaseCheck?: boolean;
  /** Require an uppercase letter. Default `true`. */
  uppercaseCheck?: boolean;
  /** Require a digit. Default `true`. */
  numberCheck?: boolean;
  /** Require a special character. Default `true`. */
  specialCharCheck?: boolean;

  /** Reject very common passwords ("password", "qwerty123", "Password1!" …). Default `false`. */
  commonPasswordCheck?: boolean;
  /** Replace the built-in common-password list. */
  commonPasswords?: readonly string[];

  /**
   * Reject predictable patterns: repeated characters (`aaaaaaaa`), repeated chunks
   * (`abcabcabc`), sequences and keyboard runs (`123456789`, `qwertyuiop`), and passwords
   * made of only a few distinct characters (including all spaces). Default `false`;
   * on in the NIST presets.
   */
  patternCheck?: boolean;

  /**
   * Check Have I Been Pwned as part of the result. The hook runs it automatically once
   * every other rule passes; on the server use `validatePasswordAsync`. The synchronous
   * `validatePassword` ignores this option. Default `false`.
   */
  breachCheck?: boolean | BreachCheckOptions;

  /**
   * When set (even to `''`), adds a `match` rule that passes only if
   * `password === confirmPassword`.
   */
  confirmPassword?: string;

  /**
   * Plug in a real strength estimator (e.g. zxcvbn via `fromZxcvbn`).
   * When set, `strengthLabel` and `strengthPercent` come from the estimator.
   */
  strengthEstimator?: StrengthEstimator;
  /** With `strengthEstimator`: minimum score (0–4) required. Adds a `strength` rule. */
  minStrength?: 0 | 1 | 2 | 3 | 4;

  /** Your own rules, checked after the built-in ones. */
  customRules?: PolicyRule[];

  /** Override requirement text per rule name, e.g. `{ minLength: 'Mindestens 8 Zeichen' }`. */
  messages?: Partial<Record<string, RuleMessage>>;

  lowercaseRegex?: RegExp;
  uppercaseRegex?: RegExp;
  numberRegex?: RegExp;
  specialCharRegex?: RegExp;
}

export interface BreachCheckOptions {
  /**
   * What to do when the breach service can't be reached: `true` lets the password
   * through (the requirement passes and `breach.status` is `'error'`), `false` blocks it.
   * Default `true`.
   */
  failOpen?: boolean;
  /** Hook only: wait this long after the last keystroke. Default `500` ms. */
  debounceMs?: number;
  /** Custom fetch implementation. */
  fetch?: typeof fetch;
  /** Range API base URL. Defaults to Have I Been Pwned. */
  endpoint?: string;
  /** Send the `Add-Padding` header. Default `false`. */
  padding?: boolean;
}

export type BreachStatus = 'idle' | 'checking' | 'safe' | 'pwned' | 'error';

export interface BreachResult {
  /**
   * `idle`: not checked yet (other rules still failing, or no input).
   * `checking`: request in flight. `safe` / `pwned`: answered. `error`: couldn't reach the service.
   */
  status: BreachStatus;
  /** Times seen in breaches (0 unless `pwned`). */
  count: number;
}

/** Options after defaults are applied. Passed to every rule's `test`. */
export type ResolvedPolicyOptions = Required<
  Omit<
    PasswordPolicyOptions,
    'password' | 'confirmPassword' | 'strengthEstimator' | 'minStrength' | 'breachCheck'
  >
> &
  Pick<PasswordPolicyOptions, 'confirmPassword' | 'strengthEstimator' | 'minStrength' | 'breachCheck'>;

/** @deprecated Use `ResolvedPolicyOptions`. */
export type PolicyDefaults = ResolvedPolicyOptions;

/** Pass/fail for each active rule, keyed by rule name. */
export interface PasswordPolicyState {
  [key: string]: boolean;
}

/** One row of a requirements checklist. */
export interface Requirement {
  name: string;
  passed: boolean;
  message: string;
  /** `true` while the result isn't known yet (the breach check before it has answered). */
  pending?: boolean;
}

/** Result of `validatePassword` (and the hook). */
export interface ValidationResult {
  /** `true` only when every active rule passes. */
  isValid: boolean;
  /** Pass/fail per rule name. */
  policyState: PasswordPolicyState;
  /** Ordered checklist with human-readable messages. */
  requirements: Requirement[];
  /** Messages of the rules that failed, in order. Handy for form errors. */
  errors: string[];
  /** Number of rules that passed. */
  strengthScore: number;
  /** 0–1. Share of rules passed, or the estimator score / 4 when an estimator is set. */
  strengthPercent: number;
  strengthLabel: StrengthLabel;
  /** The estimator's result, if `strengthEstimator` is set. */
  estimate?: StrengthEstimate;
  /** Breach-check state, when `breachCheck` is on (hook and `validatePasswordAsync`). */
  breach?: BreachResult;
}

/** What `usePasswordPolicy` returns. */
export interface HookReturnValue extends ValidationResult {
  password?: string;
}
