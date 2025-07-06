// ===== Journal Management Module =====
class JournalManager {
    constructor() {
        this.currentEntry = null;
        this.isEditing = false;
        this.isDirty = false; // Track unsaved changes
        this.autosaveTimer = null;
        this.autosaveDelay = 30000; // 30 seconds
        
        this.init();
    }
    
    init() {
        console.log('📔 Journal manager initialized');
        this.setupAutosave();
        this.setupFormValidation();
        this.setupKeyboardShortcuts();
    }
    
    // ===== Entry Creation & Editing =====
    async createNewEntry() {
        try {
            console.log('📝 Creating new journal entry...');
            
            // Clear any existing data
            this.clearCurrentEntry();
            
            // Reset form
            this.resetEntryForm();
            
            // Clear media
            if (window.cameraManager) {
                window.cameraManager.clearPhotos();
            }
            
            if (window.audioRecorder) {
                window.audioRecorder.deleteRecording();
            }
            
            // Set up new entry
            this.currentEntry = {
                id: this.generateId(),
                title: '',
                content: '',
                mood: null,
                tags: [],
                photoIds: [],
                audioId: null,
                location: null,
                weather: null,
                dateCreated: new Date().toISOString(),
                dateModified: new Date().toISOString()
            };
            
            this.isEditing = false;
            this.isDirty = false;
            
            // Update UI
            this.updateCreateFormTitle('New Entry');
            
        } catch (error) {
            console.error('Failed to create new entry:', error);
            this.showError('Failed to create new entry.');
        }
    }
    
    async loadEntryForEditing(entryId) {
        try {
            console.log('✏️ Loading entry for editing:', entryId);
            
            // Load entry from database
            const entry = await getEntry(entryId);
            if (!entry) {
                throw new Error('Entry not found');
            }
            
            this.currentEntry = { ...entry };
            this.isEditing = true;
            this.isDirty = false;
            
            // Populate form
            await this.populateEntryForm(entry);
            
            // Update UI
            this.updateCreateFormTitle('Edit Entry');
            
            console.log('✅ Entry loaded for editing');
            
        } catch (error) {
            console.error('Failed to load entry for editing:', error);
            this.showError('Failed to load entry for editing.');
        }
    }
    
    async populateEntryForm(entry) {
        try {
            // Populate text fields
            const titleInput = document.getElementById('entry-title');
            const contentTextarea = document.getElementById('entry-content');
            const tagsInput = document.getElementById('entry-tags');
            
            if (titleInput) titleInput.value = entry.title || '';
            if (contentTextarea) contentTextarea.value = entry.content || '';
            if (tagsInput) tagsInput.value = entry.tags ? entry.tags.join(', ') : '';
            
            // Set mood
            this.setMoodSelection(entry.mood);
            
            // Load photos
            if (entry.photoIds && entry.photoIds.length > 0 && window.cameraManager) {
                await window.cameraManager.loadPhotosFromDatabase(entry.photoIds);
            }
            
            // Load audio
            if (entry.audioId && window.audioRecorder) {
                await window.audioRecorder.loadAudioFromDatabase(entry.audioId);
            }
            
        } catch (error) {
            console.error('Failed to populate entry form:', error);
        }
    }
    
    async saveCurrentEntry() {
        try {
            console.log('💾 Saving current entry...');
            
            if (!this.currentEntry) {
                throw new Error('No current entry to save');
            }
            
            // Validate entry
            const validation = this.validateEntry();
            if (!validation.isValid) {
                this.showError(validation.message);
                return false;
            }
            
            // Update entry from form
            await this.updateEntryFromForm();
            
            // Save media files
            await this.saveMediaFiles();
            
            // Save entry to database
            await saveEntry(this.currentEntry);
            
            // Update global entries list
            await loadAllEntries();
            
            // Mark as saved
            this.isDirty = false;
            
            // Show success message
            this.showSuccess(this.isEditing ? 'Entry updated!' : 'Entry saved!');
            
            console.log('✅ Entry saved successfully:', this.currentEntry.id);
            return true;
            
        } catch (error) {
            console.error('Failed to save entry:', error);
            this.showError('Failed to save entry. Please try again.');
            return false;
        }
    }
    
    async updateEntryFromForm() {
        try {
            // Get form values
            const titleInput = document.getElementById('entry-title');
            const contentTextarea = document.getElementById('entry-content');
            const tagsInput = document.getElementById('entry-tags');
            const selectedMood = document.querySelector('.mood-btn.selected');
            
            // Update entry object
            this.currentEntry.title = titleInput ? titleInput.value.trim() : '';
            this.currentEntry.content = contentTextarea ? contentTextarea.value.trim() : '';
            this.currentEntry.mood = selectedMood ? selectedMood.dataset.mood : null;
            this.currentEntry.tags = tagsInput && tagsInput.value.trim() 
                ? tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                : [];
            
            // Update timestamp
            this.currentEntry.dateModified = new Date().toISOString();
            
            // Add location if available
            await this.addLocationData();
            
        } catch (error) {
            console.error('Failed to update entry from form:', error);
            throw error;
        }
    }
    
    async saveMediaFiles() {
        try {
            // Save photos
            if (window.cameraManager) {
                const photos = window.cameraManager.getPhotos();
                if (photos.length > 0) {
                    this.currentEntry.photoIds = await window.cameraManager.savePhotosToDatabase();
                    
                    // Generate thumbnail for first photo
                    if (photos[0]) {
                        this.currentEntry.photoPreview = photos[0].dataUrl;
                    }
                }
            }
            
            // Save audio
            if (window.audioRecorder) {
                const recording = window.audioRecorder.getCurrentRecording();
                if (recording && recording.blob) {
                    this.currentEntry.audioId = await window.audioRecorder.saveAudioToDatabase();
                }
            }
            
        } catch (error) {
            console.error('Failed to save media files:', error);
            throw error;
        }
    }
    
    async deleteEntry(entryId) {
        try {
            if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
                return false;
            }
            
            console.log('🗑️ Deleting entry:', entryId);
            
            // Delete from database
            await deleteEntry(entryId);
            
            // Update global entries list
            await loadAllEntries();
            
            // Show success message
            this.showSuccess('Entry deleted successfully.');
            
            console.log('✅ Entry deleted');
            return true;
            
        } catch (error) {
            console.error('Failed to delete entry:', error);
            this.showError('Failed to delete entry.');
            return false;
        }
    }
    
    // ===== Entry Validation =====
    validateEntry() {
        if (!this.currentEntry) {
            return { isValid: false, message: 'No entry data found.' };
        }
        
        const hasTitle = this.currentEntry.title && this.currentEntry.title.trim();
        const hasContent = this.currentEntry.content && this.currentEntry.content.trim();
        const hasPhotos = this.currentEntry.photoIds && this.currentEntry.photoIds.length > 0;
        const hasAudio = this.currentEntry.audioId;
        
        if (!hasTitle && !hasContent && !hasPhotos && !hasAudio) {
            return { 
                isValid: false, 
                message: 'Please add a title, content, photo, or audio recording to your entry.' 
            };
        }
        
        // Validate title length
        if (hasTitle && this.currentEntry.title.length > 100) {
            return { 
                isValid: false, 
                message: 'Title must be 100 characters or less.' 
            };
        }
        
        // Validate content length
        if (hasContent && this.currentEntry.content.length > 10000) {
            return { 
                isValid: false, 
                message: 'Content must be 10,000 characters or less.' 
            };
        }
        
        // Validate tags
        if (this.currentEntry.tags && this.currentEntry.tags.length > 20) {
            return { 
                isValid: false, 
                message: 'Maximum 20 tags allowed.' 
            };
        }
        
        return { isValid: true };
    }
    
    // ===== UI Helpers =====
    resetEntryForm() {
        const titleInput = document.getElementById('entry-title');
        const contentTextarea = document.getElementById('entry-content');
        const tagsInput = document.getElementById('entry-tags');
        
        if (titleInput) titleInput.value = '';
        if (contentTextarea) contentTextarea.value = '';
        if (tagsInput) tagsInput.value = '';
        
        // Clear mood selection
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Clear media previews
        const photoPreview = document.getElementById('photo-preview');
        const audioPreview = document.getElementById('audio-preview');
        
        if (photoPreview) photoPreview.innerHTML = '';
        if (audioPreview) audioPreview.innerHTML = '';
    }
    
    setMoodSelection(mood) {
        // Clear all selections
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Set selected mood
        if (mood) {
            const moodBtn = document.querySelector(`[data-mood="${mood}"]`);
            if (moodBtn) {
                moodBtn.classList.add('selected');
            }
        }
    }
    
    updateCreateFormTitle(title) {
        const titleElement = document.getElementById('create-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }
    
    clearCurrentEntry() {
        this.currentEntry = null;
        this.isEditing = false;
        this.isDirty = false;
        this.clearAutosave();
    }
    
    // ===== Autosave Functionality =====
    setupAutosave() {
        // Listen for form changes
        document.addEventListener('input', (e) => {
            if (e.target.matches('#entry-title, #entry-content, #entry-tags')) {
                this.markDirty();
                this.scheduleAutosave();
            }
        });
        
        // Listen for mood changes
        document.addEventListener('click', (e) => {
            if (e.target.matches('.mood-btn')) {
                this.markDirty();
                this.scheduleAutosave();
            }
        });
        
        console.log('💾 Autosave setup complete');
    }
    
    scheduleAutosave() {
        this.clearAutosave();
        
        this.autosaveTimer = setTimeout(() => {
            if (this.isDirty && this.currentEntry) {
                this.performAutosave();
            }
        }, this.autosaveDelay);
    }
    
    async performAutosave() {
        try {
            console.log('💾 Performing autosave...');
            
            if (!this.currentEntry) return;
            
            // Update entry from form
            await this.updateEntryFromForm();
            
            // Save to localStorage as draft
            this.saveDraft();
            
            console.log('✅ Autosave completed');
            
        } catch (error) {
            console.error('Autosave failed:', error);
        }
    }
    
    clearAutosave() {
        if (this.autosaveTimer) {
            clearTimeout(this.autosaveTimer);
            this.autosaveTimer = null;
        }
    }
    
    markDirty() {
        this.isDirty = true;
    }
    
    // ===== Draft Management =====
    saveDraft() {
        try {
            if (this.currentEntry) {
                localStorage.setItem('journal_draft', JSON.stringify(this.currentEntry));
                console.log('💾 Draft saved');
            }
        } catch (error) {
            console.error('Failed to save draft:', error);
        }
    }
    
    loadDraft() {
        try {
            const draftJson = localStorage.getItem('journal_draft');
            if (draftJson) {
                const draft = JSON.parse(draftJson);
                console.log('📄 Draft loaded');
                return draft;
            }
        } catch (error) {
            console.error('Failed to load draft:', error);
        }
        return null;
    }
    
    clearDraft() {
        try {
            localStorage.removeItem('journal_draft');
            console.log('🧹 Draft cleared');
        } catch (error) {
            console.error('Failed to clear draft:', error);
        }
    }
    
    // ===== Location & Context =====
    async addLocationData() {
        try {
            if ('geolocation' in navigator) {
                const position = await this.getCurrentPosition();
                
                this.currentEntry.location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toISOString()
                };
                
                console.log('📍 Location added to entry');
            }
        } catch (error) {
            console.log('📍 Location not available:', error.message);
            // Don't throw error - location is optional
        }
    }
    
    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }
    
    // ===== Form Validation Setup =====
    setupFormValidation() {
        // Real-time validation
        const titleInput = document.getElementById('entry-title');
        const contentTextarea = document.getElementById('entry-content');
        
        if (titleInput) {
            titleInput.addEventListener('input', () => {
                this.validateTitleInput(titleInput);
            });
        }
        
        if (contentTextarea) {
            contentTextarea.addEventListener('input', () => {
                this.validateContentInput(contentTextarea);
            });
        }
    }
    
    validateTitleInput(input) {
        const maxLength = 100;
        const currentLength = input.value.length;
        
        if (currentLength > maxLength) {
            input.value = input.value.substring(0, maxLength);
        }
        
        // Could add visual indicator of character count
    }
    
    validateContentInput(textarea) {
        const maxLength = 10000;
        const currentLength = textarea.value.length;
        
        if (currentLength > maxLength) {
            textarea.value = textarea.value.substring(0, maxLength);
        }
        
        // Could add visual indicator of character count
    }
    
    // ===== Keyboard Shortcuts =====
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (this.currentEntry) {
                    this.saveCurrentEntry();
                }
            }
            
            // Escape to cancel
            if (e.key === 'Escape') {
                const createView = document.getElementById('create-view');
                if (createView && createView.classList.contains('active')) {
                    this.handleCancelEdit();
                }
            }
        });
    }
    
    async handleCancelEdit() {
        if (this.isDirty) {
            const confirmed = confirm('You have unsaved changes. Are you sure you want to cancel?');
            if (!confirmed) {
                return;
            }
        }
        
        this.clearCurrentEntry();
        this.clearDraft();
        
        // Navigate back to timeline
        if (window.navigateToView) {
            window.navigateToView('timeline');
        }
    }
    
    // ===== Utility Methods =====
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    showSuccess(message) {
        console.log('✅ Success:', message);
        // TODO: Implement toast notification
    }
    
    showError(message) {
        console.error('❌ Error:', message);
        // TODO: Implement toast notification
        alert(message);
    }
    
    // ===== Export Methods =====
    async exportEntry(entryId, format = 'json') {
        try {
            const entry = await getEntry(entryId);
            if (!entry) {
                throw new Error('Entry not found');
            }
            
            let exportData;
            let filename;
            let mimeType;
            
            switch (format) {
                case 'json':
                    exportData = JSON.stringify(entry, null, 2);
                    filename = `journal-entry-${entry.id}.json`;
                    mimeType = 'application/json';
                    break;
                    
                case 'txt':
                    exportData = this.entryToText(entry);
                    filename = `journal-entry-${entry.id}.txt`;
                    mimeType = 'text/plain';
                    break;
                    
                default:
                    throw new Error('Unsupported export format');
            }
            
            // Create download
            const blob = new Blob([exportData], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            console.log('📤 Entry exported:', filename);
            
        } catch (error) {
            console.error('Failed to export entry:', error);
            this.showError('Failed to export entry.');
        }
    }
    
    entryToText(entry) {
        const date = new Date(entry.dateCreated).toLocaleDateString();
        const mood = entry.mood ? ` (${entry.mood})` : '';
        
        let text = `${entry.title || 'Untitled Entry'}${mood}\n`;
        text += `${date}\n`;
        text += '='.repeat(50) + '\n\n';
        
        if (entry.content) {
            text += entry.content + '\n\n';
        }
        
        if (entry.tags && entry.tags.length > 0) {
            text += `Tags: ${entry.tags.join(', ')}\n`;
        }
        
        if (entry.photoIds && entry.photoIds.length > 0) {
            text += `Photos: ${entry.photoIds.length} attached\n`;
        }
        
        if (entry.audioId) {
            text += 'Audio recording attached\n';
        }
        
        return text;
    }
}

// ===== Initialize Journal System =====
let journalManager = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    journalManager = new JournalManager();
    console.log('📔 Journal system initialized');
    
    // Setup global handlers
    setupGlobalJournalHandlers();
});

function setupGlobalJournalHandlers() {
    // Save button handler
    const saveBtn = document.getElementById('save-entry');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            if (journalManager && journalManager.currentEntry) {
                const saved = await journalManager.saveCurrentEntry();
                if (saved && window.navigateToView) {
                    window.navigateToView('timeline');
                }
            }
        });
    }
    
    // Cancel button handler
    const cancelBtn = document.getElementById('cancel-create');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (journalManager) {
                journalManager.handleCancelEdit();
            }
        });
    }
    
    // Edit button handler
    const editBtn = document.getElementById('edit-entry');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            if (journalManager && journalManager.currentEntry) {
                window.showEditEntry(journalManager.currentEntry);
            }
        });
    }
}

// ===== Global Functions =====
window.createNewJournalEntry = function() {
    if (journalManager) {
        journalManager.createNewEntry();
    }
};

window.editJournalEntry = function(entryId) {
    if (journalManager) {
        journalManager.loadEntryForEditing(entryId);
    }
};

window.deleteJournalEntry = function(entryId) {
    if (journalManager) {
        return journalManager.deleteEntry(entryId);
    }
    return false;
};

window.exportJournalEntry = function(entryId, format = 'json') {
    if (journalManager) {
        journalManager.exportEntry(entryId, format);
    }
};

// Export for use in other modules
window.journalManager = journalManager; 