import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { SweetAlertService } from '../../../core/services/sweetalert.service';

@Component({
    selector: 'app-question-bank',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './question-bank.component.html',
    styleUrls: ['./question-bank.component.css']
})
export class QuestionBankComponent implements OnInit {
    questions: any[] = [];
    loading = false;
    error = '';
    success = '';

    // Filters
    searchTerm = '';
    filterType = '';
    filterDifficulty = '';
    filterGrade = '';
    filterSubject = '';
    filterTopic = '';
    filterStatus = '';

    // Pagination
    currentPage = 1;
    pageSize = 10; // Will be updated from backend response
    totalPages = 1;
    totalQuestions = 0;

    // Options
    questionTypes = [
        { value: 'true_false', label: 'True/False' },
        { value: 'mcq_single', label: 'MCQ (Single)' },
        { value: 'mcq_multiple', label: 'MCQ (Multiple)' },
        { value: 'match_column', label: 'Match Columns' },
        { value: 'short_answer', label: 'Short Answer' },
        { value: 'long_answer', label: 'Long Answer' },
        { value: 'drag_drop', label: 'Drag & Drop' },
        { value: 'fill_blank', label: 'Fill in the Blank' },
        { value: 'hotspot', label: 'Hotspot' },
        { value: 'comprehension', label: 'Comprehension' },
        { value: 'coding', label: 'Coding' }
    ];

    difficulties = ['easy', 'medium', 'hard'];
    statuses = ['pending', 'approved', 'rejected'];

    // Selected question for details
    selectedQuestion: any = null;
    showDetailsModal = false;

    Math = Math;

    constructor(
        private http: HttpClient,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadQuestions();
    }

    loadQuestions(): void {
        this.loading = true;
        const params: any = {
            page: this.currentPage,
            limit: this.pageSize
        };

        if (this.searchTerm) params.search = this.searchTerm;
        if (this.filterType) params.type = this.filterType;
        if (this.filterDifficulty) params.difficulty = this.filterDifficulty;
        if (this.filterGrade) params.grade = this.filterGrade;
        if (this.filterSubject) params.subject = this.filterSubject;
        if (this.filterTopic) params.topic = this.filterTopic;
        if (this.filterStatus) params.approvalStatus = this.filterStatus;

        this.http.get<any>(`${environment.apiUrl}/questions`, { params }).subscribe({
            next: (res) => {
                this.questions = res.data || [];
                this.totalQuestions = res.pagination?.total || 0;
                this.totalPages = res.pagination?.pages || 1;
                this.currentPage = res.pagination?.page || 1;
                if (res.pagination?.limit) {
                    this.pageSize = res.pagination.limit;
                }
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load questions';
                console.error('Error loading questions:', err);
                this.loading = false;
            }
        });
    }

    onSearch(): void {
        this.currentPage = 1;
        this.loadQuestions();
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.loadQuestions();
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.filterType = '';
        this.filterDifficulty = '';
        this.filterGrade = '';
        this.filterSubject = '';
        this.filterTopic = '';
        this.filterStatus = '';
        this.currentPage = 1;
        this.loadQuestions();
    }

    changePage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadQuestions();
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

    viewQuestion(question: any): void {
        this.selectedQuestion = question;
        this.showDetailsModal = true;
    }

    closeDetailsModal(): void {
        this.showDetailsModal = false;
        this.selectedQuestion = null;
    }

    editQuestion(question: any): void {
        this.router.navigate(['/questions/question-editor', question._id]);
    }

    async deleteQuestion(question: any): Promise<void> {
        const confirmed = await SweetAlertService.confirm(
            'Delete Question?',
            'This action cannot be undone!',
            'Yes, delete it!'
        );
        if (!confirmed) return;

        this.http.delete(`${environment.apiUrl}/questions/${question._id}`).subscribe({
            next: () => {
                this.success = 'Question deleted successfully';
                this.loadQuestions();
                setTimeout(() => this.success = '', 3000);
            },
            error: (err) => {
                this.error = err.error?.message || 'Failed to delete question';
                setTimeout(() => this.error = '', 3000);
            }
        });
    }

    approveQuestion(id: string): void {
        this.http.put(`${environment.apiUrl}/questions/${id}/approve`, { status: 'approved' }).subscribe({
            next: () => {
                this.success = 'Question approved successfully';
                this.loadQuestions();
                setTimeout(() => this.success = '', 3000);
            },
            error: (err) => {
                this.error = err.error?.message || 'Failed to approve question';
                setTimeout(() => this.error = '', 3000);
            }
        });
    }

    rejectQuestion(id: string): void {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        this.http.put(`${environment.apiUrl}/questions/${id}/approve`, {
            status: 'rejected',
            rejectionReason: reason
        }).subscribe({
            next: () => {
                this.success = 'Question rejected';
                this.loadQuestions();
                setTimeout(() => this.success = '', 3000);
            },
            error: (err) => {
                this.error = err.error?.message || 'Failed to reject question';
                setTimeout(() => this.error = '', 3000);
            }
        });
    }

    formatType(type: string): string {
        const typeObj = this.questionTypes.find(t => t.value === type);
        return typeObj ? typeObj.label : type;
    }

    formatDifficulty(difficulty: string): string {
        return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    }

    getDifficultyBadgeClass(difficulty: string): string {
        const classes: { [key: string]: string } = {
            'easy': 'bg-success',
            'medium': 'bg-warning',
            'hard': 'bg-danger'
        };
        return classes[difficulty] || 'bg-secondary';
    }

    getStatusBadgeClass(status: string): string {
        const classes: { [key: string]: string } = {
            'pending': 'bg-warning',
            'approved': 'bg-success',
            'rejected': 'bg-danger'
        };
        return classes[status] || 'bg-secondary';
    }
}
