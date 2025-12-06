import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { SweetAlertService } from '../../../core/services/sweetalert.service';

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

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
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
    const params: any = {};

    if (this.selectedOrganization) params.organization = this.selectedOrganization;
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.filterStatus !== 'all') params.status = this.filterStatus;

    this.http.get<any>(`${environment.apiUrl}/departments`, { params }).subscribe({
      next: (res) => {
        this.departments = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load departments';
        console.error('Error loading departments:', err);
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
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
