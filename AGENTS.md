# Website Official Agent Guide

## Repository Purpose

This repository contains the implementation baseline for the official website, including the public Portal, the protected visual editor, preview mode, and independent detail editors for products, cases, and industry solutions.

The current repository is documentation-led. Do not assume that a frontend application already exists. When application code is introduced, follow the architecture and delivery sequence defined below.

## Source of Truth

Read the relevant documents before changing code, API contracts, plans, or rules.

| Area | Required reference |
| --- | --- |
| Frontend implementation baseline | `docs/官网前端实现说明.md` |
| Existing API contract | `docs/接口文档.md` |
| Page-builder API contract | `docs/重构接口文档.md` |
| Database constraints | `docs/数据库设计说明.md` |
| API error conventions | `docs/错误码说明.md` |
| Visual-editor implementation plan | `plan/官网可视化编辑模式执行计划.md` |
| Phased delivery order | `plan/官网可视化编辑模式/README.md` |
| Backend implementation gaps | `plan/官网可视化编辑模式后端接口缺口清单.md` |
| Frontend engineering rules | `rule/README.md` and every linked rule document |

If documents conflict, use this priority order:

1. Security, privacy, access control, and approved API/database contracts.
2. The draft -> preview -> publish -> rollback lifecycle and server-side exclusive lock requirements.
3. The applicable frontend rule in `rule/`.
4. The phased implementation documents under `plan/`.
5. General implementation guidance.

## Mandatory Frontend Baseline

- Use `Next.js` App Router, `React`, strict `TypeScript`, CSS Modules, and CSS Design Tokens.
- Use `pnpm` when the frontend application is initialized.
- Keep Next.js frontend-only. Existing Portal and Admin APIs own business logic, authorization, locking, publishing, audit, and cache invalidation.
- Public Portal routes may call only `/portal/api/**`; protected editor routes may call only authenticated `/admin/api/**`.
- Keep API calls in typed service modules. Convert API DTOs to UI view models before data reaches components.
- Use the controlled-block registry and legal slots for editable pages. Never introduce arbitrary HTML, JavaScript, CSS, or unregistered blocks into published content.
- Use explicit `portal`, `editor`, and `preview` render modes. Public pages must never expose editor controls, draft data, locks, versions, audit data, or Admin assets.
- Product, case, and industry-solution detail editors must retain their own draft, preview, publish, rollback, and lock lifecycles.

## Required Workflow

1. Identify the affected Portal route, Admin editor, controlled block, API contract, and implementation phase.
2. Read `rule/README.md` and all topical rule files relevant to the change before editing.
3. Confirm that the current phase's entry conditions are satisfied before implementing the next visual-editor phase.
4. Make the smallest focused change that preserves existing public behavior and lifecycle boundaries.
5. Update documentation when an approved API contract, schema, error code, lifecycle, or delivery rule changes.
6. Run the applicable quality gates before handoff and report commands plus results.

## Non-Negotiable Safety Rules

- Saving a draft must never update public Portal output directly.
- The backend exclusive lock is authoritative. On lock loss, block save, preview, publish, rollback, and destructive edits until a valid lock is reacquired.
- Do not rely on hidden UI, route checks, or preview URLs as authorization. Backend authorization is mandatory.
- Do not leak privileged tokens, draft content, lock data, Admin responses, or contact-form personal data to browser storage, logs, analytics, or public HTML.
- Do not add a business BFF, API proxying, or lifecycle orchestration in Next.js Route Handlers without an approved exception.
- Do not add a full UI framework, a second styling system, or unapproved runtime dependencies.

## Quality Gates

- Run ESLint, strict TypeScript checking, unit tests, component tests, Playwright critical-path tests, visual regression checks, and a production build when the frontend application and scripts exist.
- Test public/Admin separation, controlled render modes, draft isolation, protected preview, publish, rollback, lock conflict, and lock expiry for affected features.
- Verify keyboard access, visible focus, WCAG AA contrast, mobile Portal behavior, and desktop editor behavior for visible UI changes.
- Run `git diff --check` for tracked changes. For newly created untracked files, use `git diff --no-index --check /dev/null <file>`.

## Documentation Conventions

- Keep all files under `rule/` in English.
- Preserve the language and naming conventions of existing `docs/` and `plan/` documents unless the task explicitly requests a migration.
- Keep plans executable: include prerequisites, implementation order, deliverables, acceptance criteria, and exit conditions where applicable.
- Do not commit, create branches, or rewrite unrelated documentation unless explicitly requested.
