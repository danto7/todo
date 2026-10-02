# todo

A simple, mobile-first to-do app built with [SvelteKit](https://svelte.dev/docs/kit) (Svelte 5, TypeScript).

- Designed for smartphones: large tap targets, bottom input bar, safe-area aware, light/dark mode.
- Installable as a PWA ("Add to Home Screen") and works offline via a service worker.
- To-dos are stored locally in the browser (`localStorage`) for now.

## Development

```sh
npm install
npm run dev -- --host   # --host lets you open it from your phone on the same network
npm run check           # type-check
npm run build && node build   # production server on :3000
```

## Structure

| Path | Purpose |
| --- | --- |
| `src/lib/todo.ts` | `Todo` model — fields mirror the iCalendar `VTODO` component (RFC 5545) |
| `src/lib/storage.ts` | `TodoStorage` interface + `localStorage` implementation |
| `src/lib/todos.svelte.ts` | Reactive `TodoList` store (add, toggle, rename, delete, filter) |
| `src/routes/+page.svelte` | The mobile UI |
| `src/service-worker/` | Offline app-shell caching |

## Roadmap: WebDAV / CalDAV

To-dos map 1:1 onto CalDAV `VTODO` resources, so syncing with Nextcloud, Radicale,
Baïkal, iCloud etc. means adding a second `TodoStorage` implementation. Because most
CalDAV servers don't send CORS headers, sync requests should go through SvelteKit
server routes (`src/routes/api/...`), which is why the app uses `@sveltejs/adapter-node`
rather than a static build. Candidate libraries: [`tsdav`](https://github.com/natelindev/tsdav)
(CalDAV/WebDAV client) and [`ical.js`](https://github.com/kewisch/ical.js) (VTODO parsing).
