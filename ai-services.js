// ===== AI Services Module for Audio-Photo Journal =====

class AIServices {
    constructor() {
        this.asticaApiKey = null; // Will be set by user
        this.isAsticaLoaded = false;
        this.speechRecognition = null;
        this.isListening = false;
        
        this.init();
    }
    
    init() {
        console.log('🤖 AI Services initialized');
        this.setupSpeechRecognition();
        this.loadAsticaSDK();
    }
    
    // ===== Astica.ai Photo Analysis =====
    loadAsticaSDK() {
        try {
            // Load Astica SDK dynamically
            if (!document.querySelector('script[src*="astica.api.js"]')) {
                const script = document.createElement('script');
                script.src = 'https://astica.ai/sdk-javascript/astica.api.js';
                script.onload = () => {
                    this.isAsticaLoaded = true;
                    console.log('📷 Astica AI SDK loaded successfully');
                };
                script.onerror = () => {
                    console.warn('⚠️ Failed to load Astica AI SDK');
                };
                document.head.appendChild(script);
            }
        } catch (error) {
            console.error('Failed to load Astica SDK:', error);
        }
    }
    
    setAsticaApiKey(apiKey) {
        this.asticaApiKey = apiKey;
        if (this.isAsticaLoaded && apiKey) {
            try {
                asticaAPI_start(apiKey);
                console.log('🔑 Astica API key configured');
            } catch (error) {
                console.error('Failed to start Astica API:', error);
            }
        }
    }
    
    async analyzePhoto(imageData) {
        return new Promise((resolve, reject) => {
            if (!this.isAsticaLoaded || !this.asticaApiKey) {
                // Fallback to basic image analysis
                resolve(this.getBasicImageAnalysis(imageData));
                return;
            }
            
            try {
                // Use Astica.ai for comprehensive photo analysis
                const customCallback = (data) => {
                    if (data.error) {
                        console.error('Astica AI error:', data.error);
                        resolve(this.getBasicImageAnalysis(imageData));
                        return;
                    }
                    
                    resolve({
                        description: data.caption || 'A captured moment',
                        detailedDescription: data.caption_GPTS || data.caption || '',
                        objects: data.objects || [],
                        faces: data.faces || [],
                        tags: data.tags || [],
                        categories: data.categories || [],
                        text: data.text || [],
                        moderate: data.moderate || null,
                        confidence: data.confidence || 0.8
                    });
                };
                
                // Call Astica Vision API
                asticaVision(
                    '2.5_full',
                    imageData,
                    'describe,objects,faces,tags,categories,moderate',
                    customCallback
                );
                
            } catch (error) {
                console.error('Photo analysis failed:', error);
                resolve(this.getBasicImageAnalysis(imageData));
            }
        });
    }
    
    getBasicImageAnalysis(imageData) {
        // Fallback analysis when AI service is unavailable
        const timestamp = new Date().toLocaleString();
        return {
            description: 'A photo captured in your journal',
            detailedDescription: `This image was captured on ${timestamp} and has been added to your journal entry.`,
            objects: [],
            faces: [],
            tags: ['photo', 'memory'],
            categories: ['personal'],
            text: [],
            moderate: null,
            confidence: 0.5,
            fallback: true
        };
    }
    
    // ===== Speech Recognition for Audio Transcription =====
    setupSpeechRecognition() {
        try {
            // Check for speech recognition support
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            if (SpeechRecognition) {
                this.speechRecognition = new SpeechRecognition();
                this.speechRecognition.continuous = true;
                this.speechRecognition.interimResults = true;
                this.speechRecognition.lang = 'en-US';
                
                console.log('🎤 Speech recognition available');
            } else {
                console.warn('⚠️ Speech recognition not supported');
            }
        } catch (error) {
            console.error('Speech recognition setup failed:', error);
        }
    }
    
    async transcribeAudio(audioBlob) {
        return new Promise((resolve, reject) => {
            if (!this.speechRecognition) {
                resolve('Audio recording captured. Voice transcription is not available on this device.');
                return;
            }
            
            try {
                // For recorded audio, we'll use a different approach
                // This is a simplified version - in production you'd send to a transcription service
                const reader = new FileReader();
                reader.onload = () => {
                    // Since we can't directly transcribe a blob with Web Speech API,
                    // we'll provide a placeholder and suggest the user speaks while recording
                    resolve('Audio transcription: [Recorded audio content - transcription requires real-time speech recognition]');
                };
                reader.readAsDataURL(audioBlob);
                
            } catch (error) {
                console.error('Audio transcription failed:', error);
                resolve('Audio recording captured but transcription failed.');
            }
        });
    }
    
    startLiveSpeechRecognition() {
        return new Promise((resolve, reject) => {
            if (!this.speechRecognition) {
                reject(new Error('Speech recognition not available'));
                return;
            }
            
            let finalTranscript = '';
            let interimTranscript = '';
            
            this.speechRecognition.onresult = (event) => {
                interimTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                // Real-time callback for UI updates
                if (this.onSpeechUpdate) {
                    this.onSpeechUpdate(finalTranscript, interimTranscript);
                }
            };
            
            this.speechRecognition.onend = () => {
                this.isListening = false;
                resolve(finalTranscript.trim());
            };
            
            this.speechRecognition.onerror = (event) => {
                this.isListening = false;
                reject(new Error(`Speech recognition error: ${event.error}`));
            };
            
            this.speechRecognition.start();
            this.isListening = true;
        });
    }
    
    stopLiveSpeechRecognition() {
        if (this.speechRecognition && this.isListening) {
            this.speechRecognition.stop();
        }
    }
    
    // ===== Smart Journal Entry Generation =====
    async generateJournalEntry(photoAnalysis, audioTranscription, userInput = '') {
        try {
            let generatedContent = '';
            const timestamp = new Date();
            const timeString = timestamp.toLocaleString();
            
            // Start with timestamp and context
            generatedContent += `Entry from ${timeString}\n\n`;
            
            // Add photo description if available
            if (photoAnalysis && !photoAnalysis.fallback) {
                generatedContent += `📷 ${photoAnalysis.description}\n`;
                
                if (photoAnalysis.detailedDescription && photoAnalysis.detailedDescription !== photoAnalysis.description) {
                    generatedContent += `${photoAnalysis.detailedDescription}\n`;
                }
                
                // Add detected objects/people
                if (photoAnalysis.objects && photoAnalysis.objects.length > 0) {
                    const objectNames = photoAnalysis.objects.map(obj => obj.name || obj).slice(0, 5);
                    generatedContent += `I can see: ${objectNames.join(', ')}\n`;
                }
                
                if (photoAnalysis.faces && photoAnalysis.faces.length > 0) {
                    const faceCount = photoAnalysis.faces.length;
                    generatedContent += `${faceCount} ${faceCount === 1 ? 'person' : 'people'} in this photo\n`;
                }
                
                generatedContent += '\n';
            }
            
            // Add audio transcription
            if (audioTranscription && audioTranscription.trim()) {
                generatedContent += `🎤 ${audioTranscription}\n\n`;
            }
            
            // Add user input
            if (userInput && userInput.trim()) {
                generatedContent += `${userInput}\n\n`;
            }
            
            // Add reflective ending if we have AI analysis
            if (photoAnalysis && !photoAnalysis.fallback) {
                generatedContent += `This moment captures ${photoAnalysis.categories ? photoAnalysis.categories.join(' and ') : 'a special memory'}.`;
            }
            
            return {
                content: generatedContent.trim(),
                suggestedTags: this.generateTags(photoAnalysis, audioTranscription, userInput),
                suggestedMood: this.detectMood(photoAnalysis, audioTranscription, userInput),
                confidence: photoAnalysis?.confidence || 0.7
            };
            
        } catch (error) {
            console.error('Journal generation failed:', error);
            return {
                content: userInput || 'A new journal entry.',
                suggestedTags: ['journal'],
                suggestedMood: null,
                confidence: 0.3
            };
        }
    }
    
    generateTags(photoAnalysis, audioTranscription, userInput) {
        const tags = new Set();
        
        // Add tags from photo analysis
        if (photoAnalysis?.tags) {
            photoAnalysis.tags.slice(0, 5).forEach(tag => tags.add(tag.toLowerCase()));
        }
        
        if (photoAnalysis?.categories) {
            photoAnalysis.categories.forEach(cat => tags.add(cat.toLowerCase()));
        }
        
        // Add tags from objects detected
        if (photoAnalysis?.objects) {
            photoAnalysis.objects.slice(0, 3).forEach(obj => {
                const name = obj.name || obj;
                if (name) tags.add(name.toLowerCase());
            });
        }
        
        // Add contextual tags
        const timeOfDay = new Date().getHours();
        if (timeOfDay < 12) tags.add('morning');
        else if (timeOfDay < 17) tags.add('afternoon');
        else tags.add('evening');
        
        // Add common journal tags
        tags.add('memory');
        if (photoAnalysis) tags.add('photo');
        if (audioTranscription) tags.add('audio');
        
        return Array.from(tags).slice(0, 8); // Limit to 8 tags
    }
    
    detectMood(photoAnalysis, audioTranscription, userInput) {
        // Simple mood detection based on content
        const allText = `${audioTranscription} ${userInput}`.toLowerCase();
        
        if (allText.includes('happy') || allText.includes('great') || allText.includes('wonderful')) {
            return 'happy';
        }
        if (allText.includes('sad') || allText.includes('down') || allText.includes('upset')) {
            return 'sad';
        }
        if (allText.includes('excited') || allText.includes('amazing') || allText.includes('fantastic')) {
            return 'excited';
        }
        if (allText.includes('calm') || allText.includes('peaceful') || allText.includes('relaxed')) {
            return 'calm';
        }
        if (allText.includes('worried') || allText.includes('anxious') || allText.includes('nervous')) {
            return 'anxious';
        }
        if (allText.includes('grateful') || allText.includes('thankful') || allText.includes('blessed')) {
            return 'grateful';
        }
        
        // Default based on photo analysis
        if (photoAnalysis?.faces && photoAnalysis.faces.length > 0) {
            return 'happy'; // Assume photos with people are positive
        }
        
        return null; // Let user choose
    }
    
    // ===== Settings Management =====
    getSettings() {
        return {
            asticaApiKey: localStorage.getItem('ai_astica_key') || '',
            speechRecognitionEnabled: localStorage.getItem('ai_speech_enabled') !== 'false',
            autoGenerateEntries: localStorage.getItem('ai_auto_generate') !== 'false',
            autoTagging: localStorage.getItem('ai_auto_tags') !== 'false'
        };
    }
    
    updateSettings(settings) {
        if (settings.asticaApiKey !== undefined) {
            localStorage.setItem('ai_astica_key', settings.asticaApiKey);
            this.setAsticaApiKey(settings.asticaApiKey);
        }
        if (settings.speechRecognitionEnabled !== undefined) {
            localStorage.setItem('ai_speech_enabled', settings.speechRecognitionEnabled);
        }
        if (settings.autoGenerateEntries !== undefined) {
            localStorage.setItem('ai_auto_generate', settings.autoGenerateEntries);
        }
        if (settings.autoTagging !== undefined) {
            localStorage.setItem('ai_auto_tags', settings.autoTagging);
        }
    }
    
    // ===== API Key Management =====
    validateAsticaApiKey(apiKey) {
        // Basic API key format validation
        return apiKey && apiKey.length > 10 && apiKey.includes('-');
    }
    
    // ===== Feature Detection =====
    getCapabilities() {
        return {
            photoAnalysis: this.isAsticaLoaded && this.asticaApiKey,
            speechRecognition: !!this.speechRecognition,
            liveSpeechRecognition: !!this.speechRecognition,
            smartGeneration: true,
            autoTagging: true
        };
    }
}

// ===== AI Integration Helper Functions =====
class AIIntegration {
    static async processNewEntry(photos, audioBlob, userText) {
        const aiServices = window.aiServices;
        if (!aiServices) return null;
        
        let photoAnalysis = null;
        let audioTranscription = '';
        
        // Analyze first photo if available
        if (photos && photos.length > 0) {
            try {
                photoAnalysis = await aiServices.analyzePhoto(photos[0].dataUrl);
                console.log('📷 Photo analysis complete:', photoAnalysis);
            } catch (error) {
                console.error('Photo analysis failed:', error);
            }
        }
        
        // Transcribe audio if available
        if (audioBlob) {
            try {
                audioTranscription = await aiServices.transcribeAudio(audioBlob);
                console.log('🎤 Audio transcription complete');
            } catch (error) {
                console.error('Audio transcription failed:', error);
            }
        }
        
        // Generate journal entry
        const generated = await aiServices.generateJournalEntry(
            photoAnalysis,
            audioTranscription,
            userText
        );
        
        return {
            photoAnalysis,
            audioTranscription,
            generated
        };
    }
    
    static createAIButton(text, onclick, icon = '🤖') {
        const button = document.createElement('button');
        button.className = 'ai-button';
        button.innerHTML = `${icon} ${text}`;
        button.onclick = onclick;
        return button;
    }
    
    static showAISettings() {
        const modal = document.createElement('div');
        modal.className = 'ai-settings-modal';
        modal.innerHTML = `
            <div class="ai-settings-content">
                <h3>🤖 AI Settings</h3>
                <div class="ai-setting">
                    <label>Astica.ai API Key (for photo analysis):</label>
                    <input type="password" id="ai-astica-key" placeholder="Enter your API key">
                    <small>Get your free API key at <a href="https://astica.ai" target="_blank">astica.ai</a></small>
                </div>
                <div class="ai-setting">
                    <label>
                        <input type="checkbox" id="ai-speech-enabled"> Enable speech recognition
                    </label>
                </div>
                <div class="ai-setting">
                    <label>
                        <input type="checkbox" id="ai-auto-generate"> Auto-generate journal entries
                    </label>
                </div>
                <div class="ai-setting">
                    <label>
                        <input type="checkbox" id="ai-auto-tags"> Auto-generate tags
                    </label>
                </div>
                <div class="ai-settings-buttons">
                    <button onclick="this.closest('.ai-settings-modal').remove()">Cancel</button>
                    <button onclick="AIIntegration.saveAISettings()">Save</button>
                </div>
            </div>
        `;
        
        // Populate current settings
        const settings = window.aiServices?.getSettings();
        if (settings) {
            modal.querySelector('#ai-astica-key').value = settings.asticaApiKey;
            modal.querySelector('#ai-speech-enabled').checked = settings.speechRecognitionEnabled;
            modal.querySelector('#ai-auto-generate').checked = settings.autoGenerateEntries;
            modal.querySelector('#ai-auto-tags').checked = settings.autoTagging;
        }
        
        document.body.appendChild(modal);
    }
    
    static saveAISettings() {
        const settings = {
            asticaApiKey: document.getElementById('ai-astica-key').value,
            speechRecognitionEnabled: document.getElementById('ai-speech-enabled').checked,
            autoGenerateEntries: document.getElementById('ai-auto-generate').checked,
            autoTagging: document.getElementById('ai-auto-tags').checked
        };
        
        window.aiServices?.updateSettings(settings);
        document.querySelector('.ai-settings-modal')?.remove();
        
        // Show success message
        console.log('✅ AI settings saved');
    }
}

// ===== Initialize AI Services =====
let aiServices = null;

document.addEventListener('DOMContentLoaded', function() {
    aiServices = new AIServices();
    window.aiServices = aiServices;
    
    // Load saved settings
    const settings = aiServices.getSettings();
    if (settings.asticaApiKey) {
        aiServices.setAsticaApiKey(settings.asticaApiKey);
    }
    
    console.log('🤖 AI Integration ready');
    console.log('Capabilities:', aiServices.getCapabilities());
});

// Export for global use
window.AIServices = AIServices;
window.AIIntegration = AIIntegration; 