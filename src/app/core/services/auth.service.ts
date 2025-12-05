import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../../shared/models/user.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = `${environment.apiUrl}/auth`;
    private currentUserSubject: BehaviorSubject<User | null>;
    public currentUser: Observable<User | null>;

    constructor(private http: HttpClient) {
        const storedUser = localStorage.getItem('currentUser');
        this.currentUserSubject = new BehaviorSubject<User | null>(
            storedUser ? JSON.parse(storedUser) : null
        );
        this.currentUser = this.currentUserSubject.asObservable();
    }

    public get currentUserValue(): User | null {
        return this.currentUserSubject.value;
    }

    login(credentials: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
            tap(async response => {
                if (response.success) {
                    localStorage.setItem('currentUser', JSON.stringify(response.data.user));
                    localStorage.setItem('token', response.data.token);
                    localStorage.setItem('refreshToken', response.data.refreshToken);
                    this.currentUserSubject.next(response.data.user);

                    // Capture and store IP address and location
                    await this.captureAndStoreLocationData();
                }
            })
        );
    }

    register(data: RegisterRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
            tap(response => {
                if (response.success) {
                    localStorage.setItem('currentUser', JSON.stringify(response.data.user));
                    localStorage.setItem('token', response.data.token);
                    localStorage.setItem('refreshToken', response.data.refreshToken);
                    this.currentUserSubject.next(response.data.user);
                }
            })
        );
    }

    logout(): void {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userIP');
        localStorage.removeItem('userLocation');
        this.currentUserSubject.next(null);
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    hasRole(roles: string[]): boolean {
        const user = this.currentUserValue;
        return user ? roles.includes(user.role) : false;
    }

    getCurrentUser(): User | null {
        return this.currentUserValue;
    }

    /**
     * Capture and store IP address and location data
     * Called after successful login
     */
    private async captureAndStoreLocationData(): Promise<void> {
        try {
            // Get IP address from a public API
            const ipData = await this.getPublicIP();
            if (ipData) {
                localStorage.setItem('userIP', ipData.ip);
                console.log('IP Address stored:', ipData.ip);
            }

            // Get browser location (city, state)
            const location = await this.getBrowserLocation();
            if (location) {
                localStorage.setItem('userLocation', location);
                console.log('Location stored:', location);
            }
        } catch (error) {
            console.error('Error capturing location data:', error);
        }
    }

    /**
     * Get public IP address from ipify API
     */
    private async getPublicIP(): Promise<{ ip: string } | null> {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting IP:', error);
            return null;
        }
    }

    /**
     * Get browser location using Geolocation API
     */
    private async getBrowserLocation(): Promise<string | null> {
        try {
            // Check if geolocation is supported
            if (!navigator.geolocation) {
                return null;
            }

            // Get coordinates
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: false,
                    timeout: 5000,
                    maximumAge: 300000
                });
            });

            const { latitude, longitude } = position.coords;

            // Reverse geocode to get city and state
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
                {
                    headers: {
                        'User-Agent': 'AuditLogApp/1.0'
                    }
                }
            );

            const data = await response.json();
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
            console.error('Error getting browser location:', error);
            return null;
        }
    }

    /**
     * Get stored IP address
     */
    getStoredIP(): string | null {
        return localStorage.getItem('userIP');
    }

    /**
     * Get stored location
     */
    getStoredLocation(): string | null {
        return localStorage.getItem('userLocation');
    }
}
