// ===== Enhanced Audio Recording Module =====
class AudioRecording {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.stream = null;
        this.startTime = null;
        this.timer = null;
        this.audioBlob = null;
        this.duration = 0;
        
        // Speech recognition for real-time transcription
        this.speechRecognition = null;
        this.isTranscribing = false;
        this.currentTranscription = '';
        this.finalTranscription = '';
        this.interimTranscription = '';
        
        this.init();
    }

    init() {
        console.log('🎤 Audio Recording module initializing...');
        
        // Check for MediaRecorder support
        if (!window.MediaRecorder) {
            console.error('❌ MediaRecorder not supported');
            return;
        }
        
        // Setup speech recognition
        this.setupSpeechRecognition();
        
        // Bind event handlers
        this.bindEvents();
        
        console.log('✅ Audio Recording ready');
    }

    setupSpeechRecognition() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            if (SpeechRecognition) {
                this.speechRecognition = new SpeechRecognition();
                this.speechRecognition.continuous = true;
                this.speechRecognition.interimResults = true;
                this.speechRecognition.lang = 'en-US';
                
                this.speechRecognition.onstart = () => {
                    console.log('🎤 Speech recognition started');
                    this.isTranscribing = true;
                    this.updateTranscriptionUI('Listening...');
                };
                
                this.speechRecognition.onresult = (event) => {
                    this.handleSpeechResults(event);
                };
                
                this.speechRecognition.onerror = (event) => {
                    console.error('❌ Speech recognition error:', event.error);
                    this.updateTranscriptionUI('Speech recognition error');
                };
                
                this.speechRecognition.onend = () => {
                    console.log('🎤 Speech recognition ended');
                    this.isTranscribing = false;
                    
                    // Restart if still recording
                    if (this.isRecording) {
                        setTimeout(() => {
                            try {
                                this.speechRecognition.start();
                            } catch (error) {
                                console.warn('⚠️ Could not restart speech recognition:', error);
                            }
                        }, 100);
                    }
                };
                
                console.log('✅ Speech recognition available');
            } else {
                console.warn('⚠️ Speech recognition not supported');
            }
        } catch (error) {
            console.error('❌ Speech recognition setup failed:', error);
        }
    }

    handleSpeechResults(event) {
        let interimTranscript = '';
        let finalTranscript = this.finalTranscription;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }
        
        this.finalTranscription = finalTranscript;
        this.interimTranscription = interimTranscript;
        this.currentTranscription = finalTranscript + interimTranscript;
        
        // Update UI with real-time transcription
        this.updateTranscriptionUI(this.currentTranscription);
    }

    updateTranscriptionUI(text) {
        const transcriptionDisplay = document.getElementById('live-transcription');
        if (transcriptionDisplay) {
            transcriptionDisplay.innerHTML = text.split(' ').map((word, index) => {
                if (index >= this.finalTranscription.split(' ').length - 1) {
                    return `<span class="interim-text">${word}</span>`;
                }
                return word;
            }).join(' ');
        }
    }

    bindEvents() {
        const recordBtn = document.getElementById('record-btn');
        if (recordBtn) {
            recordBtn.addEventListener('click', () => this.toggleRecording());
        }
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
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                } 
            });
            
            // Initialize MediaRecorder
            const options = {
                mimeType: this.getSupportedMimeType(),
                audioBitsPerSecond: 128000
            };
            
            this.mediaRecorder = new MediaRecorder(this.stream, options);
            this.audioChunks = [];
            
            // Event handlers
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.processRecordedAudio();
            };
            
            // Start recording
            this.mediaRecorder.start(1000); // Collect data every second
            this.isRecording = true;
            this.startTime = Date.now();
            
            // Start speech recognition if available
            if (this.speechRecognition) {
                try {
                    this.finalTranscription = '';
                    this.interimTranscription = '';
                    this.currentTranscription = '';
                    this.speechRecognition.start();
                } catch (error) {
                    console.warn('⚠️ Could not start speech recognition:', error);
                }
            }
            
            // Start timer
            this.startTimer();
            
            // Update UI
            this.updateRecordingUI(true);
            
            console.log('✅ Recording started');
            
        } catch (error) {
            console.error('❌ Failed to start recording:', error);
            this.showError('Microphone access denied or not available');
        }
    }

    async stopRecording() {
        try {
            console.log('⏹️ Stopping recording...');
            
            if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
                this.mediaRecorder.stop();
            }
            
            // Stop speech recognition
            if (this.speechRecognition && this.isTranscribing) {
                this.speechRecognition.stop();
            }
            
            // Stop stream
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }
            
            this.isRecording = false;
            this.duration = (Date.now() - this.startTime) / 1000;
            
            // Stop timer
            this.stopTimer();
            
            // Update UI
            this.updateRecordingUI(false);
            
            console.log('✅ Recording stopped');
            
        } catch (error) {
            console.error('❌ Failed to stop recording:', error);
        }
    }

    processRecordedAudio() {
        if (this.audioChunks.length === 0) return;
        
        this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Create audio URL for playback
        const audioUrl = URL.createObjectURL(this.audioBlob);
        
        // Update audio preview
        this.updateAudioPreview(audioUrl);
        
        // Trigger audio processed event
        const event = new CustomEvent('audioProcessed', {
            detail: {
                blob: this.audioBlob,
                duration: this.duration,
                transcription: this.finalTranscription.trim(),
                url: audioUrl
            }
        });
        document.dispatchEvent(event);
        
        console.log('🎤 Audio processed:', {
            duration: this.duration,
            size: this.audioBlob.size,
            transcription: this.finalTranscription.length + ' chars'
        });
    }

    getSupportedMimeType() {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/ogg'
        ];
        
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        
        return 'audio/webm'; // Fallback
    }

    startTimer() {
        const timerDisplay = document.getElementById('recording-timer');
        if (!timerDisplay) return;
        
        timerDisplay.classList.remove('hidden');
        
        this.timer = setInterval(() => {
            const elapsed = (Date.now() - this.startTime) / 1000;
            const minutes = Math.floor(elapsed / 60);
            const seconds = Math.floor(elapsed % 60);
            timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        const timerDisplay = document.getElementById('recording-timer');
        if (timerDisplay) {
            timerDisplay.classList.add('hidden');
        }
    }

    updateRecordingUI(isRecording) {
        const recordBtn = document.getElementById('record-btn');
        const audioRecorder = document.querySelector('.audio-recorder');
        
        if (recordBtn) {
            if (isRecording) {
                recordBtn.classList.add('recording');
                recordBtn.innerHTML = '⏹️';
                recordBtn.nextElementSibling.textContent = 'Tap to stop recording';
            } else {
                recordBtn.classList.remove('recording');
                recordBtn.innerHTML = '🎤';
                recordBtn.nextElementSibling.textContent = 'Tap to record your voice';
            }
        }
        
        if (audioRecorder) {
            if (isRecording) {
                audioRecorder.classList.add('recording');
                
                // Show live transcription if speech recognition is available
                if (this.speechRecognition) {
                    this.showLiveTranscription();
                }
            } else {
                audioRecorder.classList.remove('recording');
                this.hideLiveTranscription();
            }
        }
    }

    showLiveTranscription() {
        let transcriptionDiv = document.getElementById('live-transcription-container');
        
        if (!transcriptionDiv) {
            transcriptionDiv = document.createElement('div');
            transcriptionDiv.id = 'live-transcription-container';
            transcriptionDiv.className = 'live-transcription-container';
            transcriptionDiv.innerHTML = `
                <div class="transcription-header">
                    <span>🎤 Live Transcription</span>
                    <small>Speak clearly for best results</small>
                </div>
                <div id="live-transcription" class="live-transcription">
                    Ready to transcribe...
                </div>
            `;
            
            const audioRecorder = document.querySelector('.audio-recorder');
            if (audioRecorder) {
                audioRecorder.appendChild(transcriptionDiv);
            }
        }
        
        transcriptionDiv.style.display = 'block';
    }

    hideLiveTranscription() {
        const transcriptionDiv = document.getElementById('live-transcription-container');
        if (transcriptionDiv) {
            transcriptionDiv.style.display = 'none';
        }
    }

    updateAudioPreview(audioUrl) {
        const audioPreview = document.getElementById('audio-preview');
        if (!audioPreview) return;
        
        audioPreview.innerHTML = `
            <div class="audio-item">
                <div class="audio-info">
                    <div class="audio-title">
                        �� Recording (${this.formatDuration(this.duration)})
                    </div>
                    <div class="audio-transcription">
                        ${this.finalTranscription || 'No transcription available'}
                    </div>
                </div>
                <div class="audio-controls">
                    <audio controls src="${audioUrl}"></audio>
                    <button class="btn-delete" onclick="audioRecording.deleteAudio()">🗑️</button>
                </div>
            </div>
        `;
        
        audioPreview.style.display = 'block';
    }

    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    deleteAudio() {
        this.audioBlob = null;
        this.finalTranscription = '';
        this.currentTranscription = '';
        this.duration = 0;
        
        const audioPreview = document.getElementById('audio-preview');
        if (audioPreview) {
            audioPreview.style.display = 'none';
            audioPreview.innerHTML = '';
        }
        
        // Trigger audio deleted event
        const event = new CustomEvent('audioDeleted');
        document.dispatchEvent(event);
        
        console.log('🗑️ Audio deleted');
    }

    // ===== Public API =====

    getCurrentAudio() {
        return {
            blob: this.audioBlob,
            duration: this.duration,
            transcription: this.finalTranscription.trim(),
            size: this.audioBlob ? this.audioBlob.size : 0
        };
    }

    getTranscription() {
        return this.finalTranscription.trim();
    }

    isRecordingActive() {
        return this.isRecording;
    }

    hasAudio() {
        return !!this.audioBlob;
    }

    getCapabilities() {
        return {
            canRecord: !!window.MediaRecorder,
            canTranscribe: !!this.speechRecognition,
            supportedFormats: this.getSupportedMimeType()
        };
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'audio-error';
        errorDiv.style.cssText = `
            background: #fee;
            border: 1px solid #fcc;
            color: #c33;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
        `;
        errorDiv.textContent = message;
        
        const audioRecorder = document.querySelector('.audio-recorder');
        if (audioRecorder) {
            audioRecorder.appendChild(errorDiv);
            
            setTimeout(() => {
                errorDiv.remove();
            }, 5000);
        }
    }

    // ===== Enhanced Integration Methods =====

    async getAudioForJournal() {
        if (!this.audioBlob) return null;
        
        return {
            blob: this.audioBlob,
            duration: this.duration,
            transcription: this.finalTranscription.trim(),
            size: this.audioBlob.size,
            mimeType: this.audioBlob.type,
            timestamp: new Date()
        };
    }

    // ===== Cleanup =====

    destroy() {
        if (this.isRecording) {
            this.stopRecording();
        }
        
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        
        if (this.speechRecognition) {
            this.speechRecognition.abort();
        }
    }
}

// ===== Initialize Audio Recording =====
let audioRecording;

document.addEventListener('DOMContentLoaded', () => {
    audioRecording = new AudioRecording();
    window.audioRecording = audioRecording;
});

// ===== Export for global use =====
window.AudioRecording = AudioRecording; 