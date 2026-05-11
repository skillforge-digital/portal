/**
 * SkillForge Offline Registry (v1.1.1)
 * Service Worker for Offline Access
 */

const CACHE_NAME = 'sf-registry-matrix-v5';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/404.html',
    '/favicon.ico',
    '/trainee-login/',
    '/trainee-login/index.html',
    '/trainee-login/forgot-password.html',
    '/trainee-registration/',
    '/trainee-registration/index.html',
    '/assets/sf-core.js',
    '/assets/sf-turbo.js',
    '/assets/sf-atmosphere-3d.js',
    '/assets/webgl-guard.js',
    '/assets/tailwind.css',
    '/assets/theme-manager.js',
    '/assets/generated-image.js',
    '/assets/error-reporter.js',
    '/assets/firebase-config.js'
];

// External assets that might not support CORS for pre-caching
const EXTERNAL_ASSETS = [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
    'https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js',
    'https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js',
    'https://www.gstatic.com/firebasejs/12.12.0/firebase-storage.js',
    'https://www.gstatic.com/firebasejs/12.12.0/firebase-analytics.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            void('[OfflineRegistry] Archiving core assets to local cache');
            // Cache internal assets first
            const cacheInternal = cache.addAll(ASSETS_TO_CACHE);
            
            // Attempt to cache external assets, only if they are valid and non-opaque
            const cacheExternal = Promise.all(
                EXTERNAL_ASSETS.map(url => 
                    fetch(url)
                        .then(response => {
                            if (response.status === 200 && response.type !== 'opaque') {
                                return cache.put(url, response);
                            }
                        })
                        .catch(err => void(`[OfflineRegistry] Failed to cache external asset: ${url}`, err))
                )
            );

            return Promise.all([cacheInternal, cacheExternal]).then(() => self.skipWaiting());
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            const keep = new Set([CACHE_NAME]);
            return Promise.all(keys.map((k) => (keep.has(k) ? null : caches.delete(k))));
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip Firebase/Analytics and Cloudflare Beacon requests to let them handle their own persistence
    if (event.request.url.includes('googleapis.com') || 
        event.request.url.includes('firebase') ||
        event.request.url.includes('cloudflareinsights.com') ||
        event.request.url.includes('/cdn-cgi/')) {
        return;
    }

    event.respondWith(
        fetch(event.request).then((fetchResponse) => {
            // Allow caching for valid, non-opaque responses
            if (fetchResponse.status === 200 && fetchResponse.type !== 'opaque') {
                const responseClone = fetchResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
            }
            return fetchResponse;
        }).catch(() => {
            return caches.match(event.request).then((response) => {
                if (response) return response;
                
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html').then(r => r || caches.match('/404.html'));
                }
                
                // FIX: Return an empty 404 response for assets/beacons to stop the TypeError
                return new Response(null, { status: 404, statusText: 'Not Found' });
            });
        })
    );
});
