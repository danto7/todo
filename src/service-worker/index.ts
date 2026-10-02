// Precache the app shell so it opens offline once installed on the home screen.
// New versions take over immediately, and pages load from the network when online,
// so a deploy shows up on the next launch instead of after the app is fully closed.
import { immutable, assets } from '$app/manifest';
import { version } from '$app/env';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `cache-${version}`;
const ASSETS = ['/', ...immutable.map((f) => f.path), ...assets.map((f) => f.path)];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;
	const url = new URL(event.request.url);
	if (url.origin !== sw.location.origin) return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);

			// Navigations: network first so the latest deploy wins, cached shell offline.
			if (event.request.mode === 'navigate') {
				try {
					const response = await fetch(event.request);
					if (response.ok) cache.put('/', response.clone());
					return response;
				} catch {
					return (await cache.match('/')) ?? Response.error();
				}
			}

			// Assets: hashed and immutable, so cache first.
			const cached = await cache.match(event.request);
			if (cached) return cached;
			try {
				return await fetch(event.request);
			} catch {
				return Response.error();
			}
		})()
	);
});
