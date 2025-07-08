// ===== Journal Management Module =====
class JournalManager {
    constructor() {
        this.entries = [];
        this.currentPhotos = [];
        this.currentAudio = null;
        this.lastAnalysis = null;
        this.isEditing = false;
        this.currentEntry = null;
        this.lastAnalysis = null;
        this.isAIProcessing = false;
        this.aiServicesReady = false; // New property to track AI services readiness
        this.enhancedStorageReady = false; // Track enhanced storage readiness
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.showView('timeline');
        this.setupAIIntegration();
        this.setupAutoSave();
        
        // Wait for enhanced storage to be ready
        this.waitForEnhancedStorage();
        
        // Wait for AI services to be ready
        this.waitForAIServices();
    }

    waitForEnhancedStorage() {
        if (window.enhancedStorage) {
            console.log('💾 Enhanced storage already available');
            this.enhancedStorageReady = true;
            this.loadEntriesFromEnhancedStorage();
            this.loadDraftFromEnhancedStorage();
            return;
        }
        
        // Listen for enhanced storage ready event
        document.addEventListener('enhancedStorageReady', () => {
            console.log('💾 Enhanced storage now available');
            this.enhancedStorageReady = true;
            this.loadEntriesFromEnhancedStorage();
            this.loadDraftFromEnhancedStorage();
        });
        
        // Fallback timeout
        setTimeout(() => {
            if (!this.enhancedStorageReady && window.enhancedStorage) {
                console.log('💾 Enhanced storage found after timeout');
                this.enhancedStorageReady = true;
                this.loadEntriesFromEnhancedStorage();
                this.loadDraftFromEnhancedStorage();
            } else if (!this.enhancedStorageReady) {
                console.warn('⚠️ Enhanced storage not available, falling back to localStorage');
                this.loadEntries(); // Fallback to old method
                this.loadDraft(); // Fallback to old method
            }
        }, 5000);
    }

    waitForAIServices() {
        if (window.improvedAIServices || window.aiServices) {
            console.log('🤖 AI services already available');
            this.aiServicesReady = true;
            return;
        }
        
        // Listen for AI services ready event
        document.addEventListener('aiServicesReady', () => {
            console.log('🤖 AI services now available');
            this.aiServicesReady = true;
        });
        
        // Fallback timeout
        setTimeout(() => {
            if (!this.aiServicesReady && (window.improvedAIServices || window.aiServices)) {
                console.log('🤖 AI services found after timeout');
                this.aiServicesReady = true;
            }
        }, 3000);
    }

    // ===== AI Integration =====
    setupAIIntegration() {
        // AI Panel Toggle
        const aiAssistBtn = document.getElementById('ai-assist-btn');
        const aiPanel = document.getElementById('ai-panel');
        const aiPanelClose = document.getElementById('ai-panel-close');
        
        if (aiAssistBtn) {
            aiAssistBtn.addEventListener('click', () => {
                aiPanel.classList.toggle('hidden');
                if (!aiPanel.classList.contains('hidden')) {
                    this.updateAIStatus();
                }
            });
        }
        
        if (aiPanelClose) {
            aiPanelClose.addEventListener('click', () => {
                aiPanel.classList.add('hidden');
            });
        }
        
        // AI Action Buttons
        this.bindAIActions();
        
        // AI Mini Buttons
        this.bindAIMiniButtons();
        
        // Settings Integration
        this.bindAISettings();
    }
    
    bindAIActions() {
        // Main AI actions in the panel
        const aiAnalyzePhoto = document.getElementById('ai-analyze-photo');
        const aiTranscribeAudio = document.getElementById('ai-transcribe-audio');
        const aiGenerateEntry = document.getElementById('ai-generate-entry');
        
        if (aiAnalyzePhoto) {
            aiAnalyzePhoto.addEventListener('click', () => this.analyzePhotosWithAI());
        }
        
        if (aiTranscribeAudio) {
            aiTranscribeAudio.addEventListener('click', () => this.transcribeAudioWithAI());
        }
        
        if (aiGenerateEntry) {
            aiGenerateEntry.addEventListener('click', () => this.generateEntryWithAI());
        }
    }
    
    bindAIMiniButtons() {
        // Photo analysis mini button
        const aiPhotoAnalyze = document.getElementById('ai-photo-analyze');
        if (aiPhotoAnalyze) {
            aiPhotoAnalyze.addEventListener('click', () => this.analyzePhotosWithAI());
        }
        
        // Speech recognition mini button
        const aiSpeechBtn = document.getElementById('ai-speech-btn');
        if (aiSpeechBtn) {
            aiSpeechBtn.addEventListener('click', () => this.toggleLiveSpeechRecognition());
        }
        
        // Content generation mini button
        const aiGenerateContent = document.getElementById('ai-generate-content');
        if (aiGenerateContent) {
            aiGenerateContent.addEventListener('click', () => this.generateContentWithAI());
        }
        
        // Mood detection mini button
        const aiDetectMood = document.getElementById('ai-detect-mood');
        if (aiDetectMood) {
            aiDetectMood.addEventListener('click', () => this.detectMoodWithAI());
        }
        
        // Tag generation mini button
        const aiGenerateTags = document.getElementById('ai-generate-tags');
        if (aiGenerateTags) {
            aiGenerateTags.addEventListener('click', () => this.generateTagsWithAI());
        }
    }
    
    bindAISettings() {
        const aiSettingsBtn = document.getElementById('ai-settings-btn');
        const autoGenerateToggle = document.getElementById('auto-generate-toggle');
        const speechRecognitionToggle = document.getElementById('speech-recognition-toggle');
        
        if (aiSettingsBtn) {
            aiSettingsBtn.addEventListener('click', () => {
                if (window.AIIntegration) {
                    AIIntegration.showAISettings();
                }
            });
        }
        
        if (autoGenerateToggle) {
            autoGenerateToggle.addEventListener('change', (e) => {
                if (window.aiServices) {
                    window.aiServices.updateSettings({
                        autoGenerateEntries: e.target.checked
                    });
                }
            });
        }
        
        if (speechRecognitionToggle) {
            speechRecognitionToggle.addEventListener('change', (e) => {
                if (window.aiServices) {
                    window.aiServices.updateSettings({
                        speechRecognitionEnabled: e.target.checked
                    });
                }
            });
        }
    }
    
    // ===== AI Workflow Methods =====
    async analyzePhotosWithAI() {
        if (this.isAIProcessing) return;
        
        if (!this.currentPhotos || this.currentPhotos.length === 0) {
            this.showAIMessage('Please add photos first before analyzing them.');
            return;
        }
        
        // Get AI services
        const aiServices = window.improvedAIServices || window.aiServices;
        if (!aiServices) {
            this.showAIMessage('AI services are not available. Please check your connection.');
            return;
        }
        
        this.isAIProcessing = true;
        this.updateAIStatus('🔍 Analyzing photos...');
        
        try {
            // Analyze the first photo
            const photo = this.currentPhotos[0];
            console.log('📷 Starting photo analysis for:', photo.dataUrl ? 'Valid image data' : 'No image data');
            
            const analysis = await aiServices.analyzePhoto(photo.dataUrl);
            
            console.log('📷 Photo analysis result:', analysis);
            
            this.lastAnalysis = analysis;
            this.displayPhotoAnalysis(analysis);
            this.updateAIStatus('✅ Photo analysis complete!');
            
            // Auto-apply insights if enabled
            const settings = aiServices.getSettings();
            if (settings && settings.autoTagging) {
                this.applyAITagsToEntry(analysis.tags);
            }
            
            // Auto-generate entry if enabled
            if (settings && settings.autoGenerateEntries) {
                console.log('🤖 Auto-generating journal entry...');
                setTimeout(() => {
                    this.generateEntryWithAI();
                }, 1000);
            }
            
        } catch (error) {
            console.error('Photo analysis failed:', error);
            this.updateAIStatus('❌ Photo analysis failed. Please check your AI settings.');
        } finally {
            this.isAIProcessing = false;
        }
    }
    
    async transcribeAudioWithAI() {
        if (this.isAIProcessing) return;
        
        // Check if we have enhanced audio system with real-time transcription
        if (window.audioRecording && window.audioRecording.hasAudio()) {
            const audioData = window.audioRecording.getCurrentAudio();
            if (audioData.transcription) {
                this.addTranscriptionToContent(audioData.transcription);
                this.updateAIStatus('✅ Live transcription already available!');
                return;
            }
        }
        
        // Fallback to old transcription method
        if (!this.currentAudio) {
            this.showAIMessage('Please record audio first before transcribing it.');
            return;
        }
        
        this.isAIProcessing = true;
        this.updateAIStatus('🎤 Transcribing audio...');
        
        try {
            const aiServices = window.improvedAIServices || window.aiServices;
            if (!aiServices) {
                throw new Error('AI services not available');
            }
            
            const transcription = await aiServices.transcribeAudio(this.currentAudio);
            this.addTranscriptionToContent(transcription);
            this.updateAIStatus('✅ Audio transcription complete!');
            
        } catch (error) {
            console.error('Audio transcription failed:', error);
            this.updateAIStatus('❌ Audio transcription failed.');
        } finally {
            this.isAIProcessing = false;
        }
    }
    
    async generateEntryWithAI() {
        if (this.isAIProcessing) return;
        
        // Get AI services
        const aiServices = window.improvedAIServices || window.aiServices;
        if (!aiServices) {
            this.showAIMessage('AI services are not available. Please check your connection.');
            return;
        }
        
        this.isAIProcessing = true;
        this.updateAIStatus('✨ Generating comprehensive journal entry...');
        
        try {
            // Get current content
            const userInput = document.getElementById('entry-content')?.value || '';
            
            // Get photo analysis
            let photoAnalysis = this.lastAnalysis;
            if (!photoAnalysis && this.currentPhotos.length > 0) {
                this.updateAIStatus('🔍 Analyzing photos...');
                photoAnalysis = await aiServices.analyzePhoto(this.currentPhotos[0].dataUrl);
                this.lastAnalysis = photoAnalysis;
            }
            
            // Get audio transcription from enhanced audio system
            let audioTranscription = '';
            let audioData = null;
            
            if (window.audioRecording && window.audioRecording.hasAudio()) {
                this.updateAIStatus('🎤 Processing audio transcription...');
                audioData = window.audioRecording.getCurrentAudio();
                audioTranscription = audioData.transcription || '';
                this.currentAudio = audioData.blob;
            } else if (this.currentAudio) {
                // Fallback for old audio system
                this.updateAIStatus('🎤 Transcribing audio...');
                audioTranscription = await aiServices.transcribeAudio(this.currentAudio);
            }
            
            // Get location data
            let locationData = null;
            if (window.locationServices) {
                this.updateAIStatus('📍 Getting location context...');
                try {
                    locationData = await window.locationServices.getJournalLocationData();
                } catch (error) {
                    console.warn('⚠️ Could not get location data:', error);
                }
            }
            
            this.updateAIStatus('🤖 Generating enhanced journal entry...');
            
            // Generate journal entry with all available data
            const generated = await aiServices.generateJournalEntry(
                photoAnalysis,
                audioTranscription,
                userInput,
                locationData
            );
            
            console.log('✨ Generated content:', generated);
            
            // Apply generated content
            this.applyGeneratedContent(generated);
            
            // Update status with detailed results
            const features = [];
            if (photoAnalysis && !photoAnalysis.fallback) features.push('📷 Photo AI');
            if (audioTranscription) features.push('🎤 Audio Transcription');
            if (locationData?.location) features.push('📍 Location');
            if (locationData?.weather) features.push('🌤️ Weather');
            
            const statusMessage = features.length > 0 
                ? `✅ Journal entry generated with ${features.join(', ')}!`
                : '✅ Basic journal entry generated!';
                
            this.updateAIStatus(statusMessage);
            
        } catch (error) {
            console.error('Entry generation failed:', error);
            this.updateAIStatus('❌ Entry generation failed. Please check your AI settings.');
        } finally {
            this.isAIProcessing = false;
        }
    }
    
    async generateContentWithAI() {
        if (this.isAIProcessing) return;
        
        this.isAIProcessing = true;
        this.showAIMessage('Generating content based on your photos and audio...');
        
        try {
            const aiServices = window.aiServices;
            if (!aiServices) {
                throw new Error('AI services not available');
            }
            
            const userInput = document.getElementById('entry-content').value;
            const generated = await aiServices.generateJournalEntry(
                this.lastAnalysis,
                this.currentAudio ? 'Audio content captured' : '',
                userInput
            );
            
            const contentTextarea = document.getElementById('entry-content');
            if (contentTextarea) {
                contentTextarea.value = generated.content;
                this.triggerAutoSave();
            }
            
            this.showAIMessage('Content generated successfully!');
            
        } catch (error) {
            console.error('Content generation failed:', error);
            this.showAIMessage('Content generation failed. Please try again.');
        } finally {
            this.isAIProcessing = false;
        }
    }
    
    async detectMoodWithAI() {
        if (this.isAIProcessing) return;
        
        this.isAIProcessing = true;
        this.showAIMessage('Detecting mood from your content...');
        
        try {
            const aiServices = window.aiServices;
            if (!aiServices) {
                throw new Error('AI services not available');
            }
            
            const userInput = document.getElementById('entry-content').value;
            const mood = aiServices.detectMood(this.lastAnalysis, '', userInput);
            
            if (mood) {
                this.selectMood(mood);
                this.showAIMessage(`Mood detected: ${mood}`);
            } else {
                this.showAIMessage('Could not detect mood. Please select manually.');
            }
            
        } catch (error) {
            console.error('Mood detection failed:', error);
            this.showAIMessage('Mood detection failed. Please try again.');
        } finally {
            this.isAIProcessing = false;
        }
    }
    
    async generateTagsWithAI() {
        if (this.isAIProcessing) return;
        
        this.isAIProcessing = true;
        this.showAIMessage('Generating tags...');
        
        try {
            const aiServices = window.aiServices;
            if (!aiServices) {
                throw new Error('AI services not available');
            }
            
            const userInput = document.getElementById('entry-content').value;
            const tags = aiServices.generateTags(this.lastAnalysis, '', userInput);
            
            this.showSuggestedTags(tags);
            this.showAIMessage('Tags generated! Click on suggestions to add them.');
            
        } catch (error) {
            console.error('Tag generation failed:', error);
            this.showAIMessage('Tag generation failed. Please try again.');
        } finally {
            this.isAIProcessing = false;
        }
    }
    
    async toggleLiveSpeechRecognition() {
        const aiServices = window.aiServices;
        if (!aiServices || !aiServices.speechRecognition) {
            this.showAIMessage('Speech recognition is not available on this device.');
            return;
        }
        
        const transcriptionDiv = document.getElementById('speech-transcription');
        const transcriptionText = document.getElementById('transcription-text');
        const stopBtn = document.getElementById('stop-speech');
        
        if (aiServices.isListening) {
            // Stop listening
            aiServices.stopLiveSpeechRecognition();
            transcriptionDiv.classList.add('hidden');
            return;
        }
        
        // Start listening
        transcriptionDiv.classList.remove('hidden');
        transcriptionText.textContent = 'Listening...';
        
        // Set up real-time updates
        aiServices.onSpeechUpdate = (final, interim) => {
            transcriptionText.innerHTML = final + '<span class="transcription-interim">' + interim + '</span>';
        };
        
        // Stop button handler
        stopBtn.onclick = () => {
            aiServices.stopLiveSpeechRecognition();
        };
        
        try {
            const result = await aiServices.startLiveSpeechRecognition();
            
            // Add transcription to content
            const contentTextarea = document.getElementById('entry-content');
            if (contentTextarea && result.trim()) {
                const existingContent = contentTextarea.value;
                const newContent = existingContent ? 
                    `${existingContent}\n\n${result}` : 
                    result;
                contentTextarea.value = newContent;
                this.triggerAutoSave();
            }
            
            transcriptionDiv.classList.add('hidden');
            
        } catch (error) {
            console.error('Speech recognition failed:', error);
            transcriptionDiv.classList.add('hidden');
            this.showAIMessage('Speech recognition failed: ' + error.message);
        }
    }
    
    // ===== AI Helper Methods =====
    updateAIStatus(message) {
        const statusDiv = document.getElementById('ai-status');
        if (statusDiv) {
            statusDiv.textContent = message;
        }
    }
    
    showAIMessage(message) {
        const resultsDiv = document.getElementById('ai-results');
        if (resultsDiv) {
            resultsDiv.textContent = message;
            resultsDiv.classList.remove('hidden');
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                resultsDiv.classList.add('hidden');
            }, 3000);
        }
    }
    
    displayPhotoAnalysis(analysis) {
        const analysisDiv = document.getElementById('photo-analysis');
        if (!analysisDiv) return;
        
        let html = `
            <h4>Photo Analysis</h4>
            <p><strong>Description:</strong> ${analysis.description}</p>
        `;
        
        if (analysis.detailedDescription && analysis.detailedDescription !== analysis.description) {
            html += `<p><strong>Details:</strong> ${analysis.detailedDescription}</p>`;
        }
        
        if (analysis.objects && analysis.objects.length > 0) {
            const objects = analysis.objects.map(obj => obj.name || obj).slice(0, 5);
            html += `<p><strong>Objects:</strong> ${objects.join(', ')}</p>`;
        }
        
        if (analysis.tags && analysis.tags.length > 0) {
            html += `<div class="ai-tags">`;
            analysis.tags.slice(0, 8).forEach(tag => {
                html += `<span class="ai-tag">${tag}</span>`;
            });
            html += `</div>`;
        }
        
        analysisDiv.innerHTML = html;
        analysisDiv.classList.remove('hidden');
    }
    
    applyGeneratedContent(generated) {
        // Apply title if generated
        if (generated.title) {
            const titleInput = document.getElementById('entry-title');
            if (titleInput && !titleInput.value.trim()) {
                titleInput.value = generated.title;
            }
        }
        
        // Apply content
        const contentTextarea = document.getElementById('entry-content');
        if (contentTextarea) {
            // Don't overwrite if user has already written content
            if (!contentTextarea.value.trim()) {
                contentTextarea.value = generated.content;
            } else {
                // Append to existing content
                contentTextarea.value += '\n\n' + generated.content;
            }
        }
        
        // Apply suggested mood
        if (generated.suggestedMood) {
            this.selectMood(generated.suggestedMood);
        }
        
        // Apply suggested tags
        if (generated.suggestedTags && generated.suggestedTags.length > 0) {
            this.showSuggestedTags(generated.suggestedTags);
        }
        
        // Trigger auto-save
        this.triggerAutoSave();
    }
    
    showSuggestedTags(tags) {
        const suggestedTagsDiv = document.getElementById('suggested-tags');
        if (!suggestedTagsDiv) return;
        
        suggestedTagsDiv.innerHTML = '';
        tags.forEach(tag => {
            const tagBtn = document.createElement('button');
            tagBtn.className = 'suggested-tag';
            tagBtn.textContent = tag;
            tagBtn.onclick = () => this.addTagToEntry(tag, tagBtn);
            suggestedTagsDiv.appendChild(tagBtn);
        });
        
        suggestedTagsDiv.classList.remove('hidden');
    }
    
    addTagToEntry(tag, tagBtn) {
        const tagsInput = document.getElementById('entry-tags');
        if (!tagsInput) return;
        
        const currentTags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t);
        
        if (!currentTags.includes(tag)) {
            currentTags.push(tag);
            tagsInput.value = currentTags.join(', ');
            tagBtn.classList.add('selected');
            this.triggerAutoSave();
        }
    }
    
    applyAITagsToEntry(tags) {
        const tagsInput = document.getElementById('entry-tags');
        if (!tagsInput || !tags) return;
        
        const currentTags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t);
        const newTags = tags.filter(tag => !currentTags.includes(tag));
        
        if (newTags.length > 0) {
            const allTags = [...currentTags, ...newTags.slice(0, 5)];
            tagsInput.value = allTags.join(', ');
            this.triggerAutoSave();
        }
    }
    
    selectMood(mood) {
        const moodBtns = document.querySelectorAll('.mood-btn');
        moodBtns.forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.mood === mood) {
                btn.classList.add('selected');
            }
        });
    }
    
    // ===== Draft Management =====
    loadDraft() {
        try {
            const saved = localStorage.getItem('journal_draft');
            if (saved) {
                const draft = JSON.parse(saved);
                
                // Restore form data
                const titleInput = document.getElementById('entry-title');
                const contentInput = document.getElementById('entry-content');
                const tagsInput = document.getElementById('entry-tags');
                
                if (titleInput && draft.title) {
                    titleInput.value = draft.title;
                }
                
                if (contentInput && draft.content) {
                    contentInput.value = draft.content;
                }
                
                if (tagsInput && draft.tags) {
                    tagsInput.value = draft.tags.join(', ');
                }
                
                // Restore photos
                if (draft.photos && draft.photos.length > 0) {
                    this.currentPhotos = draft.photos;
                    this.renderPhotoPreview();
                }
                
                // Restore mood
                if (draft.mood) {
                    this.selectMood(draft.mood);
                }
                
                // Restore analysis
                if (draft.aiAnalysis) {
                    this.lastAnalysis = draft.aiAnalysis;
                    this.displayPhotoAnalysis(draft.aiAnalysis);
                }
                
                console.log('📄 Draft restored successfully');
            }
        } catch (error) {
            console.error('Failed to load draft:', error);
            // Clean up corrupted draft
            localStorage.removeItem('journal_draft');
        }
    }

    // ===== Auto-Save Integration =====
    triggerAutoSave() {
        if (this.enhancedStorageReady) {
            this.autoSaveToEnhancedStorage();
        } else {
            this.autoSaveToLocalStorage();
        }
    }
    
    // Enhanced Auto-Save =====
    async autoSave() {
        if (this.enhancedStorageReady) {
            return this.autoSaveToEnhancedStorage();
        } else {
            return this.autoSaveToLocalStorage(); // Fallback
        }
    }

    async autoSaveToEnhancedStorage() {
        if (!window.enhancedStorage) {
            return this.autoSave(); // Fallback to localStorage
        }
        
        try {
            const entryData = this.collectEntryData();
            
            // Create a lightweight draft (compress photos more aggressively)
            const draftData = {
                title: entryData.title,
                content: entryData.content,
                tags: entryData.tags,
                mood: entryData.mood,
                photos: await this.compressPhotosForDraft(entryData.photos),
                audio: entryData.audio ? {
                    transcription: entryData.audio.transcription || '',
                    hasAudio: true
                } : null,
                location: entryData.location,
                lastSaved: new Date().toISOString(),
                version: '2.0'
            };
            
            await window.enhancedStorage.storeDraft(draftData);
            this.showAutoSaveStatus('Draft saved to enhanced storage');
            
        } catch (error) {
            if (error.message.includes('quota')) {
                console.warn('Storage quota exceeded, using minimal draft');
                
                // Try saving without photos
                const minimalDraft = {
                    title: entryData.title,
                    content: entryData.content,
                    tags: entryData.tags,
                    mood: entryData.mood,
                    photos: [],
                    photoCount: entryData.photos.length,
                    audio: entryData.audio ? { hasAudio: true } : null,
                    lastSaved: new Date().toISOString(),
                    version: '2.0'
                };
                
                await window.enhancedStorage.storeDraft(minimalDraft);
                this.showAutoSaveStatus('Draft saved (text only)', false);
            } else {
                console.error('Auto-save to enhanced storage failed:', error);
                this.showAutoSaveStatus('Auto-save failed', true);
            }
        }
    }

    async autoSaveToLocalStorage() {
        // This is the old auto-save method as fallback
        try {
            // Update storage indicator before attempting save
            this.updateStorageIndicator();
            
            const entryData = this.collectEntryData();
            
            // Create a lightweight version for auto-save
            const lightweightData = {
                title: entryData.title,
                content: entryData.content,
                tags: entryData.tags,
                mood: entryData.mood,
                photos: await this.compressPhotosForStorage(entryData.photos),
                audio: entryData.audio ? {
                    transcription: entryData.audio.transcription || '',
                    hasAudio: true
                } : null,
                location: entryData.location,
                lastSaved: new Date().toISOString(),
                version: '2.1'
            };
            
            // Check storage quota before saving
            const dataSize = this.getDataSize(lightweightData);
            const availableSpace = this.getAvailableStorageSpace();
            
            if (dataSize > availableSpace) {
                // Try to save without photos if too large
                const minimalData = {
                    title: entryData.title,
                    content: entryData.content,
                    tags: entryData.tags,
                    mood: entryData.mood,
                    photos: [], // Remove photos from draft
                    photoCount: entryData.photos.length,
                    audio: lightweightData.audio,
                    location: entryData.location,
                    lastSaved: new Date().toISOString(),
                    version: '2.1'
                };
                
                if (this.getDataSize(minimalData) <= availableSpace) {
                    localStorage.setItem('journal_draft', JSON.stringify(minimalData));
                    this.showAutoSaveStatus('Draft saved (text only)', false);
                } else {
                    // Clear old drafts and try again
                    this.clearOldDrafts();
                    if (this.getDataSize(minimalData) <= this.getAvailableStorageSpace()) {
                        localStorage.setItem('journal_draft', JSON.stringify(minimalData));
                        this.showAutoSaveStatus('Draft saved (minimal)', false);
                    } else {
                        this.showAutoSaveStatus('Storage full - draft disabled', true);
                    }
                }
            } else {
                localStorage.setItem('journal_draft', JSON.stringify(lightweightData));
                this.showAutoSaveStatus('Draft saved');
            }
            
            // Update storage indicator after save
            this.updateStorageIndicator();
            
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                this.handleQuotaExceeded();
            } else {
                console.error('Auto-save failed:', error);
                this.showAutoSaveStatus('Save failed', true);
            }
        }
    }

    // Enhanced photo compression
    async compressPhotosForStorage(photos) {
        const compressedPhotos = [];
        
        for (const photo of photos) {
            try {
                const compressed = await this.compressImageForStorage(photo.dataUrl, 400, 0.7);
                compressedPhotos.push({
                    ...photo,
                    dataUrl: compressed,
                    compressed: true
                });
            } catch (error) {
                console.warn('Photo compression failed:', error);
                // Use original if compression fails
                compressedPhotos.push(photo);
            }
        }
        
        return compressedPhotos;
    }

    // Fixed image compression function
    compressImageForStorage(dataUrl, maxWidth = 400, quality = 0.7) {
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                img.onload = () => {
                    try {
                        // Calculate new dimensions
                        let { width, height } = img;
                        if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                        }
                        
                        // Draw and compress
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                        resolve(compressedDataUrl);
                    } catch (error) {
                        reject(error);
                    }
                };
                
                img.onerror = () => {
                    reject(new Error('Image load failed'));
                };
                
                img.src = dataUrl;
            } catch (error) {
                reject(error);
            }
        });
    }

    // Storage quota management
    getDataSize(data) {
        try {
            return new Blob([JSON.stringify(data)]).size;
        } catch (error) {
            // Fallback estimation
            return JSON.stringify(data).length * 2; // UTF-16 characters
        }
    }

    getAvailableStorageSpace() {
        try {
            // Test with a small item
            const testKey = 'storage_test_' + Date.now();
            const testData = 'x'.repeat(1024); // 1KB test
            
            let available = 0;
            let size = 1024;
            
            // Binary search for available space
            while (size < 10 * 1024 * 1024) { // Max 10MB
                try {
                    localStorage.setItem(testKey, 'x'.repeat(size));
                    localStorage.removeItem(testKey);
                    available = size;
                    size *= 2;
                } catch (e) {
                    break;
                }
            }
            
            return available;
        } catch (error) {
            return 1024 * 1024; // Default 1MB
        }
    }

    handleQuotaExceeded() {
        console.warn('Storage quota exceeded, cleaning up...');
        
        // Try to clear old drafts and entries
        this.clearOldDrafts();
        
        // Show user-friendly message
        this.showAutoSaveStatus('Storage full - drafts disabled', true);
        
        // Offer cleanup options
        this.showStorageCleanupDialog();
    }

    clearOldDrafts() {
        try {
            // Remove old draft
            localStorage.removeItem('journal_draft');
            
            // If we have many entries, consider removing the oldest ones
            const entries = JSON.parse(localStorage.getItem('journal_entries') || '[]');
            if (entries.length > 100) {
                // Keep only the 50 most recent entries
                const recentEntries = entries.slice(0, 50);
                localStorage.setItem('journal_entries', JSON.stringify(recentEntries));
                console.log('Cleaned up old journal entries');
            }
        } catch (error) {
            console.error('Failed to clean up old drafts:', error);
        }
    }

    showStorageCleanupDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'storage-cleanup-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay">
                <div class="dialog-content">
                    <h3>Storage Full</h3>
                    <p>Your device storage is full. Auto-save has been disabled to prevent errors.</p>
                    <div class="dialog-actions">
                        <button onclick="journalManager.cleanupStorage()">Clean Up Storage</button>
                        <button onclick="journalManager.closeStorageDialog()">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
        `;
        
        document.body.appendChild(dialog);
        
        // Auto-close after 10 seconds
        setTimeout(() => {
            this.closeStorageDialog();
        }, 10000);
    }

    cleanupStorage() {
        try {
            // Clear all drafts
            localStorage.removeItem('journal_draft');
            
            // Keep only recent entries
            const entries = JSON.parse(localStorage.getItem('journal_entries') || '[]');
            const recentEntries = entries.slice(0, 20);
            localStorage.setItem('journal_entries', JSON.stringify(recentEntries));
            
            this.entries = recentEntries;
            this.renderEntries();
            
            this.showAutoSaveStatus('Storage cleaned up');
            this.closeStorageDialog();
        } catch (error) {
            console.error('Storage cleanup failed:', error);
            this.showAutoSaveStatus('Cleanup failed', true);
        }
    }

    closeStorageDialog() {
        const dialog = document.querySelector('.storage-cleanup-dialog');
        if (dialog) {
            dialog.remove();
        }
    }

    showAutoSaveStatus(message, isError = false) {
        let statusElement = document.getElementById('autosave-status');
        
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'autosave-status';
            statusElement.style.cssText = `
                position: fixed;
                top: 70px;
                right: 20px;
                background: ${isError ? '#fee' : '#efe'};
                color: ${isError ? '#c33' : '#363'};
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 0.8rem;
                z-index: 1000;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(statusElement);
        }
        
        statusElement.textContent = message;
        statusElement.style.opacity = '1';
        
        setTimeout(() => {
            statusElement.style.opacity = '0';
        }, 2000);
    }
    
    // Storage monitoring system
    initializeStorageMonitoring() {
        // Enhanced storage monitoring
        if (this.enhancedStorageReady) {
            this.setupEnhancedStorageMonitoring();
        } else {
            // Fallback to basic monitoring
            this.storageCheckInterval = setInterval(() => {
                this.updateStorageIndicator();
            }, 30000);
            
            this.updateStorageIndicator();
        }
    }

    updateStorageIndicator() {
        const indicator = document.getElementById('storage-indicator');
        const storageText = document.getElementById('storage-text');
        
        if (!indicator || !storageText) return;
        
        try {
            const used = this.getStorageUsage();
            const available = this.getAvailableStorageSpace();
            const total = used + available;
            const usagePercent = (used / total) * 100;
            
            // Update indicator text
            const usedMB = (used / (1024 * 1024)).toFixed(1);
            const totalMB = (total / (1024 * 1024)).toFixed(1);
            
            storageText.textContent = `Storage: ${usedMB}MB / ${totalMB}MB`;
            
            // Update indicator style based on usage
            indicator.className = 'storage-indicator';
            if (usagePercent > 90) {
                indicator.classList.add('critical');
            } else if (usagePercent > 75) {
                indicator.classList.add('warning');
            }
            
            // Show/hide based on usage
            if (usagePercent > 50) {
                indicator.style.display = 'block';
            } else {
                indicator.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Storage monitoring failed:', error);
            if (storageText) {
                storageText.textContent = 'Storage: Unknown';
            }
        }
    }

    getStorageUsage() {
        let totalSize = 0;
        
        try {
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length;
                }
            }
        } catch (error) {
            console.error('Failed to calculate storage usage:', error);
        }
        
        return totalSize * 2; // UTF-16 characters
    }
    
    // ===== Event Handlers =====
    bindEvents() {
        // Navigation
        document.getElementById('cancel-create')?.addEventListener('click', () => {
            this.cancelCreate();
        });
        
        document.getElementById('save-entry')?.addEventListener('click', () => {
            this.saveEntry();
        });
        
        // Form inputs
        document.getElementById('entry-title')?.addEventListener('input', () => {
            this.triggerAutoSave();
        });
        
        document.getElementById('entry-content')?.addEventListener('input', () => {
            this.triggerAutoSave();
        });
        
        document.getElementById('entry-tags')?.addEventListener('input', () => {
            this.triggerAutoSave();
        });
        
        // Mood selection
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.triggerAutoSave();
            });
        });
        
        // Photo management
        document.getElementById('take-photo')?.addEventListener('click', () => {
            this.takePhoto();
        });
        
        document.getElementById('select-photo')?.addEventListener('click', () => {
            this.selectPhoto();
        });
        
        // Audio recording
        document.getElementById('record-btn')?.addEventListener('click', () => {
            this.toggleRecording();
        });
        
        // Search
        document.getElementById('search-input')?.addEventListener('input', (e) => {
            this.searchEntries(e.target.value);
        });
        
        // View switching
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.switchView(btn.dataset.view);
            });
        });
        
        // Settings
        document.getElementById('settings-back')?.addEventListener('click', () => {
            this.showView('timeline');
        });
        
        // Load saved AI settings
        this.loadAISettings();
    }
    
    loadAISettings() {
        const aiServices = window.aiServices;
        if (!aiServices) return;
        
        const settings = aiServices.getSettings();
        
        // Update toggles
        const autoGenerateToggle = document.getElementById('auto-generate-toggle');
        const speechRecognitionToggle = document.getElementById('speech-recognition-toggle');
        
        if (autoGenerateToggle) {
            autoGenerateToggle.checked = settings.autoGenerateEntries;
        }
        
        if (speechRecognitionToggle) {
            speechRecognitionToggle.checked = settings.speechRecognitionEnabled;
        }
    }
    
    setupAutoSave() {
        // Set up auto-save for the current entry
        const entryInputs = ['entry-title', 'entry-content', 'entry-tags'];
        entryInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => {
                    this.triggerAutoSave();
                });
            }
        });
    }
    
    // ===== Core Journal Methods =====
    loadEntries() {
        try {
            const saved = localStorage.getItem('journal_entries');
            if (saved) {
                this.entries = JSON.parse(saved);
                this.renderEntries();
            }
        } catch (error) {
            console.error('Failed to load entries:', error);
        }
    }
    
    saveEntry() {
        if (this.enhancedStorageReady) {
            return this.saveEntryToEnhancedStorage();
        } else {
            return this.saveToLocalStorage(); // Fallback
        }
    }
    
    collectEntryData() {
        const title = document.getElementById('entry-title').value.trim();
        const content = document.getElementById('entry-content').value.trim();
        const tags = document.getElementById('entry-tags')?.value.split(',').map(t => t.trim()).filter(t => t) || [];
        const selectedMood = document.querySelector('.mood-option.selected')?.dataset.mood;
        
        // Get enhanced audio data
        let audioData = null;
        if (window.audioRecording && window.audioRecording.hasAudio()) {
            audioData = window.audioRecording.getCurrentAudio();
        } else if (this.currentAudio) {
            audioData = {
                blob: this.currentAudio,
                transcription: ''
            };
        }
        
        // Get location data
        let locationData = null;
        if (window.locationServices) {
            locationData = window.locationServices.getLocationData();
        }
        
        return {
            title: title || 'Untitled Entry',
            content,
            tags,
            mood: selectedMood,
            photos: [...this.currentPhotos],
            audio: audioData,
            location: locationData,
            aiAnalysis: this.lastAnalysis,
            timestamp: new Date()
        };
    }
    
    saveToLocalStorage(entryData = null) {
        try {
            // Always save all entries (parameter is not used correctly)
            const dataToSave = JSON.stringify(this.entries);
            const dataSize = this.getDataSize(this.entries);
            const availableSpace = this.getAvailableStorageSpace();
            
            if (dataSize > availableSpace) {
                // Try to compress images in entries before saving
                const compressedEntries = this.entries.map(entry => ({
                    ...entry,
                    photos: entry.photos ? entry.photos.map(photo => ({
                        ...photo,
                        dataUrl: photo.compressed ? photo.dataUrl : photo.dataUrl.substring(0, 50000) // Truncate if not compressed
                    })) : []
                }));
                
                try {
                    localStorage.setItem('journal_entries', JSON.stringify(compressedEntries));
                    console.log('⚠️ Saved entries with compressed images due to storage constraints');
                } catch (error) {
                    if (error.name === 'QuotaExceededError') {
                        this.handleQuotaExceeded();
                        throw error;
                    }
                }
            } else {
                localStorage.setItem('journal_entries', dataToSave);
            }
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('Storage quota exceeded while saving entries');
                this.handleQuotaExceeded();
            } else {
                console.error('Failed to save to localStorage:', error);
            }
            throw error;
        }
    }
    
    renderEntries() {
        const container = document.getElementById('entries-container');
        const emptyState = document.getElementById('empty-state');
        
        if (this.entries.length === 0) {
            emptyState.style.display = 'block';
            container.innerHTML = '';
            return;
        }
        
        emptyState.style.display = 'none';
        container.innerHTML = '';
        
        this.entries.forEach(entry => {
            const entryElement = this.createEntryElement(entry);
            container.appendChild(entryElement);
        });
    }
    
    createEntryElement(entry) {
        const article = document.createElement('article');
        article.className = 'entry-card';
        article.onclick = () => this.showEntryDetail(entry);
        
        const date = new Date(entry.createdAt).toLocaleDateString();
        const mood = entry.mood ? this.getMoodEmoji(entry.mood) : '';
        
        let html = `
            <header class="entry-header">
                <h3 class="entry-title">${entry.title}</h3>
                <div class="entry-date">${date}${mood}</div>
            </header>
        `;
        
        if (entry.photos && entry.photos.length > 0) {
            html += `
                <div class="entry-media">
                    <img src="${entry.photos[0].dataUrl}" alt="Entry photo" class="entry-photo">
                </div>
            `;
        }
        
        html += `
            <div class="entry-content">
                ${entry.content ? `<p class="entry-text">${entry.content}</p>` : ''}
                ${entry.audio ? '<div class="entry-audio-indicator">🎵 Audio Recording</div>' : ''}
                ${entry.tags.length > 0 ? `
                    <div class="entry-tags">
                        ${entry.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        article.innerHTML = html;
        return article;
    }
    
    getMoodEmoji(mood) {
        const moodEmojis = {
            happy: '😊',
            sad: '😢',
            excited: '🤩',
            calm: '😌',
            anxious: '😰',
            grateful: '🙏'
        };
        return moodEmojis[mood] || '';
    }
    
    showEntryDetail(entry) {
        this.currentEntry = entry;
        // Implementation for showing entry detail
        console.log('Showing entry detail:', entry);
    }
    
    // ===== Photo Management =====
    takePhoto() {
        window.cameraService?.openCamera((photoData) => {
            this.addPhoto(photoData);
        });
    }
    
    selectPhoto() {
        const input = document.getElementById('file-input');
        if (input) {
            input.click();
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.addPhoto({ dataUrl: e.target.result, type: file.type });
                    };
                    reader.readAsDataURL(file);
                }
            };
        }
    }
    
    // Enhanced photo addition with better AI integration
    async addPhoto(photoData) {
        try {
            // Compress image for storage
            const compressedDataUrl = await this.compressImageForStorage(photoData.dataUrl, 400, 0.7);
            
            const optimizedPhoto = {
                ...photoData,
                dataUrl: compressedDataUrl,
                originalSize: photoData.dataUrl.length,
                compressedSize: compressedDataUrl.length,
                compressed: true
            };
            
            this.currentPhotos.push(optimizedPhoto);
            this.renderPhotoPreview();
            
            console.log('📷 Photo added successfully, triggering AI analysis...');
            
            // Auto-analyze if enabled
            const aiServices = window.improvedAIServices || window.aiServices;
            if (aiServices) {
                const settings = aiServices.getSettings();
                if (settings && settings.autoGenerateEntries) {
                    console.log('🤖 Auto-generation enabled, analyzing photo...');
                    setTimeout(() => {
                        this.analyzePhotosWithAI();
                    }, 1000);
                } else {
                    console.log('🤖 Auto-generation disabled');
                }
            } else {
                console.warn('⚠️ AI services not available for auto-analysis');
            }
            
            // Delayed auto-save to avoid quota issues
            setTimeout(() => {
                this.triggerAutoSave();
            }, 1500);
            
        } catch (error) {
            console.error('Failed to add photo:', error);
            this.showAutoSaveStatus('Photo add failed', true);
            
            // Try to add without compression as fallback
            try {
                const fallbackPhoto = {
                    ...photoData,
                    originalSize: photoData.dataUrl.length,
                    compressedSize: photoData.dataUrl.length,
                    compressed: false
                };
                
                this.currentPhotos.push(fallbackPhoto);
                this.renderPhotoPreview();
                this.showAutoSaveStatus('Photo added (uncompressed)', false);
            } catch (fallbackError) {
                console.error('Failed to add photo even without compression:', fallbackError);
                alert('Failed to add photo. Your device may be low on storage.');
            }
        }
    }
    
    renderPhotoPreview() {
        const preview = document.getElementById('photo-preview');
        if (!preview) return;
        
        preview.innerHTML = '';
        this.currentPhotos.forEach((photo, index) => {
            const photoDiv = document.createElement('div');
            photoDiv.className = 'photo-item';
            photoDiv.innerHTML = `
                <img src="${photo.dataUrl}" alt="Photo ${index + 1}">
                <button class="photo-remove" onclick="journalManager.removePhoto(${index})">×</button>
            `;
            preview.appendChild(photoDiv);
        });
    }
    
    removePhoto(index) {
        this.currentPhotos.splice(index, 1);
        this.renderPhotoPreview();
        this.triggerAutoSave();
    }
    
    // ===== Audio Recording =====
    toggleRecording() {
        if (window.audioRecorder) {
            if (window.audioRecorder.isRecording) {
                window.audioRecorder.stopRecording();
            } else {
                window.audioRecorder.startRecording();
            }
        }
    }
    
    setAudioData(audioBlob) {
        this.currentAudio = audioBlob;
        this.renderAudioPreview();
        this.triggerAutoSave();
    }
    
    renderAudioPreview() {
        const preview = document.getElementById('audio-preview');
        if (!preview || !this.currentAudio) return;
        
        const audioUrl = URL.createObjectURL(this.currentAudio);
        preview.innerHTML = `
            <button class="audio-play-btn" onclick="journalManager.playAudio('${audioUrl}')">▶</button>
            <div class="audio-info">
                <div class="audio-duration">Audio Recording</div>
                <div class="audio-waveform">
                    <div class="audio-progress"></div>
                </div>
            </div>
        `;
    }
    
    playAudio(audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play();
    }
    
    // ===== Utility Methods =====
    showView(viewName) {
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
        }
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === viewName) {
                btn.classList.add('active');
            }
        });
    }
    
    resetForm() {
        // Use optional chaining and null checking for DOM elements
        const titleInput = document.getElementById('entry-title');
        const contentInput = document.getElementById('entry-content');
        const tagsInput = document.getElementById('entry-tags');
        const audioPreview = document.getElementById('audio-preview');
        const photoAnalysis = document.getElementById('photo-analysis');
        const suggestedTags = document.getElementById('suggested-tags');
        
        if (titleInput) titleInput.value = '';
        if (contentInput) contentInput.value = '';
        if (tagsInput) tagsInput.value = '';
        
        // Clear mood selection
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Reset internal state
        this.currentPhotos = [];
        this.currentAudio = null;
        this.lastAnalysis = null;
        this.isEditing = false;
        this.currentEntry = null;
        
        // Clear UI elements
        this.renderPhotoPreview();
        if (audioPreview) audioPreview.innerHTML = '';
        if (photoAnalysis) photoAnalysis.classList.add('hidden');
        if (suggestedTags) suggestedTags.classList.add('hidden');
        
        // Clear draft from enhanced storage or localStorage
        try {
            if (this.enhancedStorageReady && window.enhancedStorage) {
                window.enhancedStorage.clearDraft();
            } else {
                localStorage.removeItem('journal_draft');
            }
        } catch (error) {
            console.warn('Failed to clear draft:', error);
        }
    }
    
    cancelCreate() {
        this.resetForm();
        this.showView('timeline');
    }
    
    searchEntries(query) {
        if (!query) {
            this.renderEntries();
            return;
        }
        
        const filtered = this.entries.filter(entry => 
            entry.title.toLowerCase().includes(query.toLowerCase()) ||
            entry.content.toLowerCase().includes(query.toLowerCase()) ||
            entry.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
        
        this.renderFilteredEntries(filtered);
    }
    
    renderFilteredEntries(entries) {
        const container = document.getElementById('entries-container');
        container.innerHTML = '';
        
        entries.forEach(entry => {
            const entryElement = this.createEntryElement(entry);
            container.appendChild(entryElement);
        });
    }
    
    switchView(viewType) {
        const container = document.getElementById('entries-container');
        if (viewType === 'grid') {
            container.classList.add('grid-view');
        } else {
            container.classList.remove('grid-view');
        }
    }

    // ===== Enhanced Storage Integration =====
    async loadEntriesFromEnhancedStorage() {
        if (!window.enhancedStorage) {
            console.warn('Enhanced storage not available');
            return this.loadEntries(); // Fallback
        }
        
        try {
            console.log('📖 Loading entries from enhanced storage...');
            this.entries = await window.enhancedStorage.getAllEntries();
            this.renderEntries();
            console.log(`✅ Loaded ${this.entries.length} entries from enhanced storage`);
        } catch (error) {
            console.error('Failed to load entries from enhanced storage:', error);
            // Fallback to localStorage
            this.loadEntries();
        }
    }

    async loadDraftFromEnhancedStorage() {
        if (!window.enhancedStorage) {
            return this.loadDraft(); // Fallback
        }
        
        try {
            const draft = await window.enhancedStorage.getDraft();
            if (draft) {
                this.restoreDraft(draft);
                console.log('📄 Draft restored from enhanced storage');
            }
        } catch (error) {
            console.error('Failed to load draft from enhanced storage:', error);
            // Fallback to localStorage
            this.loadDraft();
        }
    }

    restoreDraft(draft) {
        try {
            // Restore form data
            const titleInput = document.getElementById('entry-title');
            const contentInput = document.getElementById('entry-content');
            const tagsInput = document.getElementById('entry-tags');
            
            if (titleInput && draft.title) {
                titleInput.value = draft.title;
            }
            
            if (contentInput && draft.content) {
                contentInput.value = draft.content;
            }
            
            if (tagsInput && draft.tags) {
                tagsInput.value = Array.isArray(draft.tags) ? draft.tags.join(', ') : draft.tags;
            }
            
            // Restore photos
            if (draft.photos && draft.photos.length > 0) {
                this.currentPhotos = draft.photos;
                this.renderPhotoPreview();
            }
            
            // Restore mood
            if (draft.mood) {
                this.selectMood(draft.mood);
            }
            
            // Restore analysis
            if (draft.aiAnalysis) {
                this.lastAnalysis = draft.aiAnalysis;
                this.displayPhotoAnalysis(draft.aiAnalysis);
            }
            
        } catch (error) {
            console.error('Failed to restore draft:', error);
        }
    }

    // ===== Enhanced Storage Integration Methods =====
    async saveEntryToEnhancedStorage() {
        if (!window.enhancedStorage) {
            console.warn('Enhanced storage not available, using localStorage fallback');
            return this.saveToLocalStorage();
        }
        
        try {
            const entryData = this.collectEntryData();
            
            if (!entryData.title && !entryData.content && entryData.photos.length === 0 && !entryData.audio) {
                alert('Please add some content to your entry.');
                return;
            }
            
            if (this.isEditing && this.currentEntry) {
                // Update existing entry
                entryData.id = this.currentEntry.id;
                entryData.updatedAt = new Date().toISOString();
            } else {
                // Create new entry
                entryData.id = Date.now().toString();
                entryData.createdAt = new Date().toISOString();
            }
            
            // Store in enhanced storage
            await window.enhancedStorage.storeEntry(entryData);
            
            // Reload entries
            await this.loadEntriesFromEnhancedStorage();
            
            this.showView('timeline');
            this.resetForm();
            
            console.log('✅ Entry saved to enhanced storage successfully');
            
        } catch (error) {
            console.error('❌ Failed to save entry to enhanced storage:', error);
            
            // Show user-friendly error
            if (error.message.includes('quota')) {
                alert('Storage space is full. Please free up space or try compressing your photos.');
            } else {
                alert('Failed to save entry. Please try again.');
            }
        }
    }

    // Enhanced Auto-Save =====
    async autoSaveToEnhancedStorage() {
        if (!window.enhancedStorage) {
            return this.autoSave(); // Fallback to localStorage
        }
        
        try {
            const entryData = this.collectEntryData();
            
            // Create a lightweight draft (compress photos more aggressively)
            const draftData = {
                title: entryData.title,
                content: entryData.content,
                tags: entryData.tags,
                mood: entryData.mood,
                photos: await this.compressPhotosForDraft(entryData.photos),
                audio: entryData.audio ? {
                    transcription: entryData.audio.transcription || '',
                    hasAudio: true
                } : null,
                location: entryData.location,
                lastSaved: new Date().toISOString(),
                version: '2.0'
            };
            
            await window.enhancedStorage.storeDraft(draftData);
            this.showAutoSaveStatus('Draft saved to enhanced storage');
            
        } catch (error) {
            if (error.message.includes('quota')) {
                console.warn('Storage quota exceeded, using minimal draft');
                
                // Try saving without photos
                const minimalDraft = {
                    title: entryData.title,
                    content: entryData.content,
                    tags: entryData.tags,
                    mood: entryData.mood,
                    photos: [],
                    photoCount: entryData.photos.length,
                    audio: entryData.audio ? { hasAudio: true } : null,
                    lastSaved: new Date().toISOString(),
                    version: '2.0'
                };
                
                await window.enhancedStorage.storeDraft(minimalDraft);
                this.showAutoSaveStatus('Draft saved (text only)', false);
            } else {
                console.error('Auto-save to enhanced storage failed:', error);
                this.showAutoSaveStatus('Auto-save failed', true);
            }
        }
    }

    async compressPhotosForDraft(photos) {
        const compressedPhotos = [];
        
        for (const photo of photos) {
            try {
                // More aggressive compression for drafts
                const compressed = await this.compressImageForStorage(photo.dataUrl, 200, 0.5);
                compressedPhotos.push({
                    ...photo,
                    dataUrl: compressed,
                    draftCompressed: true
                });
            } catch (error) {
                console.warn('Draft photo compression failed:', error);
                // Skip photo if compression fails
            }
        }
        
        return compressedPhotos;
    }

    // ===== Storage Monitoring Integration =====
    initializeStorageMonitoring() {
        // Enhanced storage monitoring
        if (this.enhancedStorageReady) {
            this.setupEnhancedStorageMonitoring();
        } else {
            // Fallback to basic monitoring
            this.storageCheckInterval = setInterval(() => {
                this.updateStorageIndicator();
            }, 30000);
            
            this.updateStorageIndicator();
        }
    }

    setupEnhancedStorageMonitoring() {
        // Listen for storage events from enhanced storage
        document.addEventListener('storageQuotaUpdate', (event) => {
            this.updateEnhancedStorageIndicator(event.detail);
        });
        
        document.addEventListener('storageWarning', (event) => {
            this.handleStorageWarning(event.detail);
        });
        
        document.addEventListener('storageQuotaExceeded', (event) => {
            this.handleEnhancedQuotaExceeded(event.detail);
        });
        
        // Initial status update
        this.updateEnhancedStorageStatus();
    }

    async updateEnhancedStorageStatus() {
        if (!window.enhancedStorage) return;
        
        try {
            const stats = await window.enhancedStorage.getStorageStats();
            if (stats) {
                this.updateEnhancedStorageIndicator(stats);
            }
        } catch (error) {
            console.error('Failed to get enhanced storage stats:', error);
        }
    }

    updateEnhancedStorageIndicator(stats) {
        const indicator = document.getElementById('storage-indicator');
        const storageText = document.getElementById('storage-text');
        
        if (!indicator || !storageText) return;
        
        const usedMB = (stats.usage / (1024 * 1024)).toFixed(1);
        const totalMB = (stats.quota / (1024 * 1024)).toFixed(1);
        
        storageText.textContent = `Storage: ${usedMB}MB / ${totalMB}MB (${stats.entriesCount} entries)`;
        
        // Update indicator style
        indicator.className = 'storage-indicator';
        if (stats.level === 'critical') {
            indicator.classList.add('critical');
        } else if (stats.level === 'warning') {
            indicator.classList.add('warning');
        }
        
        // Show/hide based on usage
        indicator.style.display = stats.usedPercent > 50 ? 'block' : 'none';
    }

    handleStorageWarning(detail) {
        const { level, quota } = detail;
        const usedPercent = Math.round((quota.usage / quota.quota) * 100);
        
        if (level === 'critical') {
            this.showAutoSaveStatus(`Storage ${usedPercent}% full - cleanup recommended`, true);
        } else if (level === 'warning') {
            this.showAutoSaveStatus(`Storage ${usedPercent}% full`, false);
        }
    }

    handleEnhancedQuotaExceeded(detail) {
        const { mediaType, mediaId } = detail;
        console.error(`Storage quota exceeded for ${mediaType}: ${mediaId}`);
        
        this.showAutoSaveStatus('Storage full - media cleanup in progress', true);
        
        // Show cleanup dialog
        this.showEnhancedStorageCleanupDialog();
    }

    showEnhancedStorageCleanupDialog() {
        // Enhanced storage cleanup dialog with more options
        const dialog = document.createElement('div');
        dialog.className = 'storage-cleanup-dialog enhanced';
        dialog.innerHTML = `
            <div class="dialog-overlay">
                <div class="dialog-content">
                    <h3>💾 Enhanced Storage Full</h3>
                    <p>Your device storage is full. Enhanced PWA storage can automatically clean up old media files.</p>
                    <div class="dialog-actions">
                        <button onclick="journalManager.triggerEnhancedCleanup()" style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">🧹 Auto Cleanup</button>
                        <button onclick="journalManager.showStorageStats()" style="background: #95a5a6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">📊 View Stats</button>
                        <button onclick="journalManager.closeStorageDialog()" style="background: #7f8c8d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
        `;
        
        document.body.appendChild(dialog);
    }

    async triggerEnhancedCleanup() {
        if (window.enhancedStorage) {
            try {
                await window.enhancedStorage.cleanupOldMedia();
                this.showAutoSaveStatus('Storage cleanup completed');
                this.closeStorageDialog();
                await this.updateEnhancedStorageStatus();
            } catch (error) {
                console.error('Enhanced cleanup failed:', error);
                this.showAutoSaveStatus('Cleanup failed', true);
            }
        }
    }

    async showStorageStats() {
        if (window.enhancedStorage) {
            try {
                const stats = await window.enhancedStorage.getStorageStats();
                alert(`Storage Statistics:
                
Usage: ${(stats.usage / (1024 * 1024)).toFixed(1)}MB / ${(stats.quota / (1024 * 1024)).toFixed(1)}MB
Entries: ${stats.entriesCount}
Media Files: ${stats.mediaCount}
Usage Level: ${stats.level}
Used: ${stats.usedPercent.toFixed(1)}%`);
            } catch (error) {
                console.error('Failed to get storage stats:', error);
            }
        }
    }
}

// ===== Initialize Journal Manager =====
let journalManager = null;

document.addEventListener('DOMContentLoaded', function() {
    journalManager = new JournalManager();
    window.journalManager = journalManager;
    
    console.log('📱 Journal app initialized');
});

// ===== Global Functions =====
function showCreateEntry() {
    if (journalManager) {
        journalManager.showView('create');
        journalManager.isEditing = false;
    }
}

// Export for other modules
window.JournalManager = JournalManager; 
window.journalManager = journalManager; 