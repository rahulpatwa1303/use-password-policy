---
name: use-password-policy demo
description: A live watch-mode test report that proves one password policy gives the same verdict in the browser and on the server.
colors:
  ground: "#111412"
  pane: "#161a17"
  pane-hi: "#1c211d"
  rule: "#2a312c"
  rule-hi: "#3a433d"
  ink: "#dde3da"
  ink-strong: "#f3f6f1"
  dim: "#8e978f"
  pass: "#6fd49a"
  fail: "#ff7a72"
  warn: "#e8c46a"
  path: "#62cbd8"
  badge-ink: "#0c0f0d"
typography:
  display:
    fontFamily: "Martian Mono Variable, Iosevka, ui-monospace, monospace"
    fontSize: "clamp(2rem, 3.6vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  heading:
    fontFamily: "Martian Mono Variable, Iosevka, ui-monospace, monospace"
    fontSize: "clamp(1.5rem, 2.4vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Iosevka, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  report:
    fontFamily: "Iosevka, ui-monospace, monospace"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Iosevka, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  badge:
    fontFamily: "Iosevka, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1.6
    letterSpacing: "0.04em"
rounded:
  none: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "18px"
  xl: "28px"
  gutter: "clamp(16px, 3vw, 40px)"
  section: "clamp(56px, 7vw, 112px)"
components:
  button-primary:
    backgroundColor: "{colors.pass}"
    textColor: "{colors.badge-ink}"
    rounded: "{rounded.none}"
    padding: "4px 10px"
  button-primary-hover:
    backgroundColor: "{colors.ink-strong}"
    textColor: "{colors.badge-ink}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "4px 10px"
  seg-selected:
    backgroundColor: "{colors.ink-strong}"
    textColor: "{colors.badge-ink}"
    rounded: "{rounded.none}"
    padding: "2px 10px"
  badge-pass:
    backgroundColor: "{colors.pass}"
    textColor: "{colors.badge-ink}"
    typography: "{typography.badge}"
    padding: "0 0.5em"
  badge-fail:
    backgroundColor: "{colors.fail}"
    textColor: "{colors.badge-ink}"
    typography: "{typography.badge}"
    padding: "0 0.5em"
  prompt-input:
    backgroundColor: "{colors.pane-hi}"
    textColor: "{colors.ink-strong}"
    padding: "16px 18px"
  pane:
    backgroundColor: "{colors.pane}"
    rounded: "{rounded.none}"
---

# Design System: use-password-policy demo

## Overview

**Creative North Star: "The Watch-Mode Report"**

The page is a test runner's output, not a marketing page dressed as one. A developer types a password and the page reruns it as a suite, twice: once through the React hook and once through the framework-free core function. It prints both results side by side and closes with a parity line. Every surface reuses the reporter's grammar: inverse-video PASS/FAIL badges, `✓`/`×` gutters, cyan file paths, yellow flags, dim timings and `#` comments.

The ground is graphite with a faint green cast, never pure black, and nothing glows. Hierarchy comes from the reporter's own devices: badge colour, the ink-strong vs dim split between failing and passing lines, and one-pixel rules between panes. The only large type is the display headline and section headings in Martian Mono. Everything else is Iosevka, because on this page text *is* terminal output.

**Key Characteristics:**
- Two lanes, one policy: whenever the product's mechanism appears, it's shown as paired output.
- Reporter palette in named roles. Colour means state, never decoration.
- Square corners, one-pixel rules, no shadows, no gradients.
- Controls read as CLI flags: `--preset`, `[x] --uppercase`, `--rule name=/…/`.
- One authored motion: the watch-mode reprint of report lines.

## Colors

A graphite ground carrying the test reporter's four signal colours, each with exactly one job.

### Primary
- **Pass Green** (`#6fd49a`): passing marks, PASS badges, the primary copy-install button, the focused prompt underline and the heading prompt `›`.

### Secondary
- **Fail Coral** (`#ff7a72`): failing marks, FAIL badges, validation errors, destructive text links.
- **Path Cyan** (`#62cbd8`): file paths, function names, links, the RERUN badge and the focus ring.
- **Flag Amber** (`#e8c46a`): flag keys (`--preset`, `dependencies`), warnings and zxcvbn feedback.

### Neutral
- **Graphite Ground** (`#111412`): the page, code blocks and input wells.
- **Pane** (`#161a17`) / **Pane High** (`#1c211d`): report panes, tables, the prompt bar and row hover.
- **Rule** (`#2a312c`) / **Rule High** (`#3a433d`): inner dividers and outer frames.
- **Ink** (`#dde3da`), **Ink Strong** (`#f3f6f1`), **Dim** (`#8e978f`): body text, emphasis and failing lines, and comments, timings and passing lines. Dim clears 5.4:1 on Pane High.
- **Badge Ink** (`#0c0f0d`): text on any filled badge or primary button.

### Named Rules
**The Signal-Only Rule.** Green, coral, cyan and amber appear only where they carry state or role (pass, fail, path, flag). No decorative colour fields.

**The Inverted Attention Rule.** A failing line is the brightest thing in a lane (Ink Strong) and a passing line recedes to Dim, the way a reporter pulls the eye to what broke.

## Typography

**Display Font:** Martian Mono Variable (fallback Iosevka, ui-monospace), set at `font-stretch: 87.5%` and 75% on phones.
**Body Font:** Iosevka (400/500/700), used for everything else.

**Character:** A wide, heavy mono for the few statements that must land, over a narrow, dense mono that fits two report lanes side by side at 15px. Tabular numerals everywhere.

### Hierarchy
- **Display** (700, clamp(2rem, 3.6vw, 3.5rem), lh 1.08, -0.03em): the hero statement only. Balanced wrap.
- **Heading** (700, clamp(1.5rem, 2.4vw, 2.25rem), lh 1.15): section headings, prefixed with a Pass Green `› ` prompt.
- **Body** (400, 16px, lh 1.6): ledes and prose. Keep to 52–72ch.
- **Report** (400, 15px): lane lines, table cells, tab names.
- **Label** (400, 14px): flags, summaries, copy buttons and code.
- **Badge** (700, 13px, +0.04em): inverse-video status blocks.

### Named Rules
**The Output-Is-Text Rule.** `✓` `×` `○` are reporter output and belong only inside report lanes and suite tables. Standalone list bullets and UI icons use the authored 1.75-stroke SVG set (check, copy, arrow, GitHub).

## Layout

The layout uses a max width of 1440px with fluid gutters (`clamp(16px, 3vw, 40px)`). The hero is a 5fr / 7fr split, copy on the left and the runner on the right. It collapses to one column below 960px. Report lanes are 1fr / 1fr with a one-pixel divider and stack below 640px. Sections open with `clamp(56px, 7vw, 112px)` of space above and a 28px gap under the heading block. Section rhythm varies: dense runner, wide table, split component stage and code, full-width tabbed code, then a sparse definition list and the install close.

## Elevation & Depth

The page is flat by design. Depth comes from three stepped grounds (Ground → Pane → Pane High) and one-pixel rules. There are no shadows. The only inset "shadow" is a 2px underline marking the focused prompt and the selected tab.

## Shapes

Every corner is square (`0px`), including the drop-in component through `--rpp-radius: 0px`. Frames are one pixel. Checkbox flags are drawn as text: `[x]` and `[ ]`.

## Components

### Buttons
- **Primary (copy install):** Pass Green fill, Badge Ink text, bold. Hover turns it Ink Strong. After copying it shows a check icon and "copied".
- **Outline (copy, star on GitHub):** transparent with a Rule High frame. Hover brightens the frame and text to Ink.
- **Segmented (`--preset` options, table run button):** outline, and the selected option inverts to Ink Strong with Badge Ink text.

### Chips
- **Flags:** a label with a visually hidden checkbox and a text box `[x]`/`[ ]`. Off is Dim, on is Ink Strong. The focus ring surrounds the whole flag.

### Cards / Containers
- **Pane:** a Rule High frame on a Pane ground. Holds the runner, the suite table and the component stage. Panes are never nested inside other panes.

### Inputs / Fields
- **Prompt:** Pass Green `password ›` label, borderless 24px input on Pane High, and a 2px Pass Green underline on focus.
- **Text inputs:** a Ground well with a Rule High frame that turns Path Cyan on focus.

### Navigation
- **Top bar:** a sticky bar on a 94% Ground wash with a one-pixel rule. `~/use-password-policy` brand, Dim anchor links (hidden below 1080px), the install command, the primary copy button and a GitHub icon link.

### Report Lane (signature)
Header: badge + runtime + cyan function name. Then an ordered list of cases with a gutter mark, and a summary: `Tests n failed | n passed (n)` plus the measured time. When input changes, the list remounts and each line reprints with a left-to-right clip reveal (260ms, expo-out, 12ms stagger). Reduced motion prints instantly.

## Do's and Don'ts

### Do:
- **Do** show the mechanism as paired output (browser lane and server lane) with a parity line.
- **Do** use badge colour and the Ink Strong / Dim split for state, and always pair colour with a mark or a word.
- **Do** write controls as flags and headings as prompts, in the product's own API names.
- **Do** label demonstration inputs as samples and compute every result live.

### Don't:
- **Don't** use pure black, glows, neon edges or gradients.
- **Don't** round corners or add drop shadows.
- **Don't** use `✓`/`×` glyphs as bullets or icons outside report output.
- **Don't** add kickers or eyebrows above headings, or feature-card grids.
- **Don't** invent usage numbers, testimonials or benchmarks. Only measured sizes and test counts appear.
