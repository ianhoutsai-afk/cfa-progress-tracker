# Public website and GitHub Pages

User explicitly changed the audience to public and requested direct GitHub access. Earlier implementation choices remain delegated. Make the existing Site public and enable GitHub Pages in the same source repository. Public repository publication is authorized by this request; only existing application source and curriculum metadata are included.

Serve the Site interface anonymously. Keep cloud API identity and per-user record checks intact. Signed-in Site users retain their existing D1 records. Anonymous Site visitors and GitHub Pages visitors use browser-owned IndexedDB records, clearly labeled as device-local, with JSON backup import/export. GitHub Pages must never call the Sites API or claim cloud sync. Do not copy cloud records into static artifacts.

Use relative paths and preserve the public/lib directory relationship under the repository's Pages subpath. Build only application assets and metadata into site-pages/. Publish through the official Pages workflow. Preserve existing appearance; update privacy/storage copy to match actual behavior.

Verify: anonymous Site app loads; anonymous cloud API stays 401; Pages works under /cfa-progress-tracker/ without login; local progress survives reload; independent browser profiles remain separate; concurrent same-browser edits cannot silently overwrite; existing cloud tests still pass; both public URLs return usable pages.
