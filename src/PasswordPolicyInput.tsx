import * as React from 'react';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { usePasswordPolicy } from './use-password-policy';
import { passwordPolicyInputCss } from './styles';
import type { PasswordPolicyOptions, HookReturnValue } from './types';

let idCounter = 0;
const useFallbackId = (): string => {
  const [id] = useState(() => `rpp-${++idCounter}`);
  return id;
};
// React 18+ has useId (SSR-safe); fall back to a counter on older versions.
const useStableId: () => string =
  (React as unknown as { useId?: () => string }).useId ?? useFallbackId;

const EyeIcon = () => (
  <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export interface PasswordPolicyInputProps
  extends Omit<React.ComponentPropsWithoutRef<'input'>, 'type' | 'value' | 'defaultValue'> {
  /** Controlled value. Leave undefined to let the component manage its own state. */
  value?: string;
  /** Initial value when uncontrolled. */
  defaultValue?: string;
  /** Same options as `usePasswordPolicy`. */
  policyOptions?: PasswordPolicyOptions;
  /** Fires on every change with the new password and its full validation result. */
  onPasswordChange?: (password: string, validation: HookReturnValue) => void;
  /** Default `true`. */
  showStrengthMeter?: boolean;
  /** Show the strength label ("Strong") under the meter. Default `false`. */
  showStrengthLabel?: boolean;
  /** Default `true`. */
  showRequirementsList?: boolean;
  /** Default `true`. */
  showToggleButton?: boolean;
  /** Accessible labels for the show/hide button. */
  toggleLabels?: { show: string; hide: string };
  /** Skip the built-in CSS (class names stay). Import `use-password-policy/styles.css` or bring your own. */
  unstyled?: boolean;
  /** Class for the outer wrapper. */
  className?: string;
  /** Extra class for the <input> itself. */
  inputClassName?: string;
}

const strengthKey = (label: string) => label.toLowerCase().replace(/\s+/g, '-');

export const PasswordPolicyInput = forwardRef<HTMLInputElement, PasswordPolicyInputProps>(
  function PasswordPolicyInput(
    {
      value,
      defaultValue,
      policyOptions,
      onPasswordChange,
      onChange,
      showStrengthMeter = true,
      showStrengthLabel = false,
      showRequirementsList = true,
      showToggleButton = true,
      toggleLabels = { show: 'Show password', hide: 'Hide password' },
      unstyled = false,
      className,
      inputClassName,
      id,
      'aria-describedby': ariaDescribedBy,
      ...inputProps
    },
    ref,
  ) {
    const generatedId = useStableId();
    const inputId = id ?? `${generatedId}-input`;
    const listId = `${generatedId}-requirements`;
    const feedbackId = `${generatedId}-feedback`;

    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(defaultValue ?? '');
    const password = isControlled ? value : internalValue;
    const [visible, setVisible] = useState(false);

    const validation = usePasswordPolicy({ ...policyOptions, password });
    const { requirements, strengthPercent, strengthLabel, isValid, estimate } = validation;

    // Report changes: on every edit, and again when an async check (breach) settles.
    const onPasswordChangeRef = useRef(onPasswordChange);
    onPasswordChangeRef.current = onPasswordChange;
    const reportKey = `${password}\u0000${isValid}\u0000${validation.breach?.status ?? ''}`;
    const lastReported = useRef(reportKey);
    useEffect(() => {
      if (lastReported.current === reportKey) return;
      lastReported.current = reportKey;
      onPasswordChangeRef.current?.(password, validation);
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setInternalValue(e.target.value);
      onChange?.(e);
    };

    const segments = 5;
    const filled = strengthPercent > 0 ? Math.max(1, Math.round(strengthPercent * segments)) : 0;
    const feedback = password && estimate?.feedback;

    const describedBy =
      [ariaDescribedBy, showRequirementsList ? listId : null, feedback ? feedbackId : null]
        .filter(Boolean)
        .join(' ') || undefined;

    const rootClass = className ? `rpp-root ${className}` : 'rpp-root';

    return (
      <div className={rootClass} data-strength={strengthKey(strengthLabel)} data-valid={isValid || undefined}>
        {!unstyled && <style>{passwordPolicyInputCss}</style>}
        <div className="rpp-field">
          <input
            {...inputProps}
            ref={ref}
            id={inputId}
            className={inputClassName ? `rpp-input ${inputClassName}` : 'rpp-input'}
            type={visible ? 'text' : 'password'}
            value={password}
            onChange={handleChange}
            aria-describedby={describedBy}
            aria-invalid={password.length > 0 && !isValid ? true : undefined}
          />
          {showToggleButton && (
            <button
              type="button"
              className="rpp-toggle"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? toggleLabels.hide : toggleLabels.show}
              aria-pressed={visible}
              aria-controls={inputId}
            >
              {visible ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}
        </div>

        {showStrengthMeter && (
          <div
            className="rpp-meter"
            role="meter"
            aria-label="Password strength"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(strengthPercent * 100)}
            aria-valuetext={strengthLabel}
          >
            {Array.from({ length: segments }, (_, i) => (
              <div key={i} className="rpp-segment" data-filled={i < filled || undefined} />
            ))}
          </div>
        )}
        {showStrengthMeter && showStrengthLabel && (
          <p className="rpp-strength-label">{strengthLabel}</p>
        )}
        {showStrengthMeter && feedback && (
          <p className="rpp-feedback" id={feedbackId}>
            {feedback}
          </p>
        )}

        {showRequirementsList && (
          <ul className="rpp-requirements" id={listId} aria-label="Password requirements">
            {requirements.map(({ name, passed, message, pending }) => (
              <li
                key={name}
                className="rpp-requirement"
                data-passed={passed || undefined}
                data-pending={pending || undefined}
                data-rule={name}
              >
                <span className="rpp-icon" aria-hidden="true">
                  {pending ? (validation.breach?.status === 'checking' ? '…' : '○') : passed ? '✓' : '✗'}
                </span>
                <span>{message}</span>
                <span className="rpp-sr-only">
                  {pending
                    ? validation.breach?.status === 'checking'
                      ? ' (checking)'
                      : ' (checked once the others are met)'
                    : passed
                      ? ' (met)'
                      : ' (not met)'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);
