import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    user: any;
    loading = true;
    error = '';

    // Dashboard statistics
    stats: any = null;
    userRole = '';

    constructor(
        private authService: AuthService,
        private http: HttpClient
    ) { }

    ngOnInit(): void {
        this.authService.currentUser.subscribe(user => {
            this.user = user;
            this.userRole = user?.role || '';
            if (user) {
                this.loadDashboardStats();
            }
        });
    }

    loadDashboardStats(): void {
        this.loading = true;
        this.error = '';

        this.http.get<any>(`${environment.apiUrl}/dashboard/stats`).subscribe({
            next: (res) => {
                this.loading = false;
                this.stats = res.data;
                console.log('Dashboard stats:', this.stats);
            },
            error: (err) => {
                this.loading = false;
                this.error = err.error?.message || 'Failed to load dashboard statistics';
                console.error('Dashboard error:', err);
            }
        });
    }

    formatRole(role: string): string {
        if (!role) return '';
        return role.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    formatDate(date: string): string {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getRoleBadgeClass(role: string): string {
        const roleClasses: { [key: string]: string } = {
            'super_admin': 'bg-danger',
            'org_admin': 'bg-primary',
            'content_creator': 'bg-info',
            'content_approver': 'bg-warning',
            'manager': 'bg-success',
            'learner': 'bg-secondary'
        };
        return roleClasses[role] || 'bg-secondary';
    }

    logout(): void {
        this.authService.logout();
    }
}
