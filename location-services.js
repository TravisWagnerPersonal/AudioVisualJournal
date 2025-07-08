// ===== Location Services Module for Audio-Photo Journal =====

class LocationServices {
    constructor() {
        this.currentLocation = null;
        this.currentWeather = null;
        this.isLocationEnabled = false;
        this.watchId = null;
        this.lastLocationUpdate = null;
        this.weatherApiKey = null; // Users can set their own OpenWeatherMap API key
        
        this.init();
    }

    async init() {
        console.log('🌍 Location Services initializing...');
        
        // Check for geolocation support
        if (!navigator.geolocation) {
            console.warn('⚠️ Geolocation is not supported by this browser');
            return;
        }

        // Load saved settings
        this.loadSettings();

        // Check permissions
        await this.checkPermissions();

        console.log('✅ Location Services ready');
    }

    loadSettings() {
        const locationEnabled = localStorage.getItem('location_enabled');
        this.isLocationEnabled = locationEnabled === 'true';
        
        const weatherApiKey = localStorage.getItem('weather_api_key');
        this.weatherApiKey = weatherApiKey;

        console.log('📍 Location settings loaded:', {
            enabled: this.isLocationEnabled,
            hasWeatherKey: !!this.weatherApiKey
        });
    }

    async checkPermissions() {
        if (!navigator.permissions) {
            console.warn('⚠️ Permissions API not supported');
            return;
        }

        try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            console.log('📍 Geolocation permission status:', result.state);
            
            result.addEventListener('change', () => {
                console.log('📍 Geolocation permission changed to:', result.state);
                if (result.state === 'denied') {
                    this.isLocationEnabled = false;
                    this.stopWatching();
                }
            });
            
        } catch (error) {
            console.warn('⚠️ Could not check geolocation permissions:', error);
        }
    }

    async requestLocationPermission() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            console.log('🔑 Requesting location permission...');

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log('✅ Location permission granted');
                    this.isLocationEnabled = true;
                    localStorage.setItem('location_enabled', 'true');
                    this.updateLocation(position);
                    resolve(true);
                },
                (error) => {
                    console.error('❌ Location permission denied:', error.message);
                    this.isLocationEnabled = false;
                    localStorage.setItem('location_enabled', 'false');
                    reject(error);
                },
                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }

    async getCurrentLocation() {
        if (!this.isLocationEnabled) {
            try {
                await this.requestLocationPermission();
            } catch (error) {
                throw new Error('Location access denied');
            }
        }

        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    await this.updateLocation(position);
                    resolve(this.currentLocation);
                },
                (error) => {
                    console.error('❌ Failed to get current location:', error);
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 60000 // 1 minute
                }
            );
        });
    }

    async updateLocation(position) {
        const { latitude, longitude } = position.coords;
        
        console.log('📍 Location updated:', { latitude, longitude });

        // Get address from coordinates
        const address = await this.reverseGeocode(latitude, longitude);
        
        this.currentLocation = {
            latitude,
            longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(),
            address: address,
            formatted: this.formatLocation(address)
        };

        this.lastLocationUpdate = Date.now();

        // Get weather if API key is available
        if (this.weatherApiKey) {
            try {
                this.currentWeather = await this.getWeather(latitude, longitude);
            } catch (error) {
                console.warn('⚠️ Weather update failed:', error);
            }
        }

        // Notify listeners
        this.notifyLocationUpdate();
    }

    async reverseGeocode(latitude, longitude) {
        try {
            // Using a free geocoding service
            const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            
            if (!response.ok) {
                throw new Error(`Geocoding failed: ${response.status}`);
            }
            
            const data = await response.json();
            
            return {
                city: data.city || data.locality || '',
                state: data.principalSubdivision || '',
                country: data.countryName || '',
                countryCode: data.countryCode || '',
                postcode: data.postcode || '',
                district: data.district || '',
                street: data.street || '',
                neighborhood: data.neighbourhood || ''
            };
            
        } catch (error) {
            console.warn('⚠️ Reverse geocoding failed:', error);
            return {
                city: '',
                state: '',
                country: '',
                countryCode: '',
                postcode: '',
                district: '',
                street: '',
                neighborhood: ''
            };
        }
    }

    formatLocation(address) {
        const components = [];
        
        if (address.neighborhood && address.neighborhood !== address.city) {
            components.push(address.neighborhood);
        }
        if (address.city) {
            components.push(address.city);
        }
        if (address.state && address.state !== address.city) {
            components.push(address.state);
        }
        if (address.country) {
            components.push(address.country);
        }
        
        return components.filter(c => c).join(', ') || 'Unknown location';
    }

    async getWeather(latitude, longitude) {
        if (!this.weatherApiKey) {
            console.warn('⚠️ No weather API key configured');
            return null;
        }

        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${this.weatherApiKey}&units=metric`
            );
            
            if (!response.ok) {
                throw new Error(`Weather API failed: ${response.status}`);
            }
            
            const data = await response.json();
            
            return {
                temperature: Math.round(data.main.temp),
                description: data.weather[0].description,
                main: data.weather[0].main,
                icon: data.weather[0].icon,
                humidity: data.main.humidity,
                pressure: data.main.pressure,
                windSpeed: data.wind?.speed || 0,
                windDirection: data.wind?.deg || 0,
                visibility: data.visibility || 0,
                clouds: data.clouds?.all || 0,
                sunrise: new Date(data.sys.sunrise * 1000),
                sunset: new Date(data.sys.sunset * 1000),
                timestamp: new Date()
            };
            
        } catch (error) {
            console.error('❌ Weather fetch failed:', error);
            return null;
        }
    }

    startWatching() {
        if (!this.isLocationEnabled || this.watchId) {
            return;
        }

        console.log('👀 Starting location watching...');

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.updateLocation(position);
            },
            (error) => {
                console.error('❌ Location watching error:', error);
            },
            {
                enableHighAccuracy: false,
                timeout: 20000,
                maximumAge: 300000 // 5 minutes
            }
        );
    }

    stopWatching() {
        if (this.watchId) {
            console.log('⏹️ Stopping location watching...');
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    notifyLocationUpdate() {
        // Dispatch custom event for location updates
        const event = new CustomEvent('locationUpdate', {
            detail: {
                location: this.currentLocation,
                weather: this.currentWeather
            }
        });
        document.dispatchEvent(event);
    }

    // ===== Public API =====

    getLocationData() {
        return {
            location: this.currentLocation,
            weather: this.currentWeather,
            isEnabled: this.isLocationEnabled,
            lastUpdate: this.lastLocationUpdate
        };
    }

    async getLocationString() {
        if (!this.currentLocation) {
            if (this.isLocationEnabled) {
                try {
                    await this.getCurrentLocation();
                } catch (error) {
                    return 'Location unavailable';
                }
            } else {
                return 'Location disabled';
            }
        }

        return this.currentLocation.formatted;
    }

    async getWeatherString() {
        if (!this.currentWeather) {
            return null;
        }

        const temp = this.currentWeather.temperature;
        const desc = this.currentWeather.description;
        return `${temp}°C, ${desc}`;
    }

    getContextualData() {
        const data = {
            timestamp: new Date(),
            timeOfDay: this.getTimeOfDay(),
            season: this.getSeason()
        };

        if (this.currentLocation) {
            data.location = this.currentLocation.formatted;
            data.coordinates = {
                latitude: this.currentLocation.latitude,
                longitude: this.currentLocation.longitude
            };
        }

        if (this.currentWeather) {
            data.weather = {
                temperature: this.currentWeather.temperature,
                description: this.currentWeather.description,
                conditions: this.currentWeather.main
            };
        }

        return data;
    }

    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour < 6) return 'night';
        if (hour < 12) return 'morning';
        if (hour < 17) return 'afternoon';
        if (hour < 21) return 'evening';
        return 'night';
    }

    getSeason() {
        const month = new Date().getMonth();
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'fall';
        return 'winter';
    }

    // ===== Settings Management =====

    updateSettings(settings) {
        if (settings.locationEnabled !== undefined) {
            this.isLocationEnabled = settings.locationEnabled;
            localStorage.setItem('location_enabled', settings.locationEnabled);
            
            if (settings.locationEnabled) {
                this.requestLocationPermission().catch(console.error);
            } else {
                this.stopWatching();
            }
        }

        if (settings.weatherApiKey !== undefined) {
            this.weatherApiKey = settings.weatherApiKey;
            localStorage.setItem('weather_api_key', settings.weatherApiKey);
        }
    }

    getSettings() {
        return {
            locationEnabled: this.isLocationEnabled,
            weatherApiKey: this.weatherApiKey || '',
            hasWeatherKey: !!this.weatherApiKey,
            isSupported: !!navigator.geolocation
        };
    }

    // ===== Integration with Journal =====

    async getJournalLocationData() {
        try {
            const contextData = this.getContextualData();
            
            // Always return context data, even if location is disabled
            const journalData = {
                timestamp: contextData.timestamp,
                timeOfDay: contextData.timeOfDay,
                season: contextData.season
            };

            // Add location data if available
            if (this.isLocationEnabled && this.currentLocation) {
                // Refresh location if it's older than 10 minutes
                if (!this.lastLocationUpdate || (Date.now() - this.lastLocationUpdate) > 600000) {
                    try {
                        await this.getCurrentLocation();
                    } catch (error) {
                        console.warn('⚠️ Could not refresh location for journal:', error);
                    }
                }

                journalData.location = this.currentLocation.formatted;
                journalData.coordinates = {
                    latitude: this.currentLocation.latitude,
                    longitude: this.currentLocation.longitude
                };
            }

            // Add weather data if available
            if (this.currentWeather) {
                journalData.weather = {
                    temperature: this.currentWeather.temperature,
                    description: this.currentWeather.description,
                    conditions: this.currentWeather.main
                };
            }

            return journalData;
            
        } catch (error) {
            console.error('❌ Failed to get journal location data:', error);
            return {
                timestamp: new Date(),
                timeOfDay: this.getTimeOfDay(),
                season: this.getSeason()
            };
        }
    }

    // ===== Cleanup =====

    destroy() {
        this.stopWatching();
        this.currentLocation = null;
        this.currentWeather = null;
        this.isLocationEnabled = false;
    }
}

// ===== Location Integration Helper Functions =====

class LocationIntegration {
    static init() {
        // Initialize location services when DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                window.locationServices = new LocationServices();
            });
        } else {
            window.locationServices = new LocationServices();
        }
    }

    static async getLocationForJournal() {
        if (!window.locationServices) {
            return { error: 'Location services not initialized' };
        }

        return await window.locationServices.getJournalLocationData();
    }

    static showLocationSettings() {
        const modal = document.createElement('div');
        modal.className = 'location-settings-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; max-width: 400px; width: 90%;">
                <h3>📍 Location Settings</h3>
                
                <div style="margin: 15px 0;">
                    <label>
                        <input type="checkbox" id="location-enabled"> Enable location services
                    </label>
                    <small style="display: block; color: #666; margin-top: 5px;">
                        Allow the app to capture your location for journal entries
                    </small>
                </div>
                
                <div style="margin: 15px 0;">
                    <label>Weather API Key (optional):</label>
                    <input type="password" id="weather-api-key" placeholder="Enter OpenWeatherMap API key" style="width: 100%; margin-top: 5px; padding: 5px;">
                    <small style="display: block; color: #666; margin-top: 5px;">
                        Get a free API key at <a href="https://openweathermap.org/api" target="_blank">openweathermap.org</a>
                    </small>
                </div>
                
                <div style="margin-top: 20px; text-align: right;">
                    <button onclick="this.closest('.location-settings-modal').remove()" style="margin-right: 10px;">Cancel</button>
                    <button onclick="LocationIntegration.saveLocationSettings()">Save</button>
                </div>
            </div>
        `;

        // Populate current settings
        if (window.locationServices) {
            const settings = window.locationServices.getSettings();
            modal.querySelector('#location-enabled').checked = settings.locationEnabled;
            modal.querySelector('#weather-api-key').value = settings.weatherApiKey;
        }

        document.body.appendChild(modal);
    }

    static saveLocationSettings() {
        const locationEnabled = document.getElementById('location-enabled').checked;
        const weatherApiKey = document.getElementById('weather-api-key').value;

        if (window.locationServices) {
            window.locationServices.updateSettings({
                locationEnabled,
                weatherApiKey
            });
        }

        document.querySelector('.location-settings-modal')?.remove();
        console.log('✅ Location settings saved');
    }
}

// ===== Auto-initialize =====
LocationIntegration.init();

// Export for global use
window.LocationServices = LocationServices;
window.LocationIntegration = LocationIntegration; 