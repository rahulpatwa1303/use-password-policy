import React, {
  useState,
  useMemo,
  useEffect,
  type FC,
  type FormEvent,
} from "react";
import { useLocation, Link as RouterLink } from "react-router-dom";

import {
  usePasswordPolicy,
  usePwnedPassword,
  PasswordPolicyInput,
  presets,
  fromZxcvbn,
  type PolicyRule,
  type PasswordPolicyOptions,
  type StrengthEstimator,
} from "use-password-policy";

import "./App.css";

// --- THEME LOGIC (Custom Hook) ---
const useTheme = () => {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return { theme, toggleTheme };
};

// --- UI COMPONENTS & ICONS ---
const GitHubIcon: FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);
const EyeIcon: FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);
const EyeOffIcon: FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);
const SunIcon: FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);
const MoonIcon: FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

// --- COMPONENT PLAYGROUND ---

interface ComponentDemoProps {
  showList: boolean;
  setShowList: React.Dispatch<React.SetStateAction<boolean>>;
  showMeter: boolean;
  setShowMeter: React.Dispatch<React.SetStateAction<boolean>>;
  showToggle: boolean;
  setShowToggle: React.Dispatch<React.SetStateAction<boolean>>;
  customRules: PolicyRule[];
  onToggleNoSpacesRule: () => void;
}

const ComponentDemo: FC<ComponentDemoProps> = ({
  showList,
  setShowList,
  showMeter,
  setShowMeter,
  showToggle,
  setShowToggle,
  customRules,
  onToggleNoSpacesRule,
}) => {
  return (
    <>
      <div className="form-field-group">
        <label htmlFor="interactive-demo-password">Live Component Demo</label>
        <PasswordPolicyInput
          className="demo-rpp"
          id="interactive-demo-password"
          name="password"
          placeholder="Try me out!"
          showRequirementsList={showList}
          showStrengthMeter={showMeter}
          showToggleButton={showToggle}
          policyOptions={{ customRules }}
        />
      </div>
      <div className="component-controls">
        <div className="control-group">
          <h4>Toggle UI Elements</h4>
          <div className="control-item">
            <label htmlFor="show-list">Show Requirements List</label>
            <input
              type="checkbox"
              id="show-list"
              checked={showList}
              onChange={(e) => setShowList(e.target.checked)}
            />
          </div>
          <div className="control-item">
            <label htmlFor="show-meter">Show Strength Meter</label>
            <input
              type="checkbox"
              id="show-meter"
              checked={showMeter}
              onChange={(e) => setShowMeter(e.target.checked)}
            />
          </div>
          <div className="control-item">
            <label htmlFor="show-toggle">Show Hide/Show Button</label>
            <input
              type="checkbox"
              id="show-toggle"
              checked={showToggle}
              onChange={(e) => setShowToggle(e.target.checked)}
            />
          </div>
        </div>
        <div className="control-group">
          <h4>Add/Remove Policies</h4>
          <button className="control-button" onClick={onToggleNoSpacesRule}>
            {customRules.some((rule) => rule.name === "noSpaces")
              ? 'Remove "No Spaces" Rule'
              : 'Add "No Spaces" Rule'}
          </button>
        </div>
      </div>
    </>
  );
};

// --- HOOK PLAYGROUND COMPONENT (FULLY TYPED & FIXED) ---
const DemoPlayground: FC = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [options, setOptions] = useState<PasswordPolicyOptions>({
    ...presets.classic,
    commonPasswordCheck: true,
  });
  const [breachCheck, setBreachCheck] = useState(true);
  const [estimator, setEstimator] = useState<StrengthEstimator | null>(null);
  const [loadingEstimator, setLoadingEstimator] = useState(false);

  const toggleZxcvbn = async (on: boolean) => {
    if (!on) return setEstimator(null);
    setLoadingEstimator(true);
    // Loaded on demand so the zxcvbn dictionaries don't weigh down the page.
    const [{ ZxcvbnFactory }, common, en] = await Promise.all([
      import("@zxcvbn-ts/core"),
      import("@zxcvbn-ts/language-common"),
      import("@zxcvbn-ts/language-en"),
    ]);
    const zxcvbn = new ZxcvbnFactory({
      dictionary: { ...common.dictionary, ...en.dictionary },
      graphs: common.adjacencyGraphs,
      translations: en.translations,
    });
    setEstimator(() => fromZxcvbn(zxcvbn));
    setLoadingEstimator(false);
  };

  const applyPreset = (name: keyof typeof presets) =>
    setOptions((o) => ({ ...o, ...presets[name] }));
  const [userCustomRules, setUserCustomRules] = useState<PolicyRule[]>([]);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleRegex, setNewRuleRegex] = useState("");
  const [regexError, setRegexError] = useState<string | null>(null);

  const policy = useMemo<PasswordPolicyOptions>(
    () => ({
      ...options,
      customRules: userCustomRules,
      strengthEstimator: estimator ?? undefined,
      minStrength: estimator ? 3 : undefined,
    }),
    [options, userCustomRules, estimator]
  );

  const { isValid, strengthPercent, strengthLabel, requirements, estimate } =
    usePasswordPolicy({ ...policy, password });
  const pwned = usePwnedPassword(password, { enabled: breachCheck });

  const handleAddRule = (e: FormEvent) => {
    e.preventDefault();
    if (!newRuleName || !newRuleRegex) {
      setRegexError("Name and Regex cannot be empty.");
      return;
    }
    try {
      const regex = new RegExp(newRuleRegex);
      setUserCustomRules([
        ...userCustomRules,
        {
          name: newRuleName.replace(/\s+/g, ""),
          message: newRuleName,
          test: (p: string) => regex.test(p),
        },
      ]);
      setNewRuleName("");
      setNewRuleRegex("");
      setRegexError(null);
    } catch (error) {
      setRegexError("Invalid Regular Expression.");
    }
  };

  const handleRemoveRule = (nameToRemove: string) =>
    setUserCustomRules(
      userCustomRules.filter((rule) => rule.name !== nameToRemove)
    );

  return (
    <div className="card">
      <main className="card-body">
        <div className="input-group">
          <label htmlFor="hook-password">Enter Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              id="hook-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Try 'P@ssword123!'"
            />
            <button
              type="button"
              className="show-hide-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>
        <div className="strength-meter">
          <div
            className={`strength-bar ${strengthLabel
              .replace(" ", "-")
              .toLowerCase()}`}
            style={{ width: `${strengthPercent * 100}%` }}
          ></div>
        </div>
        <p className="strength-label">
          Strength: <strong>{strengthLabel}</strong>
          {password && estimate?.feedback ? <> · {estimate.feedback}</> : null}
        </p>
        {breachCheck && password && (
          <p className={`breach-status ${pwned.status}`} role="status">
            {pwned.status === "checking" && "Checking known breaches…"}
            {pwned.status === "safe" && "✓ Not found in known data breaches"}
            {pwned.status === "pwned" &&
              `✗ Seen ${pwned.count.toLocaleString()} times in data breaches — pick another`}
            {pwned.status === "error" && "Couldn't reach the breach database"}
          </p>
        )}
        <ul className="policy-list">
          {requirements.map(({ name, passed, message }) => (
            <li key={name} className={passed ? "passed" : "failed"}>
              <span className="icon">{passed ? "✓" : "✗"}</span>
              {message}
              {userCustomRules.some((r) => r.name === name) ? (
                <button
                  type="button"
                  className="remove-rule-btn"
                  onClick={() => handleRemoveRule(name)}
                  title={`Remove "${name}" policy`}
                >
                  ×
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        <fieldset className="options-group">
          <legend>Preset</legend>
          <div className="preset-buttons">
            <button type="button" onClick={() => applyPreset("classic")}>Classic</button>
            <button type="button" onClick={() => applyPreset("nist")}>NIST (15+ chars)</button>
            <button type="button" onClick={() => applyPreset("nistMfa")}>NIST with MFA (8+)</button>
          </div>
        </fieldset>
        <fieldset className="options-group">
          <legend>Smarter checks</legend>
          <div className="option-item checkbox">
            <input
              type="checkbox"
              id="commonPasswordCheck"
              checked={!!options.commonPasswordCheck}
              onChange={(e) =>
                setOptions({ ...options, commonPasswordCheck: e.target.checked })
              }
            />
            <label htmlFor="commonPasswordCheck">Block common passwords</label>
          </div>
          <div className="option-item checkbox">
            <input
              type="checkbox"
              id="breachCheck"
              checked={breachCheck}
              onChange={(e) => setBreachCheck(e.target.checked)}
            />
            <label htmlFor="breachCheck">Check Have I Been Pwned</label>
          </div>
          <div className="option-item checkbox">
            <input
              type="checkbox"
              id="zxcvbn"
              checked={!!estimator}
              disabled={loadingEstimator}
              onChange={(e) => toggleZxcvbn(e.target.checked)}
            />
            <label htmlFor="zxcvbn">
              Real strength score (zxcvbn, require "Strong")
              {loadingEstimator ? " — loading…" : ""}
            </label>
          </div>
        </fieldset>
        <fieldset className="options-group">
          <legend>Default Policies</legend>
          <div className="option-item slider">
            <label htmlFor="minLength">Min Length: {options.minLength}</label>
            <input
              type="range"
              id="minLength"
              min="4"
              max="24"
              value={options.minLength}
              onChange={(e) =>
                setOptions({ ...options, minLength: Number(e.target.value) })
              }
            />
          </div>
          <div className="option-item checkbox">
            <input
              type="checkbox"
              id="lowercaseCheck"
              checked={options.lowercaseCheck}
              onChange={(e) =>
                setOptions({ ...options, lowercaseCheck: e.target.checked })
              }
            />
            <label htmlFor="lowercaseCheck">Lowercase</label>
          </div>
          <div className="option-item checkbox">
            <input
              type="checkbox"
              id="uppercaseCheck"
              checked={options.uppercaseCheck}
              onChange={(e) =>
                setOptions({ ...options, uppercaseCheck: e.target.checked })
              }
            />
            <label htmlFor="uppercaseCheck">Uppercase</label>
          </div>
          <div className="option-item checkbox">
            <input
              type="checkbox"
              id="numberCheck"
              checked={options.numberCheck}
              onChange={(e) =>
                setOptions({ ...options, numberCheck: e.target.checked })
              }
            />
            <label htmlFor="numberCheck">Number</label>
          </div>
          <div className="option-item checkbox">
            <input
              type="checkbox"
              id="specialCharCheck"
              checked={options.specialCharCheck}
              onChange={(e) =>
                setOptions({ ...options, specialCharCheck: e.target.checked })
              }
            />
            <label htmlFor="specialCharCheck">Special Character</label>
          </div>
        </fieldset>
        <fieldset className="options-group">
          <legend>Live Custom Policies</legend>
          <form className="add-rule-form" onSubmit={handleAddRule}>
            <input
              type="text"
              placeholder="Policy Name (e.g., noSpaces)"
              value={newRuleName}
              onChange={(e) => setNewRuleName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Regex (e.g., ^\\S*$)"
              value={newRuleRegex}
              onChange={(e) => setNewRuleRegex(e.target.value)}
            />
            <button type="submit">Add</button>
          </form>
          {regexError && <p className="error-text">{regexError}</p>}
        </fieldset>
      </main>
      <footer className="card-footer">
        <button className="submit-button" disabled={!isValid || pwned.isPwned}>
          Submit
        </button>
      </footer>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
function App() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  // --- STATE LIFTED UP FOR COMPONENT DEMO ---
  const [showList, setShowList] = useState(true);
  const [showMeter, setShowMeter] = useState(true);
  const [showToggle, setShowToggle] = useState(true);
  const [customRules, setCustomRules] = useState<PolicyRule[]>([]);

  const noSpacesRule: PolicyRule = {
    name: "noSpaces",
    message: "No spaces",
    test: (password: string) => !/\s/.test(password),
  };

  const handleToggleNoSpacesRule = () => {
    setCustomRules((rules) =>
      rules.some((rule) => rule.name === "noSpaces")
        ? rules.filter((rule) => rule.name !== "noSpaces")
        : [...rules, noSpacesRule]
    );
  };

  // --- DYNAMIC CODE SNIPPET GENERATION ---
  const generatedCode = useMemo(() => {
    let propsString = "";
    // The component defaults are all true, so we only add the prop if it's set to false.
    if (!showList) propsString += `\n  showRequirementsList={false}`;
    if (!showMeter) propsString += `\n  showStrengthMeter={false}`;
    if (!showToggle) propsString += `\n  showToggleButton={false}`;

    if (customRules.length > 0) {
      // For the demo, we just show a placeholder for the custom rules.
      propsString += `\n  policyOptions={{ customRules: [/* ... */] }}`;
    }

    return `import { PasswordPolicyInput } from 'use-password-policy';

<PasswordPolicyInput
  id="your-password-input"
  name="password"${propsString}
/>`;
  }, [showList, showMeter, showToggle, customRules]);

  useEffect(() => {
    const sectionId = location.pathname.substring(1);
    if (sectionId) {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">use-password-policy</div>
        <nav className="app-nav">
          <a href="#features">Features</a>
          <RouterLink to="/component-demo">Component</RouterLink>
          <RouterLink to="/demo">Hook Playground</RouterLink>
          <a
            href="https://github.com/rahulpatwa1303/use-password-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <MoonIcon /> : <SunIcon />}
        </button>
      </header>

      <main>
        <section id="hero" className="hero-section">
          <h1 className="hero-title">
            Effortless Password Validation for React
          </h1>
          <p className="hero-subtitle">
            One password policy for your React form and your server. NIST
            presets, breached-password checks, and a drop-in accessible input.
          </p>
          <div className="hero-cta">
            <a href="#component-demo" className="cta-button primary">
              Live Component Demo
            </a>
            <a
              href="https://github.com/rahulpatwa1303/use-password-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-button secondary"
            >
              <GitHubIcon /> Star on GitHub
            </a>
          </div>
        </section>

        <section id="features" className="features-section">
          <h2>Why You'll Love It</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>🚀 Two Ways to Use</h3>
              <p>
                Get full control with the <code>usePasswordPolicy</code> hook,
                or get running in seconds with the{" "}
                <code>{"<PasswordPolicyInput />"}</code> component.
              </p>
            </div>
            <div className="feature-card">
              <h3>🔁 One Policy, Client & Server</h3>
              <p>
                <code>validatePassword()</code> has no React dependency. Enforce
                the exact same rules in your API, with Zod and react-hook-form
                helpers included.
              </p>
            </div>
            <div className="feature-card">
              <h3>🛡️ Modern Security</h3>
              <p>
                A NIST SP 800-63B preset, a common-password blocklist,
                breached-password checks via Have I Been Pwned, and optional
                zxcvbn scoring.
              </p>
            </div>
            <div className="feature-card">
              <h3>📦 Zero Dependencies</h3>
              <p>
                No runtime dependencies. The component ships plain CSS you can
                theme with CSS variables, Tailwind or any class.
              </p>
            </div>
          </div>
        </section>

        <section id="component-demo" className="component-demo-section">
          <h2>The All-in-One Component</h2>
          <p>
            For maximum speed, drop this component directly into your form.
            Explore its features below.
          </p>
          <div className="component-showcase">
            <div className="component-instance-wrapper">
              <ComponentDemo
                showList={showList}
                setShowList={setShowList}
                showMeter={showMeter}
                setShowMeter={setShowMeter}
                showToggle={showToggle}
                setShowToggle={setShowToggle}
                customRules={customRules}
                onToggleNoSpacesRule={handleToggleNoSpacesRule}
              />
            </div>
            <div className="component-code">
              <h3>Live Props Example</h3>
              {/* Use the dynamically generated code snippet */}
              <pre>
                <code>{generatedCode}</code>
              </pre>
            </div>
          </div>
        </section>

        <section id="demo" className="demo-section">
          <h2>Advanced Hook Playground</h2>
          <p>
            For full control over your UI, use the hook directly. Customize
            every aspect of the validation logic and presentation.
          </p>
          <DemoPlayground />
        </section>
      </main>

      <footer className="app-footer">
        <p>
          Built with ❤️ by Rahul Patwa. Found it useful? Please consider
          starring the repo!
        </p>
        <a
          href="https://github.com/rahulpatwa1303/use-password-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="cta-button secondary"
        >
          <GitHubIcon /> Star on GitHub
        </a>
      </footer>
    </div>
  );
}

export default App;
