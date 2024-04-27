import { useState } from "react";
import { Lock, Unlock } from "./assets/Image";
import Styles from "./style.module.css";

interface PasswordInputProps {
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value: string;
  key?: string;
  allowShowPassword: boolean;
  placeholder?: string;
}

function PasswordInput({
  handleChange,
  value,
  allowShowPassword = true,
  placeholder = "password",
  key = "password-input",
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <div className={Styles.group}>
        {allowShowPassword && (
          <>
            {showPassword ? (
              <Lock
                height={"30px"}
                width={"30px"}
                fill={"#000"}
                className={Styles.icon}
                onClick={() => setShowPassword(!showPassword)}
              />
            ) : (
              <Unlock
                height={"30px"}
                width={"30px"}
                fill={"#000"}
                className={Styles.icon}
                onClick={() => setShowPassword(!showPassword)}
              />
            )}
          </>
        )}
        <input
          className={Styles.input}
          name="password"
          type={showPassword ? "text" : "Password"}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          key={key}
        />
      </div>
    </div>
  );
}

export default PasswordInput;
