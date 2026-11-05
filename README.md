# CFA Progress

Fresh, owner-private CFA Level I progress tracker. Traditional Chinese interface; original English module titles from the ten 2027 textbook tables of contents. 102 learning modules; Quant appendices listed separately. All progress starts empty; exam date is unset.

Four views: overview, modules, learning history and settings. Module status, daily minutes, editable personal goal, validated JSON backups, owner-scoped D1 cloud storage, local pending backup and optimistic revision conflicts. No official textbook content or credentials are bundled.

## Run

Node 24 or later, no package installation required.

```sh
npm test
npm run build
npm run dev
```

Local preview is at http://127.0.0.1:4178 and uses a separate ignored SQLite database in outputs/. Its test identity is only supplied by the loopback preview server. Production uses Sites authentication and a fresh D1 database.

## Privacy and publishing

The Site is owner-private; GitHub source is private independently. Preserve the project identity in .openai/hosting.json. Use the Sites source workflow and private deployment tool; never enable public GitHub Pages as a substitute for private hosting. Schema-only migrations live in drizzle/.

Only curriculum metadata, application source and tests belong in GitHub. Do not upload textbook PDFs, exported personal progress, browser caches or credentials. No browser analytics or external font/CDN requests.

Progress means self-reported module completion, not exam readiness. The default 10-hour weekly goal is editable and is not a required study recommendation.
