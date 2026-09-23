# use-password-policy

[![npm version](https://img.shields.io/npm/v/use-password-policy.svg)](https://www.npmjs.com/package/use-password-policy)
[![CI](https://github.com/rahulpatwa1303/use-password-policy/actions/workflows/ci.yml/badge.svg)](https://github.com/rahulpatwa1303/use-password-policy/actions/workflows/ci.yml)
[![bundle size](https://img.shields.io/bundlephobia/minzip/use-password-policy)](https://bundlephobia.com/package/use-password-policy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**Write your password rules once. Use them in your React form and on your server.**

- A hook and an accessible drop-in `<PasswordPolicyInput />`
- A framework-free `validatePassword()` for Node, edge functions and API routes
- A **NIST SP 800-63B** preset, a common-password blocklist and **Have I Been Pwned** breach checks
- Optional **zxcvbn** scoring, so "strength" means how hard a password is to guess, not how many boxes it ticks
- **Zod** and **react-hook-form** helpers
- No runtime dependencies. About 3 KB gzipped for the core, about 5.5 KB with the React parts.

### [➡️ Live demo & playground](https://rahulpatwa1303.github.io/use-password-policy/)

![PasswordPolicyInput demo](https://raw.githubusercontent.com/rahulpatwa1303/use-password-policy/master/.github/assets/demo.gif)

---

## Install

```bash
npm install use-password-policy
```

React 16.8+ is needed for the hook and component. It is tested on React 18 and 19. The `use-password-policy/core` entry doesn't need React at all.

## Quick start

### 1. Drop-in component

```tsx
import { PasswordPolicyInput } from 'use-password-policy';

function SignUp() {
  const [isValid, setIsValid] = useState(false);

  return (
    <form>
      <label htmlFor="password">Password</label>
      <PasswordPolicyInput
        id="password"
        name="password"
        policyOptions={{ minLength: 10 }}
        onPasswordChange={(_, v) => setIsValid(v.isValid)}
      />
      <button disabled={!isValid}>Sign up</button>
    </form>
  );
}
```

The component comes with its own styles, a strength meter, a checklist, and a show/hide button that screen readers can use.

### 2. Hook (build your own UI)

```tsx
import { usePasswordPolicy } from 'use-password-policy';

const { isValid, requirements, strengthLabel, strengthPercent } = usePasswordPolicy({
  password,
  minLength: 10,
  customRules: [{ name: 'noSpaces', message: 'No spaces', test: (p) => !/\s/.test(p) }],
});

<ul>
  {requirements.map((r) => (
    <li key={r.name} style={{ color: r.passed ? 'green' : 'crimson' }}>{r.message}</li>
  ))}
</ul>
```

### 3. The same policy on the server

```ts
// password-policy.ts — shared by client and server
import { presets, type PasswordPolicyOptions } from 'use-password-policy/core';
export const policy: PasswordPolicyOptions = { ...presets.nist };
```

```ts
// api/sign-up.ts (Node, Next.js route handler, Express, Cloudflare Worker…)
import { validatePassword } from 'use-password-policy/core';
import { policy } from './password-policy';

const { isValid, errors } = validatePassword(body.password, policy);
if (!isValid) return Response.json({ errors }, { status: 400 });
```

`use-password-policy/core` doesn't import React, so it's safe in server bundles.

## Presets

```ts
import { presets } from 'use-password-policy';

usePasswordPolicy({ ...presets.nist, password });          // NIST, password used on its own
usePasswordPolicy({ ...presets.nistMfa, password });       // NIST, password is one factor of MFA
usePasswordPolicy({ ...presets.classic, password });       // 8+ chars, upper, lower, number, symbol (the default)
```

| Preset | Min | Max | Composition rules | Blocks common passwords |
| --- | --- | --- | --- | --- |
| `classic` (default) | 8 | – | upper, lower, number, symbol | no |
| `nist` | 15 | 64 | none | yes |
| `nistMfa` | 8 | 64 | none | yes |

The NIST presets follow [SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html). It asks for length and a blocklist check, and says not to require "mixtures of different character types".

## Security add-ons

### Block common passwords

```ts
usePasswordPolicy({ password, commonPasswordCheck: true });
```

This uses a small built-in list of the most common passwords and base words. It also catches simple variations such as `Password123!`, `P@ssw0rd`, `123qwerty` and `Monkey!!`. Pass `commonPasswords: [...]` to use your own list, for example your product name.

### Check breached passwords (Have I Been Pwned)

```tsx
import { usePwnedPassword } from 'use-password-policy';

const pwned = usePwnedPassword(password, { enabled: isValid }); // debounced, cancels stale requests
// pwned.status: 'idle' | 'checking' | 'safe' | 'pwned' | 'error'
{pwned.isPwned && <p>Seen {pwned.count.toLocaleString()} times in data breaches. Pick another.</p>}
```

On the server: `await checkPwnedPassword(password)` from `use-password-policy/core` returns the breach count.
Only the first 5 characters of the password's SHA-1 hash are sent ([k-anonymity](https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange)), never the password. It needs `crypto.subtle`, which means HTTPS or `localhost` in browsers and Node 20+ on the server.

### Real strength scoring with zxcvbn

A checklist can't tell `Password1!` apart from a strong password. [zxcvbn](https://github.com/zxcvbn-ts/zxcvbn) can. Add it yourself (it's large, so it isn't bundled) and wrap it with `fromZxcvbn`:

```ts
import { ZxcvbnFactory } from '@zxcvbn-ts/core';
import * as common from '@zxcvbn-ts/language-common';
import * as en from '@zxcvbn-ts/language-en';
import { fromZxcvbn } from 'use-password-policy';

const zxcvbn = new ZxcvbnFactory({
  dictionary: { ...common.dictionary, ...en.dictionary },
  graphs: common.adjacencyGraphs,
  translations: en.translations,
});
const strengthEstimator = fromZxcvbn(zxcvbn); // create once, outside your component

usePasswordPolicy({ password, strengthEstimator, minStrength: 3 });
```

With an estimator, `strengthLabel` and `strengthPercent` come from its score (0–4). `minStrength` adds a "Hard to guess" requirement, and `estimate.feedback` gives you a hint to show the user. `fromZxcvbn` also accepts a plain function, such as the original `zxcvbn` package.

## Form libraries

```ts
import { z } from 'zod';
import { zodPasswordRule, passwordValidator } from 'use-password-policy/core';

// Zod 3 or 4: one issue per failed rule
const schema = z.object({ password: z.string().superRefine(zodPasswordRule(policy)) });

// react-hook-form: returns true or the first error message
register('password', { validate: passwordValidator(policy) });
```

Neither helper imports Zod or react-hook-form, so they add no dependencies.

## Confirm-password field

```ts
usePasswordPolicy({ password, confirmPassword });  // adds a "Passwords match" requirement
```

## Custom messages & i18n

Every requirement has a readable message. You can override any of them with a string or a function:

```ts
usePasswordPolicy({
  password,
  messages: {
    minLength: (o) => `Mindestens ${o.minLength} Zeichen`,
    uppercase: 'Ein Großbuchstabe',
  },
});
```

Rule names: `minLength`, `maxLength`, `uppercase`, `lowercase`, `number`, `specialChar`, `notCommon`, `match`, `strength`, plus your custom rule names.

## API

### Options (`PasswordPolicyOptions`)

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `password` | `string` | `''` | Password to check (hook only). |
| `minLength` | `number` | `8` | Minimum length. `0` turns it off. |
| `maxLength` | `number` | `0` | Maximum length. `0` means no maximum. |
| `lowercaseCheck` | `boolean` | `true` | Require a lowercase letter. |
| `uppercaseCheck` | `boolean` | `true` | Require an uppercase letter. |
| `numberCheck` | `boolean` | `true` | Require a digit. |
| `specialCharCheck` | `boolean` | `true` | Require a special character. |
| `commonPasswordCheck` | `boolean` | `false` | Reject common passwords. |
| `commonPasswords` | `string[]` | built-in | Replace the blocklist. |
| `confirmPassword` | `string` | – | Adds a `match` rule when set. |
| `strengthEstimator` | `(pw) => { score, feedback? }` | – | For example `fromZxcvbn(zxcvbn)`. |
| `minStrength` | `0–4` | – | With an estimator: minimum score required. |
| `customRules` | `PolicyRule[]` | `[]` | `{ name, test, message? }` |
| `messages` | `Record<string, string \| (o) => string>` | – | Override requirement text. |
| `lowercaseRegex` / `uppercaseRegex` / `numberRegex` / `specialCharRegex` | `RegExp` | – | Change what counts as each character type. |

### Result (hook and `validatePassword`)

| Key | Type | Description |
| --- | --- | --- |
| `isValid` | `boolean` | `true` only when every active rule passes. |
| `requirements` | `{ name, passed, message }[]` | Ordered checklist, ready to render. |
| `errors` | `string[]` | Messages of the failed rules. |
| `policyState` | `Record<string, boolean>` | Pass/fail by rule name. |
| `strengthLabel` | `'Very Weak' \| 'Weak' \| 'Medium' \| 'Strong' \| 'Very Strong'` | |
| `strengthPercent` | `number` (0–1) | Fill for a meter. |
| `strengthScore` | `number` | Number of rules passed. |
| `estimate` | `{ score, feedback? }` | Only with `strengthEstimator`. |

### `<PasswordPolicyInput />` props

It accepts every normal `<input>` prop (`id`, `name`, `placeholder`, `autoComplete`, `onBlur`, and so on) and forwards `ref` to the input. It also takes:

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `policyOptions` | `PasswordPolicyOptions` | `{}` | Same options as the hook. |
| `onPasswordChange` | `(password, validation) => void` | – | Called on every change with the fresh result. |
| `value` / `defaultValue` | `string` | – | Controlled or uncontrolled. `onChange` works as usual. |
| `showStrengthMeter` | `boolean` | `true` | |
| `showStrengthLabel` | `boolean` | `false` | Shows the label ("Strong") under the meter. |
| `showRequirementsList` | `boolean` | `true` | |
| `showToggleButton` | `boolean` | `true` | Show/hide password button. |
| `toggleLabels` | `{ show, hide }` | `Show password` / `Hide password` | Accessible labels for the button. |
| `className` | `string` | – | Class on the wrapper. |
| `inputClassName` | `string` | – | Class on the `<input>`. |
| `unstyled` | `boolean` | `false` | Leaves out the built-in CSS. |

Accessibility: the checklist is linked to the input with `aria-describedby`, the meter has `role="meter"`, `aria-invalid` is set once the user types an invalid password, and each item announces "met" or "not met".

## Styling

The component ships plain CSS with no CSS-in-JS. Theme it with CSS variables from any class:

```css
.my-password {
  --rpp-accent: #0ea5e9;
  --rpp-success: #16a34a;
  --rpp-danger: #dc2626;
  --rpp-weak: #ea580c;
  --rpp-medium: #ca8a04;
  --rpp-bg: #fff;
  --rpp-border: #d4d4d8;
  --rpp-text: #18181b;
  --rpp-muted: #71717a;
  --rpp-radius: 8px;
}
```

```tsx
<PasswordPolicyInput className="my-password" />
```

Each part has a stable class you can target: `.rpp-root`, `.rpp-input`, `.rpp-toggle`, `.rpp-meter`, `.rpp-segment`, `.rpp-requirements`, `.rpp-requirement` (with `[data-passed]`). The built-in selectors have low specificity, so `.my-password .rpp-input { … }` always wins. This works with Tailwind, CSS Modules and styled-components (`styled(PasswordPolicyInput)` still works).

To use your own stylesheet instead of the built-in one, pass `unstyled` and optionally start from the shipped file: `import 'use-password-policy/styles.css'`.

For **Next.js App Router**, the React entry is marked `'use client'`, and `use-password-policy/core` can be used in Server Components and route handlers.

## Upgrading from v2

- **`styled-components` is no longer required.** You can uninstall it if nothing else in your app uses it.
- The component's DOM and class names changed (`.rpp-*`). The `--rpp-*` theme variables still work.
- `onPasswordChange` now runs on user changes only, not on mount.
- The hook's options and return values are backward compatible. New fields were added: `requirements`, `errors`, `strengthPercent`, `estimate`.

See the [CHANGELOG](./CHANGELOG.md).

## Contributing

Issues and PRs are welcome. To get started:

```bash
npm install
npm test          # vitest
npm run build     # tsup
npm run dev -w demo
```

## License

[MIT](./LICENSE) © Rahul Patwa
