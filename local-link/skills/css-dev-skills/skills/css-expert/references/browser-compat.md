# Browser Compatibility Guide

Reference for modern CSS feature support. As of March 2026, all major evergreen browsers (Chrome 120+, Firefox 121+, Safari 17.2+, Edge 120+) support the features listed below unless noted.

## Fully Supported (use freely)

These features have broad support across all evergreen browsers:

- **CSS Nesting** — Chrome 120+, Firefox 117+, Safari 17.2+
- **`:has()` selector** — Chrome 105+, Firefox 121+, Safari 15.4+
- **`:is()` and `:where()`** — Chrome 88+, Firefox 78+, Safari 14+
- **`@layer`** — Chrome 99+, Firefox 97+, Safari 15.4+
- **Container queries (`@container`)** — Chrome 105+, Firefox 110+, Safari 16+
- **`container-type` / `container-name`** — Chrome 105+, Firefox 110+, Safari 16+
- **`oklch()` and `oklab()`** — Chrome 111+, Firefox 113+, Safari 15.4+
- **`color-mix()`** — Chrome 111+, Firefox 113+, Safari 16.2+
- **Custom properties (CSS variables)** — Chrome 49+, Firefox 31+, Safari 9.1+
- **CSS Grid (including gap)** — Chrome 57+, Firefox 52+, Safari 10.1+
- **Subgrid** — Chrome 117+, Firefox 71+, Safari 16+
- **Logical properties** — Chrome 87+, Firefox 66+, Safari 15+
- **`clamp()`** — Chrome 79+, Firefox 75+, Safari 13.1+
- **`aspect-ratio`** — Chrome 88+, Firefox 89+, Safari 15+
- **`gap` in Flexbox** — Chrome 84+, Firefox 63+, Safari 14.1+
- **`inset` shorthand** — Chrome 87+, Firefox 66+, Safari 14.1+
- **`accent-color`** — Chrome 93+, Firefox 92+, Safari 15.4+
- **`prefers-color-scheme`** — Chrome 76+, Firefox 67+, Safari 12.1+
- **`prefers-reduced-motion`** — Chrome 74+, Firefox 63+, Safari 10.1+
- **`:focus-visible`** — Chrome 86+, Firefox 85+, Safari 15.4+
- **`dvh` / `svh` / `lvh` viewport units** — Chrome 108+, Firefox 101+, Safari 15.4+
- **`content-visibility`** — Chrome 85+, Firefox 125+, Safari 18+

## Well Supported (use with awareness)

These features work in most browsers but may have minor gaps:

- **`light-dark()`** — Chrome 123+, Firefox 120+, Safari 17.5+
- **Scroll-driven animations** — Chrome 115+, Firefox 110+ (behind flag until 129), Safari 18+ (partial)
- **View Transition API** — Chrome 111+, Firefox 126+, Safari 18+
- **`@property` (registered custom properties)** — Chrome 85+, Firefox 128+, Safari 15.4+
- **`forced-colors` media query** — Chrome 89+, Firefox 89+, Safari 16+
- **`prefers-contrast`** — Chrome 96+, Firefox 101+, Safari 14.1+
- **`text-wrap: balance`** — Chrome 114+, Firefox 121+, Safari 17.5+
- **`text-wrap: pretty`** — Chrome 117+, Firefox 126+, Safari 18.2+

## Emerging (use progressively)

These features are newer and may not be fully available. Use as progressive enhancement:

- **Anchor positioning (`anchor()`, `position-anchor`)** — Chrome 125+, Firefox (nightly), Safari (no support yet)
- **`@scope`** — Chrome 118+, Firefox (nightly), Safari 17.4+ (partial)
- **`@starting-style`** — Chrome 117+, Firefox 129+, Safari 17.5+
- **Discrete property transitions (`display`, `overlay`)** — Chrome 117+, limited in others
- **`interpolate-size`** — Chrome 129+, limited in others
- **CSS `calc-size()`** — Chrome 129+, limited in others

## Progressive Enhancement Pattern

When using emerging features, wrap in `@supports`:

```css
/* Base experience — works everywhere */
.tooltip {
  position: absolute;
  top: calc(100% + 8px);
}

/* Enhanced experience — anchor positioning where supported */
@supports (anchor-name: --trigger) {
  .tooltip {
    position: fixed;
    position-anchor: --trigger;
    inset-area: bottom;
    position-try-fallbacks: top;
  }
}
```

## When Asked for Legacy Support

If the user explicitly requests support for older browsers (IE 11, older Safari, etc.):

1. Ask which browsers and versions need support
2. Use `@supports` for progressive enhancement rather than polyfills
3. Provide the modern approach first, then add fallbacks
4. Never use the legacy approach as the default
