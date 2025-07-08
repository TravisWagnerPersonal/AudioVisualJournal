// ===== Comprehensive Functionality Test Script =====

console.log('🧪 Starting comprehensive functionality tests...');

// Test 1: Check if all modules are loaded
function testModuleLoading() {
    console.log('\n📦 Testing module loading...');
    
    const requiredModules = {
        'LocationServices': window.LocationServices,
        'AudioRecording': window.AudioRecording,
        'ImprovedAIServices': window.ImprovedAIServices,
        'JournalManager': window.JournalManager,
        'LocationIntegration': window.LocationIntegration,
        'EnhancedAIIntegration': window.EnhancedAIIntegration
    };
    
    let passed = 0;
    const total = Object.keys(requiredModules).length;
    
    for (const [name, module] of Object.entries(requiredModules)) {
        if (module) {
            console.log(`✅ ${name} loaded`);
            passed++;
        } else {
            console.log(`❌ ${name} not loaded`);
        }
    }
    
    console.log(`📦 Module loading: ${passed}/${total} passed`);
    return passed === total;
}

// Test 2: Test location services
async function testLocationServices() {
    console.log('\n📍 Testing location services...');
    
    if (!window.locationServices) {
        console.log('❌ Location services not initialized');
        return false;
    }
    
    try {
        const settings = window.locationServices.getSettings();
        console.log('✅ Location settings retrieved:', settings);
        
        const locationData = await window.locationServices.getJournalLocationData();
        console.log('✅ Location data retrieved:', locationData);
        
        return true;
    } catch (error) {
        console.log('❌ Location services test failed:', error.message);
        return false;
    }
}

// Test 3: Test audio recording capabilities
function testAudioCapabilities() {
    console.log('\n🎤 Testing audio capabilities...');
    
    if (!window.audioRecording) {
        console.log('❌ Audio recording not initialized');
        return false;
    }
    
    try {
        const capabilities = window.audioRecording.getCapabilities();
        console.log('✅ Audio capabilities:', capabilities);
        
        if (capabilities.canRecord) {
            console.log('✅ Audio recording supported');
        } else {
            console.log('⚠️ Audio recording not supported');
        }
        
        if (capabilities.canTranscribe) {
            console.log('✅ Speech recognition supported');
        } else {
            console.log('⚠️ Speech recognition not supported');
        }
        
        return true;
    } catch (error) {
        console.log('❌ Audio capabilities test failed:', error.message);
        return false;
    }
}

// Test 4: Test AI services
async function testAIServices() {
    console.log('\n🤖 Testing AI services...');
    
    const aiServices = window.improvedAIServices;
    if (!aiServices) {
        console.log('❌ AI services not initialized');
        return false;
    }
    
    try {
        const capabilities = aiServices.getCapabilities();
        console.log('✅ AI capabilities:', capabilities);
        
        // Test tag generation
        if (aiServices.testTagGeneration) {
            const tagTest = aiServices.testTagGeneration();
            console.log(`${tagTest ? '✅' : '❌'} Tag generation test`);
        }
        
        // Test journal generation
        if (aiServices.testJournalGeneration) {
            const journalTest = await aiServices.testJournalGeneration();
            console.log(`${journalTest ? '✅' : '❌'} Journal generation test`);
        }
        
        // Test API connection if available
        if (capabilities.photoAnalysis) {
            const apiTest = await aiServices.testApiConnection();
            console.log(`${apiTest.success ? '✅' : '❌'} API connection: ${apiTest.message}`);
        }
        
        return true;
    } catch (error) {
        console.log('❌ AI services test failed:', error.message);
        return false;
    }
}

// Test 5: Test journal integration
function testJournalIntegration() {
    console.log('\n📖 Testing journal integration...');
    
    if (!window.journalManager) {
        console.log('❌ Journal manager not initialized');
        return false;
    }
    
    try {
        // Test data collection
        const testData = window.journalManager.collectEntryData();
        console.log('✅ Data collection working:', testData);
        
        // Test local storage
        localStorage.setItem('test_key', 'test_value');
        const retrieved = localStorage.getItem('test_key');
        localStorage.removeItem('test_key');
        
        if (retrieved === 'test_value') {
            console.log('✅ Local storage working');
        } else {
            console.log('❌ Local storage not working');
            return false;
        }
        
        return true;
    } catch (error) {
        console.log('❌ Journal integration test failed:', error.message);
        return false;
    }
}

// Test 6: Test enhanced journal generation
async function testEnhancedJournalGeneration() {
    console.log('\n✨ Testing enhanced journal generation...');
    
    const aiServices = window.improvedAIServices;
    if (!aiServices) {
        console.log('❌ AI services not available');
        return false;
    }
    
    try {
        // Create mock data
        const mockPhotoAnalysis = {
            fallback: false,
            description: 'A beautiful sunset over the ocean',
            objects: [{ name: 'ocean' }, { name: 'sunset' }],
            categories: ['nature', 'scenic'],
            tags: ['beautiful', 'peaceful'],
            confidence: 0.9
        };
        
        const mockLocationData = {
            location: 'Santa Monica, CA',
            weather: {
                temperature: 22,
                description: 'clear sky',
                conditions: 'Clear'
            },
            timeOfDay: 'evening',
            season: 'summer'
        };
        
        const result = await aiServices.generateJournalEntry(
            mockPhotoAnalysis,
            'This is a beautiful evening by the ocean.',
            'I love watching sunsets here.',
            mockLocationData
        );
        
        console.log('✅ Enhanced journal generation result:', result);
        
        // Verify the result contains expected elements
        const hasLocation = result.content.includes('Santa Monica');
        const hasWeather = result.content.includes('22°C');
        const hasPhotoAnalysis = result.content.includes('sunset');
        const hasAudio = result.content.includes('evening by the ocean');
        const hasLocationTags = result.suggestedTags.includes('evening');
        
        console.log('🔍 Content verification:');
        console.log(`${hasLocation ? '✅' : '❌'} Location included`);
        console.log(`${hasWeather ? '✅' : '❌'} Weather included`);
        console.log(`${hasPhotoAnalysis ? '✅' : '❌'} Photo analysis included`);
        console.log(`${hasAudio ? '✅' : '❌'} Audio transcription included`);
        console.log(`${hasLocationTags ? '✅' : '❌'} Location-based tags included`);
        
        return hasLocation && hasWeather && hasPhotoAnalysis && hasAudio;
        
    } catch (error) {
        console.log('❌ Enhanced journal generation test failed:', error.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Running comprehensive functionality tests...\n');
    
    const tests = [
        { name: 'Module Loading', fn: testModuleLoading },
        { name: 'Location Services', fn: testLocationServices },
        { name: 'Audio Capabilities', fn: testAudioCapabilities },
        { name: 'AI Services', fn: testAIServices },
        { name: 'Journal Integration', fn: testJournalIntegration },
        { name: 'Enhanced Journal Generation', fn: testEnhancedJournalGeneration }
    ];
    
    const results = [];
    
    for (const test of tests) {
        try {
            const result = await test.fn();
            results.push({ name: test.name, passed: result });
        } catch (error) {
            console.log(`❌ ${test.name} test error:`, error.message);
            results.push({ name: test.name, passed: false });
        }
    }
    
    // Summary
    console.log('\n📊 TEST SUMMARY:');
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    
    results.forEach(result => {
        console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
    });
    
    const percentage = Math.round((passed / total) * 100);
    console.log(`\n🎯 Overall Result: ${passed}/${total} tests passed (${percentage}%)`);
    
    if (percentage >= 80) {
        console.log('🎉 App is functioning well!');
    } else if (percentage >= 60) {
        console.log('⚠️ App has some issues but core functionality works');
    } else {
        console.log('❌ App has significant issues that need to be addressed');
    }
    
    return { passed, total, percentage, results };
}

// Auto-run tests if this script is loaded
if (typeof window !== 'undefined') {
    // Wait a bit for all modules to load
    setTimeout(runAllTests, 2000);
}

// Export for manual testing
if (typeof window !== 'undefined') {
    window.testFunctionality = runAllTests;
} 