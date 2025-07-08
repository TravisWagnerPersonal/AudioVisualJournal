// ===== Enhanced PWA Storage Manager =====
// Based on web.dev best practices: https://web.dev/articles/storage-for-the-web

class EnhancedPWAStorage {
    constructor() {
        this.dbName = 'AudioPhotoJournal';
        this.dbVersion = 1;
        this.db = null;
        this.cacheVersion = 'journal-media-v1';
        this.staticCacheVersion = 'journal-static-v1';
        
        // Storage quotas and monitoring
        this.quotaWarningThreshold = 0.8; // 80% usage warning
        this.quotaCriticalThreshold = 0.95; // 95% usage critical
        
        this.init();
    }
    
    async init() {
        try {
            console.log('🏗️ Initializing Enhanced PWA Storage...');
            
            // Initialize IndexedDB first and wait for completion
            await this.initIndexedDB();
            
            // Initialize Cache API
            await this.initCacheAPI();
            
            // Only proceed with other operations after DB is ready
            await this.waitForDBReady();
            
            // Set up storage monitoring
            await this.setupStorageMonitoring();
            
            // Migrate from localStorage if needed
            await this.migrateFromLocalStorage();
            
            console.log('✅ Enhanced PWA Storage initialized successfully');
            
            // Dispatch ready event
            document.dispatchEvent(new CustomEvent('enhancedStorageReady', {
                detail: { storage: this }
            }));
            
        } catch (error) {
            console.error('❌ Failed to initialize Enhanced PWA Storage:', error);
            throw error;
        }
    }
    
    async waitForDBReady() {
        if (this.db && this.db.objectStoreNames.contains('entries')) {
            return;
        }
        
        // Wait for database to be ready with proper timeout
        const startTime = Date.now();
        const timeout = 10000; // 10 seconds
        
        while (Date.now() - startTime < timeout) {
            if (this.db && 
                this.db.objectStoreNames.contains('entries') && 
                this.db.objectStoreNames.contains('mediaMetadata') &&
                this.db.objectStoreNames.contains('settings') &&
                this.db.objectStoreNames.contains('storageAnalytics')) {
                console.log('✅ Enhanced storage database is ready');
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        throw new Error('Database initialization timeout');
    }
    
    // ===== IndexedDB Setup =====
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB opened successfully');
                
                // Wait a bit more for the database to be fully ready
                setTimeout(() => {
                    resolve();
                }, 100);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains('entries')) {
                    const entriesStore = db.createObjectStore('entries', { keyPath: 'id' });
                    entriesStore.createIndex('createdAt', 'createdAt', { unique: false });
                    entriesStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
                }
                
                if (!db.objectStoreNames.contains('mediaMetadata')) {
                    const mediaStore = db.createObjectStore('mediaMetadata', { keyPath: 'id' });
                    mediaStore.createIndex('entryId', 'entryId', { unique: false });
                    mediaStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
                
                if (!db.objectStoreNames.contains('storageAnalytics')) {
                    db.createObjectStore('storageAnalytics', { keyPath: 'timestamp' });
                }
                
                console.log('✅ IndexedDB object stores created');
            };
        });
    }
    
    // ===== Cache API Setup =====
    async initCacheAPI() {
        try {
            console.log('🗂️ Setting up Cache API...');
            
            // Initialize media cache
            const mediaCache = await caches.open(this.cacheVersion);
            console.log('✅ Media cache initialized');
            
            // Initialize static cache for app resources
            const staticCache = await caches.open(this.staticCacheVersion);
            console.log('✅ Static cache initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Cache API:', error);
            throw error;
        }
    }
    
    // ===== Storage Monitoring =====
    async setupStorageMonitoring() {
        if (!navigator.storage || !navigator.storage.estimate) {
            console.warn('⚠️ StorageManager API not available');
            return;
        }
        
        // Initial quota check
        await this.checkStorageQuota();
        
        // Set up periodic monitoring
        setInterval(() => {
            this.checkStorageQuota();
        }, 30000); // Check every 30 seconds
    }
    
    async checkStorageQuota() {
        try {
            const quota = await navigator.storage.estimate();
            const usedPercent = (quota.usage / quota.quota) * 100;
            
            // Update storage analytics
            await this.updateStorageAnalytics(quota);
            
            // Check thresholds
            if (usedPercent > this.quotaCriticalThreshold * 100) {
                this.handleCriticalStorage(quota);
            } else if (usedPercent > this.quotaWarningThreshold * 100) {
                this.handleWarningStorage(quota);
            }
            
            // Dispatch storage status event
            document.dispatchEvent(new CustomEvent('storageQuotaUpdate', {
                detail: {
                    usage: quota.usage,
                    quota: quota.quota,
                    usedPercent,
                    level: this.getStorageLevel(usedPercent)
                }
            }));
            
        } catch (error) {
            console.error('Failed to check storage quota:', error);
        }
    }
    
    getStorageLevel(usedPercent) {
        if (usedPercent > this.quotaCriticalThreshold * 100) return 'critical';
        if (usedPercent > this.quotaWarningThreshold * 100) return 'warning';
        return 'normal';
    }
    
    async updateStorageAnalytics(quota) {
        try {
            // Ensure database is ready before accessing
            await this.waitForDBReady();
            
            const transaction = this.db.transaction(['storageAnalytics'], 'readwrite');
            const store = transaction.objectStore('storageAnalytics');
            
            const analytics = {
                timestamp: Date.now(),
                usage: quota.usage,
                quota: quota.quota,
                usedPercent: (quota.usage / quota.quota) * 100
            };
            
            await this.promisifyRequest(store.put(analytics));
            
            // Keep only last 100 records
            const allRecords = await this.promisifyRequest(store.getAll());
            if (allRecords.length > 100) {
                const oldRecords = allRecords.slice(0, allRecords.length - 100);
                for (const record of oldRecords) {
                    await this.promisifyRequest(store.delete(record.timestamp));
                }
            }
            
        } catch (error) {
            console.warn('Failed to update storage analytics:', error.message);
            // Don't throw - this is not critical functionality
        }
    }
    
    // ===== Journal Entry Operations =====
    async storeEntry(entryData) {
        try {
            // Wait for database to be ready
            await this.waitForDBReady();
            
            console.log('💾 Storing journal entry:', entryData.id);
            
            // Separate media from text data
            const { photos, audio, ...textData } = entryData;
            
            // Store media files in Cache API
            const mediaMetadata = [];
            
            // Store photos
            if (photos && photos.length > 0) {
                for (const [index, photo] of photos.entries()) {
                    const photoId = `photo_${entryData.id}_${index}`;
                    const photoMetadata = await this.storePhoto(photoId, photo, entryData.id);
                    mediaMetadata.push(photoMetadata);
                }
            }
            
            // Store audio
            if (audio && audio.blob) {
                const audioId = `audio_${entryData.id}`;
                const audioMetadata = await this.storeAudio(audioId, audio, entryData.id);
                mediaMetadata.push(audioMetadata);
            }
            
            // Store entry text data in IndexedDB
            const entryRecord = {
                ...textData,
                mediaIds: mediaMetadata.map(m => m.id),
                storageVersion: '2.0',
                lastModified: Date.now()
            };
            
            const transaction = this.db.transaction(['entries'], 'readwrite');
            const store = transaction.objectStore('entries');
            await this.promisifyRequest(store.put(entryRecord));
            
            console.log('✅ Entry stored successfully');
            return entryRecord;
            
        } catch (error) {
            console.error('❌ Failed to store entry:', error);
            throw error;
        }
    }
    
    async storePhoto(photoId, photoData, entryId) {
        try {
            // Convert dataURL to blob for efficient storage
            const blob = this.dataURLToBlob(photoData.dataUrl);
            
            // Store in Cache API
            const cache = await caches.open(this.cacheVersion);
            const response = new Response(blob, {
                headers: {
                    'Content-Type': photoData.type || 'image/jpeg',
                    'Content-Length': blob.size,
                    'X-Entry-Id': entryId,
                    'X-Media-Type': 'photo'
                }
            });
            
            await cache.put(photoId, response);
            
            // Store metadata in IndexedDB
            const metadata = {
                id: photoId,
                entryId,
                type: 'photo',
                mimeType: photoData.type || 'image/jpeg',
                size: blob.size,
                originalSize: photoData.originalSize || photoData.dataUrl.length,
                compressed: photoData.compressed || false,
                createdAt: Date.now()
            };
            
            const transaction = this.db.transaction(['mediaMetadata'], 'readwrite');
            const store = transaction.objectStore('mediaMetadata');
            await this.promisifyRequest(store.put(metadata));
            
            return metadata;
            
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.warn('⚠️ Storage quota exceeded while storing photo');
                await this.handleQuotaExceeded('photo', photoId);
                throw new Error('Storage quota exceeded');
            }
            throw error;
        }
    }
    
    async storeAudio(audioId, audioData, entryId) {
        try {
            const blob = audioData.blob;
            
            // Store in Cache API
            const cache = await caches.open(this.cacheVersion);
            const response = new Response(blob, {
                headers: {
                    'Content-Type': 'audio/webm',
                    'Content-Length': blob.size,
                    'X-Entry-Id': entryId,
                    'X-Media-Type': 'audio',
                    'X-Transcription': audioData.transcription || ''
                }
            });
            
            await cache.put(audioId, response);
            
            // Store metadata in IndexedDB
            const metadata = {
                id: audioId,
                entryId,
                type: 'audio',
                mimeType: 'audio/webm',
                size: blob.size,
                transcription: audioData.transcription || '',
                duration: audioData.duration || 0,
                createdAt: Date.now()
            };
            
            const transaction = this.db.transaction(['mediaMetadata'], 'readwrite');
            const store = transaction.objectStore('mediaMetadata');
            await this.promisifyRequest(store.put(metadata));
            
            return metadata;
            
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.warn('⚠️ Storage quota exceeded while storing audio');
                await this.handleQuotaExceeded('audio', audioId);
                throw new Error('Storage quota exceeded');
            }
            throw error;
        }
    }
    
    // ===== Retrieval Operations =====
    async getEntry(entryId) {
        try {
            // Get entry from IndexedDB
            const transaction = this.db.transaction(['entries'], 'readonly');
            const store = transaction.objectStore('entries');
            const entry = await this.promisifyRequest(store.get(entryId));
            
            if (!entry) return null;
            
            // Get media data
            const photos = [];
            const audio = [];
            
            if (entry.mediaIds && entry.mediaIds.length > 0) {
                for (const mediaId of entry.mediaIds) {
                    const media = await this.getMedia(mediaId);
                    if (media) {
                        if (media.metadata.type === 'photo') {
                            photos.push(media);
                        } else if (media.metadata.type === 'audio') {
                            audio.push(media);
                        }
                    }
                }
            }
            
            return {
                ...entry,
                photos: photos.map(p => ({ 
                    dataUrl: p.dataUrl, 
                    type: p.metadata.mimeType,
                    compressed: p.metadata.compressed,
                    originalSize: p.metadata.originalSize
                })),
                audio: audio.length > 0 ? {
                    blob: audio[0].blob,
                    transcription: audio[0].metadata.transcription,
                    duration: audio[0].metadata.duration
                } : null
            };
            
        } catch (error) {
            console.error('❌ Failed to get entry:', error);
            throw error;
        }
    }
    
    async getMedia(mediaId) {
        try {
            // Get from Cache API
            const cache = await caches.open(this.cacheVersion);
            const response = await cache.match(mediaId);
            
            if (!response) return null;
            
            // Get metadata from IndexedDB
            const transaction = this.db.transaction(['mediaMetadata'], 'readonly');
            const store = transaction.objectStore('mediaMetadata');
            const metadata = await this.promisifyRequest(store.get(mediaId));
            
            const blob = await response.blob();
            
            if (metadata.type === 'photo') {
                return {
                    metadata,
                    dataUrl: await this.blobToDataURL(blob),
                    blob
                };
            } else if (metadata.type === 'audio') {
                return {
                    metadata,
                    blob
                };
            }
            
        } catch (error) {
            console.error('❌ Failed to get media:', error);
            return null;
        }
    }
    
    async getAllEntries() {
        try {
            // Wait for database to be ready
            await this.waitForDBReady();
            
            const transaction = this.db.transaction(['entries'], 'readonly');
            const store = transaction.objectStore('entries');
            const index = store.index('createdAt');
            
            // Get all entries sorted by creation date (newest first)
            const entries = await this.promisifyRequest(index.getAll());
            entries.reverse();
            
            // Load media for each entry (with pagination for performance)
            const entriesWithMedia = [];
            for (const entry of entries) {
                try {
                    const fullEntry = await this.getEntry(entry.id);
                    if (fullEntry) {
                        entriesWithMedia.push(fullEntry);
                    }
                } catch (error) {
                    console.warn('Failed to load media for entry:', entry.id, error);
                    // Include entry without media as fallback
                    entriesWithMedia.push({ ...entry, photos: [], audio: null });
                }
            }
            
            return entriesWithMedia;
            
        } catch (error) {
            console.error('❌ Failed to get all entries:', error);
            throw error;
        }
    }
    
    // ===== Storage Management =====
    async handleQuotaExceeded(mediaType, mediaId) {
        console.warn(`⚠️ Quota exceeded while storing ${mediaType}: ${mediaId}`);
        
        // Try to free up space
        await this.cleanupOldMedia();
        
        // Notify user
        document.dispatchEvent(new CustomEvent('storageQuotaExceeded', {
            detail: { mediaType, mediaId }
        }));
    }
    
    async cleanupOldMedia() {
        try {
            console.log('🧹 Cleaning up old media files...');
            
            // Get all media metadata sorted by creation date
            const transaction = this.db.transaction(['mediaMetadata'], 'readonly');
            const store = transaction.objectStore('mediaMetadata');
            const index = store.index('createdAt');
            const allMedia = await this.promisifyRequest(index.getAll());
            
            // Remove oldest 20% of files
            const filesToRemove = allMedia.slice(0, Math.floor(allMedia.length * 0.2));
            
            const cache = await caches.open(this.cacheVersion);
            const deleteTransaction = this.db.transaction(['mediaMetadata'], 'readwrite');
            const deleteStore = deleteTransaction.objectStore('mediaMetadata');
            
            for (const media of filesToRemove) {
                // Remove from cache
                await cache.delete(media.id);
                
                // Remove metadata
                await this.promisifyRequest(deleteStore.delete(media.id));
            }
            
            console.log(`🧹 Cleaned up ${filesToRemove.length} old media files`);
            
        } catch (error) {
            console.error('Failed to cleanup old media:', error);
        }
    }
    
    async handleWarningStorage(quota) {
        console.warn('⚠️ Storage usage is high:', Math.round((quota.usage / quota.quota) * 100) + '%');
        
        // Show user notification
        document.dispatchEvent(new CustomEvent('storageWarning', {
            detail: { quota, level: 'warning' }
        }));
    }
    
    async handleCriticalStorage(quota) {
        console.error('🚨 Critical storage usage:', Math.round((quota.usage / quota.quota) * 100) + '%');
        
        // Automatic cleanup
        await this.cleanupOldMedia();
        
        // Show critical notification
        document.dispatchEvent(new CustomEvent('storageWarning', {
            detail: { quota, level: 'critical' }
        }));
    }
    
    // ===== Migration from localStorage =====
    async migrateFromLocalStorage() {
        try {
            const legacyEntries = localStorage.getItem('journal_entries');
            const legacyDraft = localStorage.getItem('journal_draft');
            
            if (!legacyEntries && !legacyDraft) {
                console.log('ℹ️ No legacy data to migrate');
                return;
            }
            
            console.log('🔄 Migrating data from localStorage...');
            
            let migratedCount = 0;
            
            // Migrate entries
            if (legacyEntries) {
                const entries = JSON.parse(legacyEntries);
                for (const entry of entries) {
                    try {
                        await this.storeEntry({
                            ...entry,
                            id: entry.id || Date.now().toString()
                        });
                        migratedCount++;
                    } catch (error) {
                        console.warn('Failed to migrate entry:', entry.id, error);
                    }
                }
                
                // Clear legacy entries
                localStorage.removeItem('journal_entries');
            }
            
            // Migrate draft
            if (legacyDraft) {
                try {
                    const draft = JSON.parse(legacyDraft);
                    await this.storeDraft(draft);
                    localStorage.removeItem('journal_draft');
                } catch (error) {
                    console.warn('Failed to migrate draft:', error);
                }
            }
            
            console.log(`✅ Migration completed: ${migratedCount} entries migrated`);
            
            // Dispatch migration complete event
            document.dispatchEvent(new CustomEvent('storageMigrationComplete', {
                detail: { migratedCount }
            }));
            
        } catch (error) {
            console.error('❌ Migration failed:', error);
        }
    }
    
    // ===== Draft Management =====
    async storeDraft(draftData) {
        try {
            // Wait for database to be ready
            await this.waitForDBReady();
            
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            
            await this.promisifyRequest(store.put({
                key: 'currentDraft',
                value: draftData,
                timestamp: Date.now()
            }));
            
        } catch (error) {
            console.warn('Failed to store draft in IndexedDB, falling back to localStorage:', error.message);
            try {
                localStorage.setItem('journal_draft', JSON.stringify(draftData));
            } catch (fallbackError) {
                console.error('Failed to store draft in localStorage too:', fallbackError);
                throw fallbackError;
            }
        }
    }
    
    async getDraft() {
        try {
            // Wait for database to be ready
            await this.waitForDBReady();
            
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const result = await this.promisifyRequest(store.get('currentDraft'));
            
            return result ? result.value : null;
            
        } catch (error) {
            console.warn('Failed to get draft from IndexedDB, falling back to localStorage:', error.message);
            try {
                const saved = localStorage.getItem('journal_draft');
                return saved ? JSON.parse(saved) : null;
            } catch (fallbackError) {
                console.error('Failed to get draft from localStorage too:', fallbackError);
                return null;
            }
        }
    }
    
    async clearDraft() {
        try {
            // Clear from IndexedDB if available
            await this.waitForDBReady();
            
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            await this.promisifyRequest(store.delete('currentDraft'));
            
            // Also clear from localStorage as fallback
            localStorage.removeItem('journal_draft');
            
        } catch (error) {
            console.warn('Failed to clear draft from IndexedDB:', error.message);
            // Always clear localStorage as fallback
            localStorage.removeItem('journal_draft');
        }
    }
    
    // ===== Utility Methods =====
    promisifyRequest(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    dataURLToBlob(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }
    
    blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    
    // ===== Storage Statistics =====
    async getStorageStats() {
        try {
            const quota = await navigator.storage.estimate();
            
            // Get entry count
            const entriesTransaction = this.db.transaction(['entries'], 'readonly');
            const entriesStore = entriesTransaction.objectStore('entries');
            const entriesCount = await this.promisifyRequest(entriesStore.count());
            
            // Get media count
            const mediaTransaction = this.db.transaction(['mediaMetadata'], 'readonly');
            const mediaStore = mediaTransaction.objectStore('mediaMetadata');
            const mediaCount = await this.promisifyRequest(mediaStore.count());
            
            return {
                quota: quota.quota,
                usage: quota.usage,
                usedPercent: (quota.usage / quota.quota) * 100,
                entriesCount,
                mediaCount,
                level: this.getStorageLevel((quota.usage / quota.quota) * 100)
            };
            
        } catch (error) {
            console.error('Failed to get storage stats:', error);
            return null;
        }
    }
}

// ===== Initialize Enhanced Storage =====
let enhancedStorage = null;

// Initialize when DOM is ready
function initializeEnhancedStorage() {
    try {
        console.log('🚀 Initializing Enhanced PWA Storage...');
        
        enhancedStorage = new EnhancedPWAStorage();
        
        // Export to global scope
        window.enhancedStorage = enhancedStorage;
        
        return enhancedStorage;
        
    } catch (error) {
        console.error('❌ Failed to initialize Enhanced Storage:', error);
        return null;
    }
}

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancedStorage);
} else {
    initializeEnhancedStorage();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnhancedPWAStorage, enhancedStorage };
}

// Also export class for direct instantiation
window.EnhancedPWAStorage = EnhancedPWAStorage; 