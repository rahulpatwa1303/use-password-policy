// src/PasswordPolicyInput.tsx
import React, { useState, useEffect, FC } from 'react';
import styled, { css } from 'styled-components';
import { usePasswordPolicy } from './use-password-policy';
import { PasswordPolicyOptions, HookReturnValue } from './types';

// --- Styled Components Definitions ---
// All styles are now encapsulated here with unique class names.

const STRENGTH_COLOR_MAP: Record<HookReturnValue['strengthLabel'], string> = {
  'Very Weak': 'var(--rpp-weak)', 'Weak': 'var(--rpp-weak)', 'Medium': 'var(--rpp-medium)', 'Strong': 'var(--rpp-success)', 'Very Strong': 'var(--rpp-success)',
};

const Container = styled.div`
  /* CSS variables define the component's internal theme */
  --rpp-accent: #646cff;
  --rpp-success: #27ae60;
  --rpp-danger: #c0392b;
  --rpp-weak: #f39c12;
  --rpp-medium: #d35400;
  --rpp-bg: #f9f9f9;
  --rpp-border: #e0e0e0;
  --rpp-text: #333;
  
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const InputWrapper = styled.div`
  position: relative;
`;

const Input = styled.input`
  box-sizing: border-box;
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--rpp-border);
  border-radius: 6px;
  font-size: 1rem;
  
  &:focus {
    border-color: var(--rpp-accent);
    outline: none;
  }
`;

const ToggleButton = styled.button`
  position: absolute;
  top: 50%;
  right: 0.5rem;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: #888;
  display: flex;
  align-items: center;
`;

const StrengthMeter = styled.div`
  display: flex;
  gap: 0.25rem;
  height: 6px;
`;

interface StrengthMeterSegmentProps {
  isFilled: boolean;
  strengthLabel: HookReturnValue['strengthLabel'];
}
const StrengthMeterSegment = styled.div<StrengthMeterSegmentProps>`
  flex: 1;
  background-color: var(--rpp-border);
  border-radius: 3px;
  transition: background-color 0.3s;
  
  ${({ isFilled, strengthLabel }: StrengthMeterSegmentProps) => // FIX: Explicitly type props
    isFilled &&
    css`
      background-color: ${STRENGTH_COLOR_MAP[strengthLabel]};
    `}
`;

const RequirementsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.875rem;
`;

interface RequirementItemProps {
  passed: boolean;
}
const RequirementItem = styled.li<RequirementItemProps>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.2s;
  /* FIX: Explicitly type props */
  color: ${({ passed }: RequirementItemProps) => (passed ? 'var(--rpp-success)' : 'var(--rpp-danger)')};
`;
// --- Helper Components & Icons --- (Unchanged)
const EyeIcon: FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const EyeOffIcon: FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>;

// --- Component Props --- (Unchanged)
export interface PasswordPolicyInputProps extends React.ComponentPropsWithoutRef<'input'> {
  policyOptions?: PasswordPolicyOptions;
  onPasswordChange?: (password: string, validation: HookReturnValue) => void;
  showStrengthMeter?: boolean;
  showRequirementsList?: boolean;
  showToggleButton?: boolean;
}

// --- The Main Component (Now uses Styled Components) ---
export const PasswordPolicyInput: FC<PasswordPolicyInputProps> = ({
  policyOptions,
  onPasswordChange,
  showStrengthMeter = true,
  showRequirementsList = true,
  showToggleButton = true,
  className,
  ...restInputProps
}) => {
  // The useEffect for injecting styles is now gone!
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const validation = usePasswordPolicy({ ...policyOptions, password });
  const { policyState, strengthScore, strengthLabel } = validation;

  useEffect(() => {
    onPasswordChange?.(password, validation);
  }, [password, validation, onPasswordChange]);

  const formatPolicyName = (name: string) => name.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    setPassword(e.target.value);
  };

  return (
    <Container className={className}>
      <InputWrapper>
        <Input
          type={showPassword ? 'text' : 'password'}
          value={password}
           onChange={handlePasswordChange} 
          {...restInputProps}
        />
        {showToggleButton && (
          <ToggleButton type="button" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </ToggleButton>
        )}
      </InputWrapper>

      {showStrengthMeter && (
        <StrengthMeter>
          {Array.from({ length: 5 }).map((_, index) => (
            <StrengthMeterSegment
              key={index}
              isFilled={strengthScore > index}
              strengthLabel={strengthLabel}
            />
          ))}
        </StrengthMeter>
      )}

      {showRequirementsList && (
        <RequirementsList>
          {Object.entries(policyState).map(([name, passed]) => (
            <RequirementItem key={name} passed={passed}>
              {passed ? '✓' : '✗'}
              <span>{formatPolicyName(name)}</span>
            </RequirementItem>
          ))}
        </RequirementsList>
      )}
    </Container>
  );
};