/**
 * SkillForge Offline Matrix (v1.0.0)
 * Service Worker for Offline Access
 */

const CACHE_NAME = 'sf-neural-matrix-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/assets/sf-core.js',
    '/assets/sf-turbo.js',
    '/assets/sf-atmosphere-3d.js',
    '/assets/theme-manager.js',
    '/assets/error-reporter.js'
];

// External assets that might not support CORS for pre-caching
const EXTERNAL_ASSETS = [
    'https://cdn.tailwindcss.com',
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
            console.log('[OfflineMatrix] Archiving core assets to local cache');
            // Cache internal assets first
            const cacheInternal = cache.addAll(ASSETS_TO_CACHE);
            
            // Attempt to cache external assets with no-cors if they fail regular fetch
            const cacheExternal = Promise.all(
                EXTERNAL_ASSETS.map(url => 
                    fetch(url, { mode: 'no-cors' })
                        .then(response => cache.put(url, response))
                        .catch(err => console.warn(`[OfflineMatrix] Failed to cache external asset: ${url}`, err))
                )
            );

            return Promise.all([cacheInternal, cacheExternal]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip Firebase/Analytics requests to let them handle their own persistence
    if (event.request.url.includes('googleapis.com') || event.request.url.includes('firebase')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cached asset or fetch from network
            return response || fetch(event.request).then((fetchResponse) => {
                // Optionally cache new successful GET requests
                if (fetchResponse.status === 200) {
                    const responseClone = fetchResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return fetchResponse;
            });
        }).catch(() => {
            // Fallback for offline pages if not in cache
            if (event.request.mode === 'navigate') {
                return caches.match('/index.html');
            }
        })
    );
});
