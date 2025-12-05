import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuditLogService {

    constructor(private http: HttpClient) { }

    /**
     * Create audit log with stored location and IP
     * Uses location and IP from localStorage (captured during login)
     */
    createAuditLog(
        action: string,
        resource: string,
        resourceId?: string,
        description?: string,
        changes?: any
    ): void {
        // Get stored location and IP from localStorage
        const location = localStorage.getItem('userLocation');
        const ipAddress = localStorage.getItem('userIP');

        // Prepare audit log data
        const auditData: any = {
            action,
            resource,
            description
        };

        // Add optional fields
        if (resourceId) auditData.resourceId = resourceId;
        if (changes) auditData.changes = changes;
        if (location) auditData.location = location;
        if (ipAddress) auditData.ipAddress = ipAddress; // NEW: Include IP from localStorage

        // Log the data being sent
        console.log('Creating audit log:', {
            ...auditData,
            storedIP: ipAddress,
            storedLocation: location
        });

        // Send to backend
        this.http.post(`${environment.apiUrl}/audit-logs`, auditData).subscribe({
            next: () => console.log('Audit log created successfully'),
            error: (err) => console.error('Failed to create audit log:', err)
        });
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
