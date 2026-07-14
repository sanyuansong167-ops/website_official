# Frontend Rules

## Purpose

This directory is the mandatory implementation baseline for the official website Portal, the protected visual editor, preview mode, and standalone product, case, and industry-solution detail editors.

These rules convert the project plans into day-to-day engineering constraints. They apply to new code, refactors, pull-request reviews, test cases, and release acceptance.

## Rule Set

| Document | Primary topic |
| --- | --- |
| [01 Frontend Architecture and Next.js](./01-frontend-architecture-and-nextjs.md) | Application structure, rendering boundaries, TypeScript, dependencies |
| [02 Design System and CSS Modules](./02-design-system-and-css-modules.md) | Tokens, layout, responsive styling, CSS ownership |
| [03 Components and Page Builder](./03-components-and-page-builder.md) | Reusable components, controlled blocks, editor rendering |
| [04 Data, API, Permissions, and State](./04-data-api-permissions-and-state.md) | API access, view models, drafts, preview, publishing, locks |
| [05 Interaction, Accessibility, and Performance](./05-interaction-accessibility-and-performance.md) | UX states, accessibility, SEO, media, performance |
| [06 Testing, Quality, and Delivery](./06-testing-quality-and-delivery.md) | Checks, automated tests, review, delivery gates |

## Precedence

1. Security, privacy, and access-control requirements always take precedence.
2. Approved API contracts and database contracts take precedence over frontend assumptions.
3. The visual-editor lifecycle is mandatory: **draft -> preview -> publish -> rollback**.
4. A stricter rule in a document takes precedence over a more general rule.
5. Existing public behavior may not be changed merely to simplify implementation.

The authoritative product and interface references are the frontend implementation guide, API documentation, API refactoring documentation, and the documents under `plan/`.

## Required Rules

- Use `Next.js` App Router, `React`, strict `TypeScript`, CSS Modules, and CSS Design Tokens.
- Keep Next.js frontend-only. Business behavior remains in the existing Portal and Admin APIs.
- Keep public Portal content and protected Admin content strictly separated.
- Follow every required rule in the topical documents before code is considered complete.
- Update the applicable rule when an approved architecture or delivery standard changes.

## Prohibited Practices

- Do not introduce a second styling system, a full UI framework, or unapproved runtime dependencies.
- Do not bypass the service layer, controlled-block registry, server-side exclusive lock, or publishing lifecycle.
- Do not expose drafts, editor controls, preview metadata, locks, versions, audits, or Admin assets in public pages.
- Do not make a permanent exception through undocumented code comments or local conventions.

## Exceptions

An exception requires an approved architecture decision that records the affected rule, business reason, security impact, owner, expiry date, and removal plan. The exception must be linked from the affected implementation and reviewed before release.

## Acceptance Criteria

- Every frontend change can identify the rule documents it follows.
- Code review checks the required and prohibited sections of the applicable documents.
- Release evidence includes the quality gates defined in `06-testing-quality-and-delivery.md`.
