# use-password-policy

[![npm version](https://img.shields.io/npm/v/use-password-policy.svg)](https://www.npmjs.com/package/use-password-policy)
[![npm downloads](https://img.shields.io/npm/dm/use-password-policy.svg)](https://www.npmjs.com/package/use-password-policy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

A powerful, lightweight, and fully customizable solution for real-time password strength validation in React. Comes with a flexible hook and a zero-config, all-in-one UI component.

---

### [➡️ View Live Demo & Playground](https://rahulpatwa1303.github.io/use-password-policy/)

*(Replace this with your final GitHub Pages URL)*


*(**Action Needed:** Record a GIF of your awesome demo and replace this link!)*

---

## ✨ Why `use-password-policy`?

-   **🚀 Two Ways to Use:** Get full control with the `usePasswordPolicy` hook, or get running in seconds with the drop-in `<PasswordPolicyInput />` component.
-   **🔧 Fully Customizable:** Easily configure policies like min-length, character requirements, and even add your own complex rules with custom functions or regex.
-   **💅 Zero-Config Styling:** The UI component works out-of-the-box with self-contained styles, but is easily overridable.
-   **✅ Rich & Reactive Feedback:** Provides a simple `isValid` boolean, a detailed `policyState` object, and a `strengthScore` to easily build any UI you can imagine.
-   **♿ Accessibility First:** The component is designed with accessibility in mind, ready to be paired with a `<label>`.
-   **📦 Tiny & Performant:** Zero dependencies and built with performance in mind, using `useMemo` to prevent unnecessary recalculations.

## 💾 Installation

```bash
npm install use-password-policy
# or
yarn add use-password-policy
```

## 🚀 Usage

You have two great ways to implement password validation.

### 1. The Easy Way: `<PasswordPolicyInput />` Component

For maximum speed, drop the component directly into your form. It includes the input, strength meter, and requirements list all-in-one.

```tsx
import { PasswordPolicyInput } from 'use-password-policy';

function MyForm() {
  const [isValid, setIsValid] = useState(false);

  return (
    <form>
      <label htmlFor="signup-password">Create a Password</label>
      <PasswordPolicyInput
        id="signup-password"
        name="password"
        placeholder="Enter a secure password..."
        onPasswordChange={(_, validation) => {
          setIsValid(validation.isValid);
        }}
        policyOptions={{ minLength: 8, numberCheck: true, specialCharCheck: true }}
      />
      <button type="submit" disabled={!isValid}>
        Sign Up
      </button>
    </form>
  );
}
```

### 2. The Powerful Way: `usePasswordPolicy` Hook

For complete control over your UI, use the hook and build your own components.

```tsx
import { usePasswordPolicy } from 'use-password-policy';

function MyCustomForm() {
  const [password, setPassword] = useState('');
  const { isValid, strengthLabel, policyState } = usePasswordPolicy({
    password: password,
    minLength: 10,
    uppercaseCheck: true,
    customRules: [{ name: 'noSpaces', test: (p) => !/\\s/.test(p) }],
  });

  return (
    <form>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div>Strength: {strengthLabel}</div>
      <ul>
        {Object.entries(policyState).map(([rule, passed]) => (
          <li key={rule} style={{ color: passed ? 'green' : 'red' }}>
            {rule}
          </li>
        ))}
      </ul>
      <button type="submit" disabled={!isValid}>
        Submit
      </button>
    </form>
  );
}
```

## 📖 API Reference

### `<PasswordPolicyInput />` Props

| Prop                   | Type                                                       | Default | Description                                                               |
| ---------------------- | ---------------------------------------------------------- | ------- | ------------------------------------------------------------------------- |
| `policyOptions`        | `PasswordPolicyOptions`                                    | `{}`    | Same options as the `usePasswordPolicy` hook to control validation logic. |
| `onPasswordChange`     | `(password: string, validation: HookReturnValue) => void`  | `null`  | Callback fired on change, providing the password and full validation state. |
| `showStrengthMeter`    | `boolean`                                                  | `true`  | Toggles the visibility of the strength meter bar.                         |
| `showRequirementsList` | `boolean`                                                  | `true`  | Toggles the visibility of the pass/fail requirements list.              |
| `showToggleButton`     | `boolean`                                                  | `true`  | Toggles the visibility of the show/hide password button.                  |
| `...restInputProps`    | `React.InputHTMLAttributes`                                |         | All other standard input props (`id`, `name`, `placeholder`, etc.) are passed to the `<input>`. |

<br/>

### `usePasswordPolicy` Hook

#### Options (`PasswordPolicyOptions`)

| Prop                   | Type           | Default    | Description                                                 |
| ---------------------- | -------------- | ---------- | ----------------------------------------------------------- |
| `password`             | `string`       | `''`       | The password string to validate.                            |
| `minLength`            | `number`       | `8`        | Minimum password length.                                    |
| `lowercaseCheck`       | `boolean`      | `true`     | Requires at least one lowercase letter.                     |
| `uppercaseCheck`       | `boolean`      | `true`     | Requires at least one uppercase letter.                     |
| `numberCheck`          | `boolean`      | `true`     | Requires at least one number.                               |
| `specialCharCheck`     | `boolean`      | `true`     | Requires at least one special character.                    |
| `customRules`          | `PolicyRule[]` | `[]`       | An array of custom validation rules.                        |

#### Return Value (`HookReturnValue`)

| Key             | Type                                                         | Description                                                               |
| --------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `isValid`       | `boolean`                                                    | `true` only if all active policies are met.                               |
| `strengthScore` | `number`                                                     | The number of policies that have passed.                                  |
| `strengthLabel` | `'Very Weak' \| 'Weak' \| 'Medium' \| 'Strong' \| 'Very Strong'` | A human-readable strength label.                                          |
| `policyState`   | `object`                                                     | An object with boolean flags for each active policy (`{ minLength: true, uppercase: false, ... }`). |

## 🎨 Customizing Styles

The `<PasswordPolicyInput />` component is built with `styled-components` for complete style isolation and easy customization. You have two primary ways to apply your own styles:

### 1. Theming with `styled()`

For deep customization, wrap the component with `styled()` from `styled-components`. You can easily change the theme by overriding the internal CSS variables, or target any internal element for specific changes.

```jsx
import styled from 'styled-components';
import { PasswordPolicyInput } from 'use-password-policy';

const MyStyledInput = styled(PasswordPolicyInput)`
  /* Override theme variables */
  --rpp-accent: #ff6347; // Use a tomato red accent

  /* Override specific elements */
  input {
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
`;

// Then use <MyStyledInput /> in your app!
```

**Available CSS Variables for Theming:**

| Variable          | Default    | Description                        |
| ----------------- | ---------- | ---------------------------------- |
| `--rpp-accent`    | `#646cff`  | Accent color for focus, buttons.   |
| `--rpp-success`   | `#27ae60`  | Color for passed requirements.     |
| `--rpp-danger`    | `#c0392b`  | Color for failed requirements.     |
| `--rpp-weak`      | `#f39c12`  | Strength meter color for weak.     |
| `--rpp-medium`    | `#d35400`  | Strength meter color for medium.   |
| `--rpp-bg`        | `#f9f9f9`  | Component's background color.      |
| `--rpp-border`    | `#e0e0e0`  | Component's border color.          |
| `--rpp-text`      | `#333`     | Component's main text color.       |

### 2. Applying Custom Class Names

To apply layout styles (like margins or flex properties), simply pass a `className`. This works perfectly with utility-class frameworks like Tailwind CSS.

```jsx
import { PasswordPolicyInput } from 'use-password-policy';

// Example with Tailwind CSS or a custom utility class
<PasswordPolicyInput className="mb-4 w-full" />
```

## ❤️ Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/rahulpatwa1303/use-password-policy/issues).

## 📄 License

This project is [MIT](https://github.com/rahulpatwa1303/use-password-policy/blob/main/LICENSE) licensed.