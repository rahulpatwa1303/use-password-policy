import React, { FC } from 'react';

interface PolicyRule {
    name: string;
    optionsKey?: keyof PasswordPolicyOptions;
    test: (password: string, options: Required<PasswordPolicyOptions>) => boolean;
}
interface PasswordPolicyOptions {
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
interface PasswordPolicyState {
    [key: string]: boolean;
}
interface HookReturnValue {
    password?: string;
    isValid: boolean;
    strengthScore: number;
    strengthLabel: 'Very Weak' | 'Weak' | 'Medium' | 'Strong' | 'Very Strong';
    policyState: PasswordPolicyState;
}

declare const usePasswordPolicy: (options?: PasswordPolicyOptions) => HookReturnValue;

interface PasswordPolicyInputProps extends React.ComponentPropsWithoutRef<'input'> {
    policyOptions?: PasswordPolicyOptions;
    onPasswordChange?: (password: string, validation: HookReturnValue) => void;
    showStrengthMeter?: boolean;
    showRequirementsList?: boolean;
    showToggleButton?: boolean;
}
declare const PasswordPolicyInput: FC<PasswordPolicyInputProps>;

export { type HookReturnValue, PasswordPolicyInput, type PasswordPolicyInputProps, type PasswordPolicyOptions, type PasswordPolicyState, type PolicyRule, usePasswordPolicy };
