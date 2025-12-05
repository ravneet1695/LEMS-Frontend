import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class GeolocationService {

    /**
     * Get user's current location using browser Geolocation API
     * Returns city and state using reverse geocoding
     */
    async getCurrentLocation(): Promise<string | null> {
        try {
            // Check if geolocation is supported
            if (!navigator.geolocation) {
                console.warn('Geolocation is not supported by this browser');
                return null;
            }

            // Get coordinates from browser
            const position = await this.getPosition();
            const { latitude, longitude } = position.coords;

            // Reverse geocode to get city and state
            const location = await this.reverseGeocode(latitude, longitude);
            return location;
        } catch (error) {
            console.error('Error getting location:', error);
            return null;
        }
    }

    /**
     * Get position from browser Geolocation API
     */
    private getPosition(): Promise<GeolocationPosition> {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => resolve(position),
                (error) => reject(error),
                {
                    enableHighAccuracy: false,
                    timeout: 5000,
                    maximumAge: 300000 // Cache for 5 minutes
                }
            );
        });
    }

    /**
     * Reverse geocode coordinates to city and state
     * Uses Nominatim (OpenStreetMap) free API
     */
    private async reverseGeocode(lat: number, lon: number): Promise<string | null> {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
                {
                    headers: {
                        'User-Agent': 'AuditLogApp/1.0' // Required by Nominatim
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Geocoding failed');
            }

            const data = await response.json();

            // Extract city and state from address
            const address = data.address;
            const city = address.city || address.town || address.village || address.county;
            const state = address.state || address.region;

            if (city && state) {
                return `${city}, ${state}`;
            } else if (city) {
                return city;
            } else if (state) {
                return state;
            }

            return null;
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return null;
        }
    }

    /**
     * Request permission and get location
     * Shows user-friendly messages
     */
    async requestLocation(): Promise<string | null> {
        try {
            const location = await this.getCurrentLocation();
            return location;
        } catch (error: any) {
            if (error.code === 1) {
                console.warn('User denied location permission');
            } else if (error.code === 2) {
                console.warn('Location unavailable');
            } else if (error.code === 3) {
                console.warn('Location request timeout');
            }
            return null;
        }
    }
}
