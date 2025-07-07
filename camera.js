// ===== Camera & Photo Management Module =====
class CameraManager {
    constructor() {
        this.stream = null;
        this.video = null;
        this.canvas = null;
        this.context = null;
        this.currentFacingMode = 'environment'; // 'user' for front, 'environment' for back
        this.photos = [];
        this.isActive = false;
        
        // UI Elements
        this.modal = null;
        this.video = null;
        this.canvas = null;
        this.photoPreview = null;
        this.takePhotoBtn = null;
        this.selectPhotoBtn = null;
        this.photoInput = null;
        this.fileInput = null;
        
        this.init();
    }
    
    init() {
        // Get UI elements
        this.modal = document.getElementById('camera-modal');
        this.video = document.getElementById('camera-video');
        this.canvas = document.getElementById('camera-canvas');
        this.photoPreview = document.getElementById('photo-preview');
        this.takePhotoBtn = document.getElementById('take-photo');
        this.selectPhotoBtn = document.getElementById('select-photo');
        this.photoInput = document.getElementById('photo-input');
        this.fileInput = document.getElementById('file-input');
        
        // Setup canvas context
        if (this.canvas) {
            this.context = this.canvas.getContext('2d');
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('📷 Camera manager initialized');
    }
    
    setupEventListeners() {
        // Camera buttons
        if (this.takePhotoBtn) {
            this.takePhotoBtn.addEventListener('click', () => this.openCamera());
        }
        
        if (this.selectPhotoBtn) {
            this.selectPhotoBtn.addEventListener('click', () => this.openFilePicker());
        }
        
        // Camera modal controls
        if (this.modal) {
            const closeBtn = this.modal.querySelector('#close-camera');
            const captureBtn = this.modal.querySelector('#capture-photo');
            const flipBtn = this.modal.querySelector('#flip-camera');
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeCamera());
            }
            
            if (captureBtn) {
                captureBtn.addEventListener('click', () => this.capturePhoto());
            }
            
            if (flipBtn) {
                flipBtn.addEventListener('click', () => this.flipCamera());
            }
        }
        
        // File input handlers
        if (this.photoInput) {
            this.photoInput.addEventListener('change', (e) => this.handleCameraInput(e));
        }
        
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => this.handleFileInput(e));
        }
        
        // Handle escape key to close camera
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.closeCamera();
            }
        });
    }
    
    async openCamera() {
        try {
            console.log('📷 Opening camera...');
            
            // Check if browser supports camera
            if (!this.isCameraSupported()) {
                this.fallbackToFilePicker();
                return;
            }
            
            // Show modal
            if (this.modal) {
                this.modal.classList.remove('hidden');
                this.isActive = true;
            }
            
            // Start camera stream
            await this.startCameraStream();
            
        } catch (error) {
            console.error('Failed to open camera:', error);
            this.handleCameraError('Could not access camera. Please check permissions.');
            this.fallbackToFilePicker();
        }
    }
    
    async startCameraStream() {
        try {
            // Stop existing stream
            this.stopCameraStream();
            
            // Request camera access
            const constraints = {
                video: {
                    facingMode: this.currentFacingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Set video source
            if (this.video) {
                this.video.srcObject = this.stream;
                await this.video.play();
                
                // Setup canvas size to match video
                this.setupCanvas();
            }
            
            console.log('✅ Camera stream started');
            
        } catch (error) {
            console.error('Failed to start camera stream:', error);
            throw error;
        }
    }
    
    setupCanvas() {
        if (!this.canvas || !this.video) return;
        
        // Wait for video metadata to load
        this.video.addEventListener('loadedmetadata', () => {
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
        });
    }
    
    async capturePhoto() {
        try {
            if (!this.video || !this.canvas || !this.context) {
                throw new Error('Camera not ready');
            }
            
            console.log('📸 Capturing photo...');
            
            // Draw video frame to canvas
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            this.context.drawImage(this.video, 0, 0);
            
            // Convert canvas to blob
            const blob = await this.canvasToBlob();
            
            // Create photo object
            const photo = await this.createPhotoObject(blob);
            
            // Add to photos array
            this.photos.push(photo);
            
            // Update UI
            this.updatePhotoPreview();
            
            // Close camera
            this.closeCamera();
            
            console.log('✅ Photo captured successfully');
            
        } catch (error) {
            console.error('Failed to capture photo:', error);
            this.handleCameraError('Failed to capture photo. Please try again.');
        }
    }
    
    canvasToBlob() {
        return new Promise((resolve, reject) => {
            this.canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to create blob from canvas'));
                }
            }, 'image/jpeg', 0.9);
        });
    }
    
    async createPhotoObject(blob) {
        const id = this.generateId();
        const dataUrl = await this.blobToDataUrl(blob);
        
        return {
            id: id,
            blob: blob,
            dataUrl: dataUrl,
            size: blob.size,
            timestamp: new Date().toISOString(),
            type: 'image/jpeg'
        };
    }
    
    blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });
    }
    
    async flipCamera() {
        try {
            // Toggle facing mode
            this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
            
            // Restart camera stream with new facing mode
            await this.startCameraStream();
            
            console.log('🔄 Camera flipped to:', this.currentFacingMode);
            
        } catch (error) {
            console.error('Failed to flip camera:', error);
            // Revert facing mode on error
            this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
        }
    }
    
    closeCamera() {
        console.log('❌ Closing camera...');
        
        // Stop camera stream
        this.stopCameraStream();
        
        // Hide modal
        if (this.modal) {
            this.modal.classList.add('hidden');
        }
        
        this.isActive = false;
    }
    
    stopCameraStream() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
            });
            this.stream = null;
        }
        
        if (this.video) {
            this.video.srcObject = null;
        }
    }
    
    openFilePicker() {
        if (this.fileInput) {
            this.fileInput.click();
        }
    }
    
    fallbackToFilePicker() {
        console.log('📁 Falling back to file picker...');
        if (this.photoInput) {
            this.photoInput.click();
        }
    }
    
    async handleCameraInput(event) {
        const files = Array.from(event.target.files);
        await this.processSelectedFiles(files);
        
        // Clear input for future selections
        event.target.value = '';
    }
    
    async handleFileInput(event) {
        const files = Array.from(event.target.files);
        await this.processSelectedFiles(files);
        
        // Clear input for future selections
        event.target.value = '';
    }
    
    async processSelectedFiles(files) {
        try {
            console.log(`📂 Processing ${files.length} selected files...`);
            
            for (const file of files) {
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    console.warn('Skipping non-image file:', file.name);
                    continue;
                }
                
                // Validate file size (limit to 10MB)
                if (file.size > 10 * 1024 * 1024) {
                    console.warn('Skipping large file:', file.name);
                    continue;
                }
                
                // Process image
                const processedPhoto = await this.processImageFile(file);
                this.photos.push(processedPhoto);
            }
            
            // Update UI
            this.updatePhotoPreview();
            
            console.log('✅ Files processed successfully');
            
        } catch (error) {
            console.error('Failed to process files:', error);
            this.handleCameraError('Failed to process selected images.');
        }
    }
    
    async processImageFile(file) {
        try {
            // Create photo object
            const id = this.generateId();
            const dataUrl = await this.blobToDataUrl(file);
            
            // Optionally resize large images
            const processedBlob = await this.resizeImageIfNeeded(file);
            
            return {
                id: id,
                blob: processedBlob,
                dataUrl: dataUrl,
                size: processedBlob.size,
                timestamp: new Date().toISOString(),
                type: processedBlob.type,
                originalName: file.name
            };
            
        } catch (error) {
            console.error('Failed to process image file:', error);
            throw error;
        }
    }
    
    async resizeImageIfNeeded(file, maxWidth = 1920, maxHeight = 1080, quality = 0.9) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
                
                // Set canvas size
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to resize image'));
                    }
                }, 'image/jpeg', quality);
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }
    
    updatePhotoPreview() {
        if (!this.photoPreview) return;
        
        this.photoPreview.innerHTML = this.photos.map((photo, index) => `
            <div class="photo-item" data-photo-id="${photo.id}">
                <img src="${photo.dataUrl}" alt="Journal photo" loading="lazy">
                <button class="photo-remove" onclick="cameraManager.removePhoto('${photo.id}')">×</button>
            </div>
        `).join('');
        
        console.log(`🖼️ Photo preview updated with ${this.photos.length} photos`);
    }
    
    removePhoto(photoId) {
        console.log('🗑️ Removing photo:', photoId);
        
        // Remove from photos array
        this.photos = this.photos.filter(photo => photo.id !== photoId);
        
        // Update UI
        this.updatePhotoPreview();
    }
    
    clearPhotos() {
        console.log('🧹 Clearing all photos');
        
        // Clean up object URLs
        this.photos.forEach(photo => {
            if (photo.dataUrl && photo.dataUrl.startsWith('blob:')) {
                URL.revokeObjectURL(photo.dataUrl);
            }
        });
        
        this.photos = [];
        this.updatePhotoPreview();
    }
    
    getPhotos() {
        return this.photos;
    }
    
    async savePhotosToDatabase() {
        const photoIds = [];
        
        try {
            for (const photo of this.photos) {
                // Convert blob to array buffer for storage
                const arrayBuffer = await photo.blob.arrayBuffer();
                
                // Save to database
                const photoId = await saveMediaFile(arrayBuffer, 'photo');
                photoIds.push(photoId);
                
                console.log('💾 Photo saved to database:', photoId);
            }
            
            return photoIds;
            
        } catch (error) {
            console.error('Failed to save photos:', error);
            throw error;
        }
    }
    
    async loadPhotosFromDatabase(photoIds) {
        try {
            this.photos = [];
            
            for (const photoId of photoIds) {
                const photoData = await getMediaFile(photoId, 'photo');
                if (photoData) {
                    // Convert array buffer back to blob
                    const blob = new Blob([photoData.file], { type: 'image/jpeg' });
                    const dataUrl = await this.blobToDataUrl(blob);
                    
                    this.photos.push({
                        id: photoId,
                        blob: blob,
                        dataUrl: dataUrl,
                        size: blob.size,
                        timestamp: photoData.dateCreated,
                        type: blob.type
                    });
                }
            }
            
            // Update UI
            this.updatePhotoPreview();
            
            console.log(`📂 Loaded ${this.photos.length} photos from database`);
            return true;
            
        } catch (error) {
            console.error('Failed to load photos:', error);
            return false;
        }
    }
    
    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    isCameraSupported() {
        return !!(navigator.mediaDevices && 
                 navigator.mediaDevices.getUserMedia);
    }
    
    handleCameraError(message) {
        console.error('Camera error:', message);
        // TODO: Show user-friendly error message
        alert(message);
        
        // Close camera on error
        this.closeCamera();
    }
    
    // Get camera capabilities
    async getCameraCapabilities() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            return {
                hasCamera: videoDevices.length > 0,
                hasMultipleCameras: videoDevices.length > 1,
                devices: videoDevices
            };
            
        } catch (error) {
            console.error('Failed to get camera capabilities:', error);
            return {
                hasCamera: false,
                hasMultipleCameras: false,
                devices: []
            };
        }
    }
}

// ===== Image Utilities =====
class ImageUtils {
    static async compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.9) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate dimensions
                let { width, height } = img;
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                
                if (ratio < 1) {
                    width *= ratio;
                    height *= ratio;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };
            
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }
    
    static generateThumbnail(file, size = 200) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                const { width, height } = img;
                const ratio = Math.min(size / width, size / height);
                const newWidth = width * ratio;
                const newHeight = height * ratio;
                
                canvas.width = size;
                canvas.height = size;
                
                // Center the image
                const x = (size - newWidth) / 2;
                const y = (size - newHeight) / 2;
                
                // Fill background
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(0, 0, size, size);
                
                // Draw image
                ctx.drawImage(img, x, y, newWidth, newHeight);
                
                canvas.toBlob(resolve, 'image/jpeg', 0.8);
            };
            
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }
}

// ===== Camera Service Integration with Photo Manager =====

class CameraService {
    constructor() {
        this.isStreamActive = false;
        this.currentStream = null;
        this.currentFacingMode = 'environment'; // 'user' for front, 'environment' for back
        this.photoManager = null; // Will be set when PhotoManager is available
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        console.log('📷 Camera Service initialized');
        
        // Wait for PhotoManager to be available
        this.waitForPhotoManager();
    }
    
    waitForPhotoManager() {
        if (window.photoManager) {
            this.photoManager = window.photoManager;
            console.log('📷 Camera integrated with Photo Manager');
        } else {
            setTimeout(() => this.waitForPhotoManager(), 100);
        }
    }
    
    bindEvents() {
        // Camera modal controls
        document.getElementById('take-photo')?.addEventListener('click', () => {
            this.openCamera();
        });
        
        document.getElementById('select-photo')?.addEventListener('click', () => {
            this.selectFromGallery();
        });
        
        document.getElementById('close-camera')?.addEventListener('click', () => {
            this.closeCamera();
        });
        
        document.getElementById('capture-photo')?.addEventListener('click', () => {
            this.capturePhoto();
        });
        
        document.getElementById('flip-camera')?.addEventListener('click', () => {
            this.flipCamera();
        });
    }
    
    // ===== Camera Access =====
    
    async openCamera() {
        try {
            const modal = document.getElementById('camera-modal');
            const video = document.getElementById('camera-video');
            
            if (!modal || !video) {
                throw new Error('Camera UI elements not found');
            }
            
            // Show modal
            modal.classList.remove('hidden');
            
            // Request camera access
            await this.startCamera();
            
        } catch (error) {
            console.error('Failed to open camera:', error);
            this.showError('Camera access failed. Please check permissions.');
            this.closeCamera();
        }
    }
    
    async startCamera() {
        try {
            // Stop existing stream if any
            if (this.currentStream) {
                this.stopCamera();
            }
            
            const constraints = {
                video: {
                    facingMode: this.currentFacingMode,
                    width: { ideal: 1920, max: 1920 },
                    height: { ideal: 1080, max: 1080 }
                },
                audio: false
            };
            
            this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            const video = document.getElementById('camera-video');
            if (video) {
                video.srcObject = this.currentStream;
                await video.play();
                this.isStreamActive = true;
                console.log('📷 Camera stream started');
            }
            
        } catch (error) {
            console.error('Camera stream failed:', error);
            
            if (error.name === 'NotAllowedError') {
                throw new Error('Camera permission denied. Please allow camera access and try again.');
            } else if (error.name === 'NotFoundError') {
                throw new Error('No camera found on this device.');
            } else {
                throw new Error('Failed to access camera. Please try again.');
            }
        }
    }
    
    stopCamera() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => {
                track.stop();
            });
            this.currentStream = null;
            this.isStreamActive = false;
            console.log('📷 Camera stream stopped');
        }
    }
    
    closeCamera() {
        this.stopCamera();
        
        const modal = document.getElementById('camera-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        const video = document.getElementById('camera-video');
        if (video) {
            video.srcObject = null;
        }
    }
    
    async flipCamera() {
        try {
            this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
            await this.startCamera();
        } catch (error) {
            console.error('Failed to flip camera:', error);
            this.showError('Failed to switch camera');
        }
    }
    
    // ===== Photo Capture =====
    
    async capturePhoto() {
        try {
            if (!this.isStreamActive) {
                throw new Error('Camera not active');
            }
            
            const video = document.getElementById('camera-video');
            const canvas = document.getElementById('camera-canvas') || this.createCaptureCanvas();
            
            if (!video || !canvas) {
                throw new Error('Camera elements not found');
            }
            
            // Set canvas size to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Capture frame
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            
            // Convert to blob with high quality
            const blob = await this.canvasToBlob(canvas, 'image/jpeg', 0.92);
            
            // Close camera
            this.closeCamera();
            
            // Process through PhotoManager
            if (this.photoManager) {
                const photoData = await this.photoManager.processPhoto(blob, 'camera');
                
                // Add to current journal entry
                this.addPhotoToEntry(photoData);
                
                console.log('📷 Photo captured and processed:', photoData.id);
                return photoData;
            } else {
                throw new Error('Photo Manager not available');
            }
            
        } catch (error) {
            console.error('Photo capture failed:', error);
            this.showError('Failed to capture photo');
            throw error;
        }
    }
    
    createCaptureCanvas() {
        const canvas = document.createElement('canvas');
        canvas.id = 'camera-canvas';
        canvas.style.display = 'none';
        document.body.appendChild(canvas);
        return canvas;
    }
    
    canvasToBlob(canvas, type = 'image/jpeg', quality = 0.92) {
        return new Promise((resolve) => {
            canvas.toBlob(resolve, type, quality);
        });
    }
    
    // ===== Gallery Selection =====
    
    async selectFromGallery() {
        try {
            if (!this.photoManager) {
                throw new Error('Photo Manager not available');
            }
            
            const photos = await this.photoManager.selectPhoto();
            
            // Add all selected photos to current entry
            photos.forEach(photoData => {
                this.addPhotoToEntry(photoData);
            });
            
            console.log(`📷 Selected ${photos.length} photos from gallery`);
            return photos;
            
        } catch (error) {
            console.error('Gallery selection failed:', error);
            this.showError('Failed to select photos from gallery');
            throw error;
        }
    }
    
    // ===== Journal Integration =====
    
    addPhotoToEntry(photoData) {
        // Add thumbnail to journal manager
        if (window.journalManager) {
            window.journalManager.addPhoto({
                id: photoData.id,
                dataUrl: photoData.thumbnail, // Use thumbnail for display
                type: 'image/jpeg',
                metadata: photoData.metadata
            });
        }
        
        // Update photo preview in UI
        this.updatePhotoPreview();
    }
    
    updatePhotoPreview() {
        const preview = document.getElementById('photo-preview');
        if (!preview || !window.journalManager) return;
        
        preview.innerHTML = '';
        
        window.journalManager.currentPhotos.forEach((photo, index) => {
            const photoDiv = document.createElement('div');
            photoDiv.className = 'photo-item';
            photoDiv.innerHTML = `
                <img src="${photo.dataUrl}" alt="Photo ${index + 1}" onclick="photoViewer.show('${photo.id}')">
                <button class="photo-remove" onclick="cameraService.removePhoto('${photo.id}')">×</button>
                <div class="photo-quality-indicator">${this.getQualityIndicator(photo.id)}</div>
            `;
            preview.appendChild(photoDiv);
        });
    }
    
    getQualityIndicator(photoId) {
        if (this.photoManager && this.photoManager.hasOriginalPhoto(photoId)) {
            return '<span class="quality-badge original">HD</span>';
        }
        return '<span class="quality-badge thumbnail">LQ</span>';
    }
    
    removePhoto(photoId) {
        // Remove from journal manager
        if (window.journalManager) {
            const index = window.journalManager.currentPhotos.findIndex(photo => photo.id === photoId);
            if (index !== -1) {
                window.journalManager.currentPhotos.splice(index, 1);
            }
        }
        
        // Remove from photo manager
        if (this.photoManager) {
            this.photoManager.deletePhoto(photoId);
        }
        
        // Update UI
        this.updatePhotoPreview();
    }
    
    // ===== Device Detection =====
    
    async getCameraCapabilities() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                return { cameras: [], hasCamera: false };
            }
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(device => device.kind === 'videoinput');
            
            return {
                cameras,
                hasCamera: cameras.length > 0,
                hasFrontCamera: cameras.some(camera => 
                    camera.label.toLowerCase().includes('front') ||
                    camera.label.toLowerCase().includes('user')
                ),
                hasBackCamera: cameras.some(camera => 
                    camera.label.toLowerCase().includes('back') ||
                    camera.label.toLowerCase().includes('environment')
                )
            };
        } catch (error) {
            console.error('Failed to get camera capabilities:', error);
            return { cameras: [], hasCamera: false };
        }
    }
    
    // ===== Error Handling =====
    
    showError(message) {
        // Create or update error display
        const existingError = document.querySelector('.camera-error');
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'camera-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff3b30;
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            max-width: 300px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 4000);
    }
    
    // ===== Photo Management Integration =====
    
    /**
     * Get photo for display (integrates with PhotoManager)
     */
    async getPhoto(photoId, quality = 'thumbnail') {
        if (this.photoManager) {
            return await this.photoManager.getPhoto(photoId, quality);
        }
        return null;
    }
    
    /**
     * Check available qualities for a photo
     */
    getPhotoQualities(photoId) {
        const qualities = ['thumbnail'];
        
        if (this.photoManager) {
            const photo = this.photoManager.photos.get(photoId);
            if (photo) {
                if (photo.preview) qualities.push('preview');
                if (this.photoManager.hasOriginalPhoto(photoId)) {
                    qualities.push('original');
                }
            }
        }
        
        return qualities;
    }
    
    /**
     * Get storage statistics
     */
    getStorageStats() {
        if (this.photoManager) {
            return this.photoManager.getStorageStats();
        }
        return { photoCount: 0, totalThumbnailSize: 0 };
    }
    
    // ===== Legacy Support =====
    
    /**
     * Legacy method for backward compatibility
     */
    openCamera(callback) {
        if (typeof callback === 'function') {
            this.legacyCallback = callback;
        }
        return this.openCamera();
    }
    
    /**
     * Legacy photo capture with callback
     */
    async capturePhotoLegacy() {
        try {
            const photoData = await this.capturePhoto();
            if (this.legacyCallback) {
                this.legacyCallback({
                    dataUrl: photoData.thumbnail,
                    type: photoData.metadata.type,
                    id: photoData.id
                });
            }
            return photoData;
        } catch (error) {
            if (this.legacyCallback) {
                this.legacyCallback(null);
            }
            throw error;
        }
    }
}

// ===== Initialize Camera Service =====
let cameraService = null;

document.addEventListener('DOMContentLoaded', function() {
    cameraService = new CameraService();
    window.cameraService = cameraService;
    
    console.log('📷 Camera Service ready');
    
    // Check camera capabilities on load
    cameraService.getCameraCapabilities().then(capabilities => {
        console.log('📷 Camera capabilities:', capabilities);
        
        // Show/hide camera button based on availability
        const takePhotoBtn = document.getElementById('take-photo');
        if (takePhotoBtn && !capabilities.hasCamera) {
            takePhotoBtn.style.display = 'none';
        }
    });
});

// Export for other modules
window.CameraService = CameraService; 