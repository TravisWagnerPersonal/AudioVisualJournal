// ===== Enhanced Service Worker v2.1 with PWA Storage Support =====

const CACHE_NAME = 'audio-journal-v2.1';
const MEDIA_CACHE_NAME = 'journal-media-v1';
const STATIC_CACHE_NAME = 'journal-static-v1';

// Enhanced PWA Storage integration
const CACHE_STRATEGIES = {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Files to cache for offline functionality
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/mobile.css',
    '/photo-viewer.css',
    '/enhanced-storage.js',
    '/location-services.js',
    '/audio.js',
    '/ai-services-improved.js',
    '/journal.js',
    '/app.js',
    '/test-functionality.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/favicon.ico'
];

// Enhanced installation with PWA Storage setup
self.addEventListener('install', (event) => {
    console.log('📦 Enhanced Service Worker v2.1 installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE_NAME)
                .then((cache) => {
                    console.log('📦 Caching static assets...');
                    return cache.addAll(STATIC_ASSETS.map(url => new Request(url, {cache: 'reload'})));
                }),
            
            // Initialize media cache
            caches.open(MEDIA_CACHE_NAME)
                .then((cache) => {
                    console.log('📦 Media cache initialized');
                    return cache;
                }),
            
            // Skip waiting to activate immediately
            self.skipWaiting()
        ])
        .then(() => {
            console.log('✅ Enhanced Service Worker v2.1 installed successfully');
        })
        .catch((error) => {
            console.error('❌ Service Worker installation failed:', error);
        })
    );
});

// Enhanced activation with cleanup
self.addEventListener('activate', (event) => {
    console.log('🚀 Enhanced Service Worker v2.1 activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            cleanupOldCaches(),
            
            // Claim all clients immediately
            self.clients.claim(),
            
            // Initialize enhanced storage communication
            setupStorageCommunication()
        ])
        .then(() => {
            console.log('✅ Enhanced Service Worker v2.1 activated successfully');
            
            // Notify all clients about service worker update
            notifyClients({
                type: 'SW_ACTIVATED',
                version: '2.1',
                features: ['enhanced-storage', 'offline-support', 'background-sync']
            });
        })
    );
});

// Enhanced fetch handler with PWA Storage integration
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle different types of requests
    if (url.pathname.includes('/api/')) {
        // API requests - network first with offline fallback
        event.respondWith(handleAPIRequest(request));
    } else if (isMediaRequest(request)) {
        // Media files - cache first with enhanced storage
        event.respondWith(handleMediaRequest(request));
    } else if (isStaticAsset(request)) {
        // Static assets - cache first
        event.respondWith(handleStaticRequest(request));
    } else {
        // Default - stale while revalidate
        event.respondWith(handleDefaultRequest(request));
    }
});

// Background sync for enhanced storage
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync triggered:', event.tag);
    
    if (event.tag === 'background-storage-sync') {
        event.waitUntil(handleBackgroundSync());
    } else if (event.tag === 'media-cleanup') {
        event.waitUntil(handleMediaCleanup());
    }
});

// Message handling for enhanced storage communication
self.addEventListener('message', (event) => {
    const { data } = event;
    
    switch (data.type) {
        case 'STORAGE_QUOTA_WARNING':
            handleStorageQuotaWarning(data.quota);
            break;
            
        case 'CACHE_MEDIA':
            handleCacheMediaRequest(data.mediaId, data.mediaData);
            break;
            
        case 'CLEANUP_OLD_MEDIA':
            handleMediaCleanup();
            break;
            
        case 'GET_STORAGE_STATS':
            handleGetStorageStats(event);
            break;
            
        default:
            console.log('📨 Unknown message type:', data.type);
    }
});

// ===== Enhanced Request Handlers =====

async function handleAPIRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.warn('🌐 Network request failed, checking cache:', error);
        
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline response
        return new Response(JSON.stringify({
            error: 'Offline',
            message: 'This feature requires an internet connection'
        }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleMediaRequest(request) {
    const url = new URL(request.url);
    
    // Check media cache first
    const mediaCache = await caches.open(MEDIA_CACHE_NAME);
    const cachedResponse = await mediaCache.match(request);
    
    if (cachedResponse) {
        console.log('📁 Serving media from cache:', url.pathname);
        return cachedResponse;
    }
    
    // If not cached, try to fetch and cache
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache media files
            await mediaCache.put(request, networkResponse.clone());
            console.log('📁 Cached media file:', url.pathname);
        }
        
        return networkResponse;
    } catch (error) {
        console.warn('📁 Media request failed:', error);
        
        // Return placeholder for missing media
        return new Response('Media not available offline', {
            status: 404,
            statusText: 'Not Found'
        });
    }
}

async function handleStaticRequest(request) {
    // Cache first strategy for static assets
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // If not cached, fetch and cache
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.warn('📄 Static asset request failed:', error);
        
        // Return basic offline page for HTML requests
        if (request.destination === 'document') {
            return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Audio Journal - Offline</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: Arial; text-align: center; padding: 50px; }
                        .offline { color: #666; }
                    </style>
                </head>
                <body>
                    <h1>Audio Journal</h1>
                    <div class="offline">
                        <h2>You're offline</h2>
                        <p>This page isn't available offline. Please check your connection and try again.</p>
                    </div>
                </body>
                </html>
            `, {
                headers: { 'Content-Type': 'text/html' }
            });
        }
        
        throw error;
    }
}

async function handleDefaultRequest(request) {
    // Stale while revalidate strategy
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Start network request (don't await)
    const networkResponsePromise = fetch(request)
        .then(response => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(error => {
            console.warn('🌐 Network request failed:', error);
            return null;
        });
    
    // Return cached response immediately if available
    if (cachedResponse) {
        // Still update cache in background
        networkResponsePromise.catch(() => {}); // Ignore errors
        return cachedResponse;
    }
    
    // If no cache, wait for network
    const networkResponse = await networkResponsePromise;
    if (networkResponse) {
        return networkResponse;
    }
    
    // Both cache and network failed
    throw new Error('Resource not available');
}

// ===== Enhanced Storage Support Functions =====

async function handleBackgroundSync() {
    console.log('🔄 Performing background storage sync...');
    
    try {
        // Notify clients about sync start
        notifyClients({
            type: 'BACKGROUND_SYNC_START'
        });
        
        // Perform storage optimization
        await optimizeStorageCaches();
        
        // Clean up old media if needed
        await handleMediaCleanup();
        
        console.log('✅ Background sync completed');
        
        // Notify clients about sync completion
        notifyClients({
            type: 'BACKGROUND_SYNC_COMPLETE'
        });
        
    } catch (error) {
        console.error('❌ Background sync failed:', error);
        
        notifyClients({
            type: 'BACKGROUND_SYNC_ERROR',
            error: error.message
        });
    }
}

async function handleMediaCleanup() {
    console.log('🧹 Performing media cleanup...');
    
    try {
        const mediaCache = await caches.open(MEDIA_CACHE_NAME);
        const requests = await mediaCache.keys();
        
        if (requests.length > 100) { // Cleanup if more than 100 media files
            // Remove oldest 20% of cached media
            const toRemove = requests.slice(0, Math.floor(requests.length * 0.2));
            
            for (const request of toRemove) {
                await mediaCache.delete(request);
            }
            
            console.log(`🧹 Cleaned up ${toRemove.length} old media files`);
        }
        
    } catch (error) {
        console.error('❌ Media cleanup failed:', error);
    }
}

async function optimizeStorageCaches() {
    try {
        // Get storage estimate
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            const usagePercent = (estimate.usage / estimate.quota) * 100;
            
            if (usagePercent > 80) {
                console.log('⚠️ High storage usage detected, optimizing...');
                
                // Clean up old caches
                await cleanupOldCaches();
                
                // Trigger media cleanup
                await handleMediaCleanup();
            }
        }
    } catch (error) {
        console.error('❌ Storage optimization failed:', error);
    }
}

async function handleStorageQuotaWarning(quota) {
    console.warn('⚠️ Storage quota warning received:', quota);
    
    // Schedule media cleanup
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        self.registration.sync.register('media-cleanup');
    } else {
        // Immediate cleanup if background sync not supported
        await handleMediaCleanup();
    }
}

async function handleCacheMediaRequest(mediaId, mediaData) {
    try {
        const mediaCache = await caches.open(MEDIA_CACHE_NAME);
        const response = new Response(mediaData.blob, {
            headers: {
                'Content-Type': mediaData.type,
                'Content-Length': mediaData.size,
                'X-Cached': 'true'
            }
        });
        
        await mediaCache.put(mediaId, response);
        console.log('📁 Media cached by service worker:', mediaId);
        
    } catch (error) {
        console.error('❌ Failed to cache media:', error);
    }
}

async function handleGetStorageStats(event) {
    try {
        const cacheNames = await caches.keys();
        const cacheStats = {};
        
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            cacheStats[cacheName] = requests.length;
        }
        
        const stats = {
            caches: cacheStats,
            totalCaches: cacheNames.length,
            serviceWorkerVersion: '2.1'
        };
        
        event.ports[0].postMessage({
            type: 'STORAGE_STATS_RESPONSE',
            stats
        });
        
    } catch (error) {
        console.error('❌ Failed to get storage stats:', error);
        event.ports[0].postMessage({
            type: 'STORAGE_STATS_ERROR',
            error: error.message
        });
    }
}

// ===== Utility Functions =====

function isMediaRequest(request) {
    const url = new URL(request.url);
    return url.pathname.includes('/media/') || 
           url.pathname.includes('photo_') || 
           url.pathname.includes('audio_') ||
           request.destination === 'image' ||
           request.destination === 'audio';
}

function isStaticAsset(request) {
    const url = new URL(request.url);
    return STATIC_ASSETS.some(asset => url.pathname.endsWith(asset)) ||
           request.destination === 'script' ||
           request.destination === 'style' ||
           request.destination === 'document';
}

async function cleanupOldCaches() {
    console.log('🧹 Cleaning up old caches...');
    
    const currentCaches = [CACHE_NAME, MEDIA_CACHE_NAME, STATIC_CACHE_NAME];
    const cacheNames = await caches.keys();
    
    const deletePromises = cacheNames
        .filter(cacheName => !currentCaches.includes(cacheName))
        .map(cacheName => {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
        });
    
    await Promise.all(deletePromises);
    console.log('✅ Old caches cleaned up');
}

async function setupStorageCommunication() {
    console.log('📡 Setting up enhanced storage communication...');
    
    // Register for background sync if supported
    if ('sync' in self.registration) {
        console.log('✅ Background sync supported');
    } else {
        console.log('⚠️ Background sync not supported');
    }
    
    // Set up periodic storage optimization
    if ('storage' in navigator && 'persist' in navigator.storage) {
        const isPersistent = await navigator.storage.persist();
        console.log('💾 Persistent storage:', isPersistent ? 'Enabled' : 'Disabled');
    }
}

function notifyClients(message) {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage(message);
        });
    });
}

// ===== Error Handling =====

self.addEventListener('error', (event) => {
    console.error('🚨 Service Worker error:', event.error);
    
    notifyClients({
        type: 'SW_ERROR',
        error: event.error.message,
        filename: event.filename,
        lineno: event.lineno
    });
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Service Worker unhandled rejection:', event.reason);
    
    notifyClients({
        type: 'SW_UNHANDLED_REJECTION',
        reason: event.reason
    });
});

console.log('🚀 Enhanced Service Worker v2.1 with PWA Storage support loaded'); 