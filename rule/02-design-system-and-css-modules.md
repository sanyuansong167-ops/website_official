# Design System and CSS Modules Rules

## Scope

This document defines the visual language, responsive behavior, and CSS ownership rules for the official website and protected editor.

## Required Rules

### Token System

- Define shared visual values as CSS Custom Properties in the global token layer. Components consume tokens; they do not define their own design scale.
- Maintain token groups for color, typography, spacing, radius, border, shadow, z-index, motion, container width, and breakpoints.
- Use semantic tokens in components, such as `--color-text-primary` and `--color-surface-raised`, rather than raw palette tokens whenever a semantic role exists.
- Use the existing brand baseline: primary brand blue `#2F63E9`, dark navy for strategic dark sections, blue-gray neutral text and borders, and off-white rather than pure-black large text surfaces.
- Preserve the established geometry: a `1200px` desktop content maximum, `24px` desktop horizontal safety padding, `16px` mobile horizontal safety padding, `80px` to `112px` desktop section rhythm, and `16px` to `24px` grid gaps.

### Typography and Content Density

- Use a defined Chinese-capable font stack with predictable fallback behavior.
- Use a small, named type scale for display titles, section titles, body text, labels, captions, and controls.
- Keep Chinese body text line height between `1.7` and `1.8` where paragraph reading is the primary use case.
- Use a section header pattern when applicable: optional label, clear title, and optional supporting description.
- Design for editorial content changes. Titles, summaries, labels, and buttons must wrap safely without clipping or overlapping.

### CSS Modules Ownership

- Every component owns a co-located `*.module.css` file unless it uses only a documented shared primitive.
- Name the root class after the component. Use explicit state classes such as `isActive`, `isLoading`, and `hasError`.
- Use `data-*` attributes only for controlled variants and interaction state. Variants must have a finite documented set.
- Keep global CSS limited to reset, base element defaults, tokens, fonts, and truly application-wide accessibility helpers.
- Use CSS logical properties where practical so layout behavior remains resilient.

### Layout and Responsive Rules

- Use a shared container primitive for page-width alignment. Do not duplicate container widths in individual blocks.
- Support three layout ranges: desktop at `1200px` and above, tablet from `768px` through `1199px`, and mobile below `768px`.
- At mobile width, convert multi-column cards to one column unless horizontal scrolling is an intentional, documented interaction; remove body-content horizontal overflow.
- Use a minimum `44px` interactive height or equivalent target area on touch devices.
- Use CSS grid or flexbox for layout. Use absolute positioning only for overlays, decorative layers, or deliberately anchored controls.

### Component Visual Language

- Use clean whitespace, clear information hierarchy, light card borders, restrained shadows, and rounded corners between `12px` and `16px` through tokens.
- Clickable cards require hover, focus-visible, and disabled behavior. Motion should remain within the shared `160ms` to `240ms` transition scale.
- Dark sections must define their own semantic surface, text, border, and interactive tokens; do not invert colors ad hoc.
- Icons in the same section must use a consistent container size, stroke/weight, and alignment. Decorative icons are not substitute labels.
- The editor UI may use a denser operational layout, but it must consume the same tokens and must not alter Portal brand primitives.

## Prohibited Practices

- Do not introduce Tailwind classes, CSS-in-JS runtime styling, Sass, styled-components, or a second token system.
- Do not use arbitrary raw colors, spacing, font sizes, z-index values, animation durations, or `!important` in component styles.
- Do not use global element selectors inside CSS Modules to style unrelated descendants.
- Do not hide responsive defects by scaling the desktop layout down or disabling overflow globally.
- Do not communicate status only by color.

## Acceptance Criteria

- All component styles are CSS Modules and rely on shared tokens for recurring design values.
- Desktop, tablet, and mobile screenshots show no unintended horizontal overflow, clipped text, or inaccessible target sizes.
- Portal blocks visually follow the brand baseline; editor-specific UI remains visually compatible without leaking into Portal output.
- A reviewer can locate each repeated visual value in the token layer rather than in scattered component CSS.
