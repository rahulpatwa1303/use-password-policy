// A generic structure for any validation rule.
// Used for both default and custom rules.
export interface PolicyRule {
  name: string;
  optionsKey?: keyof PasswordPolicyOptions;
  test: (password: string, options: Required<PasswordPolicyOptions>) => boolean;
}

// All options are optional for the user.
export interface PasswordPolicyOptions {
  password?: string;
  minLength?: number;
  lowercaseCheck?: boolean;
  uppercaseCheck?: boolean;
  numberCheck?: boolean;
  specialCharCheck?: boolean;
  customRules?: PolicyRule[];
  lowercaseRegex?: RegExp;
  uppercaseRegex?: RegExp;
  numberRegex?: RegExp;
  specialCharRegex?: RegExp;
}

// A more precise type for our internal defaults constant.
// It requires all config options, but not 'password'.
export type PolicyDefaults = Required<Omit<PasswordPolicyOptions, 'password' | 'customRules'>> & {
  customRules: PolicyRule[];
};

// The state of each individual policy (true if passed, false if failed).
export interface PasswordPolicyState {
  [key:string]: boolean;
}

// The complete object returned by the hook.
export interface HookReturnValue {
  password?: string;
  isValid: boolean;
  strengthScore: number;
  strengthLabel: 'Very Weak' | 'Weak' | 'Medium' | 'Strong' | 'Very Strong';
  policyState: PasswordPolicyState;
}