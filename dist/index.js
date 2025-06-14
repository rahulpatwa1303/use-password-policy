"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  PasswordPolicyInput: () => PasswordPolicyInput,
  usePasswordPolicy: () => usePasswordPolicy
});
module.exports = __toCommonJS(index_exports);

// src/use-password-policy.ts
var import_react = require("react");
var DEFAULT_POLICIES = [
  {
    name: "minLength",
    optionsKey: "minLength",
    test: (password, options) => password.length >= options.minLength
  },
  {
    name: "uppercase",
    optionsKey: "uppercaseCheck",
    test: (password, options) => options.uppercaseRegex.test(password)
  },
  {
    name: "lowercase",
    optionsKey: "lowercaseCheck",
    test: (password, options) => options.lowercaseRegex.test(password)
  },
  {
    name: "number",
    optionsKey: "numberCheck",
    test: (password, options) => options.numberRegex.test(password)
  },
  {
    name: "specialChar",
    optionsKey: "specialCharCheck",
    test: (password, options) => options.specialCharRegex.test(password)
  }
];
var DEFAULT_OPTIONS = {
  minLength: 8,
  lowercaseCheck: true,
  uppercaseCheck: true,
  numberCheck: true,
  specialCharCheck: true,
  customRules: [],
  lowercaseRegex: /[a-z]/,
  uppercaseRegex: /[A-Z]/,
  numberRegex: /\d/,
  specialCharRegex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/
};
var usePasswordPolicy = (options = {}) => {
  const { password = "" } = options;
  const mergedOptions = (0, import_react.useMemo)(
    () => ({ ...DEFAULT_OPTIONS, ...options }),
    [options]
  );
  const activePolicies = (0, import_react.useMemo)(() => {
    const activeDefaultPolicies = DEFAULT_POLICIES.filter(
      (policy) => policy.optionsKey && mergedOptions[policy.optionsKey]
    );
    return [...activeDefaultPolicies, ...mergedOptions.customRules];
  }, [mergedOptions]);
  const policyState = (0, import_react.useMemo)(() => {
    const state = {};
    for (const policy of activePolicies) {
      state[policy.name] = policy.test(password, mergedOptions);
    }
    return state;
  }, [password, activePolicies, mergedOptions]);
  const { score, label, isValid } = (0, import_react.useMemo)(() => {
    const passedPolicies = Object.values(policyState).filter(Boolean);
    const score2 = passedPolicies.length;
    const totalPolicies = activePolicies.length;
    const strengthPercentage = totalPolicies > 0 ? score2 / totalPolicies : 0;
    let label2 = "Very Weak";
    if (strengthPercentage >= 1) {
      label2 = "Very Strong";
    } else if (strengthPercentage >= 0.75) {
      label2 = "Strong";
    } else if (strengthPercentage >= 0.5) {
      label2 = "Medium";
    } else if (strengthPercentage > 0) {
      label2 = "Weak";
    }
    return {
      score: score2,
      label: label2,
      isValid: score2 === totalPolicies && totalPolicies > 0
    };
  }, [policyState, activePolicies]);
  return {
    password,
    policyState,
    isValid,
    strengthScore: score,
    strengthLabel: label
  };
};

// src/PasswordPolicyInput.tsx
var import_react2 = require("react");
var import_styled_components = __toESM(require("styled-components"));
var import_jsx_runtime = require("react/jsx-runtime");
var STRENGTH_COLOR_MAP = {
  "Very Weak": "var(--rpp-weak)",
  "Weak": "var(--rpp-weak)",
  "Medium": "var(--rpp-medium)",
  "Strong": "var(--rpp-success)",
  "Very Strong": "var(--rpp-success)"
};
var Container = import_styled_components.default.div`
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
var InputWrapper = import_styled_components.default.div`
  position: relative;
`;
var Input = import_styled_components.default.input`
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
var ToggleButton = import_styled_components.default.button`
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
var StrengthMeter = import_styled_components.default.div`
  display: flex;
  gap: 0.25rem;
  height: 6px;
`;
var StrengthMeterSegment = import_styled_components.default.div`
  flex: 1;
  background-color: var(--rpp-border);
  border-radius: 3px;
  transition: background-color 0.3s;
  
  ${({ isFilled, strengthLabel }) => (
  // FIX: Explicitly type props
  isFilled && import_styled_components.css`
      background-color: ${STRENGTH_COLOR_MAP[strengthLabel]};
    `
)}
`;
var RequirementsList = import_styled_components.default.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.875rem;
`;
var RequirementItem = import_styled_components.default.li`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.2s;
  /* FIX: Explicitly type props */
  color: ${({ passed }) => passed ? "var(--rpp-success)" : "var(--rpp-danger)"};
`;
var EyeIcon = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }),
  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "3" })
] });
var EyeOffIcon = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" }),
  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "1", y1: "1", x2: "23", y2: "23" })
] });
var PasswordPolicyInput = ({
  policyOptions,
  onPasswordChange,
  showStrengthMeter = true,
  showRequirementsList = true,
  showToggleButton = true,
  className,
  ...restInputProps
}) => {
  const [password, setPassword] = (0, import_react2.useState)("");
  const [showPassword, setShowPassword] = (0, import_react2.useState)(false);
  const validation = usePasswordPolicy({ ...policyOptions, password });
  const { policyState, strengthScore, strengthLabel } = validation;
  (0, import_react2.useEffect)(() => {
    onPasswordChange?.(password, validation);
  }, [password, validation, onPasswordChange]);
  const formatPolicyName = (name) => name.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Container, { className, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(InputWrapper, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        Input,
        {
          type: showPassword ? "text" : "password",
          value: password,
          onChange: handlePasswordChange,
          ...restInputProps
        }
      ),
      showToggleButton && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleButton, { type: "button", onClick: () => setShowPassword(!showPassword), children: showPassword ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOffIcon, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeIcon, {}) })
    ] }),
    showStrengthMeter && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StrengthMeter, { children: Array.from({ length: 5 }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      StrengthMeterSegment,
      {
        isFilled: strengthScore > index,
        strengthLabel
      },
      index
    )) }),
    showRequirementsList && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequirementsList, { children: Object.entries(policyState).map(([name, passed]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RequirementItem, { passed, children: [
      passed ? "\u2713" : "\u2717",
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatPolicyName(name) })
    ] }, name)) })
  ] });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PasswordPolicyInput,
  usePasswordPolicy
});
