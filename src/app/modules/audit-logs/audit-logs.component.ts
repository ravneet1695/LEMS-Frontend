import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-audit-logs',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './audit-logs.component.html',
    styleUrls: ['./audit-logs.component.css']
})
export class AuditLogsComponent implements OnInit {
    auditLogs: any[] = [];
    loading = false;
    error = '';

    // Filters
    filterUser = '';
    filterAction = '';
    filterResource = '';
    filterStartDate = '';
    filterEndDate = '';
    filterUserSearch = ''; // New: search by user name/email
    filterOrganization = ''; // New: filter by organization

    // Pagination
    currentPage = 1;
    pageSize = 10; // Will be updated from backend response
    totalPages = 1;
    totalLogs = 0;

    // Actions and Resources
    actions = ['create', 'update', 'delete', 'login', 'logout', 'status_change', 'settings_update', 'role_change', 'permission_change'];
    resources = ['user', 'organization', 'test', 'question', 'group', 'settings', 'role'];
    organizations: any[] = []; // List of organizations for filter
    isSuperAdmin = false; // Track if user is super admin

    // Selected log for details
    selectedLog: any = null;
    showDetailsModal = false;

    // Make Math available in template
    Math = Math;

    // Make Object available in template
    Object = Object;

    // Statistics
    statistics: any = null;
    loadingStats = false;

    // Organization Statistics
    organizationStats: any[] = [];
    loadingOrgStats = false;
    showOrgStats = false; // Toggle for showing organization view

    // Date range presets
    datePresets = [
        { label: 'Today', days: 0 },
        { label: 'Last 7 days', days: 7 },
        { label: 'Last 30 days', days: 30 },
        { label: 'Last 90 days', days: 90 }
    ];

    constructor(private http: HttpClient) { }

    ngOnInit(): void {
        this.loadOrganizations();
        this.loadAuditLogs();
        this.loadStatistics();
        this.loadOrganizationStats();
    }

    loadOrganizations(): void {
        // Check if user is super admin
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        console.log('Current user:', user);
        console.log('User role:', user.role);
        this.isSuperAdmin = user.role === 'super_admin';
        console.log('Is super admin:', this.isSuperAdmin);

        // Only load organizations for super admin
        if (this.isSuperAdmin) {
            console.log('Fetching organizations from API...');
            this.http.get<any>(`${environment.apiUrl}/organizations`).subscribe({
                next: (res) => {
                    console.log('API Response:', res);
                    this.organizations = res.data || [];
                    console.log('Loaded organizations:', this.organizations.length);
                    console.log('Organizations:', this.organizations);
                },
                error: (err) => {
                    console.error('Error loading organizations:', err);
                    console.error('Error status:', err.status);
                    console.error('Error message:', err.message);
                    console.error('Error details:', err.error);
                    // Even if API fails, we still want to show the filter
                    this.organizations = [];
                }
            });
        } else {
            console.log('User is not super admin, skipping organization load');
        }
    }

    loadAuditLogs(): void {
        this.loading = true;
        const params: any = {
            page: this.currentPage,
            limit: this.pageSize
        };

        if (this.filterUser) params.user = this.filterUser;
        if (this.filterAction) params.action = this.filterAction;
        if (this.filterResource) params.resource = this.filterResource;
        if (this.filterOrganization) params.organization = this.filterOrganization;
        if (this.filterStartDate) params.startDate = this.filterStartDate;
        if (this.filterEndDate) params.endDate = this.filterEndDate;
        if (this.filterUserSearch) params.search = this.filterUserSearch;

        this.http.get<any>(`${environment.apiUrl}/audit-logs`, { params }).subscribe({
            next: (res) => {
                this.auditLogs = res.data || [];
                this.totalLogs = res.pagination?.total || 0;
                this.totalPages = res.pagination?.pages || 1;
                this.currentPage = res.pagination?.page || 1;
                if (res.pagination?.limit) {
                    this.pageSize = res.pagination.limit;
                }
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load audit logs';
                console.error('Error loading audit logs:', err);
                this.loading = false;
            }
        });
    }

    loadStatistics(): void {
        this.loadingStats = true;
        this.http.get<any>(`${environment.apiUrl}/audit-logs/stats?days=30`).subscribe({
            next: (res) => {
                this.statistics = res.data;
                this.loadingStats = false;
            },
            error: (err) => {
                console.error('Error loading statistics:', err);
                this.loadingStats = false;
            }
        });
    }

    loadOrganizationStats(): void {
        // Only load for super admin
        if (!this.isSuperAdmin) return;

        this.loadingOrgStats = true;
        this.http.get<any>(`${environment.apiUrl}/audit-logs/by-organization?days=30`).subscribe({
            next: (res) => {
                this.organizationStats = res.data || [];
                this.loadingOrgStats = false;
                console.log('Organization stats loaded:', this.organizationStats.length);
            },
            error: (err) => {
                console.error('Error loading organization stats:', err);
                this.loadingOrgStats = false;
            }
        });
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.loadAuditLogs();
    }

    clearFilters(): void {
        this.filterUser = '';
        this.filterAction = '';
        this.filterResource = '';
        this.filterStartDate = '';
        this.filterEndDate = '';
        this.filterUserSearch = '';
        this.filterOrganization = '';
        this.currentPage = 1;
        this.loadAuditLogs();
    }

    applyDatePreset(days: number): void {
        if (days === 0) {
            // Today
            const today = new Date();
            this.filterStartDate = today.toISOString().split('T')[0];
            this.filterEndDate = today.toISOString().split('T')[0];
        } else {
            // Last N days
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            this.filterStartDate = startDate.toISOString().split('T')[0];
            this.filterEndDate = endDate.toISOString().split('T')[0];
        }
        this.onFilterChange();
    }

    changePage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadAuditLogs();
        }
    }

    get pages(): number[] {
        const maxPages = 10;
        const half = Math.floor(maxPages / 2);
        let start = Math.max(1, this.currentPage - half);
        let end = Math.min(this.totalPages, start + maxPages - 1);

        if (end - start < maxPages - 1) {
            start = Math.max(1, end - maxPages + 1);
        }

        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }

    viewDetails(log: any): void {
        this.selectedLog = log;
        this.showDetailsModal = true;
    }

    closeDetailsModal(): void {
        this.showDetailsModal = false;
        this.selectedLog = null;
    }

    exportToCSV(): void {
        const params: any = {};
        if (this.filterUser) params.user = this.filterUser;
        if (this.filterAction) params.action = this.filterAction;
        if (this.filterResource) params.resource = this.filterResource;
        if (this.filterStartDate) params.startDate = this.filterStartDate;
        if (this.filterEndDate) params.endDate = this.filterEndDate;
        if (this.filterOrganization) params.organization = this.filterOrganization;
        if (this.filterUserSearch) params.search = this.filterUserSearch;

        this.http.get(`${environment.apiUrl}/audit-logs/export`, {
            params,
            responseType: 'blob'
        }).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
            },
            error: (err) => {
                console.error('Export failed:', err);
                this.error = 'Failed to export audit logs';
            }
        });
    }

    formatAction(action: string): string {
        return action.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    formatResource(resource: string): string {
        return resource.charAt(0).toUpperCase() + resource.slice(1);
    }

    formatDate(date: string): string {
        if (!date) return '-';
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getActionBadgeClass(action: string): string {
        const classes: { [key: string]: string } = {
            'create': 'bg-success',
            'update': 'bg-info',
            'delete': 'bg-danger',
            'login': 'bg-primary',
            'logout': 'bg-secondary',
            'status_change': 'bg-warning',
            'settings_update': 'bg-info',
            'role_change': 'bg-warning',
            'permission_change': 'bg-warning'
        };
        return classes[action] || 'bg-secondary';
    }

    getTotalActions(): number {
        if (!this.statistics || !this.statistics.actionStats) {
            return 0;
        }
        return this.statistics.actionStats.reduce((sum: number, stat: any) => sum + stat.count, 0);
    }

    getTopItems(obj: any, limit: number): Array<{ key: string, value: number }> {
        if (!obj) return [];
        return Object.entries(obj)
            .map(([key, value]) => ({ key, value: value as number }))
            .sort((a, b) => b.value - a.value)
            .slice(0, limit);
    }
}
