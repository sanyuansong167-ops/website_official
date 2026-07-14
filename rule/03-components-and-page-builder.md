# Components and Page Builder Rules

## Scope

This document governs reusable UI components, Portal blocks, the visual editor canvas, preview behavior, and independent detail editors for products, cases, and industry solutions.

## Required Rules

### Component Boundaries

- Build reusable primitives for container, button, link, tag, section header, card, empty state, loading state, error state, dialog, toast, and form field behavior.
- Keep presentational components deterministic: given the same view-model props and rendering mode, they render the same visible output.
- Keep business queries, mutations, form submission, lock renewal, and publish orchestration in feature modules rather than leaf components.
- Use semantic HTML elements for the component role. A clickable navigation destination uses a link; an in-place action uses a button.
- Provide explicit loading, empty, error, disabled, and unavailable states for all data-dependent reusable components.

### Controlled Block Registry

- Render editable pages only through a typed controlled-block registry.
- Each registered block defines a stable component identifier, legal slots, typed props schema, style variant schema, data-binding schema, validation rules, and Portal/editor/preview renderer.
- The first-release registry must support the approved block families: hero, metrics, rich text, image-text, product grid, case grid, solution grid, AI cards, capability content, timeline, logo wall, contact CTA, contact form, FAQ, and divider.
- Unknown blocks, illegal slot placement, invalid props, unsafe links, and invalid media references are editor validation errors. Portal rendering must safely skip invalid blocks and report an observable client error without breaking the rest of the page.
- Keep block identifiers stable after publication. A breaking block-schema migration requires a versioned migration plan and backward-compatible rendering until all published snapshots are migrated.

### Slots and Page Composition

- Use controlled `header`, `main`, and `footer` slots.
- `header` and `footer` are global controlled regions and cannot be removed by first-release editor operations.
- `main` allows an expandable number of registered blocks. Administrators may add, copy, reorder, hide, and delete blocks only when the component and page constraints permit the action.
- Page-specific minimum-content requirements must be validated before preview and publish. For example, the contact page must retain valid contact information or a contact form block.
- Block configuration supports only approved theme, layout, spacing, and data-binding variants; it must never accept arbitrary HTML, JavaScript, or CSS.

### Rendering Modes

- Every editable block accepts an explicit rendering mode: `portal`, `editor`, or `preview`.
- `portal` renders only published content and never includes selection borders, block menus, draft metadata, lock state, version history, or Admin resource URLs.
- `editor` renders the same content structure plus authenticated selection, hover, drag, and block-operation affordances.
- `preview` renders the draft snapshot without editor chrome. It must not depend on public cache results or alter Portal state.
- Do not branch components based on ad hoc route checks. Pass a typed rendering context from the page-builder runtime.

### Editor and Detail Editor Rules

- The editor shell contains a protected toolbar, page switcher, device-width preview control, save-draft action, preview action, publish action, version history, canvas, and properties panel.
- Block operation controls appear only to authorized editors and only in editor mode.
- Products, cases, and industry solutions have independent detail editors. Each editor owns its own draft, preview, publish, version, rollback, and exclusive-lock lifecycle.
- Listing blocks may reference published content entities through controlled bindings. They do not replace the independent detail editor or expose unpublished entity data to Portal users.
- Editor content configuration must validate media alternative text, button/link targets, required fields, data source references, and allowed style variants before preview or publish.

## Prohibited Practices

- Do not create page-specific one-off block implementations that bypass the registry.
- Do not permit arbitrary HTML, Markdown-to-unsafe-HTML output, custom CSS, inline scripts, or unregistered React components in page schemas.
- Do not render the edit button, hover controls, block ids, lock owner, draft status, or version metadata in Portal or preview mode.
- Do not use the public page itself as an authenticated editing surface.
- Do not allow a list-page configuration change to mutate a product, case, or solution detail draft implicitly.

## Acceptance Criteria

- A registered block can be added, duplicated, reordered, hidden, deleted, validated, previewed, and published only within legal slots and lifecycle rules.
- The same block produces matching content output in Portal and preview modes, excluding editor-only controls.
- Public pages remain functional if a malformed or unknown block is encountered.
- Detail editors for products, cases, and industry solutions use independent, typed rendering and lifecycle boundaries.
