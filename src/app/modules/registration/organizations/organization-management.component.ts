import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { SweetAlertService } from '../../../core/services/sweetalert.service';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
    selector: 'app-organization-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './organization-management.component.html',
    styleUrls: ['./organization-management.component.css']
})
export class OrganizationManagementComponent implements OnInit {
    organizations: any[] = [];
    filteredOrganizations: any[] = [];
    showForm = false;
    selectedLogoFile: File | null = null;
    logoPreview: string | null = null;
    newOrg = {
        name: '',
        description: '',
        logo: '',
        websiteUrl: '',
        type: 'Corporate',
        alias: '',
        code: '',
        adminDetails: {
            firstName: '',
            lastName: '',
            email: '',
            password: ''
        }
    };
    orgTypes = ['Corporate', 'Educational', 'Non-Profit', 'Other'];
    error = '';
    success = '';

    isEditing = false;
    currentOrgId = '';

    // Filter properties
    searchTerm = '';
    filterType = '';
    filterStatus = '';

    // Pagination
    loading = false;
    currentPage: number = 1;
    pageSize: number = 3; // Reduced from 10 to 3 for easier testing
    totalPages: number = 0;
    totalOrganizations: number = 0;

    constructor(
        private http: HttpClient,
        private settingsService: SettingsService
    ) { }

    async ngOnInit(): Promise<void> {
        // Load settings first
        await this.settingsService.loadSettings();
        this.pageSize = this.settingsService.getTablePageSize();

        this.loadOrganizations();
    }

    loadOrganizations() {
        this.loading = true;
        const params: any = {
            page: this.currentPage,
            limit: this.pageSize
        };

        this.http.get<any>(`${environment.apiUrl}/organizations`, { params }).subscribe({
            next: (res) => {
                this.organizations = res.data || [];
                this.filteredOrganizations = this.organizations;
                this.totalOrganizations = res.pagination?.total || 0;
                this.totalPages = res.pagination?.pages || 0;
                this.currentPage = res.pagination?.page || 1;
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load organizations';
                console.error('Error loading organizations:', err);
                this.loading = false;
            }
        });
    }

    changePage(page: number) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadOrganizations();
        }
    }
    applyFilters(): void {
        let filtered = [...this.organizations];

        // Search filter
        if (this.searchTerm) {
            const search = this.searchTerm.toLowerCase();
            filtered = filtered.filter(org =>
                org.name.toLowerCase().includes(search) ||
                org.code.toLowerCase().includes(search) ||
                org.description?.toLowerCase().includes(search) ||
                org.admin?.email?.toLowerCase().includes(search)
            );
        }

        // Type filter
        if (this.filterType) {
            filtered = filtered.filter(org => org.type === this.filterType);
        }

        // Status filter
        if (this.filterStatus) {
            const isActive = this.filterStatus === 'active';
            filtered = filtered.filter(org => org.isActive === isActive);
        }

        this.filteredOrganizations = filtered;
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.filterType = '';
        this.filterStatus = '';
        this.applyFilters();
    }

    hasActiveFilters(): boolean {
        return !!(this.searchTerm || this.filterType || this.filterStatus);
    }


    submitForm(): void {
        if (this.isEditing) {
            this.updateOrganization();
        } else {
            this.createOrganization();
        }
    }

    createOrganization(): void {
        if (!this.validateForm()) return;

        const formData = new FormData();
        formData.append('name', this.newOrg.name);
        formData.append('description', this.newOrg.description);
        formData.append('websiteUrl', this.newOrg.websiteUrl);
        formData.append('type', this.newOrg.type);
        formData.append('alias', this.newOrg.alias);
        formData.append('code', this.newOrg.code);
        formData.append('adminDetails', JSON.stringify(this.newOrg.adminDetails));

        // Add logo file if selected
        if (this.selectedLogoFile) {
            formData.append('logo', this.selectedLogoFile);
        }

        this.http.post<any>(`${environment.apiUrl}/organizations`, formData).subscribe({
            next: (res) => {
                this.success = 'Organization created successfully';
                this.finalizeSubmission();
            },
            error: (err) => {
                this.handleError(err, 'Failed to create organization');
            }
        });
    }

    updateOrganization(): void {
        if (!this.validateForm()) return;

        const formData = new FormData();
        formData.append('name', this.newOrg.name);
        formData.append('description', this.newOrg.description);
        formData.append('websiteUrl', this.newOrg.websiteUrl);
        formData.append('type', this.newOrg.type);
        formData.append('alias', this.newOrg.alias);
        formData.append('code', this.newOrg.code);

        // Add logo file if a new one is selected
        if (this.selectedLogoFile) {
            formData.append('logo', this.selectedLogoFile);
        }

        this.http.put<any>(`${environment.apiUrl}/organizations/${this.currentOrgId}`, formData).subscribe({
            next: (res) => {
                this.success = 'Organization updated successfully';
                this.finalizeSubmission();
            },
            error: (err) => {
                this.handleError(err, 'Failed to update organization');
            }
        });
    }

    editOrganization(org: any): void {
        this.isEditing = true;
        this.currentOrgId = org._id;
        this.showForm = true;

        // Explicitly populate all form fields
        this.newOrg = {
            name: org.name || '',
            description: org.description || '',
            logo: org.logo || '',
            websiteUrl: org.websiteUrl || '',
            type: org.type || 'Corporate',
            alias: org.alias || '',
            code: org.code || '',
            adminDetails: {
                firstName: org.admin?.firstName || '',
                lastName: org.admin?.lastName || '',
                email: org.admin?.email || '',
                password: '' // Don't pre-fill password
            }
        };

        // Set logo preview if organization has a logo
        if (org.logo) {
            this.logoPreview = `http://localhost:5003${org.logo}`;
        } else {
            this.logoPreview = null;
        }

        // Clear selected file since we're editing
        this.selectedLogoFile = null;
    }

    async deleteOrganization(org: any): Promise<void> {
        const confirmed = await SweetAlertService.confirm(
            'Delete Organization?',
            'This action cannot be undone!',
            'Yes, delete it!'
        );
        if (!confirmed) return;

        this.http.delete<any>(`${environment.apiUrl}/organizations/${org._id}`).subscribe({
            next: (res) => {
                this.success = 'Organization deleted successfully';
                this.loadOrganizations();
                // Clear success message after 3 seconds
                setTimeout(() => this.success = '', 3000);
            },
            error: (err) => {
                this.handleError(err, 'Failed to delete organization');
            }
        });
    }

    validateForm(): boolean {
        if (!this.newOrg.name || !this.newOrg.code || !this.newOrg.type) {
            this.error = 'Please fill in all required fields';
            return false;
        }
        // Check if logo is uploaded (for new organizations) or already exists (for editing)
        if (!this.isEditing && !this.selectedLogoFile) {
            this.error = 'Please upload an organization logo';
            return false;
        }
        // Admin details validation only for create
        if (!this.isEditing) {
            if (!this.newOrg.adminDetails.email || !this.newOrg.adminDetails.password ||
                !this.newOrg.adminDetails.firstName || !this.newOrg.adminDetails.lastName) {
                this.error = 'Please fill in all required admin fields';
                return false;
            }
        }
        return true;
    }

    finalizeSubmission(): void {
        this.showForm = false;
        this.loadOrganizations();
        this.resetForm();
        this.error = '';
        // Clear success message after 3 seconds
        setTimeout(() => this.success = '', 3000);
    }

    handleError(err: any, defaultMsg: string): void {
        this.error = err.error?.message || defaultMsg;
        console.error(err);
        // Clear error message after 5 seconds
        setTimeout(() => this.error = '', 5000);
    }

    resetForm(): void {
        this.isEditing = false;
        this.currentOrgId = '';
        this.selectedLogoFile = null;
        this.logoPreview = null;
        this.newOrg = {
            name: '',
            description: '',
            logo: '',
            websiteUrl: '',
            type: 'Corporate',
            alias: '',
            code: this.generateOrgCode(),
            adminDetails: {
                firstName: '',
                lastName: '',
                email: '',
                password: ''
            }
        };
    }

    generateOrgCode(): string {
        return 'ORG' + Math.floor(1000 + Math.random() * 9000) + Date.now().toString().slice(-4);
    }

    toggleForm(): void {
        this.showForm = !this.showForm;
        if (this.showForm) {
            if (!this.isEditing && !this.newOrg.code) {
                this.newOrg.code = this.generateOrgCode();
            }
        } else {
            this.resetForm();
        }
    }

    onLogoSelect(event: any): void {
        const file = event.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                this.error = 'Please select an image file';
                return;
            }

            this.selectedLogoFile = file;

            // Create preview
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.logoPreview = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    removeLogo(): void {
        this.selectedLogoFile = null;
        this.logoPreview = null;
        this.newOrg.logo = '';
    }
}
