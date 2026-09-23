import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  usePasswordPolicy,
  PasswordPolicyInput,
  fromZxcvbn,
  type PolicyRule,
  type PasswordPolicyOptions,
  type StrengthEstimator,
  type ValidationResult,
} from "use-password-policy";
import {
  validatePassword,
  validatePasswordAsync,
  applyBreachResult,
  presets,
  checkPwnedPassword,
  passwordLength,
} from "use-password-policy/core";
import "./App.css";

const REPO = "https://github.com/rahulpatwa1303/use-password-policy";
const NPM = "https://www.npmjs.com/package/use-password-policy";
const INSTALL = "npm i use-password-policy";

/* ------------------------------------------------------------------ icons */

type IconProps = { size?: number };
const Svg = ({ size = 16, children }: IconProps & { children: ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="square"
    strokeLinejoin="miter"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);
const CopyIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="8" y="8" width="12" height="12" />
    <path d="M16 8V4H4v12h4" />
  </Svg>
);
const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 12.5l5 5L20 6.5" />
  </Svg>
);
const ArrowIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 17L17 7M9 7h8v8" />
  </Svg>
);
const GitHubIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
  </Svg>
);

/* ------------------------------------------------------------ copy button */

function CopyButton({ text, label = "copy", className = "" }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button type="button" className={`copy ${className}`} onClick={copy} data-copied={copied || undefined}>
      {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
      <span aria-live="polite">{copied ? "copied" : label}</span>
    </button>
  );
}

/* --------------------------------------------------------------- policy */

type PresetName = "classic" | "nist" | "nistMfa";
interface Config {
  preset: PresetName;
  minLength: number;
  lowercaseCheck: boolean;
  uppercaseCheck: boolean;
  numberCheck: boolean;
  specialCharCheck: boolean;
  commonPasswordCheck: boolean;
  patternCheck: boolean;
}

const configFromPreset = (preset: PresetName): Config => {
  const p = presets[preset];
  return {
    preset,
    minLength: p.minLength,
    lowercaseCheck: p.lowercaseCheck,
    uppercaseCheck: p.uppercaseCheck,
    numberCheck: p.numberCheck,
    specialCharCheck: p.specialCharCheck,
    commonPasswordCheck: "commonPasswordCheck" in p ? Boolean(p.commonPasswordCheck) : false,
    patternCheck: "patternCheck" in p ? Boolean(p.patternCheck) : false,
  };
};

interface CustomRuleSpec {
  name: string;
  source: string;
}

function policySource(config: Config, custom: CustomRuleSpec[], zxcvbn: boolean, breach: boolean): string {
  const base = configFromPreset(config.preset);
  const overrides: string[] = [];
  const keys: (keyof Omit<Config, "preset">)[] = [
    "minLength",
    "lowercaseCheck",
    "uppercaseCheck",
    "numberCheck",
    "specialCharCheck",
    "commonPasswordCheck",
    "patternCheck",
  ];
  for (const k of keys) if (config[k] !== base[k]) overrides.push(`  ${k}: ${config[k]},`);
  if (breach) overrides.push("  breachCheck: true,");
  if (zxcvbn) overrides.push("  strengthEstimator: fromZxcvbn(zxcvbn),", "  minStrength: 3,");
  if (custom.length) {
    overrides.push("  customRules: [");
    for (const r of custom) overrides.push(`    { name: '${r.name}', test: (p) => /${r.source}/.test(p) },`);
    overrides.push("  ],");
  }
  return [
    "import { presets } from 'use-password-policy/core';",
    "",
    "export const policy = {",
    `  ...presets.${config.preset},`,
    ...overrides,
    "};",
  ].join("\n");
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const fmtMs = (ms: number) => (ms < 0.01 ? "<0.01ms" : `${ms.toFixed(2)}ms`);

/* ------------------------------------------------------------ lanes */

function Lane({
  runtime,
  fn,
  result,
  ms,
  idle,
  runKey,
}: {
  runtime: string;
  fn: string;
  result: ValidationResult;
  ms: number;
  idle: boolean;
  runKey: string;
}) {
  const passed = result.requirements.filter((r) => r.passed).length;
  const checking = result.breach?.status === "checking";
  const pending = result.requirements.filter((r) => r.pending).length;
  const failed = result.requirements.length - passed - pending;
  const badge = idle ? "WAIT" : failed > 0 ? "FAIL" : pending > 0 ? (checking ? "RUN" : "WAIT") : "PASS";
  return (
    <section className="lane" aria-label={`${runtime} runner`}>
      <header className="lane-head">
        <span className={`badge badge-${badge.toLowerCase()}`}>{badge}</span>
        <span className="lane-runtime">{runtime}</span>
        <code className="lane-fn">{fn}</code>
      </header>
      <ol className="cases" key={runKey}>
        {result.requirements.map((r, i) => {
          const state = idle ? "todo" : r.pending ? (checking ? "pending" : "todo") : r.passed ? "pass" : "fail";
          return (
            <li key={r.name} className="case" data-state={state} style={{ ["--i" as string]: i }}>
              <span className="case-mark" aria-hidden="true">
                {state === "todo" ? "○" : state === "pending" ? "…" : state === "pass" ? "✓" : "×"}
              </span>
              <span className="case-name">{lowerFirst(r.message)}</span>
              <span className="sr-only">
                {state === "todo" ? " (waiting)" : state === "pending" ? " (checking)" : state === "pass" ? " (passed)" : " (failed)"}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="lane-summary">
        <span className="dim">Tests</span>{" "}
        {idle ? (
          <span className="dim">{result.requirements.length} todo</span>
        ) : (
          <>
            {failed > 0 && <span className="t-fail">{failed} failed</span>}
            {failed > 0 && passed > 0 && <span className="dim"> | </span>}
            {passed > 0 && <span className="t-pass">{passed} passed</span>}
            {pending > 0 && <span className="dim"> | {pending} {checking ? "running" : "todo"}</span>}
          </>
        )}{" "}
        <span className="dim">({result.requirements.length})</span>
        <span className="lane-time dim">{fmtMs(ms)}</span>
      </p>
    </section>
  );
}

/* ------------------------------------------------------------ flags */

function Flag({
  id,
  checked,
  onChange,
  children,
  disabled,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="flag" htmlFor={id} data-on={checked || undefined}>
      <input id={id} type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="flag-box" aria-hidden="true">{checked ? "x" : " "}</span>
      <span className="flag-name">{children}</span>
    </label>
  );
}

/* ------------------------------------------------------------ zxcvbn loader */

async function loadZxcvbn(): Promise<StrengthEstimator> {
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
  return fromZxcvbn(zxcvbn);
}

function useZxcvbn() {
  const [estimator, setEstimator] = useState<StrengthEstimator | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const load = async () => {
    if (estimator) return estimator;
    setStatus("loading");
    try {
      const est = await loadZxcvbn();
      setEstimator(() => est);
      setStatus("ready");
      return est;
    } catch {
      setStatus("error");
      return null;
    }
  };
  return { estimator, status, load };
}

/* ------------------------------------------------------------ runner (hero) */

function Runner({ zx }: { zx: ReturnType<typeof useZxcvbn> }) {
  const inputId = useId();
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<Config>(() => ({
    ...configFromPreset("classic"),
    commonPasswordCheck: true,
    patternCheck: true,
  }));
  const [breach, setBreach] = useState(true);
  const [useZx, setUseZx] = useState(false);
  const [custom, setCustom] = useState<CustomRuleSpec[]>([]);
  const [ruleName, setRuleName] = useState("");
  const [ruleSource, setRuleSource] = useState("");
  const [ruleError, setRuleError] = useState<string | null>(null);

  const customRules = useMemo<PolicyRule[]>(
    () =>
      custom.map((r) => {
        const re = new RegExp(r.source);
        return { name: r.name, message: r.name.replace(/([A-Z])/g, " $1").toLowerCase(), test: (p: string) => re.test(p) };
      }),
    [custom]
  );

  const zxOn = useZx && zx.estimator !== null;
  const policy = useMemo<PasswordPolicyOptions>(
    () => ({
      ...presets[config.preset],
      minLength: config.minLength,
      lowercaseCheck: config.lowercaseCheck,
      uppercaseCheck: config.uppercaseCheck,
      numberCheck: config.numberCheck,
      specialCharCheck: config.specialCharCheck,
      commonPasswordCheck: config.commonPasswordCheck,
      patternCheck: config.patternCheck,
      breachCheck: breach,
      customRules,
      ...(zxOn ? { strengthEstimator: zx.estimator!, minStrength: 3 as const } : {}),
    }),
    [config, customRules, zxOn, zx.estimator, breach]
  );

  // Browser lane: the React hook.
  const t0 = performance.now();
  const browser = usePasswordPolicy({ ...policy, password });
  const browserMs = performance.now() - t0;

  const runKey = `${password}\u0000${JSON.stringify(config)}\u0000${custom.length}\u0000${zxOn}\u0000${breach}`;

  // Server lane: the framework-free core your API imports. With the breach check on,
  // it runs validatePasswordAsync (debounced), exactly as an API route would.
  const t1 = performance.now();
  const serverSync = validatePassword(password, policy);
  const serverSyncMs = performance.now() - t1;
  const [serverAsync, setServerAsync] = useState<{ key: string; result: ValidationResult; ms: number } | null>(null);
  useEffect(() => {
    if (!policy.breachCheck) return;
    let cancelled = false;
    const key = runKey;
    const timer = window.setTimeout(async () => {
      const start = performance.now();
      const result = await validatePasswordAsync(password, policy);
      if (!cancelled) setServerAsync({ key, result, ms: performance.now() - start });
    }, 500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [password, policy, runKey]);
  const asyncReady = Boolean(policy.breachCheck) && serverAsync?.key === runKey;
  const server = !policy.breachCheck
    ? serverSync
    : asyncReady
      ? serverAsync!.result
      : applyBreachResult(serverSync, { status: serverSync.isValid ? "checking" : "idle", count: 0 }, policy);
  const serverMs = asyncReady ? serverAsync!.ms : serverSyncMs;

  const idle = password.length === 0;
  const pendingNames = new Set(
    [...browser.requirements, ...server.requirements].filter((r) => r.pending).map((r) => r.name)
  );
  const names = Array.from(new Set([...Object.keys(browser.policyState), ...Object.keys(server.policyState)])).filter(
    (n) => !pendingNames.has(n)
  );
  const identical = names.filter((n) => browser.policyState[n] === server.policyState[n]).length;
  const exitCode = !idle && browser.isValid ? 0 : 1;
  const pwned = browser.breach;

  const setPreset = (preset: PresetName) =>
    setConfig((c) =>
      preset === "classic"
        ? { ...configFromPreset(preset), commonPasswordCheck: c.commonPasswordCheck, patternCheck: c.patternCheck }
        : configFromPreset(preset)
    );
  const set = <K extends keyof Config>(k: K, v: Config[K]) => setConfig((c) => ({ ...c, [k]: v }));

  const addRule = (e: FormEvent) => {
    e.preventDefault();
    const name = ruleName.trim().replace(/\s+(\w)/g, (_, ch: string) => ch.toUpperCase());
    if (!name || !ruleSource) {
      setRuleError("Give the rule a name and a pattern.");
      return;
    }
    if (custom.some((r) => r.name === name) || name in DEFAULT_RULE_NAMES) {
      setRuleError(`A rule called "${name}" already exists.`);
      return;
    }
    try {
      new RegExp(ruleSource);
    } catch {
      setRuleError("That pattern isn't a valid regular expression.");
      return;
    }
    setCustom((list) => [...list, { name, source: ruleSource }]);
    setRuleName("");
    setRuleSource("");
    setRuleError(null);
  };
  const hasNoSpaces = custom.some((r) => r.name === "noSpaces");
  const toggleNoSpaces = () =>
    setCustom((list) => (hasNoSpaces ? list.filter((r) => r.name !== "noSpaces") : [...list, { name: "noSpaces", source: "^\\S*$" }]));

  const toggleZx = async (on: boolean) => {
    setUseZx(on);
    if (on) await zx.load();
  };

  return (
    <div className="runner">
      <div className="prompt">
        <label htmlFor={inputId} className="prompt-label">
          password <span aria-hidden="true">›</span>
        </label>
        <input
          id={inputId}
          className="prompt-input"
          type={visible ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="type one — try Password1!"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          className="prompt-toggle"
          aria-pressed={visible}
          aria-controls={inputId}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? "hide" : "show"}
        </button>
      </div>

      <div className="report" aria-live="off">
        <p className="run-line">
          <span className="badge badge-run">{idle ? "WATCH" : "RERUN"}</span>{" "}
          <span className="path">policy.ts</span>{" "}
          <span className="t-warn">--preset={config.preset}</span>{" "}
          <span className="dim">
            {idle ? "waiting for input" : `${passwordLength(password)} char${passwordLength(password) === 1 ? "" : "s"}`}
          </span>
        </p>

        <div className="lanes">
          <Lane runtime="browser" fn="usePasswordPolicy()" result={browser} ms={browserMs} idle={idle} runKey={runKey} />
          <Lane
            runtime="server"
            fn={breach ? "validatePasswordAsync()" : "validatePassword()"}
            result={server}
            ms={serverMs}
            idle={idle}
            runKey={runKey}
          />
        </div>

        <div className="verdict">
          <p className="verdict-line">
            <span className={`badge ${identical === names.length ? "badge-pass" : "badge-fail"}`}>PARITY</span>{" "}
            <strong>
              {identical}/{names.length}
            </strong>{" "}
            identical results
          </p>
          {breach && !idle && pwned && (
            <p className="verdict-line" role="status">
              <span className="dim">breach</span> <code className="path">Have I Been Pwned</code>{" "}
              {pwned.status === "idle" && <span className="dim">waits until the other rules pass</span>}
              {pwned.status === "checking" && <span className="dim">checking known breaches…</span>}
              {pwned.status === "safe" && <span className="t-pass">✓ not found in known breaches</span>}
              {pwned.status === "pwned" && (
                <span className="t-fail">× seen {pwned.count.toLocaleString()} times in breaches</span>
              )}
              {pwned.status === "error" && (
                <span className="t-warn">! couldn't reach Have I Been Pwned (let through: failOpen)</span>
              )}
            </p>
          )}
          {zxOn && !idle && browser.estimate?.feedback && (
            <p className="verdict-line t-warn">! zxcvbn: {browser.estimate.feedback}</p>
          )}
          <p className="verdict-line">
            <span className="dim">exit</span>{" "}
            <span className={exitCode === 0 ? "t-pass" : "t-fail"}>{exitCode}</span>
            <span className="dim">
              {" "}
              {idle ? "# no input yet" : exitCode === 0 ? "# ready to submit" : "# form stays disabled"}
            </span>
          </p>
        </div>
        <p className="note">
          # the server lane runs <code>use-password-policy/core</code> right here in this tab, the same function your API
          imports. Nothing you type leaves the page except a 5-character hash prefix for the breach check.
        </p>
      </div>

      <details className="config" open>
        <summary>
          <span className="path">policy.ts</span> <span className="dim">edit the one policy both lanes import</span>
        </summary>
        <div className="config-body">
          <div className="flags-row" role="radiogroup" aria-label="Preset">
            <span className="flag-key">--preset</span>
            {(["classic", "nist", "nistMfa"] as const).map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={config.preset === p}
                className="seg"
                onClick={() => setPreset(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flags-row">
            <label className="flag-key" htmlFor="minlen">
              --min-length
            </label>
            <input
              id="minlen"
              type="range"
              min={4}
              max={32}
              value={config.minLength}
              onChange={(e) => set("minLength", Number(e.target.value))}
            />
            <output htmlFor="minlen" className="range-out">
              {config.minLength}
            </output>
          </div>
          <div className="flags-row wrap">
            <Flag id="f-upper" checked={config.uppercaseCheck} onChange={(v) => set("uppercaseCheck", v)}>
              --uppercase
            </Flag>
            <Flag id="f-lower" checked={config.lowercaseCheck} onChange={(v) => set("lowercaseCheck", v)}>
              --lowercase
            </Flag>
            <Flag id="f-number" checked={config.numberCheck} onChange={(v) => set("numberCheck", v)}>
              --number
            </Flag>
            <Flag id="f-special" checked={config.specialCharCheck} onChange={(v) => set("specialCharCheck", v)}>
              --symbol
            </Flag>
          </div>
          <div className="flags-row wrap">
            <Flag id="f-common" checked={config.commonPasswordCheck} onChange={(v) => set("commonPasswordCheck", v)}>
              --block-common
            </Flag>
            <Flag id="f-pattern" checked={config.patternCheck} onChange={(v) => set("patternCheck", v)}>
              --block-patterns
            </Flag>
            <Flag id="f-breach" checked={breach} onChange={setBreach}>
              --breach-check
            </Flag>
            <Flag id="f-zx" checked={useZx} onChange={toggleZx} disabled={zx.status === "loading"}>
              --zxcvbn {zx.status === "loading" ? <span className="dim">(loading…)</span> : null}
            </Flag>
            <Flag id="f-nospace" checked={hasNoSpaces} onChange={toggleNoSpaces}>
              --no-spaces
            </Flag>
          </div>
          <form className="flags-row wrap rule-form" onSubmit={addRule}>
            <span className="flag-key">--rule</span>
            <input
              aria-label="Custom rule name"
              placeholder="name"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              className="text-in"
            />
            <span className="dim" aria-hidden="true">
              =/
            </span>
            <input
              aria-label="Custom rule regular expression"
              placeholder="[A-Z].*[A-Z]"
              value={ruleSource}
              onChange={(e) => setRuleSource(e.target.value)}
              className="text-in"
            />
            <span className="dim" aria-hidden="true">
              /
            </span>
            <button type="submit" className="seg">
              add
            </button>
            {ruleError && (
              <p className="t-fail rule-error" role="alert">
                {ruleError}
              </p>
            )}
          </form>
          {custom.length > 0 && (
            <ul className="rule-list">
              {custom.map((r) => (
                <li key={r.name}>
                  <code>
                    {r.name} = /{r.source}/
                  </code>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => setCustom((l) => l.filter((x) => x.name !== r.name))}
                    aria-label={`Remove rule ${r.name}`}
                  >
                    remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="code-block small">
            <CopyButton text={policySource(config, custom, zxOn, breach)} className="code-copy" />
            <pre>
              <code>{policySource(config, custom, zxOn, breach)}</code>
            </pre>
          </div>
        </div>
      </details>
    </div>
  );
}

const DEFAULT_RULE_NAMES: Record<string, true> = {
  minLength: true,
  maxLength: true,
  uppercase: true,
  lowercase: true,
  number: true,
  specialChar: true,
  notCommon: true,
  match: true,
  strength: true,
};

/* ------------------------------------------------------------ checklists lie */

const SAMPLES = ["Password1!", "Summer2024!", "P@ssw0rd", "correct horse battery staple", "violet-trombone-glacier-47"];

function ChecklistsLie({ zx }: { zx: ReturnType<typeof useZxcvbn> }) {
  const [breaches, setBreaches] = useState<Record<string, number | "error" | "checking">>({});
  const [ran, setRan] = useState(false);
  const run = async () => {
    setRan(true);
    zx.load();
    setBreaches(Object.fromEntries(SAMPLES.map((s) => [s, "checking" as const])));
    await Promise.all(
      SAMPLES.map(async (s) => {
        try {
          const n = await checkPwnedPassword(s);
          setBreaches((b) => ({ ...b, [s]: n }));
        } catch {
          setBreaches((b) => ({ ...b, [s]: "error" }));
        }
      })
    );
  };

  return (
    <section className="section" id="checklists" aria-labelledby="checklists-h">
      <div className="section-head">
        <h2 id="checklists-h">A checklist isn't a strength test.</h2>
        <p className="lede">
          <code>Password1!</code> ticks every box of the classic checklist. It's also one of the first guesses any attacker
          makes. The NIST preset, the common-password blocklist, zxcvbn and Have I Been Pwned each catch what the checklist
          can't.
        </p>
      </div>

      <div className="table-wrap">
        <table className="suite">
          <caption className="suite-caption">
            <span className="path">describe.each</span>
            <span className="dim">(samples)</span>{" "}
            <button type="button" className="seg" onClick={run} disabled={ran && zx.status === "loading"}>
              {ran ? "re-run zxcvbn + breach checks" : "run zxcvbn + breach checks"}
            </button>
          </caption>
          <thead>
            <tr>
              <th scope="col">input</th>
              <th scope="col">presets.classic</th>
              <th scope="col">presets.nist</th>
              <th scope="col">zxcvbn ≥ 3</th>
              <th scope="col">breaches</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLES.map((s) => {
              const classic = validatePassword(s, presets.classic).isValid;
              const nist = validatePassword(s, presets.nist).isValid;
              const score = zx.estimator ? zx.estimator(s).score : null;
              const b = breaches[s];
              return (
                <tr key={s}>
                  <th scope="row">
                    <code>{s}</code>
                  </th>
                  <td>
                    <Verdict ok={classic} />
                  </td>
                  <td>
                    <Verdict ok={nist} />
                  </td>
                  <td>
                    {score === null ? (
                      <span className="dim">{zx.status === "loading" ? "loading…" : "not run"}</span>
                    ) : (
                      <Verdict ok={score >= 3} detail={`${score}/4`} />
                    )}
                  </td>
                  <td>
                    {b === undefined && <span className="dim">not run</span>}
                    {b === "checking" && <span className="dim">checking…</span>}
                    {b === "error" && <span className="t-warn">unreachable</span>}
                    {typeof b === "number" && (
                      <Verdict ok={b === 0} detail={b === 0 ? "clean" : `seen ${b.toLocaleString()}×`} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="note"># these are sample inputs for the demo; results are computed live in your browser.</p>
    </section>
  );
}

function Verdict({ ok, detail }: { ok: boolean; detail?: string }) {
  return (
    <span className={ok ? "t-pass" : "t-fail"}>
      <span aria-hidden="true">{ok ? "✓" : "×"}</span> {detail ?? (ok ? "pass" : "fail")}
      <span className="sr-only">{ok ? " (pass)" : " (fail)"}</span>
    </span>
  );
}

/* ------------------------------------------------------------ component demo */

function ComponentDemo() {
  const [meter, setMeter] = useState(true);
  const [label, setLabel] = useState(true);
  const [list, setList] = useState(true);
  const [toggle, setToggle] = useState(true);
  const [nist, setNist] = useState(false);
  const [breachOn, setBreachOn] = useState(false);
  const componentPolicy = useMemo(
    () => (nist || breachOn ? { ...(nist ? presets.nist : {}), ...(breachOn ? { breachCheck: true } : {}) } : undefined),
    [nist, breachOn]
  );

  const props = [
    `  id="password"`,
    `  name="password"`,
    nist && breachOn
      ? `  policyOptions={{ ...presets.nist, breachCheck: true }}`
      : nist
        ? `  policyOptions={presets.nist}`
        : breachOn
          ? `  policyOptions={{ breachCheck: true }}`
          : null,
    !meter ? `  showStrengthMeter={false}` : null,
    label && meter ? `  showStrengthLabel` : null,
    !list ? `  showRequirementsList={false}` : null,
    !toggle ? `  showToggleButton={false}` : null,
    `  onPasswordChange={(pw, v) => setValid(v.isValid)}`,
  ].filter(Boolean);
  const code = `import { PasswordPolicyInput${nist ? ", presets" : ""} } from 'use-password-policy';

<label htmlFor="password">Password</label>
<PasswordPolicyInput
${props.join("\n")}
/>`;

  return (
    <section className="section" id="component" aria-labelledby="component-h">
      <div className="section-head">
        <h2 id="component-h">Or drop in the input.</h2>
        <p className="lede">
          <code>&lt;PasswordPolicyInput /&gt;</code> ships a strength meter, a live checklist and a show/hide button. It
          links them to the field for screen readers and takes the same options as the hook. Themed here with its{" "}
          <code>--rpp-*</code> CSS variables.
        </p>
      </div>
      <div className="component-grid">
        <div className="component-stage">
          <label htmlFor="component-password" className="stage-label">
            Password
          </label>
          <PasswordPolicyInput
            id="component-password"
            name="password"
            className="term-rpp"
            policyOptions={componentPolicy}
            showStrengthMeter={meter}
            showStrengthLabel={label}
            showRequirementsList={list}
            showToggleButton={toggle}
            placeholder="type to see it work"
          />
          <div className="flags-row wrap stage-flags">
            <Flag id="c-nist" checked={nist} onChange={setNist}>
              presets.nist
            </Flag>
            <Flag id="c-breach" checked={breachOn} onChange={setBreachOn}>
              breachCheck
            </Flag>
            <Flag id="c-meter" checked={meter} onChange={setMeter}>
              showStrengthMeter
            </Flag>
            <Flag id="c-label" checked={label} onChange={setLabel} disabled={!meter}>
              showStrengthLabel
            </Flag>
            <Flag id="c-list" checked={list} onChange={setList}>
              showRequirementsList
            </Flag>
            <Flag id="c-toggle" checked={toggle} onChange={setToggle}>
              showToggleButton
            </Flag>
          </div>
        </div>
        <div className="code-block">
          <div className="code-bar">
            <span className="path">SignUp.tsx</span>
            <CopyButton text={code} />
          </div>
          <pre>
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ wire it up (tabs) */

const FILES: { name: string; note: string; code: string }[] = [
  {
    name: "policy.ts",
    note: "one source of truth",
    code: `import { presets, type PasswordPolicyOptions } from 'use-password-policy/core';

export const policy: PasswordPolicyOptions = {
  ...presets.nist,              // 15+ chars, no composition rules, blocks common passwords + patterns
  breachCheck: true,            // Have I Been Pwned, part of isValid
  commonPasswords: ['acme'],    // add your product name
};`,
  },
  {
    name: "SignUp.tsx",
    note: "client",
    code: `import { usePasswordPolicy } from 'use-password-policy';
import { policy } from './policy';

export function SignUp() {
  const [password, setPassword] = useState('');
  // isValid stays false until the breach check has answered
  const { isValid, requirements } = usePasswordPolicy({ ...policy, password });

  return (
    <form>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <ul>
        {requirements.map((r) => (
          <li key={r.name} data-passed={r.passed} data-pending={r.pending}>{r.message}</li>
        ))}
      </ul>
      <button disabled={!isValid}>Create account</button>
    </form>
  );
}`,
  },
  {
    name: "api/sign-up.ts",
    note: "server",
    code: `import { validatePasswordAsync } from 'use-password-policy/core';
import { policy } from '../policy';

export async function POST(req: Request) {
  const { password } = await req.json();

  // same rules as the form, including the breach check
  const { isValid, errors } = await validatePasswordAsync(password, policy);
  if (!isValid) return Response.json({ errors }, { status: 400 });

  // …create the user
}`,
  },
  {
    name: "schema.ts",
    note: "zod",
    code: `import { z } from 'zod';
import { zodPasswordRuleAsync } from 'use-password-policy/core';
import { policy } from './policy';

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().superRefine(zodPasswordRuleAsync(policy)), // one issue per failed rule
});

// await signUpSchema.parseAsync(body)`,
  },
  {
    name: "Form.tsx",
    note: "react-hook-form",
    code: `import { useForm } from 'react-hook-form';
import { passwordValidatorAsync } from 'use-password-policy/core';
import { policy } from './policy';

const { register } = useForm();

<input type="password" {...register('password', { validate: passwordValidatorAsync(policy) })} />`,
  },
];

function WireUp() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? FILES.length - 1 : (active + dir + FILES.length) % FILES.length;
    setActive(next);
    tabs.current[next]?.focus();
  };
  const file = FILES[active];
  return (
    <section className="section" id="wire-up" aria-labelledby="wire-h">
      <div className="section-head">
        <h2 id="wire-h">Write it once. Import it twice.</h2>
        <p className="lede">
          Put the policy in a shared file. The form imports it for the hook, the API route imports it for{" "}
          <code>validatePassword()</code>. Your Zod schema or react-hook-form field can use it too. Change a rule in one
          place and every check changes with it.
        </p>
      </div>
      <div className="code-block tabs-block">
        <div className="tabs" role="tablist" aria-label="Example files" onKeyDown={onKey}>
          {FILES.map((f, i) => (
            <button
              key={f.name}
              ref={(el) => (tabs.current[i] = el)}
              role="tab"
              id={`${baseId}-tab-${i}`}
              aria-selected={i === active}
              aria-controls={`${baseId}-panel`}
              tabIndex={i === active ? 0 : -1}
              className="tab"
              onClick={() => setActive(i)}
            >
              <span className="tab-name">{f.name}</span>
              <span className="tab-note">{f.note}</span>
            </button>
          ))}
        </div>
        <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-tab-${active}`} className="tab-panel">
          <CopyButton text={file.code} className="code-copy" />
          <pre>
            <code>{file.code}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ facts */

function Facts() {
  const rows: [string, ReactNode, string][] = [
    ["dependencies", "0", "nothing else gets installed"],
    ["core", "3.9 kB", "gzipped · use-password-policy/core, no React"],
    ["react entry", "6.5 kB", "gzipped · hook, component, breach check"],
    ["react", "≥ 16.8, optional", "tested on 18 and 19"],
    ["tests", <span className="t-pass">85 passed</span>, "vitest + Testing Library, run in CI"],
    ["guidance", "NIST SP 800-63B-4", "the nist presets follow it"],
    ["license", "MIT", ""],
  ];
  return (
    <section className="section facts" id="facts" aria-labelledby="facts-h">
      <div className="section-head">
        <h2 id="facts-h">What you're installing.</h2>
      </div>
      <dl className="facts-list">
        {rows.map(([k, v, note]) => (
          <div className="fact" key={k}>
            <dt>{k}</dt>
            <dd>
              <span className="fact-v">{v}</span>
              {note && <span className="dim"> # {note}</span>}
            </dd>
          </div>
        ))}
      </dl>
      <div className="install-close">
        <code className="install-cmd">
          <span className="dim">$</span> {INSTALL}
        </code>
        <CopyButton text={INSTALL} label="copy install" className="copy-primary" />
        <a className="btn-ghost" href={REPO} target="_blank" rel="noopener noreferrer">
          <GitHubIcon size={15} /> star on GitHub
        </a>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ app */

export default function App() {
  const zx = useZxcvbn();

  // Old links (/demo, /component-demo) still land somewhere useful.
  useEffect(() => {
    const path = window.location.pathname.replace(/\/+$/, "").split("/").pop();
    const map: Record<string, string> = { demo: "try", "component-demo": "component" };
    const target = path && map[path];
    if (target) document.getElementById(target)?.scrollIntoView();
  }, []);

  return (
    <div className="app">
      <a className="skip" href="#try">
        Skip to the live demo
      </a>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="use-password-policy, top of page">
          use-password-policy
        </a>
        <nav className="topnav" aria-label="Sections">
          <a href="#try">try it</a>
          <a href="#checklists">checklists</a>
          <a href="#component">component</a>
          <a href="#wire-up">wire it up</a>
        </nav>
        <div className="topbar-actions">
          <code className="install-cmd small">
            <span className="dim">$</span> {INSTALL}
          </code>
          <CopyButton text={INSTALL} label="copy install" className="copy-primary" />
          <a className="icon-link" href={REPO} target="_blank" rel="noopener noreferrer" aria-label="GitHub repository">
            <GitHubIcon size={18} />
          </a>
        </div>
      </header>

      <main id="top">
        <section className="hero" id="try" aria-labelledby="hero-h">
          <div className="hero-copy">
            <h1 id="hero-h" className="display">
              One password policy. Same verdict in the browser and on your server.
            </h1>
            <p className="hero-lede">
              <code>use-password-policy</code> runs your rules as a React hook while people type, and as a plain function
              in your API. Type a password: both runners import one policy object and print the same result.
            </p>
            <ul className="hero-points">
              <li>
                <span className="t-pass point-icon"><CheckIcon size={15} /></span> NIST SP 800-63B presets
              </li>
              <li>
                <span className="t-pass point-icon"><CheckIcon size={15} /></span> common-password blocklist
              </li>
              <li>
                <span className="t-pass point-icon"><CheckIcon size={15} /></span> Have I Been Pwned breach check
              </li>
              <li>
                <span className="t-pass point-icon"><CheckIcon size={15} /></span> zxcvbn, Zod, react-hook-form
              </li>
              <li>
                <span className="t-pass point-icon"><CheckIcon size={15} /></span> zero dependencies
              </li>
            </ul>
            <div className="hero-links">
              <a href={NPM} target="_blank" rel="noopener noreferrer">
                npm <ArrowIcon size={13} />
              </a>
              <a href={REPO} target="_blank" rel="noopener noreferrer">
                GitHub <ArrowIcon size={13} />
              </a>
              <a href={`${REPO}#readme`} target="_blank" rel="noopener noreferrer">
                docs <ArrowIcon size={13} />
              </a>
            </div>
          </div>
          <Runner zx={zx} />
        </section>

        <ChecklistsLie zx={zx} />
        <ComponentDemo />
        <WireUp />
        <Facts />
      </main>

      <footer className="footer">
        <p>
          <span className="dim">$</span> exit <span className="t-pass">0</span>
          <span className="dim"> · built by Rahul Patwa · MIT</span>
        </p>
        <p className="footer-links">
          <a href={REPO} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href={NPM} target="_blank" rel="noopener noreferrer">
            npm
          </a>
          <a href={`${REPO}/blob/master/CHANGELOG.md`} target="_blank" rel="noopener noreferrer">
            changelog
          </a>
          <a href={`${REPO}/issues`} target="_blank" rel="noopener noreferrer">
            issues
          </a>
        </p>
      </footer>
    </div>
  );
}
