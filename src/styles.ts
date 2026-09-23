/**
 * Styles for <PasswordPolicyInput />. Kept deliberately low-specificity:
 * the theme variables sit on `:where(.rpp-root)` (zero specificity), so any
 * class you pass via `className` wins; inner parts use a single class
 * (e.g. `.rpp-toggle`), which still beats global element resets like
 * `button { … }`. Override them with `.your-class .rpp-toggle { … }`.
 *
 * Also shipped as `use-password-policy/styles.css` for use with `unstyled`.
 */
export const passwordPolicyInputCss = `
:where(.rpp-root) {
  --rpp-accent: #646cff;
  --rpp-success: #1e8449;
  --rpp-danger: #c0392b;
  --rpp-weak: #d35400;
  --rpp-medium: #b8860b;
  --rpp-bg: #ffffff;
  --rpp-border: #d0d0d0;
  --rpp-text: #222222;
  --rpp-muted: #6b6b6b;
  --rpp-radius: 6px;
  font-family: inherit;
  color: var(--rpp-text);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
:where(.rpp-root) .rpp-field { position: relative; }
:where(.rpp-root) .rpp-input {
  box-sizing: border-box;
  width: 100%;
  padding: 0.75rem 2.75rem 0.75rem 0.75rem;
  border: 1px solid var(--rpp-border);
  border-radius: var(--rpp-radius);
  background: var(--rpp-bg);
  color: var(--rpp-text);
  font: inherit;
  font-size: 1rem;
}
:where(.rpp-root) .rpp-input:focus-visible {
  outline: 2px solid var(--rpp-accent);
  outline-offset: 1px;
  border-color: var(--rpp-accent);
}
:where(.rpp-root) .rpp-toggle {
  position: absolute;
  top: 50%;
  right: 0.375rem;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  padding: 0.375rem;
  border: 0;
  border-radius: var(--rpp-radius);
  background: none;
  color: var(--rpp-muted);
  cursor: pointer;
}
:where(.rpp-root) .rpp-toggle:focus-visible { outline: 2px solid var(--rpp-accent); }
:where(.rpp-root) .rpp-toggle:focus:not(:focus-visible) { outline: none; }
:where(.rpp-root) .rpp-meter { display: flex; gap: 0.25rem; height: 6px; }
:where(.rpp-root) .rpp-segment {
  flex: 1;
  border-radius: 3px;
  background: var(--rpp-border);
  transition: background-color 0.25s;
}
:where(.rpp-root[data-strength="very-weak"]) .rpp-segment[data-filled] { background: var(--rpp-danger); }
:where(.rpp-root[data-strength="weak"]) .rpp-segment[data-filled] { background: var(--rpp-weak); }
:where(.rpp-root[data-strength="medium"]) .rpp-segment[data-filled] { background: var(--rpp-medium); }
:where(.rpp-root[data-strength="strong"]) .rpp-segment[data-filled],
:where(.rpp-root[data-strength="very-strong"]) .rpp-segment[data-filled] { background: var(--rpp-success); }
:where(.rpp-root) .rpp-strength-label,
:where(.rpp-root) .rpp-feedback { margin: 0; font-size: 0.8125rem; color: var(--rpp-muted); }
:where(.rpp-root) .rpp-requirements {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.875rem;
}
:where(.rpp-root) .rpp-requirement { display: flex; align-items: center; gap: 0.5rem; color: var(--rpp-danger); }
:where(.rpp-root) .rpp-requirement[data-passed] { color: var(--rpp-success); }
:where(.rpp-root) .rpp-icon { width: 1em; text-align: center; font-weight: 700; }
:where(.rpp-root) .rpp-sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
`.trim();
