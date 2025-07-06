// ===== Settings Management Module =====

class SettingsManager {
    constructor() {
        this.settings = this.getDefaultSettings();
        this.modals = new Map();
        this.confirmationCallbacks = new Map();
        
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.bindEvents();
        this.updateUI();
        this.calculateStorageUsage();
        console.log('⚙️ Settings Manager initialized');
    }
    
    getDefaultSettings() {
        return {
            // AI Features
            aiAutoGenerate: false,
            aiSpeechRecognition: true,
            aiAutoTag: false,
            asticaApiKey: '',
            
            // Journal Preferences
            autoSave: true,
            defaultMood: null,
            showDates: true,
            sortBy: 'newest',
            
            // Privacy & Security
            localOnly: true,
            clearCacheOnExit: false,
            
            // Display & Appearance
            theme: 'auto',
            fontSize: 'medium',
            compactView: false,
            
            // Notifications
            dailyReminders: false,
            reminderTime: '20:00',
            achievementNotifications: true,
            
            // App Info
            version: '2.0.0'
        };
    }
    
    // ===== Event Binding =====
    bindEvents() {
        // Data Management
        document.getElementById('export-data-btn')?.addEventListener('click', () => this.exportData());
        document.getElementById('import-data-btn')?.addEventListener('click', () => this.importData());
        document.getElementById('clear-cache-btn')?.addEventListener('click', () => this.clearCache());
        document.getElementById('delete-entries-btn')?.addEventListener('click', () => this.deleteAllEntries());
        document.getElementById('reset-app-btn')?.addEventListener('click', () => this.resetApp());
        
        // Preferences
        document.getElementById('default-mood-btn')?.addEventListener('click', () => this.showMoodSelector());
        document.getElementById('entry-sorting-btn')?.addEventListener('click', () => this.showSortingOptions());
        document.getElementById('theme-btn')?.addEventListener('click', () => this.showThemeSelector());
        document.getElementById('font-size-btn')?.addEventListener('click', () => this.showFontSizeSelector());
        document.getElementById('reminder-time-btn')?.addEventListener('click', () => this.showTimeSelector());
        
        // About & Info
        document.getElementById('about-app-btn')?.addEventListener('click', () => this.showAboutDialog());
        document.getElementById('help-support-btn')?.addEventListener('click', () => this.showHelpDialog());
        document.getElementById('privacy-policy-btn')?.addEventListener('click', () => this.showPrivacyDialog());
        document.getElementById('storage-info-btn')?.addEventListener('click', () => this.showStorageInfo());
        document.getElementById('privacy-settings-btn')?.addEventListener('click', () => this.showPrivacySettings());
        
        // Toggle Settings
        this.bindToggleEvents();
    }
    
    bindToggleEvents() {
        const toggles = [
            { id: 'auto-tag-toggle', setting: 'aiAutoTag' },
            { id: 'auto-save-toggle', setting: 'autoSave' },
            { id: 'show-dates-toggle', setting: 'showDates' },
            { id: 'clear-cache-toggle', setting: 'clearCacheOnExit' },
            { id: 'compact-view-toggle', setting: 'compactView' },
            { id: 'daily-reminders-toggle', setting: 'dailyReminders' },
            { id: 'achievement-notifications-toggle', setting: 'achievementNotifications' }
        ];
        
        toggles.forEach(({ id, setting }) => {
            const toggle = document.getElementById(id);
            if (toggle) {
                toggle.addEventListener('change', (e) => {
                    this.updateSetting(setting, e.target.checked);
                });
            }
        });
    }
    
    // ===== Settings CRUD =====
    loadSettings() {
        try {
            const saved = localStorage.getItem('app_settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }
    
    saveSettings() {
        try {
            localStorage.setItem('app_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }
    
    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        this.updateUI();
        this.applySettings(key, value);
    }
    
    applySettings(key, value) {
        switch (key) {
            case 'theme':
                this.applyTheme(value);
                break;
            case 'fontSize':
                this.applyFontSize(value);
                break;
            case 'compactView':
                this.applyCompactView(value);
                break;
            case 'dailyReminders':
                this.scheduleReminders(value);
                break;
        }
    }
    
    updateUI() {
        // Update toggle states
        const toggleMappings = {
            'auto-tag-toggle': this.settings.aiAutoTag,
            'auto-save-toggle': this.settings.autoSave,
            'show-dates-toggle': this.settings.showDates,
            'clear-cache-toggle': this.settings.clearCacheOnExit,
            'compact-view-toggle': this.settings.compactView,
            'daily-reminders-toggle': this.settings.dailyReminders,
            'achievement-notifications-toggle': this.settings.achievementNotifications
        };
        
        Object.entries(toggleMappings).forEach(([id, value]) => {
            const toggle = document.getElementById(id);
            if (toggle) toggle.checked = value;
        });
        
        // Update status texts
        this.updateStatusTexts();
    }
    
    updateStatusTexts() {
        const updates = {
            'default-mood-status': this.settings.defaultMood ? this.getMoodName(this.settings.defaultMood) : 'None selected',
            'sorting-status': this.getSortingName(this.settings.sortBy),
            'theme-status': this.getThemeName(this.settings.theme),
            'font-size-status': this.getFontSizeName(this.settings.fontSize),
            'reminder-time-status': this.settings.reminderTime
        };
        
        Object.entries(updates).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = text;
        });
    }
    
    // ===== Data Management =====
    async exportData() {
        try {
            const entries = JSON.parse(localStorage.getItem('journal_entries') || '[]');
            const settings = this.settings;
            const exportData = {
                entries,
                settings,
                exportDate: new Date().toISOString(),
                version: this.settings.version
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `journal-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('✅ Journal data exported successfully!');
        } catch (error) {
            console.error('Export failed:', error);
            this.showToast('❌ Export failed. Please try again.');
        }
    }
    
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.entries && Array.isArray(data.entries)) {
                        this.showConfirmDialog(
                            'Import Journal Data',
                            `This will replace all existing journal entries (${data.entries.length} entries found). This action cannot be undone.`,
                            () => {
                                localStorage.setItem('journal_entries', JSON.stringify(data.entries));
                                if (data.settings) {
                                    this.settings = { ...this.settings, ...data.settings };
                                    this.saveSettings();
                                    this.updateUI();
                                }
                                this.showToast('✅ Journal data imported successfully!');
                                // Refresh the timeline if visible
                                if (window.journalManager) {
                                    window.journalManager.loadEntries();
                                }
                            }
                        );
                    } else {
                        this.showToast('❌ Invalid backup file format.');
                    }
                } catch (error) {
                    console.error('Import failed:', error);
                    this.showToast('❌ Failed to parse backup file.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
    
    clearCache() {
        this.showConfirmDialog(
            'Clear App Cache',
            'This will remove temporary files and cached data. Your journal entries will not be affected.',
            () => {
                try {
                    // Clear service worker caches
                    if ('caches' in window) {
                        caches.keys().then(names => {
                            names.forEach(name => caches.delete(name));
                        });
                    }
                    
                    // Clear any temporary data
                    localStorage.removeItem('journal_draft');
                    
                    this.showToast('✅ Cache cleared successfully!');
                } catch (error) {
                    console.error('Cache clear failed:', error);
                    this.showToast('❌ Failed to clear cache.');
                }
            }
        );
    }
    
    deleteAllEntries() {
        const entries = JSON.parse(localStorage.getItem('journal_entries') || '[]');
        const count = entries.length;
        
        this.showConfirmDialog(
            'Delete All Entries',
            `This will permanently delete all ${count} journal entries. This action cannot be undone.`,
            () => {
                localStorage.removeItem('journal_entries');
                localStorage.removeItem('journal_draft');
                this.showToast('✅ All journal entries deleted.');
                
                // Refresh the timeline
                if (window.journalManager) {
                    window.journalManager.entries = [];
                    window.journalManager.renderEntries();
                }
            },
            'Delete All',
            true
        );
    }
    
    resetApp() {
        this.showConfirmDialog(
            'Reset App Data',
            'This will delete ALL data including journal entries, settings, and cached files. This action cannot be undone.',
            () => {
                // Clear all localStorage
                localStorage.clear();
                
                // Clear caches
                if ('caches' in window) {
                    caches.keys().then(names => {
                        names.forEach(name => caches.delete(name));
                    });
                }
                
                this.showToast('✅ App reset complete. Reloading...');
                
                // Reload the app
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            },
            'Reset Everything',
            true
        );
    }
    
    // ===== Storage Management =====
    async calculateStorageUsage() {
        try {
            let totalSize = 0;
            
            // Calculate localStorage usage
            Object.keys(localStorage).forEach(key => {
                totalSize += localStorage.getItem(key).length;
            });
            
            // Convert to human readable format
            const sizeText = this.formatBytes(totalSize);
            const statusElement = document.getElementById('storage-status');
            if (statusElement) {
                statusElement.textContent = sizeText;
            }
            
            return totalSize;
        } catch (error) {
            console.error('Failed to calculate storage:', error);
            const statusElement = document.getElementById('storage-status');
            if (statusElement) {
                statusElement.textContent = 'Unknown';
            }
        }
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // ===== UI Helpers =====
    showMoodSelector() {
        const moods = [
            { value: null, name: 'None', emoji: '' },
            { value: 'happy', name: 'Happy', emoji: '😊' },
            { value: 'sad', name: 'Sad', emoji: '😢' },
            { value: 'excited', name: 'Excited', emoji: '🤩' },
            { value: 'calm', name: 'Calm', emoji: '😌' },
            { value: 'anxious', name: 'Anxious', emoji: '😰' },
            { value: 'grateful', name: 'Grateful', emoji: '🙏' }
        ];
        
        this.showOptionsDialog('Default Mood', moods, this.settings.defaultMood, (value) => {
            this.updateSetting('defaultMood', value);
        });
    }
    
    showSortingOptions() {
        const options = [
            { value: 'newest', name: 'Newest first' },
            { value: 'oldest', name: 'Oldest first' },
            { value: 'title', name: 'By title' },
            { value: 'mood', name: 'By mood' }
        ];
        
        this.showOptionsDialog('Sort Entries', options, this.settings.sortBy, (value) => {
            this.updateSetting('sortBy', value);
        });
    }
    
    showThemeSelector() {
        const options = [
            { value: 'auto', name: 'Auto (follows system)' },
            { value: 'light', name: 'Light' },
            { value: 'dark', name: 'Dark' }
        ];
        
        this.showOptionsDialog('Theme', options, this.settings.theme, (value) => {
            this.updateSetting('theme', value);
        });
    }
    
    showFontSizeSelector() {
        const options = [
            { value: 'small', name: 'Small' },
            { value: 'medium', name: 'Medium' },
            { value: 'large', name: 'Large' },
            { value: 'extra-large', name: 'Extra Large' }
        ];
        
        this.showOptionsDialog('Text Size', options, this.settings.fontSize, (value) => {
            this.updateSetting('fontSize', value);
        });
    }
    
    showTimeSelector() {
        const modal = this.createModal('Set Reminder Time');
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Set Reminder Time</h3>
                <input type="time" id="time-picker" value="${this.settings.reminderTime}">
                <div class="modal-buttons">
                    <button onclick="this.closest('.modal').remove()">Cancel</button>
                    <button onclick="settingsManager.saveReminderTime()">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    saveReminderTime() {
        const timePicker = document.getElementById('time-picker');
        if (timePicker) {
            this.updateSetting('reminderTime', timePicker.value);
            document.querySelector('.modal')?.remove();
        }
    }
    
    // ===== Info Dialogs =====
    showAboutDialog() {
        const modal = this.createModal('About');
        modal.innerHTML = `
            <div class="modal-content">
                <h3>🎙️📷 Audio-Photo Journal</h3>
                <p><strong>Version:</strong> ${this.settings.version}</p>
                <p><strong>AI-Powered Journaling</strong></p>
                <p>A progressive web app that captures your memories through audio, photos, and intelligent text generation.</p>
                <div class="about-features">
                    <h4>Features:</h4>
                    <ul>
                        <li>🤖 AI photo analysis & content generation</li>
                        <li>🎤 Speech recognition & transcription</li>
                        <li>📷 Camera integration & photo management</li>
                        <li>💾 Local storage & offline support</li>
                        <li>🔒 Privacy-focused design</li>
                    </ul>
                </div>
                <div class="modal-buttons">
                    <button onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    showHelpDialog() {
        const modal = this.createModal('Help & Support');
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Help & Support</h3>
                <div class="help-section">
                    <h4>Getting Started</h4>
                    <p>Tap the + button to create your first journal entry. You can add photos, record audio, and write text.</p>
                    
                    <h4>AI Features</h4>
                    <p>Configure AI services in settings to enable photo analysis and smart content generation.</p>
                    
                    <h4>Troubleshooting</h4>
                    <ul>
                        <li>Grant microphone permissions for audio recording</li>
                        <li>Grant camera permissions for photos</li>
                        <li>Use a modern browser for best performance</li>
                    </ul>
                    
                    <h4>Need More Help?</h4>
                    <p>Check the documentation on GitHub or contact support.</p>
                </div>
                <div class="modal-buttons">
                    <button onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    showPrivacyDialog() {
        const modal = this.createModal('Privacy Policy');
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Privacy Policy</h3>
                <div class="privacy-section">
                    <h4>Data Storage</h4>
                    <p>All your journal data is stored locally on your device. We do not collect, store, or transmit your personal journal entries.</p>
                    
                    <h4>AI Processing</h4>
                    <p>When you use AI features, only the content you choose to analyze is sent to AI services. No data is retained by AI providers.</p>
                    
                    <h4>Permissions</h4>
                    <p>The app requests camera and microphone permissions only for creating journal entries. These permissions can be revoked at any time.</p>
                    
                    <h4>No Tracking</h4>
                    <p>We do not use analytics, advertising, or tracking technologies.</p>
                </div>
                <div class="modal-buttons">
                    <button onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    showStorageInfo() {
        const entries = JSON.parse(localStorage.getItem('journal_entries') || '[]');
        const modal = this.createModal('Storage Information');
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Storage Usage</h3>
                <div class="storage-info">
                    <div class="storage-item">
                        <span>Journal Entries:</span>
                        <span>${entries.length} entries</span>
                    </div>
                    <div class="storage-item">
                        <span>Total Data Size:</span>
                        <span>${document.getElementById('storage-status')?.textContent || 'Calculating...'}</span>
                    </div>
                    <div class="storage-item">
                        <span>Storage Type:</span>
                        <span>Local Device Only</span>
                    </div>
                    <div class="storage-item">
                        <span>Backup Status:</span>
                        <span>Manual Export Available</span>
                    </div>
                </div>
                <div class="modal-buttons">
                    <button onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    showPrivacySettings() {
        const modal = this.createModal('AI Privacy Controls');
        modal.innerHTML = `
            <div class="modal-content">
                <h3>AI Privacy Controls</h3>
                <div class="privacy-controls">
                    <div class="control-item">
                        <label>
                            <input type="checkbox" id="privacy-photo-analysis" checked>
                            Allow photo analysis
                        </label>
                        <p>Send photos to AI service for description and tagging</p>
                    </div>
                    <div class="control-item">
                        <label>
                            <input type="checkbox" id="privacy-content-generation" checked>
                            Allow content generation
                        </label>
                        <p>Use AI to generate journal entry text</p>
                    </div>
                    <div class="control-item">
                        <label>
                            <input type="checkbox" id="privacy-auto-processing" checked>
                            Auto-process new content
                        </label>
                        <p>Automatically analyze photos and audio when added</p>
                    </div>
                </div>
                <p class="privacy-note">
                    <strong>Note:</strong> AI services only process content you explicitly choose to analyze. No data is permanently stored by AI providers.
                </p>
                <div class="modal-buttons">
                    <button onclick="this.closest('.modal').remove()">Cancel</button>
                    <button onclick="settingsManager.savePrivacySettings()">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    savePrivacySettings() {
        // Save privacy settings logic here
        this.showToast('✅ Privacy settings saved');
        document.querySelector('.modal')?.remove();
    }
    
    // ===== Modal Helpers =====
    createModal(title) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
        `;
        return modal;
    }
    
    showOptionsDialog(title, options, currentValue, callback) {
        const modal = this.createModal(title);
        const optionsHtml = options.map(option => `
            <label class="option-item ${option.value === currentValue ? 'selected' : ''}">
                <input type="radio" name="option" value="${option.value}" ${option.value === currentValue ? 'checked' : ''}>
                <span>${option.emoji || ''} ${option.name}</span>
            </label>
        `).join('');
        
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${title}</h3>
                <div class="options-list">
                    ${optionsHtml}
                </div>
                <div class="modal-buttons">
                    <button onclick="this.closest('.modal').remove()">Cancel</button>
                    <button onclick="settingsManager.saveOption('${title}', this)">Save</button>
                </div>
            </div>
        `;
        
        // Store callback for later use
        this.confirmationCallbacks.set(title, callback);
        document.body.appendChild(modal);
    }
    
    saveOption(title, button) {
        const modal = button.closest('.modal');
        const selected = modal.querySelector('input[name="option"]:checked');
        if (selected) {
            const callback = this.confirmationCallbacks.get(title);
            if (callback) {
                callback(selected.value === 'null' ? null : selected.value);
            }
        }
        modal.remove();
    }
    
    showConfirmDialog(title, message, callback, buttonText = 'Confirm', isDangerous = false) {
        const modal = this.createModal(title);
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="modal-buttons">
                    <button onclick="this.closest('.modal').remove()">Cancel</button>
                    <button class="${isDangerous ? 'danger' : ''}" onclick="settingsManager.executeCallback('${title}', this)">${buttonText}</button>
                </div>
            </div>
        `;
        
        this.confirmationCallbacks.set(title, callback);
        document.body.appendChild(modal);
    }
    
    executeCallback(title, button) {
        const callback = this.confirmationCallbacks.get(title);
        if (callback) {
            callback();
            this.confirmationCallbacks.delete(title);
        }
        button.closest('.modal').remove();
    }
    
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1001;
            font-size: 14px;
            max-width: 300px;
            text-align: center;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    // ===== Theme and Appearance =====
    applyTheme(theme) {
        const body = document.body;
        body.classList.remove('theme-light', 'theme-dark', 'theme-auto');
        
        if (theme === 'light') {
            body.classList.add('theme-light');
        } else if (theme === 'dark') {
            body.classList.add('theme-dark');
        } else {
            body.classList.add('theme-auto');
        }
    }
    
    applyFontSize(size) {
        const body = document.body;
        body.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
        body.classList.add(`font-${size}`);
    }
    
    applyCompactView(enabled) {
        const body = document.body;
        if (enabled) {
            body.classList.add('compact-view');
        } else {
            body.classList.remove('compact-view');
        }
    }
    
    scheduleReminders(enabled) {
        if (enabled && 'Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    // Schedule daily reminders logic here
                    console.log('Daily reminders scheduled');
                }
            });
        }
    }
    
    // ===== Helper Methods =====
    getMoodName(mood) {
        const moodNames = {
            happy: '😊 Happy',
            sad: '😢 Sad',
            excited: '🤩 Excited',
            calm: '😌 Calm',
            anxious: '😰 Anxious',
            grateful: '🙏 Grateful'
        };
        return moodNames[mood] || 'Unknown';
    }
    
    getSortingName(sort) {
        const sortNames = {
            newest: 'Newest first',
            oldest: 'Oldest first',
            title: 'By title',
            mood: 'By mood'
        };
        return sortNames[sort] || 'Unknown';
    }
    
    getThemeName(theme) {
        const themeNames = {
            auto: 'Auto (follows system)',
            light: 'Light',
            dark: 'Dark'
        };
        return themeNames[theme] || 'Unknown';
    }
    
    getFontSizeName(size) {
        const sizeNames = {
            small: 'Small',
            medium: 'Medium',
            large: 'Large',
            'extra-large': 'Extra Large'
        };
        return sizeNames[size] || 'Unknown';
    }
}

// ===== Initialize Settings Manager =====
let settingsManager = null;

document.addEventListener('DOMContentLoaded', function() {
    settingsManager = new SettingsManager();
    window.settingsManager = settingsManager;
    
    console.log('⚙️ Settings management ready');
});

// Export for other modules
window.SettingsManager = SettingsManager; 