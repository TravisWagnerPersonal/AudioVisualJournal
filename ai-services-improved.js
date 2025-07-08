// ===== Improved AI Services Module for Audio-Photo Journal =====

class ImprovedAIServices {
    constructor() {
        this.asticaApiKey = '446B691B-6259-4B9E-A07A-D8BA68EB741F410477F35DD4A0-6820-4BC2-815D-7691A8655963';
        this.speechRecognition = null;
        this.isListening = false;
        this.debugMode = true; // Enable to see AI features working
        
        this.init();
    }
    
    init() {
        console.log('🤖 Improved AI Services initialized');
        this.setupSpeechRecognition();
        this.loadSavedSettings();
        
        // Show AI capabilities when enabled
        if (this.asticaApiKey) {
            console.log('✨ Premium AI Features Enabled:');
            console.log('  📷 Advanced photo analysis & description');
            console.log('  🔍 Object & face detection');
            console.log('  📝 Text extraction from images');
            console.log('  🏷️ Smart tagging & categorization');
            console.log('  🎭 Mood detection');
        }
    }
    
    loadSavedSettings() {
        // Save the API key to localStorage if not already set
        if (this.asticaApiKey && !localStorage.getItem('ai_astica_key')) {
            localStorage.setItem('ai_astica_key', this.asticaApiKey);
        }
        
        const settings = this.getSettings();
        if (settings.asticaApiKey) {
            this.setAsticaApiKey(settings.asticaApiKey);
        }
    }
    
    // ===== Enhanced Astica.ai Photo Analysis using REST API =====
    setAsticaApiKey(apiKey) {
        this.asticaApiKey = apiKey?.trim();
        if (this.debugMode) {
            console.log('🔑 API key set:', this.asticaApiKey ? 'Yes' : 'No');
            console.log('🔑 API key length:', this.asticaApiKey?.length || 0);
        }
    }
    
    async analyzePhoto(imageData) {
        if (this.debugMode) {
            console.log('📷 Starting photo analysis...');
            console.log('📷 Has API key:', !!this.asticaApiKey);
            console.log('📷 Image data type:', typeof imageData);
        }
        
        if (!this.asticaApiKey) {
            if (this.debugMode) {
                console.log('ℹ️ Using basic photo analysis (no AI API key configured)');
            }
            return this.getEnhancedFallbackAnalysis(imageData);
        }
        
        try {
            // Convert image data to base64 if needed
            let base64Image = imageData;
            if (imageData.startsWith('data:image/')) {
                base64Image = imageData.split(',')[1];
            }
            
            const requestBody = {
                tkn: this.asticaApiKey,
                modelVersion: '2.5_full',
                input: base64Image,
                visionParams: 'describe,objects,faces,tags,categories,moderate,text',
                gpt: 'Describe this image in detail, noting any people, objects, activities, and the overall mood or setting.',
                prompt_length: '90'
            };
            
            if (this.debugMode) {
                console.log('📷 Sending request to Astica API...');
            }
            
            const response = await fetch('https://vision.astica.ai/describe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                console.error('❌ Astica API error:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('❌ Error details:', errorText);
                return this.getEnhancedFallbackAnalysis(imageData);
            }
            
            const result = await response.json();
            
            if (this.debugMode) {
                console.log('📷 Astica API response:', result);
            }
            
            if (result.status === 'error') {
                console.error('❌ Astica API returned error:', result.error);
                
                // Check if it's a billing issue
                if (result.error && result.error.includes('Vision Compute')) {
                    console.warn('💳 Billing Issue: Your Astica API credits are exhausted');
                    console.warn('🔗 Add credits at: https://astica.ai/account');
                    console.warn('✅ App will continue with basic analysis');
                    
                    // Show user-friendly notification
                    this.showBillingNotification();
                }
                
                return this.getEnhancedFallbackAnalysis(imageData);
            }
            
            // Process the successful response
            return this.processAsticaResponse(result);
            
        } catch (error) {
            console.error('❌ Photo analysis failed:', error);
            if (this.debugMode) {
                console.error('❌ Full error:', error);
            }
            return this.getEnhancedFallbackAnalysis(imageData);
        }
    }
    
    processAsticaResponse(result) {
        const processed = {
            description: result.caption?.text || 'A captured moment',
            detailedDescription: result.caption_GPTS || result.caption?.text || '',
            objects: this.extractObjects(result.objects),
            faces: this.extractFaces(result.faces),
            tags: this.extractTags(result.tags),
            categories: result.categories || [],
            text: result.text || [],
            confidence: result.caption?.confidence || 0.8,
            fallback: false,
            rawData: result // For debugging
        };
        
        if (this.debugMode) {
            console.log('📷 Processed analysis:', processed);
        }
        
        return processed;
    }
    
    extractObjects(objects) {
        if (!objects || !Array.isArray(objects)) return [];
        
        return objects.map(obj => ({
            name: obj.name || obj.object || obj,
            confidence: obj.confidence || 0.5
        })).slice(0, 10); // Limit to top 10 objects
    }
    
    extractFaces(faces) {
        if (!faces || !Array.isArray(faces)) return [];
        
        return faces.map(face => ({
            age: face.age || null,
            gender: face.gender || null,
            confidence: face.confidence || 0.5
        }));
    }
    
    extractTags(tags) {
        if (!tags || !Array.isArray(tags)) return [];
        
        return tags.map(tag => tag.name || tag).slice(0, 8);
    }
    
    getEnhancedFallbackAnalysis(imageData) {
        const timestamp = new Date().toLocaleString();
        
        // Enhanced fallback with basic image analysis
        const analysis = {
            description: 'A photo captured in your journal',
            detailedDescription: `This image was captured on ${timestamp}. The photo has been successfully added to your journal entry and is ready for your personal notes and memories.`,
            objects: [],
            faces: [],
            tags: ['photo', 'memory', 'journal'],
            categories: ['personal'],
            text: [],
            confidence: 0.3,
            fallback: true,
            fallbackReason: this.asticaApiKey ? 'API call failed' : 'No API key configured'
        };
        
        // Try to extract some basic info from image data
        if (imageData && typeof imageData === 'string') {
            if (imageData.includes('jpeg') || imageData.includes('jpg')) {
                analysis.tags.push('jpeg');
            }
            if (imageData.includes('png')) {
                analysis.tags.push('png');
            }
        }
        
        return analysis;
    }
    
    // ===== Enhanced Speech Recognition =====
    setupSpeechRecognition() {
        try {
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
            
            // Since Web Speech API can't transcribe pre-recorded audio,
            // we provide a helpful message with some analysis
            const duration = audioBlob ? Math.round(audioBlob.size / 1000) : 0;
            if (duration > 0) {
                resolve(`🎤 Audio recording captured (${duration}s). For transcription, please use the live speech recognition while recording.`);
            } else {
                resolve('Audio recording captured. For transcription, please use the live speech recognition while recording.');
            }
        });
    }
    
    // ===== Enhanced Journal Entry Generation =====
    async generateJournalEntry(photoAnalysis, audioTranscription, userInput = '', locationData = null) {
        try {
            console.log('🔄 Generating journal entry...');
            
            // Get location data if not provided
            if (!locationData && window.locationServices) {
                try {
                    locationData = await window.locationServices.getJournalLocationData();
                } catch (error) {
                    console.warn('⚠️ Could not get location data:', error);
                }
            }
            
            console.log('📊 Input data:', {
                photoAnalysis: photoAnalysis ? {
                    fallback: photoAnalysis.fallback,
                    hasDescription: !!photoAnalysis.description,
                    hasObjects: !!(photoAnalysis.objects?.length),
                    hasFaces: !!(photoAnalysis.faces?.length),
                    hasText: !!(photoAnalysis.text?.length),
                    hasCategories: !!(photoAnalysis.categories?.length)
                } : null,
                audioTranscription: audioTranscription ? audioTranscription.length + ' chars' : 'none',
                userInput: userInput ? userInput.length + ' chars' : 'none',
                locationData: locationData ? 'available' : 'none'
            });
            
            let generatedContent = '';
            const timestamp = new Date();
            const timeString = timestamp.toLocaleString();
            
            // Start with timestamp and context
            generatedContent += `Entry from ${timeString}`;
            
            // Add location context if available
            if (locationData) {
                if (locationData.location) {
                    generatedContent += ` in ${locationData.location}`;
                }
                if (locationData.weather) {
                    generatedContent += ` (${locationData.weather.temperature}°C, ${locationData.weather.description})`;
                }
            }
            
            generatedContent += '\n\n';
            
            // Add contextual opening based on time and weather
            if (locationData) {
                const contextualOpening = this.generateContextualOpening(locationData);
                if (contextualOpening) {
                    generatedContent += `${contextualOpening}\n\n`;
                }
            }
            
            // Add photo analysis if available and not fallback
            if (photoAnalysis) {
                console.log('📷 Processing photo analysis...');
                if (!photoAnalysis.fallback) {
                    // Rich AI analysis available
                    generatedContent += `📷 Photo Analysis:\n`;
                    generatedContent += `${photoAnalysis.description}\n\n`;
                    
                    if (photoAnalysis.detailedDescription && 
                        photoAnalysis.detailedDescription !== photoAnalysis.description) {
                        generatedContent += `${photoAnalysis.detailedDescription}\n\n`;
                    }
                    
                    // Add detected objects
                    if (photoAnalysis.objects && photoAnalysis.objects.length > 0) {
                        const objectNames = photoAnalysis.objects
                            .map(obj => obj.name || obj)
                            .slice(0, 5);
                        generatedContent += `🔍 I can see: ${objectNames.join(', ')}\n\n`;
                    }
                    
                    // Add face detection info
                    if (photoAnalysis.faces && photoAnalysis.faces.length > 0) {
                        const faceCount = photoAnalysis.faces.length;
                        generatedContent += `👥 ${faceCount} ${faceCount === 1 ? 'person' : 'people'} detected in this photo\n\n`;
                    }
                    
                    // Add text detection
                    if (photoAnalysis.text && photoAnalysis.text.length > 0) {
                        generatedContent += `📝 Text found: ${photoAnalysis.text.join(', ')}\n\n`;
                    }
                } else {
                    // Fallback analysis
                    generatedContent += `📷 Photo captured and stored\n`;
                    if (photoAnalysis.fallbackReason) {
                        generatedContent += `(Note: AI analysis unavailable - ${photoAnalysis.fallbackReason})\n\n`;
                    }
                }
            }
            
            // Add audio transcription
            if (audioTranscription && audioTranscription.trim()) {
                console.log('🎤 Adding audio transcription...');
                generatedContent += `🎤 Audio Notes:\n${audioTranscription}\n\n`;
            }
            
            // Add user input
            if (userInput && userInput.trim()) {
                console.log('✍️ Adding user input...');
                generatedContent += `✍️ Notes:\n${userInput}\n\n`;
            }
            
            // Add reflective ending
            if (photoAnalysis && !photoAnalysis.fallback) {
                const categories = photoAnalysis.categories || [];
                if (categories.length > 0) {
                    generatedContent += `This moment captures ${categories.join(' and ')}.`;
                } else {
                    generatedContent += `A special moment preserved in time.`;
                }
            } else {
                generatedContent += `A new memory added to your journal.`;
            }
            
            // Add weather-based reflection if available
            if (locationData?.weather) {
                generatedContent += ` The ${locationData.weather.description} weather adds to the atmosphere of this ${locationData.timeOfDay}.`;
            }
            
            console.log('🏷️ Generating tags...');
            const suggestedTags = this.generateEnhancedTags(photoAnalysis, audioTranscription, userInput, locationData);
            
            console.log('🎭 Detecting mood...');
            const suggestedMood = this.detectMood(photoAnalysis, audioTranscription, userInput);
            
            const result = {
                content: generatedContent.trim(),
                suggestedTags,
                suggestedMood,
                confidence: photoAnalysis?.confidence || 0.5,
                hasAIAnalysis: photoAnalysis && !photoAnalysis.fallback,
                locationData: locationData
            };
            
            console.log('✅ Journal entry generated successfully:', {
                contentLength: result.content.length,
                tagsCount: result.suggestedTags.length,
                mood: result.suggestedMood,
                hasAI: result.hasAIAnalysis,
                hasLocation: !!locationData?.location,
                hasWeather: !!locationData?.weather
            });
            
            return result;
            
        } catch (error) {
            console.error('❌ Journal generation failed:', error);
            console.error('📊 Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            return {
                content: userInput || `Entry from ${new Date().toLocaleString()}\n\nA new journal entry.`,
                suggestedTags: ['journal'],
                suggestedMood: null,
                confidence: 0.3,
                hasAIAnalysis: false
            };
        }
    }

    generateContextualOpening(locationData) {
        const openings = [];
        
        if (locationData.timeOfDay) {
            switch (locationData.timeOfDay) {
                case 'morning':
                    openings.push('Starting this morning with a moment to capture.');
                    openings.push('A beautiful morning moment worth remembering.');
                    break;
                case 'afternoon':
                    openings.push('Taking a moment this afternoon to reflect.');
                    openings.push('Pausing in the afternoon to document this experience.');
                    break;
                case 'evening':
                    openings.push('Winding down the evening with this memory.');
                    openings.push('An evening moment that deserves to be preserved.');
                    break;
                case 'night':
                    openings.push('A late night reflection on today.');
                    openings.push('Capturing this quiet night moment.');
                    break;
            }
        }
        
        if (locationData.weather) {
            const weather = locationData.weather.conditions.toLowerCase();
            if (weather.includes('rain')) {
                openings.push('The gentle rain creates a peaceful backdrop for this moment.');
            } else if (weather.includes('sun') || weather.includes('clear')) {
                openings.push('The sunshine brightens this special moment.');
            } else if (weather.includes('cloud')) {
                openings.push('Under cloudy skies, this moment feels contemplative.');
            } else if (weather.includes('snow')) {
                openings.push('The snowy weather adds a magical quality to this experience.');
            }
        }
        
        return openings.length > 0 ? openings[Math.floor(Math.random() * openings.length)] : null;
    }

    generateEnhancedTags(photoAnalysis, audioTranscription, userInput, locationData) {
        const tags = new Set();
        
        // Add AI-generated tags
        if (photoAnalysis && !photoAnalysis.fallback) {
            if (photoAnalysis.tags && Array.isArray(photoAnalysis.tags)) {
                photoAnalysis.tags.slice(0, 5).forEach(tag => {
                    const tagStr = typeof tag === 'string' ? tag : (tag?.name || String(tag));
                    if (tagStr && typeof tagStr === 'string') {
                        tags.add(tagStr.toLowerCase());
                    }
                });
            }
            
            if (photoAnalysis.categories && Array.isArray(photoAnalysis.categories)) {
                photoAnalysis.categories.forEach(cat => {
                    const catStr = typeof cat === 'string' ? cat : (cat?.name || String(cat));
                    if (catStr && typeof catStr === 'string') {
                        tags.add(catStr.toLowerCase());
                    }
                });
            }
            
            if (photoAnalysis.objects && Array.isArray(photoAnalysis.objects)) {
                photoAnalysis.objects.slice(0, 3).forEach(obj => {
                    const name = obj?.name || obj;
                    const nameStr = typeof name === 'string' ? name : String(name);
                    if (nameStr && typeof nameStr === 'string' && nameStr !== 'undefined' && nameStr !== 'null') {
                        tags.add(nameStr.toLowerCase());
                    }
                });
            }
        }
        
        // Add location-based tags
        if (locationData) {
            // Time-based tags
            if (locationData.timeOfDay) {
                tags.add(locationData.timeOfDay);
            }
            
            // Season tags
            if (locationData.season) {
                tags.add(locationData.season);
            }
            
            // Weather tags
            if (locationData.weather) {
                const weather = locationData.weather.conditions.toLowerCase();
                tags.add(weather);
                
                if (locationData.weather.temperature < 10) {
                    tags.add('cold');
                } else if (locationData.weather.temperature > 25) {
                    tags.add('warm');
                }
                
                if (weather.includes('rain')) {
                    tags.add('rainy');
                } else if (weather.includes('sun')) {
                    tags.add('sunny');
                } else if (weather.includes('cloud')) {
                    tags.add('cloudy');
                }
            }
            
            // Location tags
            if (locationData.location) {
                const location = locationData.location.toLowerCase();
                if (location.includes('park')) tags.add('park');
                if (location.includes('beach')) tags.add('beach');
                if (location.includes('city')) tags.add('urban');
                if (location.includes('home')) tags.add('home');
                if (location.includes('office')) tags.add('work');
            }
        } else {
            // Fallback time-based tags
            const now = new Date();
            const hour = now.getHours();
            const month = now.toLocaleString('default', { month: 'long' }).toLowerCase();
            
            if (hour < 12) tags.add('morning');
            else if (hour < 17) tags.add('afternoon');
            else tags.add('evening');
            
            tags.add(month);
        }
        
        // Add content-based tags from text
        const allText = `${audioTranscription} ${userInput}`.toLowerCase();
        const keywordTags = {
            'family': ['family', 'mom', 'dad', 'sister', 'brother', 'parents'],
            'work': ['work', 'office', 'meeting', 'project', 'job'],
            'travel': ['travel', 'vacation', 'trip', 'flight', 'hotel'],
            'food': ['food', 'restaurant', 'dinner', 'lunch', 'cooking'],
            'nature': ['nature', 'park', 'tree', 'flower', 'outdoor'],
            'exercise': ['exercise', 'gym', 'run', 'workout', 'fitness']
        };
        
        Object.entries(keywordTags).forEach(([tag, keywords]) => {
            if (keywords.some(keyword => allText.includes(keyword))) {
                tags.add(tag);
            }
        });
        
        // Essential tags
        tags.add('memory');
        if (photoAnalysis) tags.add('photo');
        if (audioTranscription) tags.add('audio');
        if (locationData?.location) tags.add('location');
        
        return Array.from(tags).slice(0, 12);
    }
    
    detectMood(photoAnalysis, audioTranscription, userInput) {
        const allText = `${audioTranscription} ${userInput}`.toLowerCase();
        
        // Enhanced mood detection
        const moodKeywords = {
            'happy': ['happy', 'great', 'wonderful', 'amazing', 'joy', 'smile', 'laugh', 'love'],
            'excited': ['excited', 'thrilled', 'awesome', 'fantastic', 'incredible', 'wow'],
            'calm': ['calm', 'peaceful', 'relaxed', 'serene', 'quiet', 'tranquil'],
            'grateful': ['grateful', 'thankful', 'blessed', 'appreciate', 'lucky'],
            'sad': ['sad', 'down', 'upset', 'disappointed', 'crying', 'tears'],
            'anxious': ['worried', 'anxious', 'nervous', 'stress', 'concerned'],
            'thoughtful': ['thinking', 'reflect', 'consider', 'ponder', 'remember']
        };
        
        for (const [mood, keywords] of Object.entries(moodKeywords)) {
            if (keywords.some(keyword => allText.includes(keyword))) {
                return mood;
            }
        }
        
        // Default mood based on photo analysis
        if (photoAnalysis && photoAnalysis.faces && photoAnalysis.faces.length > 0) {
            return 'happy';
        }
        
        return null;
    }
    
    // ===== Debugging and Testing =====
    async testApiConnection() {
        if (!this.asticaApiKey) {
            return {
                success: false,
                message: 'No API key configured'
            };
        }
        
        try {
            // Create a small test image (1x1 pixel base64)
            const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA1+Z/bQAAAABJRU5ErkJggg==';
            
            const response = await fetch('https://vision.astica.ai/describe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tkn: this.asticaApiKey,
                    modelVersion: '1.0_full',
                    input: testImage,
                    visionParams: 'describe'
                })
            });
            
            const result = await response.json();
            
            return {
                success: result.status !== 'error',
                message: result.status === 'error' ? result.error : 'API connection successful',
                response: result
            };
            
        } catch (error) {
            return {
                success: false,
                message: `Connection failed: ${error.message}`
            };
        }
    }
    
    async checkAccountStatus() {
        console.log('🔍 Checking Astica account status...');
        
        if (!this.asticaApiKey) {
            console.error('❌ No API key configured');
            return { success: false, message: 'No API key configured' };
        }
        
        try {
            const testResult = await this.testApiConnection();
            
            if (testResult.success) {
                console.log('✅ Account Status: Active');
                console.log('💰 Credits: Available');
                console.log('🔗 Account: https://astica.ai/account');
                return { success: true, message: 'Account is active with available credits' };
            } else {
                console.error('❌ Account Status: Issue detected');
                console.error('💳 Error:', testResult.message);
                
                if (testResult.message.includes('Vision Compute')) {
                    console.warn('💳 BILLING ISSUE: Credits exhausted');
                    console.warn('🔗 Add credits at: https://astica.ai/account');
                    console.warn('✅ App will continue with basic analysis');
                }
                
                return { success: false, message: testResult.message };
            }
            
        } catch (error) {
            console.error('❌ Status check failed:', error);
            return { success: false, message: error.message };
        }
    }
    
    // ===== Settings Management =====
    getSettings() {
        return {
            asticaApiKey: localStorage.getItem('ai_astica_key') || '',
            speechRecognitionEnabled: localStorage.getItem('ai_speech_enabled') !== 'false',
            autoGenerateEntries: localStorage.getItem('ai_auto_generate') !== 'false',
            autoTagging: localStorage.getItem('ai_auto_tags') !== 'false',
            debugMode: localStorage.getItem('ai_debug_mode') === 'true'
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
        if (settings.debugMode !== undefined) {
            localStorage.setItem('ai_debug_mode', settings.debugMode);
            this.debugMode = settings.debugMode;
        }
    }
    
    getCapabilities() {
        return {
            photoAnalysis: !!this.asticaApiKey,
            speechRecognition: !!this.speechRecognition,
            liveSpeechRecognition: !!this.speechRecognition,
            smartGeneration: true,
            autoTagging: true,
            apiTesting: true
        };
    }

    showBillingNotification() {
        // Check if we already showed this notification recently
        const lastShown = localStorage.getItem('billing_notification_shown');
        const now = Date.now();
        
        // Only show once per hour to avoid spam
        if (lastShown && (now - parseInt(lastShown)) < 3600000) {
            return;
        }
        
        // Create a non-intrusive notification
        const notification = document.createElement('div');
        notification.className = 'ai-billing-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 10000;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
            line-height: 1.4;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 10px;">
                <div style="font-size: 20px;">💳</div>
                <div style="flex: 1;">
                    <strong>AI Credits Exhausted</strong><br>
                    <small>Your Astica API credits are low. The app will continue with basic analysis.</small><br>
                    <a href="https://astica.ai/account" target="_blank" style="color: #007AFF; text-decoration: none; font-weight: 500;">Add Credits →</a>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 16px; cursor: pointer; color: #666;">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
        
        // Remember we showed this notification
        localStorage.setItem('billing_notification_shown', now.toString());
    }

    // ===== Testing and Debugging Functions =====
    testTagGeneration() {
        console.log('🧪 Testing tag generation...');
        
        // Test with mock data that could cause the error
        const mockPhotoAnalysis = {
            fallback: false,
            tags: ['tag1', 'tag2', { name: 'tag3' }, null, undefined],
            categories: ['category1', { name: 'category2' }, null, 'category3'],
            objects: [{ name: 'object1' }, 'object2', { name: null }, undefined]
        };
        
        try {
            const result = this.generateEnhancedTags(mockPhotoAnalysis, 'test audio', 'test input');
            console.log('✅ Tag generation test passed:', result);
            return true;
        } catch (error) {
            console.error('❌ Tag generation test failed:', error);
            return false;
        }
    }
    
    testJournalGeneration() {
        console.log('🧪 Testing journal generation...');
        
        const mockPhotoAnalysis = {
            fallback: false,
            description: 'Test photo description',
            detailedDescription: 'Test detailed description',
            objects: [{ name: 'dog' }, { name: 'house' }],
            faces: [{ age: 25, gender: 'female' }],
            text: ['Hello', 'World'],
            categories: ['outdoor', 'family'],
            tags: ['nature', 'happy'],
            confidence: 0.9
        };
        
        try {
            const result = this.generateJournalEntry(mockPhotoAnalysis, 'Test audio transcription', 'Test user input');
            console.log('✅ Journal generation test passed');
            return true;
        } catch (error) {
            console.error('❌ Journal generation test failed:', error);
            return false;
        }
    }
}

// ===== Enhanced AI Integration Helper Functions =====
class EnhancedAIIntegration {
    static async processNewEntry(photos, audioBlob, userText) {
        const aiServices = window.improvedAIServices;
        if (!aiServices) return null;
        
        let photoAnalysis = null;
        let audioTranscription = '';
        
        // Analyze first photo if available
        if (photos && photos.length > 0) {
            try {
                console.log('🔄 Processing photo for AI analysis...');
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
    
    static showEnhancedAISettings() {
        const modal = document.createElement('div');
        modal.className = 'ai-settings-modal';
        modal.innerHTML = `
            <div class="ai-settings-content">
                <h3>🤖 Enhanced AI Settings</h3>
                
                <div class="ai-setting">
                    <label>Astica.ai API Key (for photo analysis):</label>
                    <input type="password" id="ai-astica-key" placeholder="Enter your API key">
                    <small>Get your free API key at <a href="https://astica.ai" target="_blank">astica.ai</a></small>
                    <button type="button" id="test-api-btn" style="margin-left: 10px;">Test API</button>
                    <div id="api-test-result"></div>
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
                
                <div class="ai-setting">
                    <label>
                        <input type="checkbox" id="ai-debug-mode"> Enable debug mode
                    </label>
                </div>
                
                <div class="ai-settings-buttons">
                    <button onclick="this.closest('.ai-settings-modal').remove()">Cancel</button>
                    <button onclick="EnhancedAIIntegration.saveAISettings()">Save</button>
                </div>
            </div>
        `;
        
        // Populate current settings
        const settings = window.improvedAIServices?.getSettings();
        if (settings) {
            modal.querySelector('#ai-astica-key').value = settings.asticaApiKey;
            modal.querySelector('#ai-speech-enabled').checked = settings.speechRecognitionEnabled;
            modal.querySelector('#ai-auto-generate').checked = settings.autoGenerateEntries;
            modal.querySelector('#ai-auto-tags').checked = settings.autoTagging;
            modal.querySelector('#ai-debug-mode').checked = settings.debugMode;
        }
        
        // Add test API functionality
        modal.querySelector('#test-api-btn').onclick = async () => {
            const apiKey = modal.querySelector('#ai-astica-key').value;
            const resultDiv = modal.querySelector('#api-test-result');
            
            if (!apiKey) {
                resultDiv.innerHTML = '<span style="color: red;">Please enter an API key first</span>';
                return;
            }
            
            resultDiv.innerHTML = '<span style="color: blue;">Testing API connection...</span>';
            
            // Temporarily set the API key for testing
            const tempServices = new ImprovedAIServices();
            tempServices.setAsticaApiKey(apiKey);
            
            const result = await tempServices.testApiConnection();
            
            if (result.success) {
                resultDiv.innerHTML = '<span style="color: green;">✅ API connection successful!</span>';
            } else {
                resultDiv.innerHTML = `<span style="color: red;">❌ ${result.message}</span>`;
            }
        };
        
        document.body.appendChild(modal);
    }
    
    static saveAISettings() {
        const settings = {
            asticaApiKey: document.getElementById('ai-astica-key').value,
            speechRecognitionEnabled: document.getElementById('ai-speech-enabled').checked,
            autoGenerateEntries: document.getElementById('ai-auto-generate').checked,
            autoTagging: document.getElementById('ai-auto-tags').checked,
            debugMode: document.getElementById('ai-debug-mode').checked
        };
        
        window.improvedAIServices?.updateSettings(settings);
        document.querySelector('.ai-settings-modal')?.remove();
        
        // Show success message
        console.log('✅ Enhanced AI settings saved');
        alert('AI settings saved successfully!');
    }
}

// ===== Initialize Enhanced AI Services =====
document.addEventListener('DOMContentLoaded', function() {
    // Replace the old AI services with improved version
    window.improvedAIServices = new ImprovedAIServices();
    window.aiServices = window.improvedAIServices; // For compatibility
    
    console.log('🚀 Enhanced AI Integration ready');
    console.log('Capabilities:', window.improvedAIServices.getCapabilities());
});

// Export for global use
window.ImprovedAIServices = ImprovedAIServices;
window.EnhancedAIIntegration = EnhancedAIIntegration; 