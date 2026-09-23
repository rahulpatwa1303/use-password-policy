# Changelog

## 3.0.0

### Added
- **`use-password-policy/core`**: a framework-free `validatePassword(password, options)` for running the same policy on the server (Node, edge, API routes). It doesn't import React.
- **Presets**: `presets.nist` and `presets.nistMfa`, following NIST SP 800-63B-4, plus `presets.classic`.
- **New rules**: `maxLength`, `commonPasswordCheck` (a built-in blocklist that also catches decorated variants like `P@ssw0rd123!`), and `confirmPassword` (a "passwords match" rule).
- **Breach checks**: `checkPwnedPassword()` and a `usePwnedPassword()` hook using Have I Been Pwned k-anonymity. Only a 5-character hash prefix is sent.
- **Real strength scoring**: a `strengthEstimator` option and a `fromZxcvbn()` adapter (zxcvbn and @zxcvbn-ts v3/v4), plus `minStrength`.
- **Integrations**: `zodPasswordRule()` for Zod `superRefine` and `passwordValidator()` for react-hook-form `validate`. Neither adds a dependency.
- **Messages & i18n**: every requirement has readable text, and `messages` overrides it.
- The result now includes `requirements`, `errors`, `strengthPercent` and `estimate`.
- Component: controlled mode (`value`/`onChange`), `ref` forwarding, `inputClassName`, `showStrengthLabel`, `toggleLabels`, `unstyled`, and the `use-password-policy/styles.css` export.
- Accessibility: `aria-describedby` checklist, `role="meter"`, `aria-invalid`, labelled toggle button, and "met"/"not met" text for screen readers.
- The React entry is marked `'use client'` for the Next.js App Router.
- Tests (Vitest + Testing Library), with CI on React 18 and 19.

### Changed (breaking)
- **Dropped the `styled-components` peer dependency.** The component now ships plain, low-specificity CSS, themeable through the same `--rpp-*` variables.
- Component DOM and class names changed to `.rpp-*`.
- `onPasswordChange` no longer fires on mount.
- `react-dom` is no longer a peer dependency, and `react` is optional (only needed for the hook and component).

### Fixed
- Passing `onChange` or `value` to `<PasswordPolicyInput />` used to break it. Both now work.
- The strength meter can now fill completely when fewer than five rules are active.
- `--rpp-bg` and `--rpp-text` now actually style the input.
- Options explicitly set to `undefined` no longer override the defaults.
- The npm README no longer shows leftover placeholder notes. The LICENSE file is added and the license link fixed.
- The demo deploy workflow now runs on `master`, which was the actual default branch.

## 2.0.0
- Added the `<PasswordPolicyInput />` component (styled-components) and custom rules.

## 1.x
- First release of the `usePasswordPolicy` hook.
