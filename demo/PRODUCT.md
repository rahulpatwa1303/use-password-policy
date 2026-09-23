# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

React developers building a sign-up, reset-password or change-password form. They arrive from npm, GitHub or a search, want to see the rules working on real input within seconds, copy a snippet, and install. They are evaluating against writing the regexes themselves or picking another package.

## Product Purpose

`use-password-policy` is an MIT-licensed npm package that validates passwords as users type and on the server. The demo site exists to let a developer try it live, understand the API, and install it. Success is a developer copying `npm install use-password-policy` or a snippet, or starring the repo.

## Positioning

One password policy, defined once, enforced identically in the React form and in the API. `validatePassword()` from `use-password-policy/core` has no React dependency and returns the same result shape as the hook, so client and server cannot drift. Supporting claims: NIST SP 800-63B-4 presets, a common-password blocklist, Have I Been Pwned k-anonymity checks, optional zxcvbn scoring, Zod and react-hook-form helpers, zero runtime dependencies.

## Operating Context

Visitors read on desktop at a desk with an editor open, and sometimes on a phone from a link. The site is deployed to GitHub Pages at `/use-password-policy/` from the `demo/` Vite + React workspace, which imports the library from the repo root build.

## Capabilities and Constraints

- Hook `usePasswordPolicy`, component `<PasswordPolicyInput />`, hook `usePwnedPassword`, core `validatePassword` and `validatePasswordAsync`, `presets` (`classic`, `nist`, `nistMfa`), `fromZxcvbn`, `zodPasswordRule`, `passwordValidator`, `checkPwnedPassword`.
- Rule names: `minLength`, `maxLength`, `uppercase`, `lowercase`, `number`, `specialChar`, `notCommon`, `noPattern`, `notBreached`, `match`, `strength`, plus custom rules.
- Sizes measured from the 3.1.0 build: core ≈ 3.9 KB gzipped, React entry ≈ 6.5 KB gzipped.
- The breach check calls api.pwnedpasswords.com from the browser; only a 5-character SHA-1 prefix is sent.
- zxcvbn is not bundled with the library; the demo loads it on demand.
- Stack is fixed: Vite 8 + React 18 + TypeScript.

## Brand Commitments

- Name: `use-password-policy`, written in code style, lowercase.
- Author credit: Rahul Patwa. MIT licence.
- Links: GitHub repo `rahulpatwa1303/use-password-policy`, npm package page.

## Evidence on Hand

- Live, working library and tests (85 passing on React 18 and 19).
- No testimonials, company logos, user counts or download milestones. The repo has very few stars. Do not fabricate social proof, usage numbers or endorsements.

## Product Principles

1. Show, don't claim: every capability on the page is demonstrated live or in runnable code.
2. Same result everywhere: the client/server symmetry is the headline and should be visible, not just stated.
3. Honest security: follow current NIST guidance and never overstate what a check guarantees.
4. Respect the developer's time: install and first snippet reachable in one scroll.

## Accessibility & Inclusion

The library markets accessibility; the demo must meet WCAG 2.2 AA itself (contrast, keyboard, focus, labels, reduced motion).
