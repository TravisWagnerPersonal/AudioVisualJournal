// ===== Audio Recording Module =====
class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioStream = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.recordingStartTime = null;
        this.recordingTimer = null;
        this.currentAudioBlob = null;
        this.currentAudioUrl = null;
        
        // UI Elements
        this.recordBtn = null;
        this.timerDisplay = null;
        this.audioPreview = null;
        
        this.init();
    }
    
    init() {
        // Get UI elements
        this.recordBtn = document.getElementById('record-btn');
        this.timerDisplay = document.getElementById('recording-timer');
        this.audioPreview = document.getElementById('audio-preview');
        
        // Setup event listeners
        if (this.recordBtn) {
            this.recordBtn.addEventListener('click', () => this.toggleRecording());
        }
        
        console.log('🎤 Audio recorder initialized');
    }
    
    async toggleRecording() {
        if (this.isRecording) {
            await this.stopRecording();
        } else {
            await this.startRecording();
        }
    }
    
    async startRecording() {
        try {
            console.log('🎤 Starting audio recording...');
            
            // Request microphone permission
            this.audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 44100,
                    sampleSize: 16,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            // Create MediaRecorder
            const options = {
                mimeType: 'audio/webm;codecs=opus',
                audioBitsPerSecond: 128000
            };
            
            // Fallback for browsers that don't support webm
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'audio/mp4';
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options.mimeType = 'audio/wav';
                }
            }
            
            this.mediaRecorder = new MediaRecorder(this.audioStream, options);
            this.audioChunks = [];
            
            // Setup MediaRecorder event handlers
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.createAudioBlob();
            };
            
            this.mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                this.handleRecordingError('Recording failed. Please try again.');
            };
            
            // Start recording
            this.mediaRecorder.start(1000); // Collect data every second
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            
            // Update UI
            this.updateRecordingUI();
            this.startTimer();
            
            console.log('✅ Recording started successfully');
            
        } catch (error) {
            console.error('Failed to start recording:', error);
            this.handleRecordingError('Could not access microphone. Please check permissions.');
        }
    }
    
    async stopRecording() {
        try {
            console.log('⏹️ Stopping audio recording...');
            
            if (this.mediaRecorder && this.isRecording) {
                this.mediaRecorder.stop();
                this.isRecording = false;
                
                // Stop audio stream
                if (this.audioStream) {
                    this.audioStream.getTracks().forEach(track => {
                        track.stop();
                    });
                    this.audioStream = null;
                }
                
                // Stop timer
                this.stopTimer();
                
                // Update UI
                this.updateRecordingUI();
                
                console.log('✅ Recording stopped successfully');
            }
            
        } catch (error) {
            console.error('Failed to stop recording:', error);
            this.handleRecordingError('Failed to stop recording.');
        }
    }
    
    createAudioBlob() {
        try {
            // Create blob from audio chunks
            this.currentAudioBlob = new Blob(this.audioChunks, { 
                type: 'audio/webm' 
            });
            
            // Create URL for playback
            if (this.currentAudioUrl) {
                URL.revokeObjectURL(this.currentAudioUrl);
            }
            this.currentAudioUrl = URL.createObjectURL(this.currentAudioBlob);
            
            // Calculate duration
            const duration = this.calculateRecordingDuration();
            
            // Show audio preview
            this.showAudioPreview(duration);
            
            console.log('🎵 Audio blob created:', {
                size: this.currentAudioBlob.size,
                type: this.currentAudioBlob.type,
                duration: duration
            });
            
        } catch (error) {
            console.error('Failed to create audio blob:', error);
            this.handleRecordingError('Failed to process recording.');
        }
    }
    
    showAudioPreview(duration) {
        if (!this.audioPreview) return;
        
        const durationText = this.formatDuration(duration);
        
        this.audioPreview.innerHTML = `
            <div class="audio-preview">
                <button class="audio-play-btn" onclick="audioRecorder.playRecording()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                </button>
                <div class="audio-info">
                    <div class="audio-duration">${durationText}</div>
                    <div class="audio-waveform">
                        <div class="audio-progress" id="audio-progress"></div>
                    </div>
                </div>
                <button class="audio-delete-btn" onclick="audioRecorder.deleteRecording()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="m19 6 v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
    }
    
    async playRecording() {
        if (!this.currentAudioUrl) return;
        
        try {
            const audio = new Audio(this.currentAudioUrl);
            const playBtn = this.audioPreview.querySelector('.audio-play-btn');
            const progressBar = document.getElementById('audio-progress');
            
            // Update play button
            playBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
            `;
            
            // Play audio
            await audio.play();
            
            // Update progress
            audio.addEventListener('timeupdate', () => {
                const progress = (audio.currentTime / audio.duration) * 100;
                if (progressBar) {
                    progressBar.style.width = `${progress}%`;
                }
            });
            
            // Reset when finished
            audio.addEventListener('ended', () => {
                playBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                `;
                if (progressBar) {
                    progressBar.style.width = '0%';
                }
            });
            
            // Handle pause
            playBtn.onclick = () => {
                audio.pause();
                playBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                `;
                playBtn.onclick = () => this.playRecording();
            };
            
        } catch (error) {
            console.error('Failed to play recording:', error);
            this.handleRecordingError('Failed to play recording.');
        }
    }
    
    deleteRecording() {
        if (this.currentAudioUrl) {
            URL.revokeObjectURL(this.currentAudioUrl);
            this.currentAudioUrl = null;
        }
        
        this.currentAudioBlob = null;
        this.audioChunks = [];
        
        if (this.audioPreview) {
            this.audioPreview.innerHTML = '';
        }
        
        console.log('🗑️ Audio recording deleted');
    }
    
    updateRecordingUI() {
        if (!this.recordBtn) return;
        
        const recordIcon = this.recordBtn.querySelector('.record-icon');
        const recordText = this.recordBtn.querySelector('.record-text');
        
        if (this.isRecording) {
            this.recordBtn.classList.add('recording');
            if (recordText) recordText.textContent = 'Tap to Stop';
            if (this.timerDisplay) this.timerDisplay.classList.remove('hidden');
        } else {
            this.recordBtn.classList.remove('recording');
            if (recordText) recordText.textContent = 'Tap to Record';
            if (this.timerDisplay) this.timerDisplay.classList.add('hidden');
        }
    }
    
    startTimer() {
        this.recordingTimer = setInterval(() => {
            const elapsed = Date.now() - this.recordingStartTime;
            const formatted = this.formatDuration(elapsed);
            
            if (this.timerDisplay) {
                this.timerDisplay.textContent = formatted;
            }
        }, 100);
    }
    
    stopTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }
    
    calculateRecordingDuration() {
        if (this.recordingStartTime) {
            return Date.now() - this.recordingStartTime;
        }
        return 0;
    }
    
    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    handleRecordingError(message) {
        this.isRecording = false;
        this.stopTimer();
        this.updateRecordingUI();
        
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
        }
        
        console.error('Recording error:', message);
        // TODO: Show user-friendly error message
        alert(message);
    }
    
    // Get current recording for saving
    getCurrentRecording() {
        return {
            blob: this.currentAudioBlob,
            url: this.currentAudioUrl,
            duration: this.calculateRecordingDuration()
        };
    }
    
    // Save audio to IndexedDB
    async saveAudioToDatabase() {
        if (!this.currentAudioBlob) return null;
        
        try {
            // Convert blob to array buffer for storage
            const arrayBuffer = await this.currentAudioBlob.arrayBuffer();
            
            // Save to database (this will be called from app.js)
            const audioId = await saveMediaFile(arrayBuffer, 'audio');
            
            console.log('💾 Audio saved to database:', audioId);
            return audioId;
            
        } catch (error) {
            console.error('Failed to save audio:', error);
            throw error;
        }
    }
    
    // Load audio from IndexedDB
    async loadAudioFromDatabase(audioId) {
        try {
            const audioData = await getMediaFile(audioId, 'audio');
            if (audioData) {
                // Convert array buffer back to blob
                const blob = new Blob([audioData.file], { type: 'audio/webm' });
                this.currentAudioBlob = blob;
                this.currentAudioUrl = URL.createObjectURL(blob);
                
                // Show preview
                this.showAudioPreview(audioData.duration || 0);
                
                console.log('📂 Audio loaded from database:', audioId);
                return true;
            }
            return false;
            
        } catch (error) {
            console.error('Failed to load audio:', error);
            return false;
        }
    }
    
    // Check if browser supports audio recording
    static isSupported() {
        return !!(navigator.mediaDevices && 
                 navigator.mediaDevices.getUserMedia && 
                 window.MediaRecorder);
    }
    
    // Get supported audio formats
    static getSupportedFormats() {
        const formats = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/wav'
        ];
        
        return formats.filter(format => MediaRecorder.isTypeSupported(format));
    }
}

// ===== Audio Playback Manager =====
class AudioPlaybackManager {
    constructor() {
        this.currentAudio = null;
        this.isPlaying = false;
    }
    
    async playAudio(audioId) {
        try {
            // Stop current audio if playing
            this.stopCurrent();
            
            // Load audio from database
            const audioData = await getMediaFile(audioId, 'audio');
            if (!audioData) {
                throw new Error('Audio not found');
            }
            
            // Create audio element
            const blob = new Blob([audioData.file], { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(blob);
            this.currentAudio = new Audio(audioUrl);
            
            // Play audio
            await this.currentAudio.play();
            this.isPlaying = true;
            
            // Handle end of playback
            this.currentAudio.addEventListener('ended', () => {
                this.cleanup();
            });
            
            console.log('🔊 Playing audio:', audioId);
            
        } catch (error) {
            console.error('Failed to play audio:', error);
            this.cleanup();
        }
    }
    
    stopCurrent() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.cleanup();
        }
    }
    
    cleanup() {
        if (this.currentAudio && this.currentAudio.src) {
            URL.revokeObjectURL(this.currentAudio.src);
        }
        this.currentAudio = null;
        this.isPlaying = false;
    }
}

// ===== Initialize Audio System =====
let audioRecorder = null;
let audioPlaybackManager = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check browser support
    if (!AudioRecorder.isSupported()) {
        console.warn('⚠️ Audio recording not supported in this browser');
        // Hide audio recording UI or show fallback
        const audioSection = document.querySelector('.media-section:nth-child(2)');
        if (audioSection) {
            audioSection.style.display = 'none';
        }
        return;
    }
    
    // Initialize audio components
    audioRecorder = new AudioRecorder();
    audioPlaybackManager = new AudioPlaybackManager();
    
    console.log('🎵 Audio system initialized');
    console.log('📋 Supported formats:', AudioRecorder.getSupportedFormats());
});

// ===== Global Functions =====
window.playAudio = function(audioId) {
    if (audioPlaybackManager) {
        audioPlaybackManager.playAudio(audioId);
    }
};

window.stopAudio = function() {
    if (audioPlaybackManager) {
        audioPlaybackManager.stopCurrent();
    }
};

// Export for use in other modules
window.audioRecorder = audioRecorder;
window.audioPlaybackManager = audioPlaybackManager; 