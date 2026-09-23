---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

# Demo site (landing + playground)

Scope: the single-page demo at `/use-password-policy/` (demo/src/App.tsx). Visitor mode: Persuade.

Audience: React developers building sign-up / reset forms, arriving from npm or GitHub. Job: see the rules work on real input, believe "one policy, client + server", copy install + snippet.
Action: copy `npm i use-password-policy`; secondary: GitHub star, copy snippets.
Proof: everything live — the hook and the core function both run on the visitor's input; real measured sizes and test counts only. No invented social proof.
Constraints: keep every existing demo capability (presets, rule toggles, min length, custom regex rules, no-spaces rule, component show/hide props, common-password check, HIBP check, zxcvbn on demand). GitHub Pages base path. WCAG 2.2 AA.

## Direction contract

THESIS: The page is a live test report. Every keystroke re-runs the visitor's password as a suite in two runners, the browser hook and the Node core function, and prints their parity. It refuses the category default of gradient hero, feature-card grid and pastel code tabs.

OWN-WORLD: A watch-mode terminal report. Graphite ground, never pure black, no glow. The reporter's own palette in named roles: inverse-video PASS (green) and FAIL (red) badges, cyan file paths, yellow warnings and skips, dim grey for timings and comments. Iosevka for everything; Martian Mono only for display lines. Square corners, one-pixel rules, left gutters of ✓ and ✗ marks, `›` prompts. Controls look like CLI flags.

STORY: The visitor types a password and watches both runners agree line by line. They see "PARITY 9/9 identical", learn that checklists lie (Password1! passes classic but fails NIST, breach and zxcvbn), try the drop-in component, then copy install and the client, server, Zod and react-hook-form snippets.

FIRST VIEWPORT: A thin top bar with the prompt `$ npm i use-password-policy` and a copy button (the primary action), plus GitHub and npm links. On the left, a four-line display headline and a two-line lede. On the right, filling about 60% of the width, the runner: a `password ›` input at 20px or larger, the `RUN policy.ts` header with preset flags, two panes (browser · usePasswordPolicy() and server · validatePassword()) with per-rule lines and real timings, and a PARITY summary line. It stacks below 900px.

FORM: Test-runner report (vitest/jest watch output). It was number 1 on my ordered list, chosen by the user as the pick. Seed key c0e778da (degraded roll).

Signature interaction: typing triggers a watch-mode rerun. A "↻ rerun" line appears, the report lines reprint with a 10ms stagger, and PASS/FAIL badges flip. Reduced motion prints instantly.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
