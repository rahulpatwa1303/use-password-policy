export interface CustomPolicy {
  name: string; // Name of the policy (e.g., "SymbolCheck")
  regex?: RegExp; // Regular expression for the check (optional)
  checkFunction?: (password: string) => boolean; // Custom check function (optional)
  message?: string; // Error message if the check fails (optional)
}

export interface StateObjects {
  [key: string]: boolean;
}

export interface DefaultConfig {
  [key: string]: boolean | RegExp | string | number;
}
