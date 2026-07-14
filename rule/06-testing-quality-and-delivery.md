# Testing, Quality, and Delivery Rules

## Scope

This document defines the mandatory quality gates for frontend implementation, review, release readiness, and evidence of acceptance.

## Required Rules

### Static Quality Gates

- Run ESLint with zero errors before delivery.
- Run strict TypeScript checking with zero errors before delivery.
- Run the production build before delivery. Warnings that indicate broken behavior, missing configuration, or bundle regressions must be resolved or approved as time-bound exceptions.
- Keep formatting consistent with the project formatter once configured. Formatting tools must not be used to hide unrelated source changes.
- Review dependency additions for license, bundle cost, security advisories, accessibility, and maintenance ownership.

### Automated Test Coverage

- Use unit tests for pure adapters, formatters, schemas, token-related utilities, lifecycle guards, and state transitions.
- Use React Testing Library for reusable component behavior, form validation, loading/empty/error states, accessibility attributes, and rendering-mode differences.
- Use Playwright for critical end-to-end paths:
  - public navigation across all nine top-level Portal routes;
  - responsive mobile navigation and contact form submission;
  - Admin authentication boundary and editor-route protection;
  - lock acquisition, lock conflict, lock expiry, and mutation blocking;
  - draft save, protected preview, publish, historical version rollback;
  - product, case, and industry-solution independent detail-editor lifecycles.
- Maintain visual regression coverage for the public homepage, each first-level navigation page, common Header/Footer, key reusable blocks, and editor canvas states at supported desktop/mobile widths.
- Mock API responses only at service boundaries. Tests must include representative success, empty, validation, unauthenticated, unauthorized, conflict, timeout, and server-failure responses.

### Review Requirements

- Reviewers verify architecture, CSS ownership, controlled-block compliance, public/Admin separation, accessibility, and lifecycle safety in addition to visual correctness.
- Every user-facing behavior change includes acceptance scenarios and tests appropriate to its risk.
- Every change to block schemas, API adapters, lifecycle state, or locking behavior includes migration/compatibility analysis.
- Every change that affects Portal output verifies that drafts and editor metadata cannot leak to public rendering.

### Delivery Evidence

- Record the implemented scope, affected routes or blocks, API dependencies, test commands, results, known limitations, and rollback considerations.
- Attach screenshots or visual-regression evidence for visible Portal changes and editor changes.
- For publish-related work, include evidence of draft isolation, preview isolation, successful publish, cache-refresh behavior, and rollback verification.
- For security-sensitive work, include authorization and data-leakage test evidence.

## Prohibited Practices

- Do not merge changes with ignored lint/type errors, skipped critical tests, unreviewed dependency additions, or untracked API contract changes.
- Do not claim a feature is complete based only on local visual inspection.
- Do not update snapshots or baselines blindly; visual differences require intentional review.
- Do not suppress flaky tests without identifying the cause and recording a time-bound remediation plan.
- Do not fix unrelated failures as part of feature delivery unless they block the required quality gate and the owner agrees on scope.

## Acceptance Criteria

- ESLint, TypeScript, unit tests, component tests, Playwright critical paths, visual regression checks, and production build all pass.
- Test coverage demonstrates public/Admin separation, controlled rendering modes, draft-preview-publish-rollback flow, and exclusive-lock enforcement.
- Review evidence confirms responsive behavior, keyboard accessibility, WCAG AA checks, safe error handling, and no unpublished-content leakage.
- Release evidence identifies the exact environment, API contract version or date, validation results, and any approved temporary exception.
