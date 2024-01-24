const cachePrms = caches.open('main'), exclude = ['/.auth/', '/api/']; // passthrough all auth requests
function log(...args) { console.log(...args); }
async function getFromCache(evt, reqPath) {
	const cacheEntry = await (await cachePrms).match(evt.request);
	return cacheEntry || log('SW: no cache entry for ' + reqPath) || Promise.reject();
}
async function getFromFetch(evt, reqPath) {
	const res = await fetch(evt.request);
	if (res.status === 401) { // if any responses are 401, authentication is not valid. Tell the app to navigate to login.html
		log(`SW: ${reqPath} indicates authentication expired`);
		(await self.clients.matchAll()).forEach(c => c.postMessage('/login'));
	}
	if (res.ok && res.status !== 206) { const toCache = res.clone(); cachePrms.then(cache => cache.put(evt.request, toCache)); }
	return res;
}
self.addEventListener('fetch', evt => {
	const reqPath = new URL(evt.request.url).pathname;
	if (exclude.some(p => reqPath.startsWith(p))) { return log('SW: excluded path', reqPath); }
	evt.respondWith(Promise.any([getFromCache(evt, reqPath), getFromFetch(evt, reqPath)]));
});
self.addEventListener('message', evt => setTimeout(async _ => {
	const cache = await cachePrms, files = evt.data.concat('/');
	for (const file of files) { await cache.match(file) || cache.add(file); }
		// if (await cache.match(file)) { log(`SW: preload of ${file} is already present`); }
		// else { log(`SW: added ${file} from preload`); cache.add(file); }
}, 10000));
self.addEventListener('install', _ => self.skipWaiting());