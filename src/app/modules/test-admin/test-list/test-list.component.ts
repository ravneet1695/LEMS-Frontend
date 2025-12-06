import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { SweetAlertService } from '../../../core/services/sweetalert.service';

@Component({
    selector: 'app-test-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './test-list.component.html',
    styleUrls: ['./test-list.component.css']
})
export class TestListComponent implements OnInit {
    tests: any[] = [];
    loading = true;
    error = '';
    success = '';

    // Filters
    searchTerm = '';
    filterStatus = '';
    filterType = '';
    filterGrade = '';
    filterSubject = '';

    // Pagination
    currentPage = 1;
    pageSize = 20;
    totalPages = 1;
    totalTests = 0;

    // Options
    statuses = ['draft', 'pending', 'approved', 'rejected'];
    types = [
        { value: 'question_bank', label: 'Question Bank' },
        { value: 'pdf_upload', label: 'PDF Upload' }
    ];

    Math = Math;

    constructor(
        private http: HttpClient,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadTests();
    }

    loadTests(): void {
        this.loading = true;
        const params: any = {
            page: this.currentPage,
            limit: this.pageSize
        };

        if (this.filterStatus) params.approvalStatus = this.filterStatus;
        if (this.filterType) params.type = this.filterType;

        this.http.get<any>(`${environment.apiUrl}/tests`, { params }).subscribe({
            next: (res) => {
                this.tests = res.data || [];
                this.totalTests = res.pagination?.total || 0;
                this.totalPages = res.pagination?.pages || 1;
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load tests';
                console.error('Error loading tests:', err);
                this.loading = false;
            }
        });
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.loadTests();
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.filterStatus = '';
        this.filterType = '';
        this.filterGrade = '';
        this.filterSubject = '';
        this.currentPage = 1;
        this.loadTests();
    }

    changePage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadTests();
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

    createTest(): void {
        this.router.navigate(['/test-admin/test-creator']);
    }

    viewTest(test: any): void {
        this.router.navigate(['/test-admin/test-preview', test._id]);
    }

    editTest(test: any): void {
        this.router.navigate(['/test-admin/test-creator', test._id]);
    }

    async duplicateTest(test: any): Promise<void> {
        const confirmed = await SweetAlertService.confirm(
            'Duplicate Test?',
            'Are you sure you want to duplicate this test?'
        );
        if (!confirmed) return;

        this.http.post(`${environment.apiUrl}/tests/${test._id}/duplicate`, {}).subscribe({
            next: (res: any) => {
                this.success = 'Test duplicated successfully';
                this.loadTests();
                setTimeout(() => this.success = '', 3000);
            },
            error: (err) => {
                this.error = err.error?.message || 'Failed to duplicate test';
                setTimeout(() => this.error = '', 3000);
            }
        });
    }

    async submitForApproval(test: any): Promise<void> {
        const confirmed = await SweetAlertService.confirm(
            'Submit for Approval?',
            'Are you sure you want to submit this test for approval?'
        );
        if (!confirmed) return;

        this.http.patch(`${environment.apiUrl}/tests/${test._id}/submit`, {}).subscribe({
            next: (res: any) => {
                this.success = 'Test submitted for approval';
                this.loadTests();
                setTimeout(() => this.success = '', 3000);
            },
            error: (err) => {
                this.error = err.error?.message || 'Failed to submit test';
                setTimeout(() => this.error = '', 3000);
            }
        });
    }

    async deleteTest(test: any): Promise<void> {
        const confirmed = await SweetAlertService.confirm(
            'Delete Test?',
            'This action cannot be undone!',
            'Yes, delete it!'
        );
        if (!confirmed) return;

        this.http.delete(`${environment.apiUrl}/tests/${test._id}`).subscribe({
            next: () => {
                this.success = 'Test deleted successfully';
                this.loadTests();
                setTimeout(() => this.success = '', 3000);
            },
            error: (err) => {
                this.error = err.error?.message || 'Failed to delete test';
                setTimeout(() => this.error = '', 3000);
            }
        });
    }

    formatStatus(status: string): string {
        return status.charAt(0).toUpperCase() + status.slice(1);
    }

    getStatusBadgeClass(status: string): string {
        const classes: { [key: string]: string } = {
            'draft': 'bg-secondary',
            'pending': 'bg-warning',
            'approved': 'bg-success',
            'rejected': 'bg-danger'
        };
        return classes[status] || 'bg-secondary';
    }

    formatType(type: string): string {
        return type === 'question_bank' ? 'Question Bank' : 'PDF Upload';
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}
