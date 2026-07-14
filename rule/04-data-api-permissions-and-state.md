# Data, API, Permissions, and State Rules

## Scope

This document governs client-server integration, DTO adaptation, public and Admin permission boundaries, lifecycle state, drafts, previews, publishing, rollback, and exclusive editing locks.

## Required Rules

### API Access and Adaptation

- Use one shared HTTP client that reads typed API base URLs from environment configuration, applies request defaults, normalizes failures, and records a backend `requestId` when present.
- Keep endpoint modules separated by audience: Portal services for `/portal/api/**` and Admin services for `/admin/api/**`.
- Define request DTOs, response DTOs, and UI view models separately. Adapters convert DTOs to view models before components consume data.
- Encode every path parameter and validate all user-controlled request values before submitting them.
- Normalize timeout, offline, transport, server, authentication, authorization, conflict, validation, and unexpected-response failures into typed frontend error categories.
- Show safe, actionable user messages. Preserve detailed failure context only in controlled logs or Admin diagnostics; do not display backend internals to public users.

### Public and Admin Boundaries

- Portal pages read only published content from Portal APIs. They must not request drafts, versions, audit data, locks, or Admin media metadata.
- Admin pages require authenticated Admin API access. Frontend route protection improves UX but never replaces backend authorization.
- Preview access follows the backend-approved protected preview contract. A preview token alone must not be treated as authorization if the backend requires an active Admin session.
- Never persist access tokens, lock tokens, preview tokens, drafts, or privileged responses in public browser storage, page HTML, analytics payloads, or logs.
- Handle authentication expiry by preserving unsaved local form input only when safe, informing the editor, and requiring reauthentication plus lock revalidation before protected actions resume.

### Draft, Preview, Publish, and Rollback

- Saving changes creates or updates a draft only. It must never modify public Portal output directly.
- Preview reads the authorized draft snapshot. Preview output must not populate or invalidate the public Portal cache.
- Publish is an explicit confirmation action after backend validation succeeds. Frontend must surface validation failures by block/field where the API provides enough detail.
- Rollback is an explicit version selection and confirmation action. The UI must identify the selected historical version and show the resulting published state after success.
- After publish or rollback, refetch the authoritative published state and invalidate only the relevant frontend query keys. Do not optimistically claim public success before the backend confirms it.

### Exclusive Lock Behavior

- Request a server-side exclusive lock before enabling an editable resource. The lock resource type and id must be explicit.
- Renew a valid lock on a controlled heartbeat while the editor remains active. Stop renewal when the editor closes or the resource changes.
- Display the lock owner and remaining availability only in protected editor UI when the API supplies that information.
- When lock acquisition fails, render the resource read-only and offer only allowed actions such as refresh or authorized force-unlock.
- When lock renewal fails or expires, immediately disable save, preview, publish, rollback, destructive block operations, and detail mutations. Preserve local unsaved input for recovery but do not retry mutations without a fresh valid lock.
- Every save, preview, publish, rollback, and force-unlock response must be treated as authoritative even when the local UI believes the lock is valid.

### Query and Form State

- Use a consistent query-state library and typed query keys for remote server state. Keep ephemeral UI state local to the feature or component that owns it.
- Use a schema-based form validation layer for user input and editable configuration. Revalidate server-side errors after submit.
- Track dirty state for editor forms and block property panels. Warn before leaving with unsaved draft changes without preventing browser safety behavior.
- Use idempotency, deduplication, disabled controls, or mutation-state guards to prevent accidental repeated submissions and duplicate publish actions.

## Prohibited Practices

- Do not call APIs directly from arbitrary components, duplicate endpoint strings, or parse response envelopes repeatedly in feature code.
- Do not treat frontend route checks, hidden buttons, or a preview URL as sufficient authorization.
- Do not update Portal UI from draft data after a save, preview, failed publish, expired lock, or unauthorized response.
- Do not cache privileged responses in a globally accessible client store.
- Do not silently overwrite a failed, stale, or lock-conflicted editor mutation.

## Acceptance Criteria

- All network requests can be traced to a typed service module and adapter.
- A normal visitor can obtain only published Portal content even when manually inspecting routes and browser network calls.
- Save, preview, publish, rollback, and lock-conflict scenarios display deterministic UI states and do not expose incorrect public content.
- Lock loss blocks all protected mutations until a valid lock is reacquired.
- Errors are safely categorized, accessible to users, and include request correlation in controlled diagnostics when available.
