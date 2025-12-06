import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { SweetAlertService } from '../../../core/services/sweetalert.service';

@Component({
    selector: 'app-bulk-upload',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './bulk-upload.component.html',
    styleUrls: ['./bulk-upload.component.css']
})
export class BulkUploadComponent {
    uploadMode: 'manual' | 'auto' = 'manual';
    selectedFile: File | null = null;
    uploading = false;
    extracting = false;
    uploadedQuestions: any[] = [];
    showPreview = false;

    // Advanced extraction options
    questionType: string = 'mcq_single';
    questionPageStart: number = 1;
    questionPageEnd: number | null = null;
    answerPageStart: number | null = null;
    answerPageEnd: number | null = null;
    difficulty: string = 'medium';
    marks: number = 1;
    tags: string = '';
    grade: string = '';
    subject: string = '';
    topic: string = '';
    subtopic: string = '';

    // Image upload
    selectedImages: File[] = [];
    imagePreviews: string[] = [];

    questionTypes = [
        { value: 'mcq_single', label: 'Multiple Choice (Single Answer)', description: 'Questions with multiple options, only one correct answer' },
        { value: 'mcq_multiple', label: 'Multiple Choice (Multiple Answers)', description: 'Questions with multiple options, multiple correct answers' },
        { value: 'true_false', label: 'True/False', description: 'Questions with only two options: True or False' },
        { value: 'short_answer', label: 'Short Answer', description: 'Questions requiring brief text responses' },
        { value: 'long_answer', label: 'Long Answer', description: 'Questions requiring detailed text responses' },
        { value: 'fill_blank', label: 'Fill in the Blank', description: 'Questions with blanks to be filled' }
    ];

    // Expose String for template
    String = String;

    constructor(
        private http: HttpClient,
        private router: Router
    ) { }

    onFileSelect(event: any): void {
        const file = event.target.files[0];
        if (file) {
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
                'application/pdf'
            ];

            if (!validTypes.includes(file.type)) {
                SweetAlertService.error('Error', 'Please upload a Word, Excel, or PDF file');
                return;
            }

            this.selectedFile = file;
        }
    }

    onPdfSelect(event: any): void {
        const file = event.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                SweetAlertService.error('Error', 'Please upload a PDF file');
                return;
            }
            this.selectedFile = file;
        }
    }

    onImageSelect(event: any): void {
        const files = Array.from(event.target.files) as File[];

        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                this.selectedImages.push(file);

                // Create preview
                const reader = new FileReader();
                reader.onload = (e: any) => {
                    this.imagePreviews.push(e.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    removeImage(index: number): void {
        this.selectedImages.splice(index, 1);
        this.imagePreviews.splice(index, 1);
    }

    async uploadFile(): Promise<void> {
        if (!this.selectedFile) {
            SweetAlertService.error('Error', 'Please select a file first');
            return;
        }

        this.uploading = true;

        const formData = new FormData();
        formData.append('file', this.selectedFile);

        this.http.post<any>(`${environment.apiUrl}/questions/bulk-file`, formData).subscribe({
            next: (res) => {
                this.uploadedQuestions = res.data || [];
                this.showPreview = true;
                this.uploading = false;
                SweetAlertService.success('Success', `Successfully imported ${res.count} questions`);
            },
            error: (err) => {
                SweetAlertService.error('Error', err.error?.message || 'Failed to upload file');
                this.uploading = false;
            }
        });
    }

    async autoExtractFromPdf(): Promise<void> {
        if (!this.selectedFile) {
            SweetAlertService.error('Error', 'Please select a PDF file first');
            return;
        }

        this.extracting = true;

        const formData = new FormData();
        formData.append('file', this.selectedFile);

        // Add extraction options
        formData.append('questionType', this.questionType);
        formData.append('questionPageStart', this.questionPageStart.toString());
        if (this.questionPageEnd) formData.append('questionPageEnd', this.questionPageEnd.toString());
        if (this.answerPageStart) formData.append('answerPageStart', this.answerPageStart.toString());
        if (this.answerPageEnd) formData.append('answerPageEnd', this.answerPageEnd.toString());
        formData.append('difficulty', this.difficulty);
        formData.append('marks', this.marks.toString());
        if (this.tags) formData.append('tags', this.tags);
        if (this.grade) formData.append('grade', this.grade);
        if (this.subject) formData.append('subject', this.subject);
        if (this.topic) formData.append('topic', this.topic);
        if (this.subtopic) formData.append('subtopic', this.subtopic);

        // Add images if any
        this.selectedImages.forEach((image, index) => {
            formData.append('images', image);
        });

        this.http.post<any>(`${environment.apiUrl}/questions/bulk-file`, formData).subscribe({
            next: (res) => {
                this.uploadedQuestions = res.data || [];
                this.showPreview = true;
                this.extracting = false;

                if (this.uploadedQuestions.length > 0) {
                    SweetAlertService.success('Preview Ready', `Extracted ${res.count} questions. Please review before importing.`);
                } else {
                    SweetAlertService.warning('No Questions Found', 'No questions could be extracted from this PDF. Please ensure the PDF is properly formatted.');
                }
            },
            error: (err) => {
                SweetAlertService.error('Error', err.error?.message || 'Failed to extract questions from PDF. Please ensure the PDF is properly formatted with clear question structure.');
                this.extracting = false;
            }
        });
    }

    async confirmImport(): Promise<void> {
        if (this.uploadedQuestions.length === 0) {
            SweetAlertService.error('Error', 'No questions to import');
            return;
        }

        // Save questions to database
        this.http.post<any>(`${environment.apiUrl}/questions/bulk-save`, {
            questions: this.uploadedQuestions
        }).subscribe({
            next: (res) => {
                SweetAlertService.success('Success', `Successfully imported ${res.count} questions to question bank`);
                this.router.navigate(['/questions/question-bank']);
            },
            error: (err) => {
                SweetAlertService.error('Error', err.error?.message || 'Failed to save questions');
            }
        });
    }

    editQuestion(index: number): void {
        // Toggle edit mode for specific question
        this.uploadedQuestions[index].editing = !this.uploadedQuestions[index].editing;
    }

    removeQuestion(index: number): void {
        this.uploadedQuestions.splice(index, 1);
        if (this.uploadedQuestions.length === 0) {
            this.showPreview = false;
        }
    }

    cancel(): void {
        this.router.navigate(['/questions/question-bank']);
    }

    removeFile(): void {
        this.selectedFile = null;
        this.uploadedQuestions = [];
        this.showPreview = false;
        this.selectedImages = [];
        this.imagePreviews = [];
    }

    getQuestionTypeDescription(type: string): string {
        const found = this.questionTypes.find(qt => qt.value === type);
        return found ? found.description : '';
    }
}
