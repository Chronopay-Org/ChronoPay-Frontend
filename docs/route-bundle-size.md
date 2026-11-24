# Route bundle size tracking

This project uses Next.js 16 with Turbopack, whose `next build` output no
longer prints a per-route “First Load JS” column. The figures below therefore
sum the unique non-async JavaScript chunks listed in each route's generated
client-reference manifest. Async chunks are excluded because they are loaded
only after the related UI is opened.

| Route | Before | After | Change |
| --- | ---: | ---: | ---: |
| `/dashboard` | 1,433,179 B | 1,416,630 B | -16,549 B |
| `/dashboard/slots/[id]` | 1,516,869 B | 1,500,320 B | -16,549 B |

Measurements were produced with `npm run build` on `main` and on
`codex/1312-lazy-load-modals`, using their generated
`.next/server/app/**/page_client-reference-manifest.js` files. The modal,
document-upload, and image-viewer chunks now remain asynchronous until the
corresponding open state is set.

`ExportHistoryModal` and `ReceiveTokenPanel` have no dashboard or slot route
consumer in this revision; they were already absent from both route manifests.
