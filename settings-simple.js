// ===== Simple Settings Module =====
// This is a simplified version that works with the core app

class SimpleSettings {
    constructor() {
        this.settings = this.loadSettings();
        this.initializeSettings();
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('journal-settings');
            return saved ? JSON.parse(saved) : this.getDefaultSettings();
        } catch (error) {
            console.error('Error loading settings:', error);
            return this.getDefaultSettings();
        }
    }
    
    getDefaultSettings() {
        return {
            autoSave: true,
            showDates: true,
            localOnly: true,
            theme: 'auto',
            fontSize: 'medium',
            compactView: false,
            exportFormat: 'json'
        };
    }
    
    saveSettings() {
        try {
            localStorage.setItem('journal-settings', JSON.stringify(this.settings));
            console.log('Settings saved successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }
    
    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        this.applySettings();
    }
    
    applySettings() {
        // Apply theme
        if (this.settings.theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else if (this.settings.theme === 'light') {
            document.body.classList.remove('dark-theme');
        } else {
            // Auto theme - follow system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }
        }
        
        // Apply font size
        document.body.setAttribute('data-font-size', this.settings.fontSize);
        
        // Apply compact view
        if (this.settings.compactView) {
            document.body.classList.add('compact-view');
        } else {
            document.body.classList.remove('compact-view');
        }
    }
    
    initializeSettings() {
        // Apply settings on initialization
        this.applySettings();
        
        // Set up event listeners for settings controls
        this.setupSettingsListeners();
    }
    
    setupSettingsListeners() {
        // Wait for DOM to be ready
        setTimeout(() => {
            // Auto-save toggle
            const autoSaveToggle = document.getElementById('auto-save-toggle');
            if (autoSaveToggle) {
                autoSaveToggle.checked = this.settings.autoSave;
                autoSaveToggle.addEventListener('change', (e) => {
                    this.updateSetting('autoSave', e.target.checked);
                });
            }
            
            // Show dates toggle
            const showDatesToggle = document.getElementById('show-dates-toggle');
            if (showDatesToggle) {
                showDatesToggle.checked = this.settings.showDates;
                showDatesToggle.addEventListener('change', (e) => {
                    this.updateSetting('showDates', e.target.checked);
                });
            }
            
            // Local only toggle
            const localOnlyToggle = document.getElementById('local-only-toggle');
            if (localOnlyToggle) {
                localOnlyToggle.checked = this.settings.localOnly;
                localOnlyToggle.disabled = true; // Keep disabled for now
            }
            
            // Export data button
            const exportBtn = document.getElementById('export-data-btn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => {
                    this.exportData();
                });
            }
            
            // Import data button
            const importBtn = document.getElementById('import-data-btn');
            if (importBtn) {
                importBtn.addEventListener('click', () => {
                    this.importData();
                });
            }
            
            // Clear cache button
            const clearCacheBtn = document.getElementById('clear-cache-btn');
            if (clearCacheBtn) {
                clearCacheBtn.addEventListener('click', () => {
                    this.clearCache();
                });
            }
            
            // Delete entries button
            const deleteEntriesBtn = document.getElementById('delete-entries-btn');
            if (deleteEntriesBtn) {
                deleteEntriesBtn.addEventListener('click', () => {
                    this.deleteAllEntries();
                });
            }
            
            // Reset app button
            const resetAppBtn = document.getElementById('reset-app-btn');
            if (resetAppBtn) {
                resetAppBtn.addEventListener('click', () => {
                    this.resetApp();
                });
            }
            
        }, 1000);
    }
    
    async exportData() {
        try {
            // Get all entries from the database
            const entries = await this.getAllEntries();
            
            const exportData = {
                entries: entries,
                exportDate: new Date().toISOString(),
                version: '1.0',
                type: 'AudioPhotoJournal'
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `journal-export-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showToast('✅ Data exported successfully!');
            
        } catch (error) {
            console.error('Export failed:', error);
            this.showToast('❌ Export failed. Please try again.');
        }
    }
    
    async importData() {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const importData = JSON.parse(e.target.result);
                        
                        if (importData.type !== 'AudioPhotoJournal') {
                            this.showToast('❌ Invalid file format');
                            return;
                        }
                        
                        const confirmImport = confirm(
                            `Import ${importData.entries?.length || 0} entries? This will merge with your existing data.`
                        );
                        
                        if (confirmImport) {
                            await this.importEntries(importData.entries);
                            this.showToast('✅ Data imported successfully!');
                            
                            // Reload the timeline if available
                            if (typeof renderTimeline === 'function') {
                                renderTimeline();
                            }
                        }
                        
                    } catch (error) {
                        console.error('Import failed:', error);
                        this.showToast('❌ Import failed. Invalid file format.');
                    }
                };
                
                reader.readAsText(file);
            };
            
            input.click();
            
        } catch (error) {
            console.error('Import setup failed:', error);
            this.showToast('❌ Import failed. Please try again.');
        }
    }
    
    clearCache() {
        const confirm = window.confirm('Clear app cache? This will remove temporary files but keep your journal entries.');
        
        if (confirm) {
            try {
                // Clear service worker cache
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.unregister();
                    });
                }
                
                // Clear browser cache for this domain
                if ('caches' in window) {
                    caches.keys().then(names => {
                        names.forEach(name => {
                            caches.delete(name);
                        });
                    });
                }
                
                this.showToast('✅ Cache cleared successfully!');
                
            } catch (error) {
                console.error('Cache clear failed:', error);
                this.showToast('❌ Failed to clear cache');
            }
        }
    }
    
    deleteAllEntries() {
        const confirm1 = window.confirm('⚠️ Delete ALL journal entries? This action cannot be undone.');
        
        if (confirm1) {
            const confirm2 = window.confirm('Are you absolutely sure? This will permanently delete all your journal entries.');
            
            if (confirm2) {
                try {
                    // Clear IndexedDB
                    const deleteRequest = indexedDB.deleteDatabase('AudioPhotoJournal');
                    deleteRequest.onsuccess = () => {
                        this.showToast('✅ All entries deleted');
                        
                        // Reload the page to reinitialize
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    };
                    
                    deleteRequest.onerror = (error) => {
                        console.error('Delete failed:', error);
                        this.showToast('❌ Failed to delete entries');
                    };
                    
                } catch (error) {
                    console.error('Delete failed:', error);
                    this.showToast('❌ Failed to delete entries');
                }
            }
        }
    }
    
    resetApp() {
        const confirm1 = window.confirm('⚠️ Reset the entire app? This will delete ALL data and settings.');
        
        if (confirm1) {
            const confirm2 = window.confirm('This action cannot be undone. Are you sure?');
            
            if (confirm2) {
                try {
                    // Clear all localStorage
                    localStorage.clear();
                    
                    // Clear IndexedDB
                    const deleteRequest = indexedDB.deleteDatabase('AudioPhotoJournal');
                    deleteRequest.onsuccess = () => {
                        this.showToast('✅ App reset complete');
                        
                        // Reload the page
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    };
                    
                } catch (error) {
                    console.error('Reset failed:', error);
                    this.showToast('❌ Failed to reset app');
                }
            }
        }
    }
    
    // Helper methods
    async getAllEntries() {
        return new Promise((resolve, reject) => {
            if (!window.db) {
                resolve([]);
                return;
            }
            
            const transaction = window.db.transaction(['entries'], 'readonly');
            const store = transaction.objectStore('entries');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }
    
    async importEntries(entries) {
        if (!entries || !Array.isArray(entries)) {
            throw new Error('Invalid entries data');
        }
        
        return new Promise((resolve, reject) => {
            if (!window.db) {
                reject(new Error('Database not available'));
                return;
            }
            
            const transaction = window.db.transaction(['entries'], 'readwrite');
            const store = transaction.objectStore('entries');
            
            let processed = 0;
            
            entries.forEach(entry => {
                // Generate new ID to avoid conflicts
                const newEntry = {
                    ...entry,
                    id: this.generateId(),
                    dateImported: new Date().toISOString()
                };
                
                const request = store.add(newEntry);
                request.onsuccess = () => {
                    processed++;
                    if (processed === entries.length) {
                        resolve();
                    }
                };
                request.onerror = () => {
                    processed++;
                    if (processed === entries.length) {
                        resolve();
                    }
                };
            });
        });
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    showToast(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 100);
        
        // Hide toast
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize settings when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.simpleSettings = new SimpleSettings();
        console.log('✅ Simple settings initialized');
    }, 500);
});

// Export for use in other modules
window.SimpleSettings = SimpleSettings; 