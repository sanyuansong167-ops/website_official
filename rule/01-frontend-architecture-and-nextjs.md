# Frontend Architecture and Next.js Rules

## Scope

This document defines the required application architecture for the public Portal, protected Admin editor, preview pages, and independent content detail editors.

## Required Rules

### Technology Baseline

- Use `Next.js` with the App Router, `React`, and strict `TypeScript`.
- Use `pnpm` as the package manager and commit its lockfile when the frontend application is created.
- Enable strict TypeScript compiler settings. Types must describe intentional values, nullability, and failure states.
- Use CSS Modules and the shared Design Token layer defined in `02-design-system-and-css-modules.md`.
- Prefer browser-native and framework-native capabilities before adding dependencies.

### Application Structure

Use the following ownership model when the frontend application is created:

```text
src/
  app/            route entries, layouts, metadata, route-level loading/error UI
  components/     reusable presentational and layout components
  features/       feature-specific queries, mutations, forms, and orchestration
  services/       HTTP client, API modules, DTO adapters
  types/          DTOs, view models, schemas, shared domain types
  lib/            pure utilities, constants, SEO, analytics helpers
  styles/         global reset, tokens, fonts, shared primitives
```

- Route entries compose feature and component modules; they must not contain API parsing, mutation logic, or large inline presentation trees.
- `services/` owns HTTP transport and API endpoints. `features/` owns use-case orchestration. `components/` receives typed props and remains independent from endpoint details.
- Import direction is one-way: `app -> features/components -> services/lib/types`. Lower layers must not import route modules.
- Use absolute imports through one configured alias. Do not create competing aliases.
- Keep public and Admin route groups separate. A protected editor route such as `/admin/editor` must not share a public page layout.

### Server and Client Components

- Default to Server Components for page shells, SEO metadata, static structure, and server-safe data reads.
- Add `'use client'` only when a component needs event handlers, browser APIs, local interactive state, React Query, React Hook Form, drag-and-drop, or editor canvas behavior.
- Place client boundaries as low in the tree as possible. Do not mark a route layout as client-only solely for one interactive child.
- Pass serializable, already-adapted view models from Server Components into Client Components.
- Keep secrets and server-only environment variables out of Client Components and browser bundles.

### Runtime and API Boundary

- Next.js is a rendering application, not a business BFF. It must not reimplement publishing, permission, lock, auditing, cache invalidation, or validation rules owned by the backend.
- Public Portal code may request only `/portal/api/**` through the Portal service module.
- Protected editor code may request only authenticated `/admin/api/**` through the Admin service module.
- Route Handlers may not be introduced for business proxying, endpoint aggregation, or lifecycle orchestration. Framework-only endpoints require an approved exception.
- Read API base URLs from typed environment configuration. Components must never concatenate hosts or environment variables.

### TypeScript and Data Modeling

- Do not use `any`, untyped JSON casts, or `@ts-ignore`. Use `unknown` at trust boundaries and validate/narrow it before use.
- Define API DTOs separately from UI view models. Convert DTOs in `services/` adapters before data reaches components.
- Use discriminated unions for asynchronous, lifecycle, and mutation states where state variants have different legal actions.
- Model optional API values explicitly. Do not use empty strings, magic numbers, or implicit `undefined` as undocumented state markers.
- Reuse shared schemas and constants for controlled blocks, route paths, API error categories, and editor resource types.

### Dependency Policy

- Add a third-party package only when native APIs and existing approved dependencies cannot meet the requirement safely.
- Keep dependencies focused: icon rendering, form handling/validation, data-query state, testing, and accessible drag-and-drop may be approved when their ownership is clear.
- Prefer self-owned primitives for buttons, inputs, cards, layout, dialogs, feedback, and editor chrome. Do not install a full UI component framework.
- Every new runtime dependency must document its purpose, bundle impact, license suitability, accessibility impact, and removal alternative in the pull request.

## Prohibited Practices

- Do not add Pages Router routes, JavaScript source files for application logic, or mixed frontend frameworks.
- Do not access Admin APIs from a public Portal route or Portal APIs as a substitute for authenticated editor state.
- Do not put API calls, endpoint strings, authorization decisions, or backend DTO field mapping directly in presentational components.
- Do not expose server environment variables with the `NEXT_PUBLIC_` prefix unless they are safe for every browser user.
- Do not make all pages client-rendered to avoid Server/Client component boundaries.

## Acceptance Criteria

- The application builds with strict TypeScript and has no forbidden imports or client-boundary violations.
- Public and Admin routes have separate layouts and service modules.
- A component can be traced to a typed view model and a centralized API adapter.
- New dependencies are justified and no full UI library is present without an approved exception.
- The public production bundle contains no Admin-only routes, editor chrome, server secrets, or management data.
