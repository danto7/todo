// First iteration has no back end: data lives in the browser (localStorage),
// so the app is rendered on the client and served as static files.
export const ssr = false;
export const prerender = true;
