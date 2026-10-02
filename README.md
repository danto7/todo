# todo

A simple, mobile-first to-do app built with [SvelteKit](https://svelte.dev/docs/kit) (Svelte 5, TypeScript).

- Designed for smartphones: large tap targets, a floating + button that adds a new row inline, safe-area aware, light/dark mode.
- Styled with the [Loam design system](https://claude.ai/artifact/67dw45QbsfkiwU25r8hKZG) (tokens in `src/lib/loam/`), with iOS patterns layered on top (`src/lib/ios.css`): large collapsing title, inset grouped list, round checkboxes, swipe-to-delete and Edit mode, sliding segmented control, frosted bars, SF Pro on Apple devices.
- Installable as a PWA ("Add to Home Screen") and works offline via a service worker.
- To-dos are stored locally in the browser (`localStorage`) for now — no back end.
- Deployed to Vercel as a fully static site.

## Development

```sh
npm install
npm run dev -- --host   # --host lets you open it from your phone on the same network
npm run check           # type-check
npm run build && npm run preview   # static build in ./build
```

## Deployment (Vercel)

Import the repository in Vercel; the SvelteKit framework preset is detected automatically
and no settings or `vercel.json` are needed. The app uses `@sveltejs/adapter-static`, which
detects the Vercel build environment and emits static files only (no serverless functions).

## Structure

| Path | Purpose |
| --- | --- |
| `src/lib/todo.ts` | `Todo` model — fields mirror the iCalendar `VTODO` component (RFC 5545) |
| `src/lib/storage.ts` | `TodoStorage` interface + `localStorage` implementation |
| `src/lib/todos.svelte.ts` | Reactive `TodoList` store (add, toggle, rename, delete, filter) |
| `src/routes/+page.svelte` | The mobile UI (Loam components ported to Svelte) |
| `src/lib/loam/` | Loam tokens, base styles and icons |
| `src/lib/ios.css` | iOS type scale, system font and bar styles on top of Loam |
| `src/lib/components/` | `TodoRow` (swipe-to-delete, inline edit), `NewTodoRow` (inline entry) and `SegmentedControl` |
| `src/service-worker/` | Offline app-shell caching |

## Roadmap: WebDAV / CalDAV

To-dos map 1:1 onto CalDAV `VTODO` resources, so syncing with Nextcloud, Radicale,
Baïkal, iCloud etc. means adding a second `TodoStorage` implementation. Because most
CalDAV servers don't send CORS headers, sync requests will need to go through SvelteKit
server routes (`src/routes/api/...`). At that point, switch `adapter-static` to
`@sveltejs/adapter-vercel` so those routes deploy as Vercel functions. Candidate libraries: [`tsdav`](https://github.com/natelindev/tsdav)
(CalDAV/WebDAV client) and [`ical.js`](https://github.com/kewisch/ical.js) (VTODO parsing).
