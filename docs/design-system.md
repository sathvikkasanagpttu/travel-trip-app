# Travel Trip — Design System

This design system establishes a polished, modern, high-contrast, accessible visual language for the Travel Trip application.

## 1. Design Tokens (`src/styles/tokens.css`)

### Color Palette
- **Primary Brand**:
  - `--color-primary`: `#2563eb` (Main brand color, active interactive states)
  - `--color-primary-light`: `#3b82f6` (Hover state)
  - `--color-primary-soft`: `#dbeafe` (Tints, focus rings, selected backgrounds)
- **Neutrals & Surfaces**:
  - `--color-navy`: `#304766` (Deep brand navy, shadow tinting)
  - `--color-ink`: `#1e293b` (Headings, primary text)
  - `--color-text`: `#334155` (Body copy, high contrast readability)
  - `--color-muted`: `#64748b` (Placeholders, secondary hints)
  - `--color-subtle`: `#475569` (Tertiary captions)
  - `--color-border`: `#cbd5e1` (Input borders, dividers)
  - `--color-border-soft`: `#e2e8f0` (Light subtle card borders)
  - `--color-surface`: `#ffffff` (Card and modal surfaces)
  - `--color-surface-hover`: `#f8fafc` (Hover surface tint)
  - `--color-bg`: `#f1f5f9` (App background)
- **Status & Feedback**:
  - `--color-success`: `#16a34a` | `--color-success-soft`: `#dcfce7`
  - `--color-warning`: `#f59e0b` | `--color-warning-soft`: `#fef3c7`
  - `--color-danger`: `#dc2626` | `--color-danger-soft`: `#fee2e2`
- **Glassmorphism**:
  - `--glass-bg`: `rgba(255, 255, 255, 0.82)`
  - `--glass-border`: `rgba(255, 255, 255, 0.75)`
  - `--glass-fallback-surface`: `#ffffff`

### Dark Theme Support
Tokens adapt automatically when `prefers-color-scheme: dark` or when `[data-theme="dark"]` is applied to the root element. Hard-coded hex values are strictly avoided across component styles.

---

### Typography Scale
- **Font Families**:
  - `--font-brand`: `'Caveat', cursive, sans-serif` (Brand identity, accent titles)
  - `--font-sans`: `'Roboto', sans-serif` (UI elements, inputs, body text)
- **Modular Scale**:
  - `xs`: 12px (line-height: 16px)
  - `sm`: 14px (line-height: 20px)
  - `base`: 16px (line-height: 24px)
  - `md`: 18px (line-height: 26px)
  - `lg`: 20px (line-height: 28px)
  - `xl`: 24px (line-height: 32px)
  - `2xl`: 32px (line-height: 40px)
  - `3xl`: 44px (line-height: 52px)
- **Fluid Heading Clamps**:
  - `--heading-1`: `clamp(2rem, 1.6rem + 2vw, 2.75rem)` (32px to 44px)
  - `--heading-2`: `clamp(1.5rem, 1.25rem + 1.25vw, 2rem)` (24px to 32px)
  - `--heading-3`: `clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)` (20px to 24px)

---

### Spacing Scale (4px Base)
- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-5`: 20px
- `--space-6`: 24px
- `--space-8`: 32px
- `--space-10`: 40px
- `--space-12`: 48px
- `--space-16`: 64px

---

### Radius Scale
- `--radius-sm`: 8px
- `--radius-md`: 12px
- `--radius-lg`: 16px
- `--radius-xl`: 24px
- `--radius-full`: 9999px (Pills, circular badges)

---

### Elevation Shadows
Layered shadows tinted with `--color-navy` (`#304766`):
- `--shadow-sm`: `0 1px 2px 0 rgba(48, 71, 102, 0.06), 0 1px 3px 0 rgba(48, 71, 102, 0.08)`
- `--shadow-md`: `0 4px 6px -1px rgba(48, 71, 102, 0.08), 0 2px 4px -2px rgba(48, 71, 102, 0.06)`
- `--shadow-lg`: `0 10px 15px -3px rgba(48, 71, 102, 0.1), 0 4px 6px -4px rgba(48, 71, 102, 0.06)`
- `--shadow-xl`: `0 20px 25px -5px rgba(48, 71, 102, 0.12), 0 8px 10px -6px rgba(48, 71, 102, 0.06)`
- `--shadow-glow`: `0 0 0 4px var(--color-primary-soft)`

---

### Motion & Animations (`src/styles/animations.css`)
- **Tokens**:
  - `--ease-out`: `cubic-bezier(0.22, 1, 0.36, 1)`
  - `--ease-in-out`: `cubic-bezier(0.65, 0, 0.35, 1)`
  - `--duration-fast`: 120ms
  - `--duration-normal`: 200ms
  - `--duration-medium`: 320ms
  - `--duration-slow`: 560ms
- **Keyframes**:
  - `fadeUp`, `fadeIn`, `scaleIn`, `shimmer`, `pulseRing`, `floatY`, `drawCheck`, `slideInRight`, `shake`
- **Accessibility**:
  - `@media (prefers-reduced-motion: reduce)` automatically sets animation durations to `0.01ms` and removes continuous transitions.

---

## 2. Usage Rules

1. **Token References**: Always use `var(--color-...)`, `var(--space-...)`, and `var(--radius-...)`. Do not use raw hex codes or ad-hoc pixel values in component CSS.
2. **Glass Surfaces**: Use `.glass` or `backdrop-filter: blur(var(--blur-lg))` with `var(--glass-bg)` and a fallback solid background for environments lacking backdrop-filter support.
3. **Buttons**: Ensure minimum 44px touch targets. Interactive states must include subtle transform lift (`translateY(-1px)`) and active down-press.
4. **Form Inputs**: Height 48px, radius 12px, border-soft default with 4px primary-soft glow on `:focus`. Error states trigger border-danger, tint background, and the `shake` keyframe.
