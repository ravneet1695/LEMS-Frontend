import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { SweetAlertService } from '../../../core/services/sweetalert.service';

@Component({
    selector: 'app-organization-users',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './organization-users.component.html',
    styleUrls: ['./organization-users.component.css']
})
export class OrganizationUsersComponent implements OnInit {
    organizationId: string = '';
    organization: any = null;
    users: any[] = [];
    loading = true;
    error = '';
    success = '';

    // Current user info
    currentUser: any = null;

    // Filters
    searchTerm = '';
    filterRole = '';
    filterStatus = 'all';
    selectedOrganization = ''; // For super_admin to filter by organization

    // Pagination
    currentPage = 1;
    pageSize = 20;
    totalPages = 1;
    totalUsers = 0;

    // Options
    roles = ['org_admin', 'content_creator', 'content_approver', 'manager', 'learner'];
    organizations: any[] = []; // List of organizations for super_admin
    departments: any[] = [];
    statuses = [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
    ];

    // User form
    showUserForm = false;
    isEditing = false;
    userForm = {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'learner',
        organization: '',
        mobile: '',
        department: ''
    };
    selectedProfileImage: File | null = null;
    profileImagePreview: string | null = null;

    // Bulk upload
    showBulkUploadModal = false;
    bulkUploadFile: File | null = null;
    bulkUploadResults: any = null;
    bulkUploadLoading = false;

    // Selected user for details
    selectedUser: any = null;
    showDetailsModal = false;

    Math = Math;

    constructor(
        private http: HttpClient,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        // Load current user info first
        this.loadCurrentUser();

        // Get organization ID from route params (optional)
        this.route.params.subscribe(params => {
            this.organizationId = params['id'];
            if (this.organizationId) {
                this.loadOrganization();
            }
            // Always load users (backend will filter based on user role and org)
            this.loadUsers();
        });
    }

    loadCurrentUser(): void {
        this.http.get<any>(`${environment.apiUrl}/auth/me`).subscribe({
            next: (res) => {
                this.currentUser = res.data;
                // Load organizations if super_admin
                if (this.currentUser.role === 'super_admin') {
                    this.loadOrganizations();
                }
            },
            error: (err) => {
                console.error('Error loading current user:', err);
            }
        });
    }

    loadOrganizations(): void {
        this.http.get<any>(`${environment.apiUrl}/organizations`).subscribe({
            next: (res) => {
                this.organizations = res.data || [];
            },
            error: (err) => {
                console.error('Error loading organizations:', err);
            }
        });
    }

    loadOrganization(): void {
        this.http.get<any>(`${environment.apiUrl}/organizations/${this.organizationId}`).subscribe({
            next: (res) => {
                this.organization = res.data;
                this.loadDepartments(); // Load departments for this organization
            },
            error: (err) => {
                this.error = 'Failed to load organization details';
                console.error('Error loading organization:', err);
            }
        });
    }

    loadDepartments(): void {
        this.http.get<any>(`${environment.apiUrl}/departments`, {
            params: { organization: this.organizationId, status: 'active' }
        }).subscribe({
            next: (res) => {
                this.departments = res.data || [];
            },
            error: (err) => {
                console.error('Error loading departments:', err);
            }
        });
    }

    loadUsers(): void {
        this.loading = true;
        const params: any = {
            page: this.currentPage,
            limit: this.pageSize
        };

        // Use selectedOrganization if set (for super_admin filtering)
        // Otherwise use organizationId from route params
        const orgFilter = this.selectedOrganization || this.organizationId;
        if (orgFilter) {
            params.organization = orgFilter;
        }

        if (this.searchTerm) params.search = this.searchTerm;
        if (this.filterRole) params.role = this.filterRole;
        if (this.filterStatus !== 'all') params.status = this.filterStatus;

        this.http.get<any>(`${environment.apiUrl}/users`, { params }).subscribe({
            next: (res) => {
                this.users = res.data || [];
                this.totalUsers = res.pagination?.total || 0;
                this.totalPages = res.pagination?.pages || 1;
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load users';
                console.error('Error loading users:', err);
                this.loading = false;
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

    clearFilters(): void {
        this.searchTerm = '';
        this.filterRole = '';
        this.filterStatus = 'all';
        this.selectedOrganization = '';
        this.currentPage = 1;
        this.loadUsers();
    }

    changePage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadUsers();
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

    openUserForm(): void {
        this.isEditing = false;
        this.userForm = {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            role: 'learner',
            organization: this.organizationId,
            mobile: '',
            department: ''
        };
        this.showUserForm = true;
    }

    editUser(user: any): void {
        this.isEditing = true;
        this.userForm = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            password: '',
            role: user.role,
            organization: this.organizationId,
            mobile: user.mobile || '',
            department: user.department?._id || ''
        };
        this.selectedUser = user;
        this.showUserForm = true;
    }

    saveUser(): void {
        if (this.isEditing && this.selectedUser) {
            // Update user
            const updateData: any = {
                firstName: this.userForm.firstName,
                lastName: this.userForm.lastName,
                email: this.userForm.email,
                role: this.userForm.role,
                mobile: this.userForm.mobile || null,
                department: this.userForm.department || null
            };

            if (this.userForm.password) {
                updateData.password = this.userForm.password;
            }

            this.http.put(`${environment.apiUrl}/users/${this.selectedUser._id}`, updateData).subscribe({
                next: () => {
                    this.success = 'User updated successfully';
                    this.closeUserForm();
                    this.loadUsers();
                    setTimeout(() => this.success = '', 3000);
                },
                error: (err) => {
                    this.error = err.error?.message || 'Failed to update user';
                    setTimeout(() => this.error = '', 3000);
                }
            });
        } else {
            // Create new user - send entire userForm
            const createData = {
                ...this.userForm,
                mobile: this.userForm.mobile || null,
                department: this.userForm.department || null
            };

            this.http.post(`${environment.apiUrl}/users`, createData).subscribe({
                next: () => {
                    this.success = 'User created successfully';
                    this.closeUserForm();
                    this.loadUsers();
                    setTimeout(() => this.success = '', 3000);
                },
                error: (err) => {
                    this.error = err.error?.message || 'Failed to create user';
                    setTimeout(() => this.error = '', 3000);
                }
            });
        }
    }

    closeUserForm(): void {
        this.showUserForm = false;
        this.isEditing = false;
        this.selectedUser = null;
    }

    onOrganizationChange(): void {
        // Load departments for the selected organization
        if (this.userForm.organization) {
            this.http.get<any>(`${environment.apiUrl}/departments`, {
                params: { organization: this.userForm.organization, status: 'active' }
            }).subscribe({
                next: (res) => {
                    this.departments = res.data || [];
                },
                error: (err) => {
                    console.error('Error loading departments:', err);
                    this.departments = [];
                }
            });
        } else {
            this.departments = [];
            this.userForm.department = '';
        }
    }

    viewUser(user: any): void {
        this.selectedUser = user;
        this.showDetailsModal = true;
    }

    closeDetailsModal(): void {
        this.showDetailsModal = false;
        this.selectedUser = null;
    }

    async toggleUserStatus(user: any): Promise<void> {
        const action = user.isActive ? 'deactivate' : 'activate';
        const confirmed = await SweetAlertService.confirm(
            `${action.charAt(0).toUpperCase() + action.slice(1)} User?`,
            `Are you sure you want to ${action} this user?`
        );
        if (!confirmed) return;

        this.http.patch(`${environment.apiUrl}/users/${user._id}/status`, {}).subscribe({
            next: () => {
                this.success = `User ${action}d successfully`;
                this.loadUsers();
                setTimeout(() => this.success = '', 3000);
            },
            error: (err) => {
                this.error = err.error?.message || `Failed to ${action} user`;
                setTimeout(() => this.error = '', 3000);
            }
        });
    }

    async deleteUser(user: any): Promise<void> {
        const confirmed = await SweetAlertService.confirm(
            'Delete User?',
            'This action cannot be undone!',
            'Yes, delete it!'
        );
        if (!confirmed) return;

        this.http.delete(`${environment.apiUrl}/users/${user._id}`).subscribe({
            next: () => {
                this.success = 'User deleted successfully';
                this.loadUsers();
                setTimeout(() => this.success = '', 3000);
            },
            error: (err) => {
                this.error = err.error?.message || 'Failed to delete user';
                setTimeout(() => this.error = '', 3000);
            }
        });
    }

    formatRole(role: string): string {
        return role.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    getRoleBadgeClass(role: string): string {
        const classes: { [key: string]: string } = {
            'super_admin': 'bg-danger',
            'org_admin': 'bg-primary',
            'content_creator': 'bg-info',
            'content_approver': 'bg-success',
            'manager': 'bg-warning',
            'learner': 'bg-secondary'
        };
        return classes[role] || 'bg-secondary';
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}
