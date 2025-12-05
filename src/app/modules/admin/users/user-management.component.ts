import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { SweetAlertService } from '../../../core/services/sweetalert.service';

@Component({
    selector: 'app-user-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './user-management.component.html',
    styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
    users: any[] = [];
    organizations: any[] = [];
    showForm = false;
    newUser = {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'learner',
        organization: '',
        profileImage: ''
    };
    roles = ['super_admin', 'org_admin', 'content_creator', 'content_approver', 'manager', 'learner'];
    error = '';
    success = '';
    isEditing = false;
    currentUserId = '';

    // Search and Filter
    searchTerm = '';
    filterRole = '';
    filterOrganization = '';
    filterStatus = 'all';

    // Pagination
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalUsers = 0;

    // Sorting
    sortBy = 'createdAt';
    sortOrder: 'asc' | 'desc' = 'desc';

    // User details modal
    showDetailsModal = false;
    selectedUser: any = null;

    // Make Math available in template
    Math = Math;

    // Statistics
    statistics = {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        roleDistribution: {} as { [key: string]: number },
        recentLogins: 0
    };

    constructor(private http: HttpClient) { }

    ngOnInit(): void {
        this.loadUsers();
        this.loadOrganizations();
    }

    loadUsers(): void {
        let params: any = {
            page: this.currentPage.toString(),
            limit: this.pageSize.toString(),
            sortBy: this.sortBy,
            sortOrder: this.sortOrder
        };

        // Only add optional parameters if they have values
        if (this.searchTerm && this.searchTerm.trim()) {
            params.search = this.searchTerm.trim();
        }
        if (this.filterRole) {
            params.role = this.filterRole;
        }
        if (this.filterOrganization) {
            params.organization = this.filterOrganization;
        }
        if (this.filterStatus && this.filterStatus !== 'all') {
            params.status = this.filterStatus;
        }

        this.http.get<any>(`${environment.apiUrl}/users`, { params }).subscribe({
            next: (res) => {
                this.users = res.data || [];
                this.totalUsers = res.pagination?.total || 0;
                this.totalPages = res.pagination?.pages || 1;
                this.calculateStatistics();
            },
            error: (err) => {
                this.error = 'Failed to load users';
                console.error('Error loading users:', err);
                this.users = [];
            }
        });
    }

    calculateStatistics(): void {
        // Get all users without filters for accurate statistics
        this.http.get<any>(`${environment.apiUrl}/users`, {
            params: { page: '1', limit: '1000' }
        }).subscribe({
            next: (res) => {
                const allUsers = res.data || [];

                this.statistics.totalUsers = allUsers.length;
                this.statistics.activeUsers = allUsers.filter((u: any) => u.isActive).length;
                this.statistics.inactiveUsers = allUsers.filter((u: any) => !u.isActive).length;

                // Calculate role distribution
                this.statistics.roleDistribution = {};
                allUsers.forEach((user: any) => {
                    if (user.role) {
                        this.statistics.roleDistribution[user.role] =
                            (this.statistics.roleDistribution[user.role] || 0) + 1;
                    }
                });

                // Calculate recent logins (last 7 days)
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                this.statistics.recentLogins = allUsers.filter((u: any) =>
                    u.lastLogin && new Date(u.lastLogin) > sevenDaysAgo
                ).length;
            },
            error: (err) => {
                console.error('Error calculating statistics:', err);
            }
        });
    }

    loadOrganizations(): void {
        this.http.get<any>(`${environment.apiUrl}/organizations`).subscribe({
            next: (res) => {
                this.organizations = res.data;
            },
            error: (err) => {
                console.error('Failed to load organizations', err);
            }
        });
    }

    onSearch(): void {
        this.currentPage = 1;
        this.loadUsers();
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.loadUsers();
    }

    onSort(field: string): void {
        if (this.sortBy === field) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = field;
            this.sortOrder = 'asc';
        }
        this.loadUsers();
    }

    changePage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadUsers();
        }
    }

    get pages(): number[] {
        return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    submitForm(): void {
        if (this.isEditing) {
            this.updateUser();
        } else {
            this.createUser();
        }
    }

    createUser(): void {
        if (!this.validateForm()) return;

        this.http.post<any>(`${environment.apiUrl}/users`, this.newUser).subscribe({
            next: (res) => {
                this.success = 'User created successfully';
                this.finalizeSubmission();
            },
            error: (err) => {
                this.handleError(err, 'Failed to create user');
            }
        });
    }

    updateUser(): void {
        if (!this.validateForm(true)) return;

        // Create update payload without password if it's empty
        const updatePayload: any = {
            firstName: this.newUser.firstName,
            lastName: this.newUser.lastName,
            email: this.newUser.email,
            role: this.newUser.role,
            organization: this.newUser.organization,
            profileImage: this.newUser.profileImage
        };

        // Only include password if it's provided
        if (this.newUser.password) {
            updatePayload.password = this.newUser.password;
        }

        this.http.put<any>(`${environment.apiUrl}/users/${this.currentUserId}`, updatePayload).subscribe({
            next: (res) => {
                this.success = 'User updated successfully';
                this.finalizeSubmission();
            },
            error: (err) => {
                this.handleError(err, 'Failed to update user');
            }
        });
    }

    editUser(user: any): void {
        this.isEditing = true;
        this.currentUserId = user._id;
        this.showForm = true;

        this.newUser = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            password: '', // Don't pre-fill password
            role: user.role,
            organization: user.organization?._id || '',
            profileImage: user.profileImage || ''
        };
    }

    async deleteUser(user: any): Promise<void> {
        const confirmed = await SweetAlertService.confirm(
            'Delete User?',
            'This action cannot be undone!',
            'Yes, delete it!'
        );
        if (!confirmed) return;

        this.http.delete<any>(`${environment.apiUrl}/users/${user._id}`).subscribe({
            next: (res) => {
                this.success = 'User deleted successfully';
                this.loadUsers();
                setTimeout(() => this.success = '', 3000);
            },
            error: (err) => {
                this.handleError(err, 'Failed to delete user');
            }
        });
    }

    async toggleUserStatus(user: any): Promise<void> {
        const action = user.isActive ? 'deactivate' : 'activate';
        const confirmed = await SweetAlertService.confirm(
            `${action.charAt(0).toUpperCase() + action.slice(1)} User?`,
            `Are you sure you want to ${action} this user?`
        );
        if (!confirmed) return;

        this.http.patch<any>(`${environment.apiUrl}/users/${user._id}/status`, {}).subscribe({
            next: (res) => {
                this.success = res.message;
                this.loadUsers();
                setTimeout(() => this.success = '', 3000);
            },
            error: (err) => {
                this.handleError(err, `Failed to ${action} user`);
            }
        });
    }

    viewUserDetails(user: any): void {
        this.selectedUser = user;
        this.showDetailsModal = true;
    }

    closeDetailsModal(): void {
        this.showDetailsModal = false;
        this.selectedUser = null;
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

    formatRole(role: string): string {
        return role.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    formatDate(date: string): string {
        if (!date) return 'Never';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    validateForm(isUpdate: boolean = false): boolean {
        if (!this.newUser.firstName || !this.newUser.lastName || !this.newUser.email) {
            this.error = 'Please fill in all required fields';
            return false;
        }
        // Password is required only for create
        if (!isUpdate && !this.newUser.password) {
            this.error = 'Password is required';
            return false;
        }
        return true;
    }

    finalizeSubmission(): void {
        this.showForm = false;
        this.loadUsers();
        this.resetForm();
        this.error = '';
        setTimeout(() => this.success = '', 3000);
    }

    handleError(err: any, defaultMsg: string): void {
        this.error = err.error?.message || defaultMsg;
        console.error(err);
        setTimeout(() => this.error = '', 5000);
    }

    resetForm(): void {
        this.isEditing = false;
        this.currentUserId = '';
        this.newUser = {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            role: 'learner',
            organization: '',
            profileImage: ''
        };
    }

    getMostCommonRole(): string {
        if (!this.statistics.roleDistribution || Object.keys(this.statistics.roleDistribution).length === 0) {
            return 'N/A';
        }

        const sortedRoles = Object.entries(this.statistics.roleDistribution)
            .sort(([, a], [, b]) => b - a);

        return sortedRoles.length > 0 ? sortedRoles[0][0] : 'N/A';
    }

    getMostCommonRoleCount(): number {
        if (!this.statistics.roleDistribution || Object.keys(this.statistics.roleDistribution).length === 0) {
            return 0;
        }

        const sortedRoles = Object.entries(this.statistics.roleDistribution)
            .sort(([, a], [, b]) => b - a);

        return sortedRoles.length > 0 ? sortedRoles[0][1] : 0;
    }

    toggleForm(): void {
        this.showForm = !this.showForm;
        if (!this.showForm) {
            this.resetForm();
        }
    }
}
