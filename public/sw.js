// Service Worker for caching game assets and API responses

const CACHE_NAME = "ai-cards-game-v1";
const STATIC_CACHE_NAME = "ai-cards-static-v1";
const API_CACHE_NAME = "ai-cards-api-v1";

// Assets to cache immediately
const STATIC_ASSETS = [
	"/",
	"/lobby",
	"/manifest.json",
	// Add other static assets as needed
];

// API endpoints to cache
const CACHEABLE_APIS = ["/api/games/", "/api/cards/", "/api/players/"];

// Install event - cache static assets
self.addEventListener("install", (event) => {
	event.waitUntil(
		Promise.all([
			caches.open(STATIC_CACHE_NAME).then((cache) => {
				return cache.addAll(STATIC_ASSETS);
			}),
			caches.open(API_CACHE_NAME),
		])
	);
	self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (
						cacheName !== CACHE_NAME &&
						cacheName !== STATIC_CACHE_NAME &&
						cacheName !== API_CACHE_NAME &&
						!cacheName.startsWith("game-")
					) {
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
	self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Handle API requests
	if (url.pathname.startsWith("/api/")) {
		event.respondWith(handleApiRequest(request));
		return;
	}

	// Handle static assets
	if (
		request.destination === "document" ||
		request.destination === "script" ||
		request.destination === "style"
	) {
		event.respondWith(handleStaticRequest(request));
		return;
	}

	// Handle images and other assets
	if (request.destination === "image") {
		event.respondWith(handleImageRequest(request));
		return;
	}
});

// API request handler with cache-first strategy for GET requests
async function handleApiRequest(request) {
	const url = new URL(request.url);
	const isCacheable = CACHEABLE_APIS.some((api) =>
		url.pathname.startsWith(api)
	);

	if (request.method === "GET" && isCacheable) {
		try {
			const cache = await caches.open(API_CACHE_NAME);
			const cachedResponse = await cache.match(request);

			if (cachedResponse) {
				// Return cached response and update in background
				updateCacheInBackground(request, cache);
				return cachedResponse;
			}

			// Fetch from network and cache
			const networkResponse = await fetch(request);
			if (networkResponse.ok) {
				cache.put(request, networkResponse.clone());
			}
			return networkResponse;
		} catch (error) {
			console.error("API request failed:", error);
			// Try to return cached version as fallback
			const cache = await caches.open(API_CACHE_NAME);
			const cachedResponse = await cache.match(request);
			if (cachedResponse) {
				return cachedResponse;
			}
			throw error;
		}
	}

	// For non-cacheable requests, just fetch from network
	return fetch(request);
}

// Static asset handler with cache-first strategy
async function handleStaticRequest(request) {
	try {
		const cache = await caches.open(STATIC_CACHE_NAME);
		const cachedResponse = await cache.match(request);

		if (cachedResponse) {
			return cachedResponse;
		}

		const networkResponse = await fetch(request);
		if (networkResponse.ok) {
			cache.put(request, networkResponse.clone());
		}
		return networkResponse;
	} catch (error) {
		console.error("Static request failed:", error);
		throw error;
	}
}

// Image handler with cache-first strategy
async function handleImageRequest(request) {
	try {
		const cache = await caches.open(CACHE_NAME);
		const cachedResponse = await cache.match(request);

		if (cachedResponse) {
			return cachedResponse;
		}

		const networkResponse = await fetch(request);
		if (networkResponse.ok) {
			cache.put(request, networkResponse.clone());
		}
		return networkResponse;
	} catch (error) {
		console.error("Image request failed:", error);
		throw error;
	}
}

// Background cache update
async function updateCacheInBackground(request, cache) {
	try {
		const networkResponse = await fetch(request);
		if (networkResponse.ok) {
			cache.put(request, networkResponse.clone());
		}
	} catch (error) {
		// Silently fail background updates
		console.warn("Background cache update failed:", error);
	}
}

// Handle cache cleanup messages from main thread
self.addEventListener("message", (event) => {
	if (event.data && event.data.type === "CLEAR_GAME_CACHE") {
		const gameId = event.data.gameId;
		caches
			.delete(`game-${gameId}`)
			.then(() => {
				event.ports[0].postMessage({ success: true });
			})
			.catch((error) => {
				event.ports[0].postMessage({ success: false, error: error.message });
			});
	}

	if (event.data && event.data.type === "CACHE_GAME_ASSETS") {
		const { gameId, assets } = event.data;
		caches
			.open(`game-${gameId}`)
			.then((cache) => {
				return cache.addAll(assets);
			})
			.then(() => {
				event.ports[0].postMessage({ success: true });
			})
			.catch((error) => {
				event.ports[0].postMessage({ success: false, error: error.message });
			});
	}
});
