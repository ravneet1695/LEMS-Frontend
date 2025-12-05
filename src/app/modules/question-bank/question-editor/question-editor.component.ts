import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { SweetAlertService } from '../../../core/services/sweetalert.service';

@Component({
    selector: 'app-question-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './question-editor.component.html',
    styleUrls: ['./question-editor.component.css']
})
export class QuestionEditorComponent implements OnInit {
    questionForm!: FormGroup;
    questionId: string | null = null;
    isEditMode = false;
    loading = false;
    saving = false;

    questionTypes = [
        { value: 'true_false', label: 'True/False' },
        { value: 'mcq_single', label: 'MCQ (Single Answer)' },
        { value: 'mcq_multiple', label: 'MCQ (Multiple Answers)' },
        { value: 'short_answer', label: 'Short Answer' },
        { value: 'long_answer', label: 'Long Answer' },
        { value: 'fill_blank', label: 'Fill in the Blank' }
    ];

    difficulties = ['easy', 'medium', 'hard'];

    // Image upload
    selectedImages: File[] = [];
    imagePreviewUrls: string[] = [];

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.initForm();
        this.questionId = this.route.snapshot.paramMap.get('id');

        if (this.questionId) {
            this.isEditMode = true;
            this.loadQuestion();
        }

        // Watch for type changes
        this.questionForm.get('type')?.valueChanges.subscribe(() => {
            this.updateFormForType();
        });
    }

    initForm(): void {
        this.questionForm = this.fb.group({
            type: ['mcq_single', Validators.required],
            questionText: ['', Validators.required],
            explanation: [''],
            marks: [1, [Validators.required, Validators.min(1)]],
            difficulty: ['medium', Validators.required],
            hierarchy: this.fb.group({
                grade: ['', Validators.required],
                subject: ['', Validators.required],
                topic: ['', Validators.required],
                subtopic: ['']
            }),
            tags: [''],
            // MCQ options
            options: this.fb.array([]),
            // True/False
            correctAnswer: [''],
            // Fill in blank
            blanks: this.fb.array([])
        });

        // Initialize with 4 options for MCQ
        this.addOption();
        this.addOption();
        this.addOption();
        this.addOption();
    }

    get options(): FormArray {
        return this.questionForm.get('options') as FormArray;
    }

    get blanks(): FormArray {
        return this.questionForm.get('blanks') as FormArray;
    }

    addOption(): void {
        this.options.push(this.fb.group({
            text: ['', Validators.required],
            isCorrect: [false]
        }));
    }

    removeOption(index: number): void {
        if (this.options.length > 2) {
            this.options.removeAt(index);
        }
    }

    addBlank(): void {
        this.blanks.push(this.fb.group({
            position: [this.blanks.length + 1],
            correctAnswers: [['']]
        }));
    }

    removeBlank(index: number): void {
        this.blanks.removeAt(index);
    }

    updateFormForType(): void {
        const type = this.questionForm.get('type')?.value;

        // Clear arrays
        while (this.options.length) {
            this.options.removeAt(0);
        }
        while (this.blanks.length) {
            this.blanks.removeAt(0);
        }

        // Setup based on type
        if (type === 'mcq_single' || type === 'mcq_multiple') {
            this.addOption();
            this.addOption();
            this.addOption();
            this.addOption();
        } else if (type === 'fill_blank') {
            this.addBlank();
        }
    }

    onImageSelect(event: any): void {
        const files = event.target.files;
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                this.selectedImages.push(file);

                // Create preview
                const reader = new FileReader();
                reader.onload = (e: any) => {
                    this.imagePreviewUrls.push(e.target.result);
                };
                reader.readAsDataURL(file);
            }
        }
    }

    removeImage(index: number): void {
        this.selectedImages.splice(index, 1);
        this.imagePreviewUrls.splice(index, 1);
    }

    async uploadImages(): Promise<string[]> {
        if (this.selectedImages.length === 0) return [];

        const uploadedUrls: string[] = [];

        for (const file of this.selectedImages) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response: any = await this.http.post(`${environment.apiUrl}/upload`, formData).toPromise();
                uploadedUrls.push(response.url);
            } catch (error) {
                console.error('Error uploading image:', error);
            }
        }

        return uploadedUrls;
    }

    loadQuestion(): void {
        this.loading = true;
        this.http.get<any>(`${environment.apiUrl}/questions/${this.questionId}`).subscribe({
            next: (res) => {
                const question = res.data;

                this.questionForm.patchValue({
                    type: question.type,
                    questionText: question.questionText,
                    explanation: question.explanation,
                    marks: question.marks,
                    difficulty: question.difficulty,
                    hierarchy: question.hierarchy,
                    tags: question.tags?.join(', '),
                    correctAnswer: question.correctAnswer
                });

                // Load options for MCQ
                if (question.options && question.options.length > 0) {
                    while (this.options.length) {
                        this.options.removeAt(0);
                    }
                    question.options.forEach((opt: any) => {
                        this.options.push(this.fb.group({
                            text: [opt.text],
                            isCorrect: [opt.isCorrect]
                        }));
                    });
                }

                this.loading = false;
            },
            error: (err) => {
                SweetAlertService.error('Error', 'Failed to load question');
                this.loading = false;
            }
        });
    }

    async saveQuestion(): Promise<void> {
        if (this.questionForm.invalid) {
            SweetAlertService.error('Error', 'Please fill all required fields');
            return;
        }

        // Validate based on type
        const type = this.questionForm.get('type')?.value;
        if ((type === 'mcq_single' || type === 'mcq_multiple') && this.options.length < 2) {
            SweetAlertService.error('Error', 'Please add at least 2 options');
            return;
        }

        if (type === 'mcq_single' || type === 'mcq_multiple') {
            const hasCorrect = this.options.value.some((opt: any) => opt.isCorrect);
            if (!hasCorrect) {
                SweetAlertService.error('Error', 'Please mark at least one correct answer');
                return;
            }
        }

        this.saving = true;

        // Upload images first
        const mediaUrls = await this.uploadImages();

        const questionData = {
            ...this.questionForm.value,
            tags: this.questionForm.value.tags ? this.questionForm.value.tags.split(',').map((t: string) => t.trim()) : [],
            media: mediaUrls
        };

        const request = this.isEditMode
            ? this.http.put<any>(`${environment.apiUrl}/questions/${this.questionId}`, questionData)
            : this.http.post<any>(`${environment.apiUrl}/questions`, questionData);

        request.subscribe({
            next: (res) => {
                SweetAlertService.success('Success', this.isEditMode ? 'Question updated successfully' : 'Question created successfully');
                this.saving = false;
                this.router.navigate(['/questions/question-bank']);
            },
            error: (err) => {
                SweetAlertService.error('Error', err.error?.message || 'Failed to save question');
                this.saving = false;
            }
        });
    }

    cancel(): void {
        this.router.navigate(['/questions/question-bank']);
    }
}
