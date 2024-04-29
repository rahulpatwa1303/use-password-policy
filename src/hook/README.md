## usePasswordPolicy Hook

This React hook simplifies password policy enforcement in your application. It provides a flexible and customizable way to validate passwords against various criteria, ensuring strong password security.

Features:
- Built-in Policies: Enforces common password complexity requirements like minimum length, case sensitivity, digit inclusion, and special characters.

- Custom Policies: Define your own validation checks using regular expressions or custom functions for even more granular control.

- Configurable Defaults: Specify a default configuration for common policies, or override them with custom settings.

Installation:

```
npm install use-password-policy
```

Usage:

```javascript

import { usePasswordPolicy } from './use-password-policy';
function MyComponent() {
	const [password, setPassword] = useState('');
	const policy = usePasswordPolicy({
						password,
						config: { minLength: 12 },
						customPolicies: [{ name: 'noRepeatedChars', regex: /^(?!.*(.)\1)/ },],});
	const isPasswordValid = Object.values(policy).every(check => check);
	
	return (
		<form>
			<input
				type="password"
				value={password}
				onChange={e => setPassword(e.target.value)}
			/>
		{isPasswordValid ? (
			<p>Password is strong!</p>
		) : (
			<ul>
				{Object.entries(policy).map(([key, value]) => (
				<li key={key}>{!value && key.replace(/([A-Z])/g, ' $1')}</li>
				))}
			</ul>
			)}
		</form>
	);
}
```

**Props:**

| Prop Name        | Props Values           | Type                        | Description                                                                                                | Default Value              |
| ---------------- | ---------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------- |
| `password`       |                        | string                      | The password to be validated.                                                                              | Required                   |
| `config`         |                        | object (optional)           | An object overriding default configuration for built-in policies.                                          |                            |
|                  | - `minLength`          | number                      | Minimum password length                                                                                    | 8                          |
|                  | - `uppercaseCharRegex` | RegExp                      | Regular expression for uppercase characters                                                                | /[A-Z]/                    |
|                  | - `digitRegex`         | RegExp                      | Regular expression for digits                                                                              | /\d/                       |
|                  | - `specialCharRegex`   | RegExp                      | Regular expression for special characters                                                                  | /[!@#$%^&*()_+-=[]{};':"\| |
|                  | - `caseCheck`          | boolean                     | This flag determines the availability of a feature or functionality within your application's state        | true                       |
|                  | - `lengthCheck`        | boolean                     | This flag determines the availability of a feature or functionality within your application's state        | true                       |
|                  | - `digitCheck`         | boolean                     | This flag determines the availability of a feature or functionality within your application's state        | true                       |
|                  | - `specialCharCheck`   | boolean                     | This flag determines the availability of a feature or functionality within your application's state        | true                       |
| `customPolicies` |                        | array of objects (optional) | An array of custom policies to enforce.                                                                    |                            |
|                  | - `name`               | string                      | Name of the custom policy for clarity in feedback.                                                         |                            |
|                  | - `regex`              | RegExp (optional)           | Regular expression for custom validation.                                                                  |                            |
|                  | - `checkFunction`      | function (optional)         | A function taking the password as an argument and returning true/false for a custom check.                 |                            |
| useDefaultConfig |                        | boolean                     | This flag controls whether to use the default configuration for validations or checks in your application. | true                       |

**Return Value:**

An object containing boolean values for each policy check (built-in and custom). Use `Object.values(policy).every(check => check)` to determine if all policies are satisfied.

**Benefits:**

- **Improved Security:** Enforces strong passwords, reducing the risk of brute-force attacks and data breaches.
- **Enhanced User Experience:** Provides clear feedback to users on password strength, guiding them towards creating secure passwords.
- **Customization:** Adapts to your specific security requirements through configurable defaults and custom policies.