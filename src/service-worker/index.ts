// Precache the app shell so it opens offline once installed on the home screen.
import { immutable, assets } from '$app/manifest';
import { version } from '$app/env';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `cache-${version}`;
const ASSETS = ['/', ...immutable.map((f) => f.path), ...assets.map((f) => f.path)];

sw.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
	);
});

sw.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;
	const url = new URL(event.request.url);
	if (url.origin !== sw.location.origin) return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			// Navigations always resolve to the cached shell (client-side rendered app).
			const key = event.request.mode === 'navigate' ? '/' : event.request;
			const cached = await cache.match(key);
			if (cached) return cached;
			try {
				return await fetch(event.request);
			} catch {
				return (await cache.match('/')) ?? Response.error();
			}
		})()
	);
});
