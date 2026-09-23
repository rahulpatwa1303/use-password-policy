import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ZxcvbnFactory } from '@zxcvbn-ts/core';
import * as zxcvbnCommon from '@zxcvbn-ts/language-common';
import * as zxcvbnEn from '@zxcvbn-ts/language-en';
import {
  validatePassword,
  presets,
  isCommonPassword,
  fromZxcvbn,
  zodPasswordRule,
  zodPasswordRuleAsync,
  passwordValidator,
  passwordValidatorAsync,
  checkPwnedPassword,
  isPredictablePattern,
  passwordLength,
  validatePasswordAsync,
  applyBreachResult,
} from './core';

describe('validatePassword — defaults (backwards compatible with v2)', () => {
  it('uses the classic checklist by default', () => {
    const r = validatePassword('');
    expect(Object.keys(r.policyState)).toEqual(['minLength', 'uppercase', 'lowercase', 'number', 'specialChar']);
    expect(r.isValid).toBe(false);
    expect(r.strengthLabel).toBe('Very Weak');
  });

  it('passes a password meeting every rule', () => {
    const r = validatePassword('Abcdef1!');
    expect(r.isValid).toBe(true);
    expect(r.strengthScore).toBe(5);
    expect(r.strengthPercent).toBe(1);
    expect(r.strengthLabel).toBe('Very Strong');
    expect(r.errors).toEqual([]);
  });

  it('reports failures in order with readable messages', () => {
    const r = validatePassword('abc');
    expect(r.errors).toEqual(['At least 8 characters', 'An uppercase letter', 'A number', 'A special character']);
    expect(r.requirements.find((x) => x.name === 'lowercase')).toEqual({
      name: 'lowercase',
      passed: true,
      message: 'A lowercase letter',
    });
    expect(r.strengthLabel).toBe('Weak');
  });

  it('ignores options explicitly set to undefined', () => {
    expect(validatePassword('Abcdef1!', { minLength: undefined }).policyState.minLength).toBe(true);
  });

  it('can switch individual rules off', () => {
    const r = validatePassword('abcdefgh', { uppercaseCheck: false, numberCheck: false, specialCharCheck: false });
    expect(r.isValid).toBe(true);
  });

  it('is invalid when no rules are active', () => {
    const r = validatePassword('x', { minLength: 0, uppercaseCheck: false, lowercaseCheck: false, numberCheck: false, specialCharCheck: false });
    expect(r.isValid).toBe(false);
  });
});

describe('new built-in rules', () => {
  it('maxLength', () => {
    expect(validatePassword('a'.repeat(65), { ...presets.nist }).policyState.maxLength).toBe(false);
    expect(validatePassword('a'.repeat(64), { ...presets.nist }).policyState.maxLength).toBe(true);
  });

  it('confirmPassword adds a match rule', () => {
    expect(validatePassword('Abcdef1!', { confirmPassword: 'Abcdef1!' }).policyState.match).toBe(true);
    expect(validatePassword('Abcdef1!', { confirmPassword: 'nope' }).isValid).toBe(false);
    expect(validatePassword('', { confirmPassword: '' }).policyState.match).toBe(false);
    expect(validatePassword('Abcdef1!').policyState.match).toBeUndefined();
  });

  it('commonPasswordCheck catches decorated common passwords', () => {
    const opts = { commonPasswordCheck: true };
    for (const pw of ['Password123!', 'P@ssw0rd', 'qwerty2024', '123qwerty', 'Iloveyou1!', '12345678', 'Monkey!!']) {
      expect(validatePassword(pw, opts).policyState.notCommon, pw).toBe(false);
    }
    for (const pw of ['correct horse battery staple', 'Tr0ub4dor&3xq', 'passwordmanager-is-great']) {
      expect(validatePassword(pw, opts).policyState.notCommon, pw).toBe(true);
    }
  });

  it('accepts a custom common-password list', () => {
    expect(isCommonPassword('acme2024!', ['acme'])).toBe(true);
    expect(isCommonPassword('password', ['acme'])).toBe(false);
  });
});

describe('presets', () => {
  it('nist: long passphrases pass without composition rules; common ones fail', () => {
    expect(validatePassword('correct horse battery staple', presets.nist).isValid).toBe(true);
    expect(validatePassword('Abcdef1!', presets.nist).isValid).toBe(false);
    expect(validatePassword('Password123456789!', presets.nist).policyState.notCommon).toBe(false);
  });

  it('nistMfa allows 8 characters', () => {
    expect(validatePassword('tangerine', presets.nistMfa).isValid).toBe(true);
  });
});

describe('messages & custom rules', () => {
  it('overrides messages with strings or functions (i18n)', () => {
    const r = validatePassword('', {
      messages: { minLength: (o) => `Mindestens ${o.minLength} Zeichen`, uppercase: 'Ein Großbuchstabe' },
    });
    expect(r.errors[0]).toBe('Mindestens 8 Zeichen');
    expect(r.errors[1]).toBe('Ein Großbuchstabe');
  });

  it('custom rules use their message, or a prettified name', () => {
    const r = validatePassword('has space', {
      customRules: [
        { name: 'noSpaces', test: (p) => !/\s/.test(p), message: 'No spaces' },
        { name: 'startsWithLetter', test: (p) => /^[a-z]/i.test(p) },
      ],
    });
    expect(r.requirements.slice(-2)).toEqual([
      { name: 'noSpaces', passed: false, message: 'No spaces' },
      { name: 'startsWithLetter', passed: true, message: 'Starts With Letter' },
    ]);
  });
});

describe('strength estimator (zxcvbn)', () => {
  const zxcvbn = new ZxcvbnFactory({
    dictionary: { ...zxcvbnCommon.dictionary, ...zxcvbnEn.dictionary },
    graphs: zxcvbnCommon.adjacencyGraphs,
    translations: zxcvbnEn.translations,
  });
  const estimator = fromZxcvbn(zxcvbn);

  it('also accepts a plain function', () => {
    const fn = fromZxcvbn((pw) => zxcvbn.check(pw));
    expect(fn('qwerty').score).toBe(0);
  });

  it('labels come from the estimator', () => {
    const weak = validatePassword('Password1!', { strengthEstimator: estimator });
    expect(weak.isValid).toBe(true); // passes the checklist…
    expect(weak.estimate!.score).toBeLessThanOrEqual(2); // …but is easy to guess
    expect(['Very Weak', 'Weak', 'Medium']).toContain(weak.strengthLabel);

    const strong = validatePassword('violet-Trombone-47-glacier!', { strengthEstimator: estimator });
    expect(strong.estimate!.score).toBe(4);
    expect(strong.strengthLabel).toBe('Very Strong');
    expect(strong.strengthPercent).toBe(1);
  });

  it('minStrength adds a strength rule', () => {
    const r = validatePassword('Password1!', { strengthEstimator: estimator, minStrength: 3 });
    expect(r.policyState.strength).toBe(false);
    expect(r.isValid).toBe(false);
    expect(r.errors).toContain('Hard to guess');
  });

  it('passes feedback through', () => {
    const r = validatePassword('qwerty', { strengthEstimator: estimator });
    expect(typeof r.estimate!.feedback).toBe('string');
  });
});

describe('integrations', () => {
  const policy = { ...presets.nistMfa };

  it('zod: adds one issue per failed rule', () => {
    const schema = z.object({ password: z.string().superRefine(zodPasswordRule(policy)) });
    const bad = schema.safeParse({ password: 'monkey1' });
    expect(bad.success).toBe(false);
    expect(bad.error!.issues.map((i) => i.message)).toEqual(['At least 8 characters', 'Not a commonly used password']);
    expect(schema.safeParse({ password: 'tangerine dream' }).success).toBe(true);
  });

  it('zod: allErrors=false reports only the first', () => {
    const schema = z.string().superRefine(zodPasswordRule(policy, { allErrors: false }));
    expect(schema.safeParse('monkey1').error!.issues).toHaveLength(1);
  });

  it('passwordValidator returns true or the first error (react-hook-form style)', () => {
    const validate = passwordValidator(policy);
    expect(validate('tangerine dream')).toBe(true);
    expect(validate('abc')).toBe('At least 8 characters');
  });
});

describe('checkPwnedPassword', () => {
  // SHA-1("password") = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
  const body = [
    '003D68EB55068C33ACE09247EE4C639306B:3',
    '1E4C9B93F3F0682250B6CF8331B7EE68FD8:10434004',
    '01330C689E5D64F660D6947A93AD634EF8F:0',
  ].join('\r\n');

  it('sends only the 5-char prefix and returns the count', async () => {
    const fetchMock = vi.fn(async () => new Response(body));
    const count = await checkPwnedPassword('password', { fetch: fetchMock as unknown as typeof fetch });
    expect(count).toBe(10434004);
    const [url] = fetchMock.mock.calls[0] as unknown as [string];
    expect(url).toBe('https://api.pwnedpasswords.com/range/5BAA6');
    expect(url.split('/range/')[1]).toHaveLength(5);
  });

  it('returns 0 when not found, and for empty input', async () => {
    const fetchMock = vi.fn(async () => new Response(body));
    expect(await checkPwnedPassword('a-very-unique-passphrase', { fetch: fetchMock as unknown as typeof fetch })).toBe(0);
    expect(await checkPwnedPassword('', { fetch: fetchMock as unknown as typeof fetch })).toBe(0);
  });

  it('throws on HTTP errors', async () => {
    const fetchMock = vi.fn(async () => new Response('nope', { status: 503 }));
    await expect(checkPwnedPassword('x', { fetch: fetchMock as unknown as typeof fetch })).rejects.toThrow(/503/);
  });

  it('sends the padding header only when asked', async () => {
    const fetchMock = vi.fn(async () => new Response(body));
    await checkPwnedPassword('password', { fetch: fetchMock as unknown as typeof fetch, padding: true });
    expect((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].headers).toEqual({ 'Add-Padding': 'true' });
  });
});

// ---------------------------------------------------------------------------
// 3.1.0: the cases found by trying to break the NIST preset by hand
// ---------------------------------------------------------------------------

describe('NIST preset: manual break attempts are now rejected', () => {
  const rejected: [string, string][] = [
    ['aaaaaaaaaaaaaaa', 'repeated character'],
    ['123456789012345', 'number sequence'],
    ['qwertyqwertyqwerty', 'repeated keyboard run'],
    ['passwordpassword', 'doubled common word'],
    ['dragon dragon dragon', 'repeated word with spaces'],
    ['               ', 'only spaces'],
    ['abababababababab', 'two characters alternating'],
    ['abcdefghijklmnopq', 'alphabet run'],
    ['987654321098765', 'descending sequence'],
    ['qwertyuiopasdfghjkl', 'keyboard rows'],
    ['Summer2024!Summer', 'common word twice around digits'],
    ['passwordqwerty2024', 'two common words joined'],
    ['🔥🔥🔥🔥🔥🔥🔥🔥', 'eight emoji are eight characters'],
  ];
  it.each(rejected)('%s (%s)', (pw) => {
    expect(validatePassword(pw, presets.nist).isValid).toBe(false);
  });

  const accepted = [
    'correct horse battery staple',
    'violet-trombone-glacier-47',
    'my cat eats pancakes at noon',
    'Tr0ub4dor&3 is not enough',
    'ünïcödé pässwörd phrase',
  ];
  it.each(accepted)('still accepts a real passphrase: %s', (pw) => {
    const r = validatePassword(pw, presets.nist);
    expect(r.errors).toEqual([]);
    expect(r.isValid).toBe(true);
  });

  it('reports the pattern rule with a readable message', () => {
    const r = validatePassword('aaaaaaaaaaaaaaa', presets.nist);
    expect(r.policyState.noPattern).toBe(false);
    expect(r.errors).toContain('No repeats, sequences or keyboard patterns');
  });

  it('pattern check is off by default (classic behaviour unchanged)', () => {
    expect(validatePassword('Aa1!Aa1!Aa1!').policyState.noPattern).toBeUndefined();
  });
});

describe('isPredictablePattern', () => {
  it.each(['aaaa', '1111111', 'abcabcabc', 'zxcvbnm', '0123456789', 'aAaAaAaA', '\t\t  \t'])('flags %s', (pw) => {
    expect(isPredictablePattern(pw)).toBe(true);
  });
  it.each(['', 'correct horse', 'glacier47!', 'Xk9#pL2m'])('does not flag %j', (pw) => {
    expect(isPredictablePattern(pw)).toBe(false);
  });
});

describe('length counts Unicode code points (NIST)', () => {
  it('counts an emoji as one character', () => {
    expect(passwordLength('🔥')).toBe(1);
    expect(passwordLength('pässwörd')).toBe(8);
    expect(validatePassword('🔥🔥🔥🔥🔥🔥🔥🔥', { minLength: 8, uppercaseCheck: false, lowercaseCheck: false, numberCheck: false, specialCharCheck: false }).policyState.minLength).toBe(true);
    expect(validatePassword('🔥🔥🔥🔥', { minLength: 8 }).policyState.minLength).toBe(false);
  });
  it('maxLength also counts code points', () => {
    expect(validatePassword('🔥'.repeat(64), { ...presets.nist, patternCheck: false }).policyState.maxLength).toBe(true);
    expect(validatePassword('🔥'.repeat(65), presets.nist).policyState.maxLength).toBe(false);
  });
});

describe('breach check as part of the result', () => {
  // SHA-1("password") starts 5BAA6; "correct horse battery staple" is not in this body.
  const body = '1E4C9B93F3F0682250B6CF8331B7EE68FD8:10434004\r\n003D68EB55068C33ACE09247EE4C639306B:3';
  const okFetch = () => vi.fn(async () => new Response(body)) as unknown as typeof fetch;
  const downFetch = () => vi.fn(async () => new Response('', { status: 503 })) as unknown as typeof fetch;
  const policy = (f: typeof fetch, failOpen?: boolean) =>
    ({ minLength: 8, uppercaseCheck: false, numberCheck: false, specialCharCheck: false, breachCheck: { fetch: f, failOpen } });

  it('validatePassword (sync) ignores breachCheck', () => {
    const r = validatePassword('password', policy(okFetch()));
    expect(r.isValid).toBe(true);
    expect(r.breach).toBeUndefined();
  });

  it('async: a breached password fails with a clear error and is Very Weak', async () => {
    const r = await validatePasswordAsync('password', policy(okFetch()));
    expect(r.isValid).toBe(false);
    expect(r.breach).toEqual({ status: 'pwned', count: 10434004 });
    expect(r.policyState.notBreached).toBe(false);
    expect(r.errors).toEqual(['Not found in known data breaches']);
    expect(r.strengthLabel).toBe('Very Weak');
  });

  it('async: a clean password passes', async () => {
    const r = await validatePasswordAsync('correct horse battery staple', policy(okFetch()));
    expect(r.isValid).toBe(true);
    expect(r.breach).toEqual({ status: 'safe', count: 0 });
    expect(r.requirements.at(-1)).toEqual({ name: 'notBreached', passed: true, message: 'Not found in known data breaches' });
  });

  it('async: skips the lookup while other rules fail (requirement stays pending)', async () => {
    const fetch = okFetch();
    const r = await validatePasswordAsync('short', policy(fetch));
    expect(fetch).not.toHaveBeenCalled();
    expect(r.breach?.status).toBe('idle');
    expect(r.requirements.at(-1)?.pending).toBe(true);
    expect(r.errors).toEqual(['At least 8 characters']);
  });

  it('async: fails open by default when the service is down', async () => {
    const r = await validatePasswordAsync('correct horse battery staple', policy(downFetch()));
    expect(r.isValid).toBe(true);
    expect(r.breach?.status).toBe('error');
  });

  it('async: failOpen: false blocks when the service is down', async () => {
    const r = await validatePasswordAsync('correct horse battery staple', policy(downFetch(), false));
    expect(r.isValid).toBe(false);
    expect(r.errors).toEqual(["Couldn't check known data breaches. Try again"]);
  });

  it('applyBreachResult keeps the sync result and adds the requirement', () => {
    const base = validatePassword('correct horse battery staple', presets.nist);
    const checking = applyBreachResult(base, { status: 'checking', count: 0 }, { breachCheck: true });
    expect(checking.isValid).toBe(false);
    expect(checking.errors).toEqual([]);
    expect(checking.requirements.at(-1)).toMatchObject({ name: 'notBreached', pending: true });
  });

  it('shares one request between simultaneous checks of the same prefix', async () => {
    const fetch = okFetch();
    await Promise.all([checkPwnedPassword('password', { fetch }), checkPwnedPassword('password', { fetch })]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('caches range responses so a repeat check does not refetch', async () => {
    const fetch = okFetch();
    await checkPwnedPassword('password', { fetch });
    await checkPwnedPassword('password', { fetch });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('zodPasswordRuleAsync and passwordValidatorAsync include the breach check', async () => {
    const p = policy(okFetch());
    const schema = z.string().superRefine(zodPasswordRuleAsync(p));
    const bad = await schema.safeParseAsync('password');
    expect(bad.error!.issues.map((i) => i.message)).toEqual(['Not found in known data breaches']);
    expect((await schema.safeParseAsync('correct horse battery staple')).success).toBe(true);
    expect(await passwordValidatorAsync(p)('password')).toBe('Not found in known data breaches');
    expect(await passwordValidatorAsync(p)('correct horse battery staple')).toBe(true);
    // the sync helpers keep working without the network
    expect(zodPasswordRule(p)).toBeTypeOf('function');
    expect(passwordValidator(p)('password')).toBe(true);
  });
});
