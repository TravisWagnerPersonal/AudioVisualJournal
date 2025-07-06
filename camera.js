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

// ===== Initialize Camera System =====
let cameraManager = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    cameraManager = new CameraManager();
    
    console.log('📷 Camera system initialized');
    
    // Check camera capabilities
    cameraManager.getCameraCapabilities().then(capabilities => {
        console.log('📋 Camera capabilities:', capabilities);
        
        if (!capabilities.hasCamera) {
            console.warn('⚠️ No camera detected');
            // Could hide camera button or show info message
        }
    });
});

// ===== Global Functions =====
window.openCamera = function() {
    if (cameraManager) {
        cameraManager.openCamera();
    }
};

window.openFilePicker = function() {
    if (cameraManager) {
        cameraManager.openFilePicker();
    }
};

// Export for use in other modules
window.cameraManager = cameraManager;
window.ImageUtils = ImageUtils; 