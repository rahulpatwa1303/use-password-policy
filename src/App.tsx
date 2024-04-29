import React, { useState } from "react";
import PasswordInput from "./PasswordInput";
import ShowTick from "./ShowTick";
// import { usePasswordPolicy } from "use-password-policy";
import { usePasswordPolicy } from "./hook/use-password-policy";
import Styles from "./style.module.css";
import { CustomPolicy } from "./hook/Type";

function App() {
  const [password, setPassword] = useState("");

  const policyMessage = {
    startWithA: "Password must start with a",
    caseCheck: "Password must have a captial letter",
    lengthCheck: "Password must be 8 character long",
    digitCheck: "Password must contain a digit",
    specialCharCheck: "Password must contain a special char check",
  };

  const customACheck: CustomPolicy = {
    name: "startWithA",
    checkFunction: (password) => password.startsWith("a" || "A"),
    message: "Password must contain at least one symbol.",
  };

  const customPolicies = [customACheck];

  const policy = usePasswordPolicy({
    password,
    config: { caseCheck: false, lengthCheck: false },
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
      <div className={Styles.policy_messages}>

      {Object.entries(policy).map(([key, value]: [string, boolean]) => (
        <ShowTick ValueByKey={value} policyMessage={policyMessage[key]} />
        ))}
        </div>
    </div>
  );
}

export default App;
