# Interaction, Accessibility, and Performance Rules

## Scope

This document defines behavior requirements for public and Admin interactions, accessibility, SEO, media delivery, and runtime performance.

## Required Rules

### Interaction States

- Every asynchronous screen and component must define loading, empty, error, retry, success, and unavailable states as applicable.
- Buttons show pending state and prevent duplicate actions while a mutation is in flight. Destructive and publish actions require explicit confirmation.
- Use toast feedback for non-blocking outcomes and inline feedback for field-level or block-level validation. Do not use a toast as the only presentation of a recoverable form error.
- Dialogs, drawers, menus, and editor property panels must manage focus correctly, support Escape when dismissal is allowed, and restore focus to the invoking control.
- Drag-and-drop editing must provide keyboard-accessible reordering and a non-drag alternative such as move up/down controls.
- Preserve unsaved editor work on accidental navigation only through a clear confirmation path; never silently discard changes.

### Accessibility

- Use semantic `header`, `nav`, `main`, `section`, `footer`, `button`, `form`, `label`, `fieldset`, and heading hierarchy elements.
- Provide visible `:focus-visible` styles for every keyboard-operable control.
- Meet WCAG AA contrast for text, controls, focus indicators, and error states. Do not use color as the only error, status, or selection signal.
- Associate labels, descriptions, and errors with form controls. Announce asynchronous status and validation outcomes through appropriate live regions.
- Use meaningful alternative text for content images. Mark decorative images and icons as decorative so screen readers do not announce noise.
- Support keyboard access for navigation, mobile menus, dialogs, tabs, accordions, carousels, drag-and-drop, and editor controls.
- Respect `prefers-reduced-motion`; motion must not be required to understand content or complete a task.

### Responsive Behavior

- Test desktop, tablet, and mobile layouts for all public pages, editor entry points, preview routes, forms, and core block families.
- The Portal must work at narrow widths without body horizontal scrolling. Navigation becomes an accessible drawer below the mobile breakpoint.
- The first release of the editor is desktop-first. At unsupported narrow widths, show an authenticated, accessible guidance state instead of a broken canvas.
- Keep text readable at a minimum `14px` body size on mobile and preserve touch target size requirements.

### SEO and Media

- Generate route-level metadata from published page metadata only. Draft metadata may appear only in protected preview behavior.
- Use unique, meaningful title, description, canonical URL, Open Graph data, and heading hierarchy where the published API supplies them.
- Use optimized image delivery with explicit dimensions or stable aspect ratios to prevent layout shift.
- Lazy-load non-critical media and defer offscreen work. Prioritize only the true above-the-fold Hero media.
- Sanitize every rich-text HTML payload through an approved allowlist before rendering. Links must be validated and external links handled deliberately.

### Performance and Observability

- Keep public pages server-rendered or statically optimized whenever API freshness requirements allow it; do not make public content client-only by default.
- Avoid sequential client waterfalls. Fetch independent data concurrently at the appropriate server or feature boundary.
- Measure Core Web Vitals and client errors for critical public routes and editor lifecycle actions without recording personal data, tokens, or draft content.
- Treat image size, third-party scripts, animation cost, and client bundle growth as release risks. Load editor-only code only inside protected editor routes.

## Prohibited Practices

- Do not replace semantic controls with clickable `div` or `span` elements.
- Do not trap keyboard focus incorrectly, remove focus outlines, auto-play disruptive motion, or require hover-only behavior.
- Do not render unsafe HTML, unbounded external embeds, unoptimized large images, or Admin-only scripts in public routes.
- Do not use public analytics/logging to record contact form content, access tokens, preview tokens, lock values, or unpublished content.
- Do not hide performance regressions behind client-side loading spinners.

## Acceptance Criteria

- Keyboard-only testing completes navigation, contact submission, editor block selection, block reordering, draft save, preview, and publish confirmation.
- Automated accessibility checks and manual focus checks find no critical violations on core routes.
- Public page metadata and images are stable, published-only, and do not cause material layout shift.
- Mobile Portal pages and desktop editor routes display intentional, usable behavior at their supported viewports.
- Production monitoring captures Core Web Vitals and safe error diagnostics for critical flows.
