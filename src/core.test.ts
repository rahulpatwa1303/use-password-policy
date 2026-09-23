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
  passwordValidator,
  checkPwnedPassword,
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
    expect(validatePassword('passwordpassword', presets.nist).isValid).toBe(true); // not an exact/decorated match
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
