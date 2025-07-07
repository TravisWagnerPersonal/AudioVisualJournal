// ===== Service Worker for Audio-Photo Journal =====
const CACHE_NAME = 'audio-photo-journal-v1.0.6';
const RUNTIME_CACHE = 'runtime-cache-v1';

// Core files to cache - using relative paths for better compatibility
const CORE_FILES = [
    './index.html',
    './styles.css',
    './app.js',
    './journal.js',
    './audio.js',
    './camera.js',
    './manifest.json'
];

// Optional files to cache - using relative paths
const OPTIONAL_FILES = [
    './icons/icon-144.png',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/maskable-icon.png',
    './icons/favicon-32x32.png',
    './startup.png',
    './ai-services-improved.js',
    './photo-manager.js',
    './settings.js',
    './mobile.css',
    './photo-viewer.css'
];

// Runtime caching patterns
const CACHE_STRATEGIES = {
    images: 'CacheFirst',
    audio: 'CacheFirst',
    api: 'NetworkFirst',
    static: 'StaleWhileRevalidate'
};

// ===== Installation =====
self.addEventListener('install', event => {
    console.log('🔧 Service Worker: Installing...');
    console.log('🔧 Service Worker scope:', self.registration.scope);
    console.log('🔧 Service Worker location:', self.location.href);
    
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            console.log('📦 Service Worker: Caching core files:', CORE_FILES);
            
            // Test each file individually first (Stack Overflow debugging approach)
            console.log('🧪 Testing file accessibility in service worker context...');
            for (const file of CORE_FILES) {
                try {
                    const response = await fetch(file);
                    console.log(`🧪 Test fetch ${file}: ${response.status} ${response.statusText}`);
                    if (!response.ok) {
                        console.error(`❌ File not accessible: ${file} - Status: ${response.status}`);
                    }
                } catch (err) {
                    console.error(`❌ Test fetch failed for ${file}:`, err.message);
                }
            }
            
            try {
                // Try to cache all core files at once
                await cache.addAll(CORE_FILES);
                console.log('✅ Service Worker: Core files cached successfully');
            } catch (error) {
                console.error('❌ Service Worker: Core files cache.addAll failed, trying individual files:', error.message);
                
                // Fallback: Cache files individually with detailed error handling (Stack Overflow approach)
                for (const file of CORE_FILES) {
                    try {
                        const response = await fetch(file);
                        if (response.ok) {
                            await cache.put(file, response);
                            console.log(`✅ Cached core file via put(): ${file}`);
                        } else {
                            console.error(`❌ File returned ${response.status}: ${file}`);
                            throw new Error(`File returned ${response.status}: ${file}`);
                        }
                    } catch (err) {
                        console.error(`❌ Failed to cache core file: ${file} - ${err.message}`);
                        throw new Error(`Critical core file failed to cache: ${file}`);
                    }
                }
            }
            
            // Cache optional files individually (Stack Overflow recommended approach)
            console.log('📦 Service Worker: Caching optional files:', OPTIONAL_FILES.length, 'files');
            for (const file of OPTIONAL_FILES) {
                try {
                    const response = await fetch(file);
                    if (response.ok) {
                        await cache.put(file, response);
                        console.log(`✅ Cached optional file: ${file}`);
                    } else {
                        console.warn(`⚠️ Optional file returned ${response.status}: ${file}`);
                    }
                } catch (err) {
                    console.warn(`⚠️ Failed to cache optional file: ${file} - ${err.message}`);
                    // Continue with other files even if one fails
                }
            }
            
            console.log('✅ Service Worker: Installation complete');
            return self.skipWaiting();
            
        }).catch(error => {
            console.error('❌ Service Worker: Installation failed -', error.message);
            throw error;
        })
    );
});

// ===== Activation =====
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker: Activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => 
                            cacheName !== CACHE_NAME && 
                            cacheName !== RUNTIME_CACHE
                        )
                        .map(cacheName => {
                            console.log('🧹 Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            }),
            
            // Take control of all clients
            self.clients.claim()
        ]).then(() => {
            console.log('✅ Service Worker: Activation complete');
        })
    );
});

// ===== Fetch Handler =====
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Skip non-GET requests and chrome-extension URLs
    if (event.request.method !== 'GET' || url.protocol === 'chrome-extension:') {
        return;
    }
    
    // Handle different types of requests
    if (url.pathname.startsWith('/api/')) {
        // API requests - Network first
        event.respondWith(handleApiRequest(event.request));
    } else if (isImageRequest(event.request)) {
        // Images - Cache first
        event.respondWith(handleImageRequest(event.request));
    } else if (isAudioRequest(event.request)) {
        // Audio files - Cache first
        event.respondWith(handleAudioRequest(event.request));
    } else {
        // Static files - Stale while revalidate
        event.respondWith(handleStaticRequest(event.request));
    }
});

// ===== Request Handlers =====
async function handleApiRequest(request) {
    try {
        console.log('🌐 Service Worker: API request:', request.url);
        
        // Try network first
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse && networkResponse.ok) {
            try {
                const cache = await caches.open(RUNTIME_CACHE);
                // Clone BEFORE consumption
                await cache.put(request, networkResponse.clone());
                console.log('🌐 API response cached:', request.url);
            } catch (cacheError) {
                console.warn('⚠️ Failed to cache API response:', request.url, cacheError.message);
            }
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('📡 Service Worker: Network failed, trying cache:', request.url);
        
        // Fallback to cache
        try {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                console.log('📡 Serving API from cache:', request.url);
                return cachedResponse;
            }
        } catch (cacheError) {
            console.warn('⚠️ Cache lookup failed:', cacheError.message);
        }
        
        // Return offline response
        return new Response(
            JSON.stringify({ error: 'Offline - data not available' }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

async function handleImageRequest(request) {
    console.log('🖼️ Service Worker: Image request:', request.url);
    
    // Check cache first
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('🖼️ Serving image from cache:', request.url);
            return cachedResponse;
        }
    } catch (cacheError) {
        console.warn('⚠️ Image cache lookup failed:', cacheError.message);
    }
    
    try {
        // Fetch from network
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse && networkResponse.ok) {
            try {
                const cache = await caches.open(RUNTIME_CACHE);
                // Clone BEFORE consumption
                await cache.put(request, networkResponse.clone());
                console.log('🖼️ Image cached:', request.url);
            } catch (cacheError) {
                console.warn('⚠️ Failed to cache image:', request.url, cacheError.message);
            }
        }
        
        return networkResponse;
        
    } catch (error) {
        console.warn('🖼️ Service Worker: Image fetch failed:', request.url, error.message);
        
        // Return placeholder response
        return new Response('', {
            status: 404,
            statusText: 'Image not found'
        });
    }
}

async function handleAudioRequest(request) {
    console.log('🎵 Service Worker: Audio request:', request.url);
    
    // Check cache first
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('🎵 Serving audio from cache:', request.url);
            return cachedResponse;
        }
    } catch (cacheError) {
        console.warn('⚠️ Audio cache lookup failed:', cacheError.message);
    }
    
    try {
        // Fetch from network
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse && networkResponse.ok) {
            try {
                const cache = await caches.open(RUNTIME_CACHE);
                // Clone BEFORE consumption
                await cache.put(request, networkResponse.clone());
                console.log('🎵 Audio cached:', request.url);
            } catch (cacheError) {
                console.warn('⚠️ Failed to cache audio:', request.url, cacheError.message);
            }
        }
        
        return networkResponse;
        
    } catch (error) {
        console.warn('🎵 Service Worker: Audio fetch failed:', request.url, error.message);
        
        return new Response('', {
            status: 404,
            statusText: 'Audio not found'
        });
    }
}

async function handleStaticRequest(request) {
    console.log('📄 Service Worker: Static request:', request.url);
    
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        
        // If we have a cached version, return it and update in background
        if (cachedResponse) {
            console.log('📄 Serving from cache:', request.url);
            
            // Update cache in background (stale-while-revalidate)
            // BUT with proper response cloning
            fetch(request).then(async networkResponse => {
                if (networkResponse && networkResponse.ok) {
                    try {
                        // Clone IMMEDIATELY upon receiving response
                        const responseClone = networkResponse.clone();
                        const cache = await caches.open(CACHE_NAME);
                        await cache.put(request, responseClone);
                        console.log('📄 Background cache update successful:', request.url);
                    } catch (error) {
                        console.warn('⚠️ Background cache update failed:', request.url, error.message);
                    }
                }
            }).catch(error => {
                console.warn('⚠️ Background fetch failed:', request.url, error.message);
            });
            
            return cachedResponse;
        }
        
        // No cache available, fetch from network
        console.log('📄 Fetching from network:', request.url);
        const networkResponse = await fetch(request);
        
        if (networkResponse && networkResponse.ok) {
            try {
                // Clone IMMEDIATELY - this is the critical fix
                const responseClone = networkResponse.clone();
                const cache = await caches.open(CACHE_NAME);
                await cache.put(request, responseClone);
                console.log('📄 Cached new response:', request.url);
            } catch (error) {
                console.warn('⚠️ Failed to cache response:', request.url, error.message);
            }
        }
        
        return networkResponse;
        
    } catch (error) {
        console.error('📄 Service Worker: Static request failed:', request.url, error.message);
        
        // Try to serve from cache as fallback
        try {
            const fallbackResponse = await caches.match(request);
            if (fallbackResponse) {
                console.log('📄 Serving fallback from cache:', request.url);
                return fallbackResponse;
            }
        } catch (cacheError) {
            console.warn('⚠️ Cache fallback failed:', cacheError.message);
        }
        
        // Last resort: return offline page
        return await getOfflinePage();
    }
}

// ===== Background Sync =====
self.addEventListener('sync', event => {
    console.log('🔄 Service Worker: Background sync triggered:', event.tag);
    
    if (event.tag === 'journal-sync') {
        event.waitUntil(syncJournalData());
    } else if (event.tag === 'media-upload') {
        event.waitUntil(uploadPendingMedia());
    }
});

async function syncJournalData() {
    try {
        console.log('📔 Service Worker: Syncing journal data...');
        
        // Get pending sync data from IndexedDB
        const pendingData = await getPendingSyncData();
        
        if (pendingData.length === 0) {
            console.log('📔 Service Worker: No pending sync data');
            return;
        }
        
        // Sync each pending item
        for (const item of pendingData) {
            try {
                await syncDataItem(item);
                await markAsSynced(item.id);
            } catch (error) {
                console.error('Failed to sync item:', item.id, error);
            }
        }
        
        console.log('✅ Service Worker: Journal sync complete');
        
    } catch (error) {
        console.error('Service Worker: Journal sync failed:', error);
        throw error; // Re-throw to retry later
    }
}

async function uploadPendingMedia() {
    try {
        console.log('📎 Service Worker: Uploading pending media...');
        
        // Implementation would depend on your backend
        // This is a placeholder for media upload logic
        
        console.log('✅ Service Worker: Media upload complete');
        
    } catch (error) {
        console.error('Service Worker: Media upload failed:', error);
        throw error;
    }
}

// ===== Message Handling =====
self.addEventListener('message', event => {
    console.log('💬 Service Worker: Message received:', event.data);
    
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'SKIP_WAITING':
                self.skipWaiting();
                break;
                
            case 'GET_VERSION':
                event.ports[0].postMessage({
                    version: CACHE_NAME
                });
                break;
                
            case 'CACHE_URLS':
                event.waitUntil(
                    cacheUrls(event.data.urls || [])
                );
                break;
                
            case 'CLEAR_CACHE':
                event.waitUntil(
                    clearCache(event.data.cacheName)
                );
                break;
                
            default:
                console.log('Unknown message type:', event.data.type);
        }
    }
});

// ===== Notification Handling =====
self.addEventListener('notificationclick', event => {
    console.log('🔔 Service Worker: Notification clicked:', event.notification.tag);
    
    event.notification.close();
    
    // Handle notification actions
    const action = event.action;
    const data = event.notification.data || {};
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            // Focus existing window if available
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // Open new window
            if (clients.openWindow) {
                const url = action === 'new-entry' ? '/?action=new-entry' : '/';
                return clients.openWindow(url);
            }
        })
    );
});

// ===== Push Notifications =====
self.addEventListener('push', event => {
    console.log('📮 Service Worker: Push message received');
    
    let data = {};
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (error) {
            data = { title: 'Audio-Photo Journal', body: event.data.text() };
        }
    }
    
    const options = {
        title: data.title || 'Audio-Photo Journal',
        body: data.body || 'You have a new notification',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: data.tag || 'journal-notification',
        data: data,
        actions: [
            {
                action: 'open',
                title: 'Open App'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ],
        requireInteraction: false,
        renotify: true
    };
    
    event.waitUntil(
        self.registration.showNotification(options.title, options)
    );
});

// ===== Utility Functions =====
function isImageRequest(request) {
    return request.destination === 'image' || 
           /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(request.url);
}

function isAudioRequest(request) {
    return request.destination === 'audio' || 
           /\.(mp3|wav|ogg|webm|m4a)$/i.test(request.url);
}

async function getOfflinePage() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match('/index.html');
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return basic offline response
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Offline - Audio-Photo Journal</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                        text-align: center;
                        padding: 50px 20px;
                        background: #f2f2f7;
                    }
                    .offline-message {
                        max-width: 400px;
                        margin: 0 auto;
                        background: white;
                        padding: 40px 20px;
                        border-radius: 12px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    h1 { color: #333; margin-bottom: 20px; }
                    p { color: #666; line-height: 1.5; }
                    button {
                        background: #007AFF;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 16px;
                        cursor: pointer;
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="offline-message">
                    <h1>📱 You're Offline</h1>
                    <p>Don't worry! Your journal entries are safely stored on your device and will sync when you're back online.</p>
                    <button onclick="window.location.reload()">Try Again</button>
                </div>
            </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });
        
    } catch (error) {
        console.error('Failed to get offline page:', error);
        return new Response('Offline', { status: 200 });
    }
}

async function cacheUrls(urls) {
    try {
        const cache = await caches.open(RUNTIME_CACHE);
        await cache.addAll(urls);
        console.log('✅ Service Worker: URLs cached:', urls);
    } catch (error) {
        console.error('Service Worker: Failed to cache URLs:', error);
    }
}

async function clearCache(cacheName) {
    try {
        if (cacheName) {
            await caches.delete(cacheName);
        } else {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        console.log('🧹 Service Worker: Cache cleared');
    } catch (error) {
        console.error('Service Worker: Failed to clear cache:', error);
    }
}

// Placeholder functions for sync operations
// These would need to be implemented based on your backend
async function getPendingSyncData() {
    // Return pending sync items from IndexedDB
    return [];
}

async function syncDataItem(item) {
    // Sync individual item with backend
    console.log('Syncing item:', item);
}

async function markAsSynced(itemId) {
    // Mark item as synced in IndexedDB
    console.log('Marked as synced:', itemId);
}

console.log('🎯 Service Worker: Script loaded and ready');

// ===== Error Handling =====
self.addEventListener('error', event => {
    console.error('Service Worker: Error occurred:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('Service Worker: Unhandled promise rejection:', event.reason);
}); 