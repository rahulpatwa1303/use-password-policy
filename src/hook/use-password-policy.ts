import { useState, useEffect, useMemo } from "react";
import { CustomPolicy } from "../App";

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
  const defaultConfig = {
    caseCheck: true,
    lengthCheck: true,
    digitCheck: true,
    specialCharCheck: true,
    minLength: 8, // Adjust minimum length as needed
    uppercaseCharRegex: /[A-Z]/, // Allow customization of regex patterns
    digitRegex: /\d/,
    specialCharRegex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/, // More inclusive special characters
  };

  const merged = useMemo(() => mergedConfig(defaultConfig, config), []);

  function mergedConfig(defaultConfig: {}, config: any) {
    if (useDefaultConfig) {
      return { ...defaultConfig, ...config };
    } else {
      return { ...config };
    }
  }

  const [policy, setPolicy] = useState<{ [key: string]: boolean }>(() => {
    if (useDefaultConfig) {
      return {
        caseCheck: false,
        lengthCheck: false,
        digitCheck: false,
        specialCharCheck: false,
        // Add properties for custom policies from mergedConfig
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
    const newPolicy: { [key: string]: boolean } = { ...policy };
    if (useDefaultConfig) {
      newPolicy.caseCheck =
        merged.caseCheck && RegExp(merged.uppercaseCharRegex).test(password);
      newPolicy.lengthCheck =
        merged.lengthCheck && password.length >= merged.minLength;
      newPolicy.digitCheck =
        merged.digitCheck && RegExp(merged.digitRegex).test(password);
      newPolicy.specialCharCheck =
        merged.specialCharCheck &&
        RegExp(merged.specialCharRegex).test(password);
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
