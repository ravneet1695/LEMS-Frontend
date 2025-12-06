/**
 * Example: How to use Geolocation Service with Audit Logs
 * 
 * This file demonstrates how to capture user's browser location
 * and send it with audit log requests
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GeolocationService } from './geolocation.service';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuditLogService {

    constructor(
        private http: HttpClient,
        private geolocationService: GeolocationService
    ) { }

    /**
     * Create audit log with browser location
     * @param action - The action performed (create, update, delete, etc.)
     * @param resource - The resource type (user, test, question, etc.)
     * @param resourceId - The ID of the resource
     * @param description - Description of the action
     * @param changes - Optional changes object
     */
    async createAuditLog(
        action: string,
        resource: string,
        resourceId?: string,
        description?: string,
        changes?: any
    ): Promise<void> {
        try {
            // Get user's current location from browser
            const location = await this.geolocationService.getCurrentLocation();

            // Prepare audit log data
            const auditData: any = {
                action,
                resource,
                description
            };

            // Add optional fields
            if (resourceId) auditData.resourceId = resourceId;
            if (changes) auditData.changes = changes;
            if (location) auditData.location = location; // Browser location

            // Send to backend
            this.http.post(`${environment.apiUrl}/audit-logs`, auditData).subscribe({
                next: () => console.log('Audit log created'),
                error: (err) => console.error('Failed to create audit log:', err)
            });
        } catch (error) {
            console.error('Error creating audit log:', error);
        }
    }

    /**
     * Create audit log without waiting for location
     * (faster, but may not have accurate location)
     */
    createAuditLogQuick(
        action: string,
        resource: string,
        resourceId?: string,
        description?: string,
        changes?: any
    ): void {
        const auditData: any = {
            action,
            resource,
            description
        };

        if (resourceId) auditData.resourceId = resourceId;
        if (changes) auditData.changes = changes;

        // Backend will use IP-based location as fallback
        this.http.post(`${environment.apiUrl}/audit-logs`, auditData).subscribe({
            next: () => console.log('Audit log created'),
            error: (err) => console.error('Failed to create audit log:', err)
        });
    }
}

