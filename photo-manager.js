// ===== Photo Management System =====
// Handles thumbnail generation, storage optimization, and full-resolution access

class PhotoManager {
    constructor() {
        this.photos = new Map(); // Store photo metadata and thumbnails
        this.originalFiles = new Map(); // Temporary storage for original files during session
        this.compressionQuality = 0.7; // JPEG quality for thumbnails
        this.thumbnailMaxSize = 300; // Maximum thumbnail dimension
        this.fullPreviewMaxSize = 800; // Maximum preview size for viewing
        
        this.init();
    }
    
    init() {
        console.log('📷 Photo Manager initialized');
        this.loadStoredPhotos();
    }
    
    // ===== Photo Capture and Selection =====
    
    /**
     * Capture photo from camera and create thumbnail
     */
    async capturePhoto() {
        try {
            // Use existing camera service or implement camera capture
            const fullResolutionBlob = await this.captureFromCamera();
            
            if (fullResolutionBlob) {
                return await this.processPhoto(fullResolutionBlob, 'camera');
            }
        } catch (error) {
            console.error('Camera capture failed:', error);
            throw new Error('Failed to capture photo from camera');
        }
    }
    
    /**
     * Select photo from device gallery and create thumbnail
     */
    async selectPhoto() {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = true;
            
            input.onchange = async (e) => {
                try {
                    const files = Array.from(e.target.files);
                    const processedPhotos = [];
                    
                    for (const file of files) {
                        const photoData = await this.processPhoto(file, 'gallery');
                        processedPhotos.push(photoData);
                    }
                    
                    resolve(processedPhotos);
                } catch (error) {
                    reject(error);
                }
            };
            
            input.onerror = () => {
                reject(new Error('Failed to select photos'));
            };
            
            input.click();
        });
    }
    
    // ===== Photo Processing =====
    
    /**
     * Process a photo file/blob into thumbnail and metadata
     * @param {File|Blob} photoFile - Original photo file or blob
     * @param {string} source - 'camera' or 'gallery'
     * @returns {Object} Photo data with thumbnail and metadata
     */
    async processPhoto(photoFile, source = 'unknown') {
        try {
            const photoId = this.generatePhotoId();
            
            // Generate thumbnail
            const thumbnail = await this.createThumbnail(photoFile);
            
            // Create preview version (higher quality for viewing)
            const preview = await this.createPreview(photoFile);
            
            // Extract metadata
            const metadata = await this.extractMetadata(photoFile);
            
            // Store original file reference (session only)
            if (photoFile instanceof File) {
                this.originalFiles.set(photoId, {
                    file: photoFile,
                    url: URL.createObjectURL(photoFile),
                    timestamp: Date.now()
                });
            }
            
            const photoData = {
                id: photoId,
                thumbnail: thumbnail.dataUrl,
                preview: preview.dataUrl,
                metadata: {
                    ...metadata,
                    source,
                    capturedAt: new Date().toISOString(),
                    originalSize: photoFile.size,
                    thumbnailSize: thumbnail.size,
                    previewSize: preview.size
                },
                hasOriginal: this.originalFiles.has(photoId)
            };
            
            // Store in memory
            this.photos.set(photoId, photoData);
            
            // Persist thumbnail to storage
            await this.savePhotoToStorage(photoData);
            
            console.log(`📷 Photo processed: ${metadata.width}x${metadata.height} → thumbnail: ${thumbnail.width}x${thumbnail.height}`);
            
            return photoData;
            
        } catch (error) {
            console.error('Photo processing failed:', error);
            throw error;
        }
    }
    
    /**
     * Create a small thumbnail for storage and display
     */
    async createThumbnail(photoFile) {
        return await this.resizeImage(photoFile, this.thumbnailMaxSize, 0.6);
    }
    
    /**
     * Create a medium-quality preview for viewing
     */
    async createPreview(photoFile) {
        return await this.resizeImage(photoFile, this.fullPreviewMaxSize, 0.8);
    }
    
    /**
     * Resize image to specified maximum dimension
     * @param {File|Blob} imageFile - Original image
     * @param {number} maxSize - Maximum width or height
     * @param {number} quality - JPEG quality (0-1)
     * @returns {Object} Resized image data
     */
    async resizeImage(imageFile, maxSize, quality) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Calculate new dimensions maintaining aspect ratio
                    let { width, height } = this.calculateDimensions(img.width, img.height, maxSize);
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Draw resized image
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to data URL and get size
                    const dataUrl = canvas.toDataURL('image/jpeg', quality);
                    const size = this.getDataUrlSize(dataUrl);
                    
                    resolve({
                        dataUrl,
                        width,
                        height,
                        size,
                        quality
                    });
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            
            if (imageFile instanceof File) {
                img.src = URL.createObjectURL(imageFile);
            } else {
                // Handle blob
                const reader = new FileReader();
                reader.onload = e => img.src = e.target.result;
                reader.readAsDataURL(imageFile);
            }
        });
    }
    
    /**
     * Calculate optimal dimensions maintaining aspect ratio
     */
    calculateDimensions(originalWidth, originalHeight, maxSize) {
        let width = originalWidth;
        let height = originalHeight;
        
        if (width > height) {
            if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
            }
        } else {
            if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
            }
        }
        
        return { width: Math.round(width), height: Math.round(height) };
    }
    
    // ===== Metadata Extraction =====
    
    /**
     * Extract metadata from image file
     */
    async extractMetadata(imageFile) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height,
                    type: imageFile.type || 'image/jpeg',
                    name: imageFile.name || 'captured-photo.jpg',
                    size: imageFile.size || 0,
                    lastModified: imageFile.lastModified || Date.now()
                });
            };
            
            img.onerror = () => {
                resolve({
                    width: 0,
                    height: 0,
                    type: 'image/jpeg',
                    name: 'unknown.jpg',
                    size: 0,
                    lastModified: Date.now()
                });
            };
            
            if (imageFile instanceof File) {
                img.src = URL.createObjectURL(imageFile);
            } else {
                const reader = new FileReader();
                reader.onload = e => img.src = e.target.result;
                reader.readAsDataURL(imageFile);
            }
        });
    }
    
    // ===== Photo Access and Viewing =====
    
    /**
     * Get photo for display (returns thumbnail by default)
     * @param {string} photoId - Photo identifier
     * @param {string} quality - 'thumbnail', 'preview', or 'original'
     * @returns {string|null} Data URL of the photo
     */
    async getPhoto(photoId, quality = 'thumbnail') {
        const photo = this.photos.get(photoId);
        if (!photo) return null;
        
        switch (quality) {
            case 'thumbnail':
                return photo.thumbnail;
                
            case 'preview':
                return photo.preview;
                
            case 'original':
                return await this.getOriginalPhoto(photoId);
                
            default:
                return photo.thumbnail;
        }
    }
    
    /**
     * Access full resolution original photo
     */
    async getOriginalPhoto(photoId) {
        const originalRef = this.originalFiles.get(photoId);
        
        if (originalRef) {
            // Original file is available in current session
            return originalRef.url;
        }
        
        // Original not available - return best available quality
        const photo = this.photos.get(photoId);
        return photo ? photo.preview : null;
    }
    
    /**
     * Check if original photo is available
     */
    hasOriginalPhoto(photoId) {
        return this.originalFiles.has(photoId);
    }
    
    /**
     * Get photo metadata
     */
    getPhotoMetadata(photoId) {
        const photo = this.photos.get(photoId);
        return photo ? photo.metadata : null;
    }
    
    // ===== Storage Management =====
    
    /**
     * Save photo data to persistent storage (thumbnails only)
     */
    async savePhotoToStorage(photoData) {
        try {
            const storageData = {
                id: photoData.id,
                thumbnail: photoData.thumbnail,
                preview: photoData.preview,
                metadata: photoData.metadata
            };
            
            // Save to localStorage (consider IndexedDB for larger apps)
            const existingPhotos = JSON.parse(localStorage.getItem('stored_photos') || '{}');
            existingPhotos[photoData.id] = storageData;
            localStorage.setItem('stored_photos', JSON.stringify(existingPhotos));
            
            console.log(`💾 Photo thumbnail saved: ${photoData.id}`);
        } catch (error) {
            console.error('Failed to save photo to storage:', error);
        }
    }
    
    /**
     * Load stored photos from persistent storage
     */
    loadStoredPhotos() {
        try {
            const storedPhotos = JSON.parse(localStorage.getItem('stored_photos') || '{}');
            
            Object.values(storedPhotos).forEach(photoData => {
                this.photos.set(photoData.id, {
                    ...photoData,
                    hasOriginal: false // Originals are not persisted
                });
            });
            
            console.log(`📂 Loaded ${Object.keys(storedPhotos).length} stored photos`);
        } catch (error) {
            console.error('Failed to load stored photos:', error);
        }
    }
    
    /**
     * Delete photo from storage
     */
    async deletePhoto(photoId) {
        try {
            // Remove from memory
            this.photos.delete(photoId);
            
            // Clean up original file reference
            const originalRef = this.originalFiles.get(photoId);
            if (originalRef) {
                URL.revokeObjectURL(originalRef.url);
                this.originalFiles.delete(photoId);
            }
            
            // Remove from persistent storage
            const storedPhotos = JSON.parse(localStorage.getItem('stored_photos') || '{}');
            delete storedPhotos[photoId];
            localStorage.setItem('stored_photos', JSON.stringify(storedPhotos));
            
            console.log(`🗑️ Photo deleted: ${photoId}`);
        } catch (error) {
            console.error('Failed to delete photo:', error);
        }
    }
    
    /**
     * Get storage usage statistics
     */
    getStorageStats() {
        const thumbnailSizes = Array.from(this.photos.values())
            .map(photo => photo.metadata.thumbnailSize || 0);
        
        const totalThumbnailSize = thumbnailSizes.reduce((sum, size) => sum + size, 0);
        const averageThumbnailSize = thumbnailSizes.length > 0 ? 
            totalThumbnailSize / thumbnailSizes.length : 0;
        
        return {
            photoCount: this.photos.size,
            totalThumbnailSize,
            averageThumbnailSize,
            originalsAvailable: this.originalFiles.size,
            storageFormat: 'thumbnails_only'
        };
    }
    
    // ===== Camera Integration =====
    
    /**
     * Capture photo from camera using getUserMedia
     */
    async captureFromCamera() {
        return new Promise((resolve, reject) => {
            // Try to use existing camera service first
            if (window.cameraService && typeof window.cameraService.capturePhoto === 'function') {
                window.cameraService.capturePhoto()
                    .then(resolve)
                    .catch(() => {
                        // Fallback to direct camera access
                        this.directCameraCapture().then(resolve).catch(reject);
                    });
            } else {
                this.directCameraCapture().then(resolve).catch(reject);
            }
        });
    }
    
    /**
     * Direct camera capture implementation
     */
    async directCameraCapture() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                } 
            });
            
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();
            
            return new Promise((resolve, reject) => {
                video.addEventListener('canplay', () => {
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    
                    context.drawImage(video, 0, 0);
                    
                    // Stop the stream
                    stream.getTracks().forEach(track => track.stop());
                    
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to capture image'));
                        }
                    }, 'image/jpeg', 0.9);
                });
                
                video.addEventListener('error', () => {
                    stream.getTracks().forEach(track => track.stop());
                    reject(new Error('Video error'));
                });
            });
            
        } catch (error) {
            console.error('Camera access failed:', error);
            throw error;
        }
    }
    
    // ===== Utility Methods =====
    
    generatePhotoId() {
        return `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    getDataUrlSize(dataUrl) {
        // Estimate size of base64 data URL
        const base64Length = dataUrl.split(',')[1].length;
        return Math.round(base64Length * 0.75); // Base64 is ~33% larger than binary
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Clean up expired original file references
     */
    cleanupOriginals() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        for (const [photoId, originalRef] of this.originalFiles.entries()) {
            if (now - originalRef.timestamp > maxAge) {
                URL.revokeObjectURL(originalRef.url);
                this.originalFiles.delete(photoId);
                console.log(`🧹 Cleaned up expired original: ${photoId}`);
            }
        }
    }
    
    /**
     * Export all photos (thumbnails) for backup
     */
    exportPhotos() {
        const exportData = {
            photos: Array.from(this.photos.values()),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        return exportData;
    }
    
    /**
     * Import photos from backup
     */
    importPhotos(exportData) {
        if (exportData.photos && Array.isArray(exportData.photos)) {
            exportData.photos.forEach(photo => {
                this.photos.set(photo.id, photo);
            });
            
            // Save to storage
            this.saveAllPhotosToStorage();
            console.log(`📥 Imported ${exportData.photos.length} photos`);
        }
    }
    
    async saveAllPhotosToStorage() {
        const storageData = {};
        this.photos.forEach((photo, id) => {
            storageData[id] = {
                id: photo.id,
                thumbnail: photo.thumbnail,
                preview: photo.preview,
                metadata: photo.metadata
            };
        });
        
        localStorage.setItem('stored_photos', JSON.stringify(storageData));
    }
}

// ===== Photo Viewer Component =====

class PhotoViewer {
    constructor(photoManager) {
        this.photoManager = photoManager;
        this.currentPhotoId = null;
        this.isVisible = false;
        
        this.createViewer();
    }
    
    createViewer() {
        this.viewerElement = document.createElement('div');
        this.viewerElement.className = 'photo-viewer hidden';
        this.viewerElement.innerHTML = `
            <div class="photo-viewer-backdrop"></div>
            <div class="photo-viewer-content">
                <div class="photo-viewer-header">
                    <button class="photo-viewer-close">×</button>
                    <span class="photo-viewer-title">Photo</span>
                    <button class="photo-viewer-info">ℹ️</button>
                </div>
                <div class="photo-viewer-container">
                    <img class="photo-viewer-image" alt="Full resolution photo">
                    <div class="photo-loading">Loading...</div>
                </div>
                <div class="photo-viewer-controls">
                    <button class="photo-quality-btn" data-quality="preview">Preview</button>
                    <button class="photo-quality-btn" data-quality="original">Original</button>
                </div>
                <div class="photo-info hidden">
                    <div class="photo-info-content"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.viewerElement);
        this.bindViewerEvents();
    }
    
    bindViewerEvents() {
        // Close viewer
        this.viewerElement.querySelector('.photo-viewer-close').addEventListener('click', () => {
            this.hide();
        });
        
        this.viewerElement.querySelector('.photo-viewer-backdrop').addEventListener('click', () => {
            this.hide();
        });
        
        // Info toggle
        this.viewerElement.querySelector('.photo-viewer-info').addEventListener('click', () => {
            this.toggleInfo();
        });
        
        // Quality buttons
        this.viewerElement.querySelectorAll('.photo-quality-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.changeQuality(btn.dataset.quality);
            });
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.isVisible) {
                if (e.key === 'Escape') this.hide();
            }
        });
    }
    
    async show(photoId) {
        this.currentPhotoId = photoId;
        this.isVisible = true;
        
        const metadata = this.photoManager.getPhotoMetadata(photoId);
        if (metadata) {
            this.viewerElement.querySelector('.photo-viewer-title').textContent = metadata.name;
        }
        
        this.viewerElement.classList.remove('hidden');
        document.body.classList.add('photo-viewer-open');
        
        // Load preview quality first
        await this.loadPhotoQuality('preview');
        
        // Update quality buttons
        this.updateQualityButtons();
    }
    
    hide() {
        this.isVisible = false;
        this.currentPhotoId = null;
        this.viewerElement.classList.add('hidden');
        document.body.classList.remove('photo-viewer-open');
        
        // Hide info panel
        this.viewerElement.querySelector('.photo-info').classList.add('hidden');
    }
    
    async loadPhotoQuality(quality) {
        const loadingEl = this.viewerElement.querySelector('.photo-loading');
        const imageEl = this.viewerElement.querySelector('.photo-viewer-image');
        
        loadingEl.style.display = 'block';
        
        try {
            const photoUrl = await this.photoManager.getPhoto(this.currentPhotoId, quality);
            if (photoUrl) {
                imageEl.src = photoUrl;
                imageEl.onload = () => {
                    loadingEl.style.display = 'none';
                };
            }
        } catch (error) {
            console.error('Failed to load photo:', error);
            loadingEl.textContent = 'Failed to load';
        }
    }
    
    async changeQuality(quality) {
        if (!this.currentPhotoId) return;
        
        await this.loadPhotoQuality(quality);
        this.updateQualityButtons(quality);
    }
    
    updateQualityButtons(activeQuality = 'preview') {
        const buttons = this.viewerElement.querySelectorAll('.photo-quality-btn');
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.quality === activeQuality);
            
            // Disable original button if not available
            if (btn.dataset.quality === 'original') {
                btn.disabled = !this.photoManager.hasOriginalPhoto(this.currentPhotoId);
            }
        });
    }
    
    toggleInfo() {
        const infoEl = this.viewerElement.querySelector('.photo-info');
        const isHidden = infoEl.classList.contains('hidden');
        
        if (isHidden) {
            this.showPhotoInfo();
        } else {
            infoEl.classList.add('hidden');
        }
    }
    
    showPhotoInfo() {
        const metadata = this.photoManager.getPhotoMetadata(this.currentPhotoId);
        if (!metadata) return;
        
        const stats = this.photoManager.getStorageStats();
        const infoEl = this.viewerElement.querySelector('.photo-info');
        const contentEl = this.viewerElement.querySelector('.photo-info-content');
        
        contentEl.innerHTML = `
            <h4>Photo Information</h4>
            <div class="info-row"><span>Name:</span> <span>${metadata.name}</span></div>
            <div class="info-row"><span>Dimensions:</span> <span>${metadata.width} × ${metadata.height}</span></div>
            <div class="info-row"><span>Original Size:</span> <span>${this.formatFileSize(metadata.originalSize)}</span></div>
            <div class="info-row"><span>Thumbnail Size:</span> <span>${this.formatFileSize(metadata.thumbnailSize)}</span></div>
            <div class="info-row"><span>Source:</span> <span>${metadata.source}</span></div>
            <div class="info-row"><span>Captured:</span> <span>${new Date(metadata.capturedAt).toLocaleString()}</span></div>
            <div class="info-row"><span>Original Available:</span> <span>${this.photoManager.hasOriginalPhoto(this.currentPhotoId) ? 'Yes' : 'No'}</span></div>
        `;
        
        infoEl.classList.remove('hidden');
    }
    
    formatFileSize(bytes) {
        return this.photoManager.formatFileSize(bytes);
    }
}

// ===== Initialize Photo Management =====
let photoManager = null;
let photoViewer = null;

document.addEventListener('DOMContentLoaded', function() {
    photoManager = new PhotoManager();
    photoViewer = new PhotoViewer(photoManager);
    
    // Clean up old originals periodically
    setInterval(() => {
        photoManager.cleanupOriginals();
    }, 60 * 60 * 1000); // Every hour
    
    window.photoManager = photoManager;
    window.photoViewer = photoViewer;
    
    console.log('📷 Photo management system ready');
});

// Export for other modules
window.PhotoManager = PhotoManager;
window.PhotoViewer = PhotoViewer; 