import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { User, LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '../models/api.models';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    private apiUrl = environment.apiUrl;

    constructor(
        private http: HttpClient,
        private router: Router
    ) {
        this.loadUserFromStorage();
    }

    private loadUserFromStorage(): void {
        const userJson = localStorage.getItem(environment.storageKeys.user);
        if (userJson) {
            try {
                const user = JSON.parse(userJson);
                this.currentUserSubject.next(user);
            } catch (error) {
                console.error('Error parsing user from storage', error);
            }
        }
    }

    register(data: RegisterRequest): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.apiUrl}/auth/register`, data);
    }

    login(credentials: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
            tap(response => {
                if (response.success && response.data) {
                    this.setSession(response.data);
                }
            })
        );
    }

    logout(): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.apiUrl}/auth/logout`, {}).pipe(
            tap(() => {
                this.clearSession();
                this.router.navigate(['/login']);
            })
        );
    }

    refreshToken(): Observable<AuthResponse> {
        const refreshToken = this.getRefreshToken();
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh-token`, { refreshToken }).pipe(
            tap(response => {
                if (response.success && response.data) {
                    this.setTokens(response.data.accessToken, response.data.refreshToken);
                }
            })
        );
    }

    getCurrentUser(): Observable<ApiResponse<{ user: User }>> {
        return this.http.get<ApiResponse<{ user: User }>>(`${this.apiUrl}/auth/me`).pipe(
            tap(response => {
                if (response.success && response.data) {
                    this.currentUserSubject.next(response.data.user);
                    localStorage.setItem(environment.storageKeys.user, JSON.stringify(response.data.user));
                }
            })
        );
    }

    private setSession(data: { user: User; accessToken: string; refreshToken: string }): void {
        localStorage.setItem(environment.storageKeys.accessToken, data.accessToken);
        localStorage.setItem(environment.storageKeys.refreshToken, data.refreshToken);
        localStorage.setItem(environment.storageKeys.user, JSON.stringify(data.user));
        this.currentUserSubject.next(data.user);
    }

    private setTokens(accessToken: string, refreshToken: string): void {
        localStorage.setItem(environment.storageKeys.accessToken, accessToken);
        localStorage.setItem(environment.storageKeys.refreshToken, refreshToken);
    }

    private clearSession(): void {
        localStorage.removeItem(environment.storageKeys.accessToken);
        localStorage.removeItem(environment.storageKeys.refreshToken);
        localStorage.removeItem(environment.storageKeys.user);
        this.currentUserSubject.next(null);
    }

    getAccessToken(): string | null {
        return localStorage.getItem(environment.storageKeys.accessToken);
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(environment.storageKeys.refreshToken);
    }

    isAuthenticated(): boolean {
        return !!this.getAccessToken();
    }

    getCurrentUserValue(): User | null {
        return this.currentUserSubject.value;
    }

    hasRole(role: string): boolean {
        const user = this.getCurrentUserValue();
        return user?.roles?.some(r => r.name === role) || false;
    }

    hasAnyRole(roles: string[]): boolean {
        return roles.some(role => this.hasRole(role));
    }
}
