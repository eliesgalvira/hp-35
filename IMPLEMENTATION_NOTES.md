# HP-35 Calculator – Implementation Notes

Documenting the non-obvious decisions, font quirks, and trade-offs in this skeuomorphic HP-35 recreation.

---

## Fonts

### TexGyreHeros (button labels)

A free Helvetica clone used for all button text, matching the original HP-35's sans-serif key legends.

**Metric override problem:** TexGyreHeros ships with `usWinAscent: 1125` and `usWinDescent: 307` against a 1000 upm grid. Browsers use these Win metrics to size the inline content box, producing a box 143.2% of font-size — heavily biased upward. When centered with flexbox, the oversized content box centers correctly but the _glyphs_ visually sit too low because the extra space is asymmetric.

**Fix:** `ascent-override: 90%; descent-override: 25%` on both `@font-face` declarations. This normalizes the content box so glyphs stay vertically centered and don't shift when the font loads.

### STIX Two Math (mathematical symbols: 𝑥, 𝑦, 𝑒, 𝜋)

Used for mathematical italic glyphs on function keys. These are the Unicode Mathematical Italic codepoints, not regular letters with `font-style: italic`:

| Glyph | Codepoint | Usage |
|-------|-----------|-------|
| 𝑥 | U+1D465 | √𝑥, 𝑒^𝑥, 𝑥^𝑦, 1/𝑥, CL𝑥 |
| 𝑦 | U+1D466 | 𝑥^𝑦, 𝑥⮂𝑦 |
| 𝑒 | U+1D452 | 𝑒^𝑥 |
| 𝜋 | U+1D70B | π key |

**Why Unicode Math Italic, not CSS italic?** Regular alphabet letters rendered in italic via `font-style: italic` look different from the dedicated Mathematical Italic codepoints. The Math Italic glyphs have proper typographic design for mathematical contexts — different stroke angles, serifs, and proportions.

**Sizing at 1.45em:** STIX Two Math's x-height is significantly smaller than TexGyreHeros's cap-height. At the same font-size, a math 𝑥 appears much smaller than a label like "CL". Scaling to 1.45em makes the math glyphs visually match the height of surrounding uppercase TexGyreHeros text.

**No vertical adjustment needed:** After extensive testing, `0em` was the correct vertical offset — the baseline alignment is correct at the default position. No `relative`/`bottom` positioning required.

### DSEG7 (LED display)

Seven-segment display font for the red LED readout. Ghost segments (the faint 8.8.8.8... background) use the italic variant with reduced opacity to simulate unlit segments.

---

## Lowercase Function Labels (log, ln, sin, cos, tan, arc)

The original HP-35 prints these labels in lowercase but at the same visual height as uppercase letters like CLR, STO, RCL.

**Approach:** Simply increase font-size to 16px (vs the 11px base for func keys). At 16px, the x-height of the lowercase letters in TexGyreHeros matches the cap-height at 11px. This is cleaner than CSS `scale-y` transforms which distort letter shapes and mess with spacing.

**Rejected approaches:**
- `font-variant: small-caps` — doesn't match the original; small-caps are a distinct typographic style
- `text-transform: uppercase` with smaller font — not lowercase anymore
- `scale-y-[1.38]` — distorts letterforms, makes strokes uneven, ruins inter-letter spacing
- `scale-y` with `origin-[50%_78%]` — still distorts, just with better baseline anchoring

---

## Unicode Arrows

| Arrow | Codepoint | Usage | Notes |
|-------|-----------|-------|-------|
| ⮂ | U+2B82 | x⮂y (swap) | Bidirectional horizontal arrow |
| 🠟 | U+1F81F | R🠟 (roll down) | Downward arrow |
| 🡪 | U+1F86A | ENTER🡪 | Rotated -90° via CSS to point upward |

The ENTER arrow is 🡪 rotated with `transform: rotate(-90deg)` because there's no single Unicode codepoint that matches the exact arrow style of the original HP-35's upward-pointing enter arrow. The `.hp-arrow-up` class in globals.css handles this — it's one of the few things left in CSS because Tailwind's `rotate` utility combined with `inline-block` display is less readable.

### Mobile fallback fix (2026-02)

On desktop, these arrow codepoints rendered via system fallback fonts. On Android (Chrome and Firefox-based browsers), those fallback fonts did not reliably include U+1F81F/U+1F86A/U+2B82, causing missing glyphs (blank space or tofu box).

To preserve the exact Unicode characters while fixing mobile rendering:

- Added `@fontsource/noto-sans-symbols-2` and `@fontsource/noto-sans-symbols`.
- Loaded symbol font CSS from `layout.tsx` imports:
  - `@fontsource/noto-sans-symbols-2/symbols-400.css`
  - `@fontsource/noto-sans-symbols/symbols-400.css`
- Added `.hp-symbol-arrow` class and applied it only to the three arrow glyph spans in `hp-35.tsx`.

**Why this import path matters:** Referencing `../../node_modules/...` in `globals.css` compiled locally but failed on Vercel with module resolution errors. Importing Fontsource CSS through the app entrypoint (`layout.tsx`) is bundler-safe and deploy-safe.

**Weight note:** `.hp-symbol-arrow` intentionally does not force `font-weight`, so the glyphs inherit button weight and the `x⮂y` arrow keeps fuller heads/stroke like the original.

This keeps the visual shape faithful to the HP-35 while removing dependency on unpredictable mobile system font fallback.

Validation performed:

- `pnpm test -- --run` (15/15 passing)
- `pnpm build` (successful production build)
- Manual browser check in local dev build confirmed all three labels still render and align on the calculator UI.

---

## Display Formatting

`updateDisplay()` mimics the real HP-35's 15-character LED display:

1. **Fixed-point first:** For values in [0.001, 1e10), tries `toFixed(9)` down to `toFixed(0)`, picking the most precision that fits in ≤11 characters. Always includes a decimal point (HP-35 convention).
2. **Scientific fallback:** Format as `M.MMMMMMMM ±EE` — mantissa with 8 decimal places (trailing zeros stripped), space-separated two-digit exponent with sign.

### 15-slot LCD layout

The display is always rendered as 15 fixed character slots:
- **1 sign slot**: `" "` for positive, `"-"` for negative (never a decimal or digit).
- **11 mantissa slots**: left-justified digits with exactly one decimal point, padded with trailing spaces.
- **3 exponent slots**: exponent sign plus two digits (sign is a space when positive). When not in scientific/EEX mode, these slots are rendered as spaces so the width never shifts.

### LED sizing

The DSEG7 LED font size is set to **19px** with **1px** letter spacing to fit all 15 character slots inside the existing display bezel without clipping. Keep ghost and active layers in sync so the segments align.

---

## Button Spacing

**CH S and E EX:** The original HP-35 has visible gaps within "CHS" and "EEX" — they read as "CH S" and "E EX". Reproduced using Unicode thin space U+2009 between the letter groups.

---

## Button Centering (Tailwind vs CSS)

All four button factories (`funcBtn`, `blueBtn`, `numBtn`, `opBtn`) use Tailwind `flex items-center justify-center` for centering. The CSS classes in globals.css only handle visual styling (colors, gradients, shadows, press animations) — no layout.

This avoids specificity conflicts and keeps layout logic colocated with the component.

---

## √x Radical

Built from two pieces:
1. The √ radical sign (U+221A) from STIX Two Math at **10px**, raised with a Tailwind `-top-[...]` offset so its start aligns with the bar.
2. The radicand 𝑥 (math italic) plus a separate, absolutely positioned **pseudo-element bar** so the bar can be positioned without moving the x.

**Why a pseudo-element bar:** Fractional `border-t` thicknesses and `top` offsets snap to device pixels (e.g., 1.25px vs 1.24px or 0.08em vs 0.07em), causing visible jumps. Using `h-px` + `scale-y-[...]` provides smoother thickness tuning, and `translate-y-[var(--sqrt-bar-offset)]` gives a high-precision vertical slider.

**Current approach (Tailwind):**
- Bar thickness: `after:h-px after:bg-current after:scale-y-[...]`
- Bar position: `after:top-0 after:translate-y-[var(--sqrt-bar-offset)]`
- Bar length: `pr-[...]` on the radicand wrapper

**Rejected approaches:**
- `text-decoration: overline` — too thick, wrong vertical position, can't control independently
- SVG path — over-engineered for a single glyph
- Precomposed √𝑥 character — doesn't exist in Unicode

---

## Trapezoidal Body

The HP-35's distinctive tapered shape uses `clip-path: polygon(3% 0%, 97% 0%, 100% 100%, 0% 100%)` — wider at the bottom than the top, matching the original's wedge profile.

---

## ON/OFF Switch

Positioned below the display and left-aligned, matching the original. The toggle nub is fixed to the right (ON position). The red power LED is a radial gradient circle with a glow `box-shadow`.

---

## Silver Chin

The bottom bar with the HP logo and "HEWLETT · PACKARD" wordmark. The dot is U+2022 (bullet) with non-breaking spaces (U+00A0) on each side. The HP logo square uses the italic lowercase "hp" matching HP's brand style.

**Stretched wordmark:** On the original HP-35, "HEWLETT · PACKARD" is spread across the entire width of the chin bar from the logo to the right edge. Achieved using `flex-1` on the wordmark div (so it fills remaining space after the logo) combined with `text-align-last: justify` which stretches a single line of text edge-to-edge. This is more faithful than a fixed `letter-spacing` value, as it adapts to the available width.

---

## Component vs Page Layout

The HP-35 component (`hp-35.tsx`) renders _only_ the calculator body — no viewport wrappers, no centering, no `min-height: 100vh`. This is intentional.

**Why:** The page layout (`page.tsx`) needs full control over positioning the calculator relative to the header, guide text, and footer. If the component wraps itself in a full-viewport centered container, the page layout can't reduce gaps or vertically center the entire content group. The component is a pure visual unit; the page owns the layout.

---

## Page Layout

The single-page layout uses a flexbox column (`flex flex-col items-center justify-center min-h-screen`) to vertically center a grouped block containing header → calculator → usage guide as one unit. The footer uses `mt-auto` to push to the bottom.

The background is the walnut-wood desk theme: a dark radial gradient with SVG fractal noise for wood grain texture and a warm brass spotlight overlay.

---

## Test Considerations

The 13 Vitest tests use accessible names that include the Unicode glyphs:
- `"ENTER🡪"` (not "ENTER↑")
- `"√x"` (U+221A + plain x, since aria-label is a string)
- `"x⮂y"` (U+2B82)
- `"R🠟"` (U+1F81F)
- `"CLx"` (plain x in aria-label)

The `displayNumber()` test helper parses HP-35 scientific notation format where the exponent is space-separated (e.g., `"1.5 03"` → `1500`).

---

## HP-35 Behavior Corrections (2026-02)

- **Display formatting** now matches the HP-35 spec: 10-digit mantissa, fixed-point range `10^-2` to `<10^10`, scientific outside that range, trailing zeros blanked, and a visible decimal point even for integers (e.g., `11.`).
- **Entry rendering** is left-justified with the decimal point shown as digits are entered. The `CH S` key also latches the sign so the next numeric entry overwrites X while preserving the sign.
- **E EX behavior** displays a right-side exponent field immediately as `00`, accepts two exponent digits, and only permits exponent sign changes immediately after `E EX`.
- **Trig/arc** are in degrees (arc returns degrees) and the arc prefix is one-shot; trigonometric operations duplicate Z into T per the manual.
- **Stack visuals** always show X (including after `x⮂y` and `R🠟`), preventing stale display reads.
- **Sign segment** is rendered as its own fixed-width LED segment so the minus sign is no longer clipped.
