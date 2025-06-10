import { useMemo } from 'react';
import { PasswordPolicyOptions, PasswordPolicyState, HookReturnValue, PolicyRule, PolicyDefaults } from './types';

const DEFAULT_POLICIES: PolicyRule[] = [
  {
    name: 'minLength',
    optionsKey: 'minLength',
    test: (password, options) => password.length >= options.minLength,
  },
  {
    name: 'uppercase',
    optionsKey: 'uppercaseCheck',
    test: (password, options) => options.uppercaseRegex.test(password),
  },
  {
    name: 'lowercase',
    optionsKey: 'lowercaseCheck',
    test: (password, options) => options.lowercaseRegex.test(password),
  },
  {
    name: 'number',
    optionsKey: 'numberCheck',
    test: (password, options) => options.numberRegex.test(password),
  },
  {
    name: 'specialChar',
    optionsKey: 'specialCharCheck',
    test: (password, options) => options.specialCharRegex.test(password),
  },
];

// FIX #2: Use the more precise PolicyDefaults type here.
const DEFAULT_OPTIONS: PolicyDefaults = {
  minLength: 8,
  lowercaseCheck: true,
  uppercaseCheck: true,
  numberCheck: true,
  specialCharCheck: true,
  customRules: [],
  lowercaseRegex: /[a-z]/,
  uppercaseRegex: /[A-Z]/,
  numberRegex: /\d/,
  specialCharRegex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/,
};

export const usePasswordPolicy = (options: PasswordPolicyOptions = {}): HookReturnValue => {
  const { password = '' } = options;

  const mergedOptions = useMemo(
    () => ({ ...DEFAULT_OPTIONS, ...options }),
    [options]
  );

  const activePolicies = useMemo(() => {
    // FIX #1: Add a check for `policy.optionsKey` before using it as an index.
    const activeDefaultPolicies = DEFAULT_POLICIES.filter(
      (policy) => policy.optionsKey && mergedOptions[policy.optionsKey]
    );
    return [...activeDefaultPolicies, ...mergedOptions.customRules];
  }, [mergedOptions]);

  const policyState = useMemo<PasswordPolicyState>(() => {
    const state: PasswordPolicyState = {};
    for (const policy of activePolicies) {
        // We cast mergedOptions here because we know it has all the required properties.
      state[policy.name] = policy.test(password, mergedOptions as Required<PasswordPolicyOptions>);
    }
    return state;
  }, [password, activePolicies, mergedOptions]);
  
  const { score, label, isValid } = useMemo(() => {
    const passedPolicies = Object.values(policyState).filter(Boolean);
    const score = passedPolicies.length;
    const totalPolicies = activePolicies.length;
    const strengthPercentage = totalPolicies > 0 ? score / totalPolicies : 0;
    
    // FIX #3: Explicitly type the `label` variable.
    let label: HookReturnValue['strengthLabel'] = 'Very Weak';
    if (strengthPercentage >= 1) {
      label = 'Very Strong';
    } else if (strengthPercentage >= 0.75) {
      label = 'Strong';
    } else if (strengthPercentage >= 0.5) {
      label = 'Medium';
    } else if (strengthPercentage > 0) {
      label = 'Weak';
    }

    return {
      score,
      label,
      isValid: score === totalPolicies && totalPolicies > 0,
    };
  }, [policyState, activePolicies]);

  return {
    password,
    policyState,
    isValid,
    strengthScore: score,
    strengthLabel: label,
  };
};