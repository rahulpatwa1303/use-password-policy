import React, { useState } from "react";
import PasswordInput from "./PasswordInput";
import ShowTick from "./ShowTick";
// import { usePasswordPolicy } from "./hook/use-password-policy";
import { usePasswordPolicy } from "use-password-policy";
import Styles from './style.module.css'

export interface CustomPolicy {
  name: string; // Name of the policy (e.g., "SymbolCheck")
  regex?: RegExp; // Regular expression for the check (optional)
  checkFunction?: (password: string) => boolean; // Custom check function (optional)
  message?: string; // Error message if the check fails (optional)
}

function App() {
  const [password, setPassword] = useState("");

  const customSymbolCheck: CustomPolicy = {
    name: "symbolCheck",
    regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/,
    message: "Password must contain at least one symbol.",
  };

  const customACheck: CustomPolicy = {
    name: "startWithA",
    checkFunction: (password) => password.startsWith("a"),
    message: "Password must contain at least one symbol.",
  };

  const customPolicies = [customSymbolCheck, customACheck];

  const pp = usePasswordPolicy({
    password,
    config: { caseCheck: true },
    customPolicies,
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    <div className={Styles.main}>
      <PasswordInput
        handleChange={handleChange}
        value={password}
        allowShowPassword={true}
      />
      <ShowTick ValueByKey={pp.caseCheck} />
    </div>
  );
}

export default App;
