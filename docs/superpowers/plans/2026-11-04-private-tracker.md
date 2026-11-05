# Private CFA tracker implementation plan

> Execute directly in this session; user delegated remaining decisions and requested completion.

**Goal:** Fresh private tracker with cloud persistence, private GitHub source and no inherited progress.
**Architecture:** Native modules, Sites Worker, D1 revision-controlled records, no external services in browser.
**Constraints:** Node 24; no runtime dependencies; zh-Hant; official English textbook names; blank progress and exam date; private Site and repository.

## Review focus
- Missing identity must not read or write records.
- Cross-owner and stale-revision writes must be rejected.
- Offline edits must survive reload without overwriting another device.
- Malformed imports and impossible dates/hours must not replace valid records.
- All editable controls and dialogs must work on narrow screens.

## Task 1 — catalogue and persistence
- [x] Write domain/API/sync tests for the above contracts; run failing suite.
- [x] Implement lib/catalog.mjs (metadata only), lib/domain.mjs (emptyState, validateState, stats), worker/api.mjs (handleApi) and public/sync.mjs (CloudStore).
- [x] Run Node test suite using real SQLite adapter; commit tested backend.

## Task 2 — usable interface
- [x] Implement public/index.html, styles.css, app.mjs, views.mjs and dialog helpers using the design concept.
- [x] Add scripts/build.mjs, scripts/dev.mjs, schema-only drizzle migration and manifest.
- [x] Verify navigation, module changes, log create/delete, settings, export/import, reload and responsive layout against a separate local database.

## Task 3 — deliver
- [x] Review source and run full tests/build.
- [ ] Create new private Site, persist exact identity, push source and deploy through Sites workflow.
- [ ] Upload source to new private GitHub repository; verify privacy and commit.
- [ ] Verify Site owner-only access and successful deployment. Return both links and material limits.
