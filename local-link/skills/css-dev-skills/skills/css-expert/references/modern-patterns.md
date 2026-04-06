# Modern CSS Patterns

Comprehensive catalog of modern CSS patterns that css.dev skills should prefer. Reference this when writing or reviewing CSS.

## Layout

### CSS Grid with Named Areas

```css
.page {
  display: grid;
  grid-template:
    "header header" auto
    "sidebar main" 1fr
    "footer footer" auto
    / 250px 1fr;
}
```

### Subgrid for Alignment

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-m);
}

.card {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 3;
}
```

### Flexbox with Gap

```css
.nav {
  display: flex;
  gap: var(--space-s);
  align-items: center;
  flex-wrap: wrap;
}
```

### Holy Grail with Grid

```css
body {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100dvh;
}
```

### Centering

```css
/* Grid centering — works for any content */
.center {
  display: grid;
  place-items: center;
}
```

## Custom Properties

### Design Token Layers

```css
:root {
  /* Primitive tokens */
  --blue-50: oklch(95% 0.05 250);
  --blue-500: oklch(55% 0.25 250);
  --blue-900: oklch(25% 0.1 250);

  /* Semantic tokens */
  --color-primary: var(--blue-500);
  --color-surface: light-dark(white, oklch(15% 0.01 250));
  --color-text: light-dark(oklch(20% 0 0), oklch(90% 0 0));

  /* Spacing scale */
  --space-3xs: clamp(0.25rem, 0.2rem + 0.25vw, 0.375rem);
  --space-2xs: clamp(0.375rem, 0.3rem + 0.375vw, 0.5rem);
  --space-xs: clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem);
  --space-s: clamp(0.75rem, 0.6rem + 0.75vw, 1rem);
  --space-m: clamp(1rem, 0.8rem + 1vw, 1.5rem);
  --space-l: clamp(1.5rem, 1.2rem + 1.5vw, 2rem);
  --space-xl: clamp(2rem, 1.6rem + 2vw, 3rem);

  /* Type scale */
  --text-sm: clamp(0.8rem, 0.75rem + 0.25vw, 0.875rem);
  --text-base: clamp(1rem, 0.925rem + 0.375vw, 1.125rem);
  --text-lg: clamp(1.125rem, 1rem + 0.625vw, 1.375rem);
  --text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.625rem);
  --text-2xl: clamp(1.5rem, 1.25rem + 1.25vw, 2.25rem);
  --text-3xl: clamp(2rem, 1.5rem + 2.5vw, 3.5rem);
}
```

### Component-Scoped Properties (underscore convention)

```css
.button {
  --_bg: var(--color-primary);
  --_color: white;
  --_padding-inline: var(--space-m);
  --_padding-block: var(--space-xs);

  background: var(--_bg);
  color: var(--_color);
  padding: var(--_padding-block) var(--_padding-inline);

  &:hover {
    --_bg: color-mix(in oklch, var(--color-primary), black 15%);
  }

  &[data-variant="ghost"] {
    --_bg: transparent;
    --_color: var(--color-primary);
  }
}
```

## Cascade Layers

```css
@layer reset, tokens, base, layout, components, utilities;

@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
  * { margin: 0; }
}

@layer tokens {
  :root { /* design tokens here */ }
}

@layer components {
  .card { /* component styles */ }
}

@layer utilities {
  .visually-hidden {
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    height: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
    width: 1px;
  }
}
```

## Selectors

### :has() — Parent Selector

```css
/* Style a form group that contains an invalid input */
.form-group:has(:invalid) {
  --_border-color: var(--color-error);
}

/* Style a card differently when it has an image */
.card:has(img) {
  grid-template-rows: 200px auto;
}
```

### :is() and :where()

```css
/* :is() — grouped selectors with specificity of the highest */
:is(h1, h2, h3) { line-height: 1.2; }

/* :where() — same grouping but zero specificity */
:where(.prose) :where(h1, h2, h3) { margin-block-start: var(--space-l); }
```

### Nesting

```css
.card {
  padding: var(--space-m);
  border-radius: var(--radius-m);

  & .title {
    font-size: var(--text-lg);
    font-weight: 600;
  }

  &:hover {
    box-shadow: var(--shadow-md);
  }

  @container (inline-size < 300px) {
    padding: var(--space-s);
  }
}
```

## Responsive Design

### Container Queries

```css
.sidebar {
  container-type: inline-size;
  container-name: sidebar;
}

@container sidebar (inline-size > 400px) {
  .widget { display: grid; grid-template-columns: 1fr 1fr; }
}

@container sidebar (inline-size <= 400px) {
  .widget { display: flex; flex-direction: column; }
}
```

### Fluid Typography

```css
body {
  font-size: clamp(1rem, 0.875rem + 0.5vw, 1.25rem);
  line-height: 1.6;
}

h1 { font-size: clamp(2rem, 1.5rem + 2.5vw, 3.5rem); }
h2 { font-size: clamp(1.5rem, 1.25rem + 1.25vw, 2.25rem); }
```

### Logical Properties

```css
.element {
  margin-block: var(--space-m);
  padding-inline: var(--space-l);
  border-inline-start: 3px solid var(--color-primary);
  text-align: start;
  inset-inline: 0;
}
```

## Color

### oklch Color Space

```css
:root {
  --primary: oklch(65% 0.25 250);
  --primary-light: oklch(80% 0.15 250);
  --primary-dark: oklch(40% 0.2 250);
}
```

### color-mix()

```css
.button:hover {
  background: color-mix(in oklch, var(--color-primary), black 15%);
}

.surface-elevated {
  background: color-mix(in oklch, var(--color-surface), white 5%);
}
```

### light-dark()

```css
:root {
  color-scheme: light dark;
  --text: light-dark(oklch(20% 0 0), oklch(90% 0 0));
  --surface: light-dark(white, oklch(15% 0 0));
  --border: light-dark(oklch(80% 0 0), oklch(30% 0 0));
}
```

## Animation

### Scroll-Driven Animations

```css
@keyframes fade-in {
  from { opacity: 0; translate: 0 2rem; }
  to { opacity: 1; translate: 0; }
}

.reveal {
  animation: fade-in linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}
```

### View Transitions

```css
::view-transition-old(main),
::view-transition-new(main) {
  animation-duration: 200ms;
}

.hero { view-transition-name: hero; }
```

### Performance-Safe Transitions

```css
.card {
  transition: transform 200ms ease, opacity 200ms ease, box-shadow 200ms ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
}
```

## Typography

### Variable Fonts

```css
@font-face {
  font-family: "Inter";
  src: url("inter-variable.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-display: swap;
}

body {
  font-family: "Inter", system-ui, sans-serif;
  font-optical-sizing: auto;
}

h1 { font-variation-settings: "wght" 750; }
```

### System Font Stack

```css
body {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

code {
  font-family: ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace;
}
```
