import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { SweetAlertService } from '../../../core/services/sweetalert.service';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './departments.html',
  styleUrls: ['./departments.css']
})
export class DepartmentsComponent implements OnInit {
  departments: any[] = [];
  organizations: any[] = [];
  loading = true;
  error = '';
  success = '';

  // Filters
  searchTerm = '';
  selectedOrganization = '';
  filterStatus = 'all';

  // Pagination
  currentPage: number = 1;
  pageSize: number = 3; // Reduced from 10 to 3 for easier testing
  totalPages: number = 0;
  totalDepartments: number = 0;

  // Department form
  showDepartmentForm = false;
  isEditing = false;
  departmentForm = {
    name: '',
    displayName: '',
    description: '',
    organization: ''
  };
  selectedDepartment: any = null;

  constructor(
    private http: HttpClient,
    private settingsService: SettingsService
  ) { }

  async ngOnInit(): Promise<void> {
    // Load settings first
    await this.settingsService.loadSettings();
    this.pageSize = this.settingsService.getTablePageSize();

    this.loadOrganizations();
    this.loadDepartments();
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

  loadDepartments(): void {
    this.loading = true;
    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };

    if (this.selectedOrganization) params.organization = this.selectedOrganization;
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.filterStatus !== 'all') {
      params.isActive = this.filterStatus === 'active';
    }

    this.http.get<any>(`${environment.apiUrl}/departments`, { params }).subscribe({
      next: (res) => {
        this.departments = res.data || [];
        this.totalDepartments = res.pagination?.total || 0;
        this.totalPages = res.pagination?.pages || 0;
        this.currentPage = res.pagination?.page || 1;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load departments';
        console.error('Error loading departments:', err);
        this.loading = false;
      }
    });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadDepartments();
    }
  }

  onFilterChange(): void {
    this.currentPage = 1; // Reset to page 1 when filters change
    this.loadDepartments();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedOrganization = '';
    this.filterStatus = 'all';
    this.loadDepartments();
  }

  openDepartmentForm(organization?: string): void {
    this.isEditing = false;
    this.departmentForm = {
      name: '',
      displayName: '',
      description: '',
      organization: organization || this.selectedOrganization || ''
    };
    this.showDepartmentForm = true;
  }

  editDepartment(department: any): void {
    this.isEditing = true;
    this.departmentForm = {
      name: department.name,
      displayName: department.displayName,
      description: department.description || '',
      organization: department.organization._id
    };
    this.selectedDepartment = department;
    this.showDepartmentForm = true;
  }

  saveDepartment(): void {
    if (this.isEditing && this.selectedDepartment) {
      // Update department
      const updateData = {
        name: this.departmentForm.name,
        displayName: this.departmentForm.displayName,
        description: this.departmentForm.description
      };

      this.http.put(`${environment.apiUrl}/departments/${this.selectedDepartment._id}`, updateData).subscribe({
        next: () => {
          this.success = 'Department updated successfully';
          this.closeDepartmentForm();
          this.loadDepartments();
          setTimeout(() => this.success = '', 3000);
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to update department';
          setTimeout(() => this.error = '', 3000);
        }
      });
    } else {
      // Create new department
      this.http.post(`${environment.apiUrl}/departments`, this.departmentForm).subscribe({
        next: () => {
          this.success = 'Department created successfully';
          this.closeDepartmentForm();
          this.loadDepartments();
          setTimeout(() => this.success = '', 3000);
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to create department';
          setTimeout(() => this.error = '', 3000);
        }
      });
    }
  }

  closeDepartmentForm(): void {
    this.showDepartmentForm = false;
    this.isEditing = false;
    this.selectedDepartment = null;
  }

  async toggleDepartmentStatus(department: any): Promise<void> {
    const action = department.isActive ? 'deactivate' : 'activate';
    const confirmed = await SweetAlertService.confirm(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Department?`,
      `Are you sure you want to ${action} this department?`
    );
    if (!confirmed) return;

    this.http.patch(`${environment.apiUrl}/departments/${department._id}/status`, {}).subscribe({
      next: () => {
        this.success = `Department ${action}d successfully`;
        this.loadDepartments();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.message || `Failed to ${action} department`;
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  async deleteDepartment(department: any): Promise<void> {
    const confirmed = await SweetAlertService.confirm(
      'Delete Department?',
      'This action cannot be undone!',
      'Yes, delete it!'
    );
    if (!confirmed) return;

    this.http.delete(`${environment.apiUrl}/departments/${department._id}`).subscribe({
      next: () => {
        this.success = 'Department deleted successfully';
        this.loadDepartments();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to delete department';
        setTimeout(() => this.error = '', 3000);
      }
    });
  }
}
