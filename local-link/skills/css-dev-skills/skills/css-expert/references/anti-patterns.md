# CSS Anti-Patterns

When writing or reviewing CSS, flag and fix these anti-patterns. Each entry shows the bad pattern and the modern replacement.

## Layout Anti-Patterns

### Float-based layouts

```css
/* BAD */
.sidebar { float: left; width: 250px; }
.main { margin-left: 270px; }
.clearfix::after { content: ""; display: table; clear: both; }

/* GOOD */
.layout { display: grid; grid-template-columns: 250px 1fr; gap: var(--space-m); }
```

### Absolute positioning for layout

```css
/* BAD */
.parent { position: relative; height: 500px; }
.child { position: absolute; top: 0; right: 0; bottom: 0; left: 0; }

/* GOOD */
.parent { display: grid; }
.child { /* flows naturally in grid */ }
```

### Negative margins for spacing

```css
/* BAD */
.item { margin-top: -20px; }

/* GOOD */
.container { gap: var(--space-m); }
```

## Specificity Anti-Patterns

### !important abuse

```css
/* BAD */
.button { color: red !important; }

/* GOOD — use @layer or :where() to manage specificity */
@layer components {
  .button { color: var(--button-color); }
}
```

### ID selectors for styling

```css
/* BAD — specificity 1-0-0, hard to override */
#header { background: navy; }

/* GOOD */
.site-header { background: var(--color-surface); }
```

### Over-qualified selectors

```css
/* BAD */
div.container > ul.nav > li.nav-item > a.nav-link { color: blue; }

/* GOOD */
.nav-link { color: var(--color-link); }
```

### Deep nesting

```css
/* BAD — more than 3 levels */
.page .content .sidebar .widget .title span { font-size: 14px; }

/* GOOD — flat, scoped */
.widget-title { font-size: var(--text-sm); }
```

## Value Anti-Patterns

### Hardcoded pixel values

```css
/* BAD */
h1 { font-size: 32px; }
.container { max-width: 1200px; padding: 20px; }

/* GOOD */
h1 { font-size: var(--text-3xl); }
.container { max-width: 75rem; padding: var(--space-m); }
```

### Magic numbers

```css
/* BAD */
.dropdown { top: 47px; left: 13px; }

/* GOOD */
.dropdown {
  position: absolute;
  inset-block-start: calc(100% + var(--space-2xs));
  inset-inline-start: 0;
}
```

### Hardcoded colors

```css
/* BAD */
.error { color: #ff0000; border: 1px solid #ff0000; }

/* GOOD */
.error {
  color: var(--color-error);
  border: 1px solid var(--color-error);
}
```

### Hex/RGB instead of oklch

```css
/* BAD — perceptually uneven, gamut-limited */
:root { --primary: #3366ff; }

/* GOOD — perceptually uniform, wider gamut */
:root { --primary: oklch(55% 0.25 260); }
```

## Responsive Anti-Patterns

### Fixed-width containers

```css
/* BAD */
.container { width: 960px; }

/* GOOD */
.container { max-width: 60rem; width: 100%; margin-inline: auto; }
```

### px-based media queries

```css
/* BAD — ignores user font size */
@media (max-width: 768px) { }

/* GOOD — respects user preferences */
@media (max-width: 48em) { }
```

### Media queries for component layout

```css
/* BAD — page-level breakpoints for component behavior */
@media (max-width: 600px) {
  .card { flex-direction: column; }
}

/* GOOD — container queries for component responsiveness */
.card-container { container-type: inline-size; }
@container (inline-size < 400px) {
  .card { flex-direction: column; }
}
```

### Hiding content with display: none for mobile

```css
/* BAD — content is invisible AND inaccessible */
@media (max-width: 48em) { .sidebar { display: none; } }

/* GOOD — reconsider the design. If content isn't needed, remove it from the markup.
   If it's supplementary, use disclosure (details/summary) */
```

## Animation Anti-Patterns

### Animating layout properties

```css
/* BAD — triggers layout recalc every frame */
.element {
  transition: width 300ms, height 300ms, top 300ms, left 300ms;
}

/* GOOD — composited, GPU-accelerated */
.element {
  transition: transform 300ms, opacity 300ms;
}
```

### will-change everywhere

```css
/* BAD — wastes GPU memory */
* { will-change: transform; }

/* GOOD — only on elements about to animate, removed after */
.card:hover { will-change: transform; }
```

### Missing reduced-motion

```css
/* BAD — animation with no opt-out */
.hero { animation: slide-in 1s ease; }

/* GOOD */
.hero { animation: slide-in 1s ease; }
@media (prefers-reduced-motion: reduce) {
  .hero { animation-duration: 0.01ms; animation-iteration-count: 1; }
}
```

## Architecture Anti-Patterns

### No cascade layers

```css
/* BAD — specificity wars as the project grows */
.button { background: blue; }
.form .button { background: green; }
.modal .form .button { background: red; }

/* GOOD — explicit layer order */
@layer components, overrides;

@layer components { .button { background: var(--_bg); } }
@layer overrides { .button[data-variant="danger"] { --_bg: var(--color-error); } }
```

### @import in stylesheets

```css
/* BAD — serial loading, performance hit */
@import url("reset.css");
@import url("components.css");

/* GOOD — parallel loading */
/* In HTML: */
/* <link rel="stylesheet" href="reset.css"> */
/* <link rel="stylesheet" href="components.css"> */
```

### Inline styles from JavaScript

```css
/* BAD — mixing concerns, hard to maintain */
element.style.backgroundColor = 'blue';
element.style.padding = '20px';

/* GOOD — toggle classes or set custom properties */
element.classList.add('is-active');
element.style.setProperty('--progress', '75%');
```

## Accessibility Anti-Patterns

### Removing focus outlines

```css
/* BAD */
*:focus { outline: none; }

/* GOOD */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Color-only indicators

```css
/* BAD — colorblind users can't distinguish */
.valid { border-color: green; }
.invalid { border-color: red; }

/* GOOD — add shape/icon/text indicator too */
.invalid {
  border-color: var(--color-error);
  border-inline-start-width: 3px;
}
.invalid::before { content: "⚠ "; }
```

### Tiny touch targets

```css
/* BAD */
.icon-button { width: 24px; height: 24px; }

/* GOOD */
.icon-button {
  min-width: 44px;
  min-height: 44px;
  display: grid;
  place-items: center;
}
```

## AI Slop Tells

Common patterns that reveal AI-generated CSS. Avoid all of these:

- Purple gradient backgrounds on everything
- Glassmorphism with `backdrop-filter: blur()` where it adds no value
- Card-grid-with-icon layouts for every section
- `box-shadow: 0 10px 40px rgba(0,0,0,0.1)` on everything
- Inter font as the only font choice
- Hardcoded `border-radius: 12px` everywhere
- `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` or similar generic gradients
- Metrics sections with fake numbers ("10K+ users", "99.9% uptime")
- Excessive `backdrop-filter` and transparency
- Using `rgba()` instead of `oklch()` for color manipulation
