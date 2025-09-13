// Weather App JavaScript
class WeatherApp {
    constructor() {
        this.apiKey = 'b6907d289e10d714a6e88b30761fae22';
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        this.currentUnit = 'metric'; // metric or imperial
        this.currentLocation = null;
        this.refreshInterval = null;
        this.currentWeatherData = null;
        
        // Sample fallback data for demo purposes
        this.sampleData = {
            "new york": {
                name: "New York",
                sys: { country: "US", sunrise: 1634562000, sunset: 1634602800 },
                main: { temp: 22, feels_like: 24, humidity: 65, pressure: 1013 },
                weather: [{ description: "clear sky", main: "Clear" }],
                wind: { speed: 5.2, deg: 180 },
                visibility: 10000,
                coord: { lat: 40.7128, lon: -74.0060 }
            },
            "london": {
                name: "London",
                sys: { country: "GB", sunrise: 1634558400, sunset: 1634598000 },
                main: { temp: 15, feels_like: 13, humidity: 78, pressure: 1015 },
                weather: [{ description: "scattered clouds", main: "Clouds" }],
                wind: { speed: 3.8, deg: 220 },
                visibility: 8000,
                coord: { lat: 51.5074, lon: -0.1278 }
            },
            "paris": {
                name: "Paris",
                sys: { country: "FR", sunrise: 1634560800, sunset: 1634600400 },
                main: { temp: 18, feels_like: 17, humidity: 72, pressure: 1012 },
                weather: [{ description: "few clouds", main: "Clouds" }],
                wind: { speed: 2.5, deg: 150 },
                visibility: 9000,
                coord: { lat: 48.8566, lon: 2.3522 }
            },
            "tokyo": {
                name: "Tokyo",
                sys: { country: "JP", sunrise: 1634508000, sunset: 1634548800 },
                main: { temp: 25, feels_like: 27, humidity: 60, pressure: 1018 },
                weather: [{ description: "clear sky", main: "Clear" }],
                wind: { speed: 4.1, deg: 90 },
                visibility: 10000,
                coord: { lat: 35.6762, lon: 139.6503 }
            }
        };
        
        // Weather condition mappings
        this.weatherConditions = {
            'clear sky': { emoji: '☀️', className: 'weather-clear' },
            'few clouds': { emoji: '🌤️', className: 'weather-clouds' },
            'scattered clouds': { emoji: '☁️', className: 'weather-clouds' },
            'broken clouds': { emoji: '☁️', className: 'weather-clouds' },
            'overcast clouds': { emoji: '☁️', className: 'weather-clouds' },
            'shower rain': { emoji: '🌦️', className: 'weather-rain' },
            'rain': { emoji: '🌧️', className: 'weather-rain' },
            'light rain': { emoji: '🌦️', className: 'weather-rain' },
            'moderate rain': { emoji: '🌧️', className: 'weather-rain' },
            'heavy intensity rain': { emoji: '🌧️', className: 'weather-rain' },
            'thunderstorm': { emoji: '⛈️', className: 'weather-thunderstorm' },
            'snow': { emoji: '❄️', className: 'weather-snow' },
            'light snow': { emoji: '🌨️', className: 'weather-snow' },
            'mist': { emoji: '🌫️', className: 'weather-fog' },
            'fog': { emoji: '🌫️', className: 'weather-fog' },
            'haze': { emoji: '🌫️', className: 'weather-fog' }
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateTime();
        this.startTimeUpdate();
        
        // Load default weather data
        setTimeout(() => {
            this.loadDefaultWeather();
        }, 500);
    }

    async loadDefaultWeather() {
        this.showLoading();
        try {
            // Try API first, fallback to sample data
            await this.fetchWeatherByCity('New York');
        } catch (error) {
            console.warn('API failed, using sample data:', error);
            this.updateWeatherDisplay(this.sampleData['new york']);
        }
    }

    bindEvents() {
        // Search functionality
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('city-search');
        
        if (searchBtn) {
            searchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.searchWeather();
            });
        }
        
        if (searchInput) {
            // Ensure search input is functional
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.searchWeather();
                }
            });
            
            // Fix focus issues
            searchInput.addEventListener('focus', () => {
                searchInput.style.outline = 'none';
            });
        }

        // Location button
        const locationBtn = document.getElementById('location-btn');
        if (locationBtn) {
            locationBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.requestLocation();
            });
        }

        // Unit toggle
        const unitToggle = document.getElementById('unit-toggle');
        if (unitToggle) {
            unitToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleUnits();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.refreshWeather();
            });
        }

        // Modal controls
        const closeModal = document.getElementById('close-modal');
        const dismissBtn = document.getElementById('dismiss-btn');
        const retryBtn = document.getElementById('retry-btn');
        const modalOverlay = document.querySelector('.modal-overlay');
        
        if (closeModal) {
            closeModal.addEventListener('click', () => this.hideModal());
        }
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => this.hideModal());
        }
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.hideModal();
                this.loadDefaultWeather();
            });
        }
        if (modalOverlay) {
            modalOverlay.addEventListener('click', () => this.hideModal());
        }

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hideModal();
        });
    }

    async requestLocation() {
        console.log('Location button clicked');
        
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by this browser. Please search for a city manually.');
            return;
        }

        // Show immediate feedback
        const locationBtn = document.getElementById('location-btn');
        if (locationBtn) {
            locationBtn.textContent = '📍 Getting location...';
            locationBtn.disabled = true;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        };

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, options);
            });
            
            const { latitude, longitude } = position.coords;
            this.currentLocation = { lat: latitude, lon: longitude };
            
            this.showLoading();
            await this.fetchWeatherByCoords(latitude, longitude);
        } catch (error) {
            let errorMessage = '';
            
            switch (error.code) {
                case 1: // PERMISSION_DENIED
                    errorMessage = 'Location access denied. Please search for a city manually or enable location permissions in your browser settings.';
                    break;
                case 2: // POSITION_UNAVAILABLE
                    errorMessage = 'Location information is unavailable. Please search for a city manually.';
                    break;
                case 3: // TIMEOUT
                    errorMessage = 'Location request timed out. Please try again or search manually.';
                    break;
                default:
                    errorMessage = 'An unknown error occurred while getting your location. Please search for a city manually.';
                    break;
            }
            
            this.showError(errorMessage);
        } finally {
            // Reset button
            if (locationBtn) {
                locationBtn.textContent = '📍 Use My Location';
                locationBtn.disabled = false;
            }
        }
    }

    async searchWeather() {
        const cityInput = document.getElementById('city-search');
        if (!cityInput) return;
        
        const cityName = cityInput.value.trim();
        console.log('Searching for:', cityName);
        
        if (!cityName) {
            this.showError('Please enter a city name.');
            return;
        }

        this.showLoading();

        try {
            await this.fetchWeatherByCity(cityName);
            cityInput.value = '';
        } catch (error) {
            // Try sample data first
            const normalizedCity = cityName.toLowerCase();
            if (this.sampleData[normalizedCity]) {
                this.updateWeatherDisplay(this.sampleData[normalizedCity]);
                cityInput.value = '';
            } else {
                this.showError(`City "${cityName}" not found. Try: New York, London, Paris, or Tokyo for demo purposes.`);
            }
        }
    }

    async fetchWeatherByCity(cityName) {
        try {
            // Try API first
            const url = `${this.baseUrl}/weather?q=${encodeURIComponent(cityName)}&appid=${this.apiKey}&units=${this.currentUnit}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.updateWeatherDisplay(data);
        } catch (error) {
            // Fallback to sample data
            const normalizedCity = cityName.toLowerCase();
            if (this.sampleData[normalizedCity]) {
                const sampleWeather = { ...this.sampleData[normalizedCity] };
                // Convert to current units if needed
                if (this.currentUnit === 'imperial') {
                    sampleWeather.main.temp = Math.round(sampleWeather.main.temp * 9/5 + 32);
                    sampleWeather.main.feels_like = Math.round(sampleWeather.main.feels_like * 9/5 + 32);
                    sampleWeather.wind.speed = Math.round(sampleWeather.wind.speed * 2.237);
                }
                this.updateWeatherDisplay(sampleWeather);
            } else {
                throw error;
            }
        }
    }

    async fetchWeatherByCoords(lat, lon) {
        try {
            const url = `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${this.currentUnit}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.updateWeatherDisplay(data);
        } catch (error) {
            // Fallback to New York data
            this.updateWeatherDisplay(this.sampleData['new york']);
        }
    }

    updateWeatherDisplay(data) {
        // Store current weather data
        this.currentWeatherData = data;
        
        // Update location info
        document.getElementById('city-name').textContent = data.name;
        document.getElementById('country-name').textContent = data.sys.country;

        // Update main temperature
        const temp = Math.round(data.main.temp);
        const unit = this.currentUnit === 'metric' ? '°C' : '°F';
        document.getElementById('main-temperature').textContent = `${temp}${unit}`;

        // Update feels like temperature
        const feelsLike = Math.round(data.main.feels_like);
        document.getElementById('feels-like').textContent = `Feels like ${feelsLike}${unit}`;

        // Update weather description
        const description = data.weather[0].description;
        document.getElementById('weather-description').textContent = description;

        // Update weather icon
        const condition = this.weatherConditions[description.toLowerCase()] || 
                         this.weatherConditions['clear sky'];
        document.getElementById('weather-emoji').textContent = condition.emoji;

        // Update background
        document.body.className = '';
        document.body.classList.add(condition.className);

        // Update weather details
        document.getElementById('humidity').textContent = `${data.main.humidity}%`;
        
        const windSpeed = this.currentUnit === 'metric' ? 
            `${data.wind.speed} m/s` : 
            `${Math.round(data.wind.speed)} mph`;
        document.getElementById('wind-speed').textContent = windSpeed;

        document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;

        const visibility = data.visibility ? 
            `${Math.round(data.visibility / 1000)} km` : 
            '10 km';
        document.getElementById('visibility').textContent = visibility;

        // Update sunrise/sunset
        document.getElementById('sunrise').textContent = this.formatTime(data.sys.sunrise);
        document.getElementById('sunset').textContent = this.formatTime(data.sys.sunset);

        // Update last updated time
        document.getElementById('last-updated').textContent = 
            `Last updated: ${new Date().toLocaleTimeString()}`;

        // Add fade-in animation
        const weatherCard = document.querySelector('.weather-card');
        if (weatherCard) {
            weatherCard.classList.add('fade-in');
            setTimeout(() => {
                weatherCard.classList.remove('fade-in');
            }, 250);
        }

        this.hideLoading();
        this.startAutoRefresh();
    }

    toggleUnits() {
        console.log('Toggle units clicked, current unit:', this.currentUnit);
        
        // Switch units
        this.currentUnit = this.currentUnit === 'metric' ? 'imperial' : 'metric';
        
        // Update button text
        const unitBtn = document.getElementById('unit-toggle');
        if (unitBtn) {
            unitBtn.textContent = this.currentUnit === 'metric' ? '°C / °F' : '°F / °C';
        }
        
        // If we have current weather data, convert the displayed values
        if (this.currentWeatherData) {
            // Create a copy and convert units
            const convertedData = { ...this.currentWeatherData };
            
            if (this.currentUnit === 'imperial') {
                // Convert from Celsius to Fahrenheit
                convertedData.main.temp = convertedData.main.temp * 9/5 + 32;
                convertedData.main.feels_like = convertedData.main.feels_like * 9/5 + 32;
                convertedData.wind.speed = convertedData.wind.speed * 2.237;
            } else {
                // Convert from Fahrenheit to Celsius
                convertedData.main.temp = (convertedData.main.temp - 32) * 5/9;
                convertedData.main.feels_like = (convertedData.main.feels_like - 32) * 5/9;
                convertedData.wind.speed = convertedData.wind.speed / 2.237;
            }
            
            // Update display with converted values
            this.updateWeatherDisplay(convertedData);
        }
    }

    async refreshWeather() {
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.classList.add('loading');
        }

        try {
            if (this.currentLocation) {
                await this.fetchWeatherByCoords(this.currentLocation.lat, this.currentLocation.lon);
            } else {
                // Refresh current city
                const cityName = document.getElementById('city-name').textContent;
                if (cityName && cityName !== 'Loading...') {
                    await this.fetchWeatherByCity(cityName);
                } else {
                    await this.loadDefaultWeather();
                }
            }
        } catch (error) {
            this.showError('Failed to refresh weather data.');
        } finally {
            if (refreshBtn) {
                refreshBtn.classList.remove('loading');
            }
        }
    }

    startAutoRefresh() {
        // Clear existing interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Set up auto-refresh every 10 minutes
        this.refreshInterval = setInterval(() => {
            this.refreshWeather();
        }, 600000); // 10 minutes
    }

    updateTime() {
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            const now = new Date();
            const timeString = now.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            timeElement.textContent = timeString;
        }
    }

    startTimeUpdate() {
        setInterval(() => this.updateTime(), 1000);
    }

    formatTime(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showLoading() {
        const loading = document.getElementById('loading');
        const mainContent = document.getElementById('main-content');
        
        if (loading) loading.classList.remove('hidden');
        if (mainContent) mainContent.classList.add('hidden');
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        const mainContent = document.getElementById('main-content');
        
        if (loading) loading.classList.add('hidden');
        if (mainContent) mainContent.classList.remove('hidden');
    }

    showError(message) {
        const errorMessage = document.getElementById('error-message');
        const errorModal = document.getElementById('error-modal');
        
        if (errorMessage) errorMessage.textContent = message;
        if (errorModal) errorModal.classList.remove('hidden');
        
        this.hideLoading();
    }

    hideModal() {
        const errorModal = document.getElementById('error-modal');
        if (errorModal) errorModal.classList.add('hidden');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing weather app');
    
    // Initialize the weather app
    window.weatherApp = new WeatherApp();

    // Add keyboard navigation support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });

    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });

    // Handle visibility change for auto-refresh
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && window.weatherApp && window.weatherApp.currentLocation) {
            window.weatherApp.refreshWeather();
        }
    });
});

// Export for potential testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherApp;
}