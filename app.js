// ===== Global App State =====
let db = null;
let currentEntry = null;
let allEntries = [];
let searchTerm = '';
let currentView = 'timeline';
let isGridView = false;

// ===== Database Configuration =====
const DB_NAME = 'AudioPhotoJournal';
const DB_VERSION = 1;
const STORES = {
    entries: 'entries',
    photos: 'photos',
    audio: 'audio'
};

// ===== Enhanced App Integration Tests =====

class AppTester {
    constructor() {
        this.testResults = [];
    }

    async runComprehensiveTests() {
        console.log('🧪 Starting comprehensive app tests...');
        
        // Clear previous results
        this.testResults = [];
        
        // Test core components
        await this.testLocationServices();
        await this.testAudioRecording();
        await this.testAIServices();
        await this.testJournalIntegration();
        
        // Display results
        this.displayTestResults();
        
        return this.testResults;
    }

    async testLocationServices() {
        console.log('📍 Testing location services...');
        
        try {
            if (!window.locationServices) {
                throw new Error('Location services not initialized');
            }
            
            const capabilities = window.locationServices.getSettings();
            this.addTestResult('Location Services', 'Available', capabilities.isSupported);
            
            // Test getting location data
            try {
                const locationData = await window.locationServices.getJournalLocationData();
                this.addTestResult('Location Data', 'Retrieved', !!locationData);
                
                if (locationData.location) {
                    this.addTestResult('Location String', locationData.location, true);
                }
                
                if (locationData.weather) {
                    this.addTestResult('Weather Data', `${locationData.weather.temperature}°C`, true);
                }
                
            } catch (error) {
                this.addTestResult('Location Access', 'Permission denied or unavailable', false);
            }
            
        } catch (error) {
            this.addTestResult('Location Services', error.message, false);
        }
    }

    async testAudioRecording() {
        console.log('🎤 Testing audio recording...');
        
        try {
            if (!window.audioRecording) {
                throw new Error('Audio recording not initialized');
            }
            
            const capabilities = window.audioRecording.getCapabilities();
            this.addTestResult('Audio Recording', 'Available', capabilities.canRecord);
            this.addTestResult('Speech Recognition', 'Available', capabilities.canTranscribe);
            this.addTestResult('Audio Format', capabilities.supportedFormats, true);
            
            // Test if microphone permission is available
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
                this.addTestResult('Microphone Access', 'Granted', true);
            } catch (error) {
                this.addTestResult('Microphone Access', 'Denied or unavailable', false);
            }
            
        } catch (error) {
            this.addTestResult('Audio Recording', error.message, false);
        }
    }

    async testAIServices() {
        console.log('🤖 Testing AI services...');
        
        try {
            const aiServices = window.improvedAIServices || window.aiServices;
            if (!aiServices) {
                throw new Error('AI services not initialized');
            }
            
            const capabilities = aiServices.getCapabilities();
            this.addTestResult('AI Photo Analysis', 'Available', capabilities.photoAnalysis);
            this.addTestResult('AI Speech Recognition', 'Available', capabilities.speechRecognition);
            this.addTestResult('AI Smart Generation', 'Available', capabilities.smartGeneration);
            
            // Test API connection if key is available
            if (capabilities.photoAnalysis) {
                try {
                    const connectionTest = await aiServices.testApiConnection();
                    this.addTestResult('Astica API', connectionTest.message, connectionTest.success);
                } catch (error) {
                    this.addTestResult('Astica API', 'Connection failed', false);
                }
            }
            
            // Test tag generation
            if (aiServices.testTagGeneration) {
                const tagTest = aiServices.testTagGeneration();
                this.addTestResult('Tag Generation', 'Test passed', tagTest);
            }
            
            // Test journal generation
            if (aiServices.testJournalGeneration) {
                const journalTest = aiServices.testJournalGeneration();
                this.addTestResult('Journal Generation', 'Test passed', journalTest);
            }
            
        } catch (error) {
            this.addTestResult('AI Services', error.message, false);
        }
    }

    async testJournalIntegration() {
        console.log('📖 Testing journal integration...');
        
        try {
            if (!window.journalManager) {
                throw new Error('Journal manager not initialized');
            }
            
            this.addTestResult('Journal Manager', 'Available', true);
            
            // Test data collection
            const testData = window.journalManager.collectEntryData();
            this.addTestResult('Data Collection', 'Working', !!testData);
            
            // Test local storage
            try {
                localStorage.setItem('test_item', 'test_value');
                const retrieved = localStorage.getItem('test_item');
                localStorage.removeItem('test_item');
                this.addTestResult('Local Storage', 'Working', retrieved === 'test_value');
            } catch (error) {
                this.addTestResult('Local Storage', 'Not available', false);
            }
            
        } catch (error) {
            this.addTestResult('Journal Integration', error.message, false);
        }
    }

    addTestResult(feature, result, success) {
        this.testResults.push({
            feature,
            result,
            success,
            timestamp: new Date()
        });
        
        const icon = success ? '✅' : '❌';
        console.log(`${icon} ${feature}: ${result}`);
    }

    displayTestResults() {
        const passed = this.testResults.filter(r => r.success).length;
        const total = this.testResults.length;
        const percentage = Math.round((passed / total) * 100);
        
        console.log(`\n🧪 Test Results: ${passed}/${total} passed (${percentage}%)`);
        
        // Create visual test report
        this.createTestReport();
    }

    createTestReport() {
        const existingReport = document.getElementById('test-report');
        if (existingReport) {
            existingReport.remove();
        }
        
        const passed = this.testResults.filter(r => r.success).length;
        const total = this.testResults.length;
        const percentage = Math.round((passed / total) * 100);
        
        const report = document.createElement('div');
        report.id = 'test-report';
        report.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            max-width: 400px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;
        
        report.innerHTML = `
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 15px;">
                <h3>🧪 App Test Results</h3>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 18px; cursor: pointer;">×</button>
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Overall: ${passed}/${total} passed (${percentage}%)</strong>
                <div style="background: #f0f0f0; height: 8px; border-radius: 4px; margin-top: 5px;">
                    <div style="background: ${percentage > 80 ? '#22c55e' : percentage > 60 ? '#f59e0b' : '#ef4444'}; height: 100%; width: ${percentage}%; border-radius: 4px;"></div>
                </div>
            </div>
            <div style="max-height: 300px; overflow-y: auto;">
                ${this.testResults.map(test => `
                    <div style="display: flex; align-items: center; margin-bottom: 8px; font-size: 0.9rem;">
                        <span style="margin-right: 8px;">${test.success ? '✅' : '❌'}</span>
                        <div>
                            <div style="font-weight: 600;">${test.feature}</div>
                            <div style="color: #666; font-size: 0.8rem;">${test.result}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top: 15px; text-align: center;">
                <button onclick="window.appTester.runComprehensiveTests()" style="background: #007AFF; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">🔄 Rerun Tests</button>
            </div>
        `;
        
        document.body.appendChild(report);
    }

    // Manual test functions for debugging
    async testPhotoAI() {
        console.log('📷 Testing photo AI...');
        const aiServices = window.improvedAIServices || window.aiServices;
        if (!aiServices) return;
        
        // Create a test image
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(0, 0, 100, 100);
        
        const testImage = canvas.toDataURL();
        
        try {
            const result = await aiServices.analyzePhoto(testImage);
            console.log('📷 Photo AI test result:', result);
            return result;
        } catch (error) {
            console.error('📷 Photo AI test failed:', error);
            return null;
        }
    }

    async testFullJournalFlow() {
        console.log('📖 Testing full journal flow...');
        
        try {
            // Get location data
            let locationData = null;
            if (window.locationServices) {
                locationData = await window.locationServices.getJournalLocationData();
            }
            
            // Generate a test journal entry
            const aiServices = window.improvedAIServices || window.aiServices;
            if (aiServices) {
                const testEntry = await aiServices.generateJournalEntry(
                    null, // No photo
                    'This is a test audio transcription.', // Test audio
                    'This is test user input.', // Test user input
                    locationData // Location data
                );
                
                console.log('📖 Full journal flow test result:', testEntry);
                return testEntry;
            }
            
        } catch (error) {
            console.error('📖 Full journal flow test failed:', error);
            return null;
        }
    }
}

// ===== Enhanced App Initialization =====

async function initializeApp() {
    console.log('🚀 Initializing enhanced Audio Journal app...');
    
    try {
        // Wait for all services to be available
        await waitForServices();
        
        // Initialize core components
        if (typeof JournalManager !== 'undefined') {
            window.journalManager = new JournalManager();
        }
        
        // Initialize app tester
        window.appTester = new AppTester();
        
        // Set up global event listeners
        setupGlobalEventListeners();
        
        // Show app and hide loading
        const app = document.getElementById('app');
        const loading = document.getElementById('loading-screen');
        
        if (loading) loading.style.display = 'none';
        if (app) app.style.display = 'block';
        
        console.log('✅ App initialization complete');
        
        // Auto-run tests in debug mode
        if (localStorage.getItem('debug_mode') === 'true') {
            setTimeout(() => {
                window.appTester.runComprehensiveTests();
            }, 1000);
        }
        
    } catch (error) {
        console.error('❌ App initialization failed:', error);
        showInitializationError(error);
    }
}

async function waitForServices() {
    const maxWait = 10000; // 10 seconds
    const checkInterval = 100; // 100ms
    let waited = 0;
    
    while (waited < maxWait) {
        const servicesReady = 
            window.LocationServices && 
            window.AudioRecording && 
            (window.improvedAIServices || window.aiServices);
            
        if (servicesReady) {
            return;
        }
        
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waited += checkInterval;
    }
    
    throw new Error('Services failed to initialize within timeout');
}

function setupGlobalEventListeners() {
    // Listen for audio processing events
    document.addEventListener('audioProcessed', (event) => {
        console.log('🎤 Audio processed:', event.detail);
        if (window.journalManager) {
            window.journalManager.currentAudio = event.detail.blob;
        }
    });
    
    // Listen for location updates
    document.addEventListener('locationUpdate', (event) => {
        console.log('📍 Location updated:', event.detail);
    });
    
    // Enhanced keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 't':
                    event.preventDefault();
                    if (window.appTester) {
                        window.appTester.runComprehensiveTests();
                    }
                    break;
                case 'l':
                    event.preventDefault();
                    if (window.LocationIntegration) {
                        window.LocationIntegration.showLocationSettings();
                    }
                    break;
            }
        }
    });
}

function showInitializationError(error) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #fee;
        border: 1px solid #fcc;
        color: #c33;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        z-index: 10000;
    `;
    errorDiv.innerHTML = `
        <h3>App Initialization Failed</h3>
        <p>${error.message}</p>
        <button onclick="location.reload()" style="background: #007AFF; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Reload App</button>
    `;
    document.body.appendChild(errorDiv);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
} 