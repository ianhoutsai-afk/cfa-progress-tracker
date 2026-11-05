# CFA Progress

Public CFA Level I progress tracker. Traditional Chinese interface; original English module titles from the ten 2027 textbook tables of contents. 102 learning modules; Quant appendices listed separately. New progress starts empty; exam date is unset.

Four views: overview, modules, learning history and settings. Module status, daily minutes, editable personal goal and validated JSON backups. Public visitors save their own records in browser IndexedDB; transactional revision checks prevent stale tabs from overwriting records. The Sites edition also supports existing authenticated D1 cloud records with per-user isolation and pending backups. No official textbook content or credentials are bundled.

## Run

Node 24 or later, no package installation required.

```sh
npm test
npm run build
npm run build:pages
npm run dev
```

Local preview is at http://127.0.0.1:4178 and uses a separate ignored SQLite database in outputs/. Its test identity is only supplied by the loopback preview server. Production uses Sites authentication and a fresh D1 database.

## Access, storage and publishing

The user requested public access on 2026-11-05. Both the Site and GitHub Pages interface open without sign-in. The cloud API still requires a platform-authenticated user and never exposes one user's records to another visitor. Preserve the Site project identity in .openai/hosting.json; schema-only D1 migrations live in drizzle/.

GitHub Pages is a static, browser-local edition. `npm run build:pages` produces only UI assets and curriculum metadata in ignored site-pages/. The official Pages workflow tests, builds and publishes this folder on main pushes. All paths work beneath /cfa-progress-tracker/. This edition never calls a cloud API. Local records are specific to each browser and origin; changing device, clearing website data or using the other URL does not copy progress. Export/import a backup to move records.

On the Sites edition, anonymous visitors also use browser-local records. Settings offers optional ChatGPT sign-in to load that account's existing cloud records. Browser-local progress is not automatically imported into cloud records; export a backup first if you want to transfer it.

Only curriculum metadata, application source and tests belong in the public GitHub repository. Do not upload textbook PDFs, exported personal progress, browser databases, caches or credentials. No browser analytics or external font/CDN requests.

Progress means self-reported module completion, not exam readiness. The default 10-hour weekly goal is editable and is not a required study recommendation.
