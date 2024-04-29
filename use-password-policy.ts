import { useState, useEffect, useMemo } from "react";
import { CustomPolicy, StateObjects, DefaultConfig } from "./Type";

export const usePasswordPolicy = ({
  password,
  config,
  customPolicies = [],
  useDefaultConfig = true,
}: {
  password: string;
  config?: {};
  customPolicies?: CustomPolicy[];
  useDefaultConfig?: boolean;
}) => {
  const defaultConfig: DefaultConfig = {
    caseCheck: true,
    lengthCheck: true,
    digitCheck: true,
    specialCharCheck: true,
    minLength: 8,
    uppercaseCharRegex: /[A-Z]/,
    digitRegex: /\d/,
    specialCharRegex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/,
  };

  const merged = useMemo(() => mergedConfig(defaultConfig, config), []);

  function mergedConfig(defaultConfig: {}, config: any) {
    if (useDefaultConfig) {
      return { ...defaultConfig, ...config };
    } else {
      return { ...config };
    }
  }

  const [policy, setPolicy] = useState<StateObjects>(() => {
    if (useDefaultConfig) {
      const defaultStates: StateObjects = {
        caseCheck: false,
        lengthCheck: false,
        digitCheck: false,
        specialCharCheck: false,
      };
      const safeConfig: StateObjects = config || {};

      Object.entries(defaultStates).map(([key]) => {
        if (safeConfig.hasOwnProperty(key) && safeConfig[key] === false) {
          delete defaultStates[key];
          delete defaultConfig[key];
        }
      });
      return {
        ...defaultStates,
        ...customPolicies.reduce(
          (acc, policy: { name: string }) => ({
            ...acc,
            [policy?.name]: false,
          }),
          {}
        ),
      };
    } else
      return {
        ...customPolicies.reduce(
          (acc, policy: { name: string }) => ({
            ...acc,
            [policy?.name]: false,
          }),
          {}
        ),
      };
  });

  const evaluateChecks = () => {
    const newPolicy: StateObjects = { ...policy };
    const policyKeys = Object.keys(policy);

    if (useDefaultConfig) {
      policyKeys.forEach((key) => {
        if (merged.hasOwnProperty(key) && policy.hasOwnProperty(key)) {
          const checkFunction = {
            caseCheck: () => RegExp(merged.uppercaseCharRegex).test(password),
            lengthCheck: () => password.length >= merged.minLength,
            digitCheck: () => RegExp(merged.digitRegex).test(password),
            specialCharCheck: () =>
              RegExp(merged.specialCharRegex).test(password),
          }[key];

          if (checkFunction) {
            newPolicy[key] = merged[key] && checkFunction();
          }
        }
      });
    }

    customPolicies.forEach((customPolicy: CustomPolicy) => {
      const name: string = customPolicy?.name;
      if (customPolicy?.regex) {
        newPolicy[name] = customPolicy.regex.test(password);
      } else if (customPolicy?.checkFunction) {
        newPolicy[name] = customPolicy.checkFunction(password);
      }
    });

    setPolicy(newPolicy);
  };

  useEffect(() => {
    evaluateChecks();
  }, [password]);
  return policy;
};
