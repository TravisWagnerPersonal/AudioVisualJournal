// ===== Journal Management Module =====
class JournalManager {
    constructor() {
        this.entries = [];
        this.currentEntry = null;
        this.isEditing = false;
        this.autoSaveTimer = null;
        this.currentPhotos = [];
        this.currentAudio = null;
        this.lastAnalysis = null;
        this.isAIProcessing = false;
        
        this.init();
    }
    
    init() {
        this.loadEntries();
        this.bindEvents();
        this.setupAutoSave();
        this.setupAIIntegration();
        console.log('📝 Journal Manager initialized');
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
        
        this.isAIProcessing = true;
        this.updateAIStatus('🔍 Analyzing photos...');
        
        try {
            const aiServices = window.aiServices;
            if (!aiServices) {
                throw new Error('AI services not available');
            }
            
            // Analyze the first photo
            const photo = this.currentPhotos[0];
            const analysis = await aiServices.analyzePhoto(photo.dataUrl);
            
            this.lastAnalysis = analysis;
            this.displayPhotoAnalysis(analysis);
            this.updateAIStatus('✅ Photo analysis complete!');
            
            // Auto-apply insights if enabled
            const settings = aiServices.getSettings();
            if (settings.autoTagging) {
                this.applyAITagsToEntry(analysis.tags);
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
        
        if (!this.currentAudio) {
            this.showAIMessage('Please record audio first before transcribing it.');
            return;
        }
        
        this.isAIProcessing = true;
        this.updateAIStatus('🎤 Transcribing audio...');
        
        try {
            const aiServices = window.aiServices;
            if (!aiServices) {
                throw new Error('AI services not available');
            }
            
            const transcription = await aiServices.transcribeAudio(this.currentAudio);
            
            // Add transcription to the content
            const contentTextarea = document.getElementById('entry-content');
            if (contentTextarea) {
                const existingContent = contentTextarea.value;
                const newContent = existingContent ? 
                    `${existingContent}\n\n🎤 ${transcription}` : 
                    `🎤 ${transcription}`;
                contentTextarea.value = newContent;
                this.triggerAutoSave();
            }
            
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
        
        this.isAIProcessing = true;
        this.updateAIStatus('✨ Generating journal entry...');
        
        try {
            const aiServices = window.aiServices;
            if (!aiServices) {
                throw new Error('AI services not available');
            }
            
            // Get current content
            const userInput = document.getElementById('entry-content').value;
            
            // Get photo analysis
            let photoAnalysis = this.lastAnalysis;
            if (!photoAnalysis && this.currentPhotos.length > 0) {
                photoAnalysis = await aiServices.analyzePhoto(this.currentPhotos[0].dataUrl);
            }
            
            // Get audio transcription
            let audioTranscription = '';
            if (this.currentAudio) {
                audioTranscription = await aiServices.transcribeAudio(this.currentAudio);
            }
            
            // Generate journal entry
            const generated = await aiServices.generateJournalEntry(
                photoAnalysis,
                audioTranscription,
                userInput
            );
            
            // Apply generated content
            this.applyGeneratedContent(generated);
            this.updateAIStatus('✅ Journal entry generated!');
            
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
        // Apply content
        const contentTextarea = document.getElementById('entry-content');
        if (contentTextarea) {
            contentTextarea.value = generated.content;
        }
        
        // Apply suggested tags
        if (generated.suggestedTags && generated.suggestedTags.length > 0) {
            this.showSuggestedTags(generated.suggestedTags);
        }
        
        // Apply suggested mood
        if (generated.suggestedMood) {
            this.selectMood(generated.suggestedMood);
        }
        
        // Auto-save
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
    
    // ===== Auto-Save Integration =====
    triggerAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setTimeout(() => {
            this.autoSave();
        }, 1000);
    }
    
    autoSave() {
        if (!this.isEditing) return;
        
        const entryData = this.collectEntryData();
        if (entryData.title || entryData.content || entryData.photos.length > 0 || entryData.audio) {
            console.log('💾 Auto-saving entry...');
            // Save to localStorage or IndexedDB
            this.saveToLocalStorage(entryData);
        }
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
        const entryData = this.collectEntryData();
        
        if (!entryData.title && !entryData.content && entryData.photos.length === 0 && !entryData.audio) {
            alert('Please add some content to your entry.');
            return;
        }
        
        if (this.isEditing && this.currentEntry) {
            // Update existing entry
            const index = this.entries.findIndex(e => e.id === this.currentEntry.id);
            if (index !== -1) {
                this.entries[index] = { ...this.currentEntry, ...entryData, updatedAt: new Date().toISOString() };
            }
        } else {
            // Create new entry
            const newEntry = {
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                ...entryData
            };
            this.entries.unshift(newEntry);
        }
        
        this.saveToLocalStorage();
        this.renderEntries();
        this.showView('timeline');
        this.resetForm();
        
        console.log('✅ Entry saved successfully');
    }
    
    collectEntryData() {
        const title = document.getElementById('entry-title').value.trim();
        const content = document.getElementById('entry-content').value.trim();
        const tags = document.getElementById('entry-tags').value.split(',').map(t => t.trim()).filter(t => t);
        const selectedMood = document.querySelector('.mood-btn.selected')?.dataset.mood;
        
        return {
            title: title || 'Untitled Entry',
            content,
            tags,
            mood: selectedMood,
            photos: [...this.currentPhotos],
            audio: this.currentAudio,
            aiAnalysis: this.lastAnalysis
        };
    }
    
    saveToLocalStorage(entryData = null) {
        try {
            if (entryData) {
                // Save draft/auto-save
                localStorage.setItem('journal_draft', JSON.stringify(entryData));
            } else {
                // Save all entries
                localStorage.setItem('journal_entries', JSON.stringify(this.entries));
            }
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
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
    
    addPhoto(photoData) {
        this.currentPhotos.push(photoData);
        this.renderPhotoPreview();
        this.triggerAutoSave();
        
        // Auto-analyze if enabled
        const aiServices = window.aiServices;
        if (aiServices && aiServices.getSettings().autoGenerateEntries) {
            this.analyzePhotosWithAI();
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
        document.getElementById('entry-title').value = '';
        document.getElementById('entry-content').value = '';
        document.getElementById('entry-tags').value = '';
        
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        this.currentPhotos = [];
        this.currentAudio = null;
        this.lastAnalysis = null;
        this.isEditing = false;
        this.currentEntry = null;
        
        this.renderPhotoPreview();
        document.getElementById('audio-preview').innerHTML = '';
        document.getElementById('photo-analysis').classList.add('hidden');
        document.getElementById('suggested-tags').classList.add('hidden');
        
        // Clear draft
        localStorage.removeItem('journal_draft');
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