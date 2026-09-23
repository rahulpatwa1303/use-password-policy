import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, renderHook, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePasswordPolicy, usePwnedPassword, PasswordPolicyInput, presets } from './index';

describe('usePasswordPolicy', () => {
  it('validates the password from options (v2 API still works)', () => {
    const { result, rerender } = renderHook(({ password }) => usePasswordPolicy({ password, minLength: 10 }), {
      initialProps: { password: '' },
    });
    expect(result.current.isValid).toBe(false);
    expect(result.current.password).toBe('');
    rerender({ password: 'Abcdefghi1!' });
    expect(result.current.isValid).toBe(true);
    expect(result.current.strengthLabel).toBe('Very Strong');
    expect(result.current.requirements[0].message).toBe('At least 10 characters');
  });

  it('works with presets', () => {
    const { result } = renderHook(() => usePasswordPolicy({ ...presets.nist, password: 'correct horse battery staple' }));
    expect(result.current.isValid).toBe(true);
  });
});

describe('usePwnedPassword', () => {
  it('debounces, then reports pwned', async () => {
    const fetchMock = vi.fn(async () => new Response('1E4C9B93F3F0682250B6CF8331B7EE68FD8:42'));
    const { result } = renderHook(() =>
      usePwnedPassword('password', { debounceMs: 10, fetch: fetchMock as unknown as typeof fetch }),
    );
    expect(result.current.status).toBe('checking');
    await waitFor(() => expect(result.current.status).toBe('pwned'));
    expect(result.current.count).toBe(42);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('stays idle when disabled or empty', () => {
    const fetchMock = vi.fn();
    const { result } = renderHook(() => usePwnedPassword('password', { enabled: false, fetch: fetchMock }));
    expect(result.current.status).toBe('idle');
    const { result: r2 } = renderHook(() => usePwnedPassword('', { fetch: fetchMock }));
    expect(r2.current.status).toBe('idle');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports errors', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 500 }));
    const { result } = renderHook(() =>
      usePwnedPassword('password', { debounceMs: 1, fetch: fetchMock as unknown as typeof fetch }),
    );
    await waitFor(() => expect(result.current.status).toBe('error'));
  });
});

describe('<PasswordPolicyInput />', () => {
  it('renders an accessible input, meter and checklist', async () => {
    const user = userEvent.setup();
    render(
      <>
        <label htmlFor="pw">Password</label>
        <PasswordPolicyInput id="pw" name="password" />
      </>,
    );
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAccessibleDescription(expect.stringContaining('At least 8 characters'));

    const list = screen.getByRole('list', { name: 'Password requirements' });
    expect(list.querySelectorAll('li')).toHaveLength(5);

    await user.type(input, 'abc');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('meter', { name: 'Password strength' })).toHaveAttribute('aria-valuetext', 'Weak');

    await user.clear(input);
    await user.type(input, 'Abcdef1!');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getAllByText('(met)', { exact: false })).toHaveLength(5);
  });

  it('toggles visibility with an accessible button', async () => {
    const user = userEvent.setup();
    render(<PasswordPolicyInput aria-label="Password" />);
    const btn = screen.getByRole('button', { name: 'Show password' });
    await user.click(btn);
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onPasswordChange with fresh validation, and the native onChange', async () => {
    const user = userEvent.setup();
    const onPasswordChange = vi.fn();
    const onChange = vi.fn();
    render(<PasswordPolicyInput aria-label="Password" onPasswordChange={onPasswordChange} onChange={onChange} />);
    await user.type(screen.getByLabelText('Password'), 'Abcdef1!');
    expect(onChange).toHaveBeenCalledTimes(8);
    const [pw, validation] = onPasswordChange.mock.calls.at(-1)!;
    expect(pw).toBe('Abcdef1!');
    expect(validation.isValid).toBe(true);
    expect(onPasswordChange).toHaveBeenCalledTimes(8); // not on mount
  });

  it('supports controlled mode', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState('');
      return (
        <>
          <PasswordPolicyInput aria-label="Password" value={value} onChange={(e) => setValue(e.target.value.toUpperCase())} />
          <output>{value}</output>
        </>
      );
    }
    render(<Controlled />);
    await user.type(screen.getByLabelText('Password'), 'abc');
    expect(screen.getByLabelText('Password')).toHaveValue('ABC');
    expect(screen.getByRole('status')).toHaveTextContent('ABC');
  });

  it('forwards the ref to the input', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<PasswordPolicyInput aria-label="Password" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('honours show* props, unstyled, className and policyOptions', () => {
    const { container } = render(
      <PasswordPolicyInput
        aria-label="Password"
        className="mine"
        inputClassName="field"
        unstyled
        showStrengthMeter={false}
        showToggleButton={false}
        policyOptions={{ ...presets.nist, confirmPassword: 'x' }}
      />,
    );
    expect(container.querySelector('style')).toBeNull();
    expect(container.firstElementChild).toHaveClass('rpp-root', 'mine');
    expect(screen.getByLabelText('Password')).toHaveClass('rpp-input', 'field');
    expect(screen.queryByRole('meter')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('At least 15 characters')).toBeInTheDocument();
    expect(screen.getByText('Passwords match')).toBeInTheDocument();
  });

  it('injects its CSS by default', () => {
    const { container } = render(<PasswordPolicyInput aria-label="Password" />);
    expect(container.querySelector('style')!.textContent).toContain('.rpp-root');
  });

  it('shows estimator feedback and wires it to aria-describedby', async () => {
    const user = userEvent.setup();
    render(
      <PasswordPolicyInput
        aria-label="Password"
        policyOptions={{ strengthEstimator: () => ({ score: 1, feedback: 'Add another word or two.' }) }}
        showStrengthLabel
      />,
    );
    await user.type(screen.getByLabelText('Password'), 'x');
    expect(screen.getByText('Add another word or two.')).toBeInTheDocument();
    expect(screen.getByText('Weak')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(expect.stringContaining('Add another word'));
  });
});

