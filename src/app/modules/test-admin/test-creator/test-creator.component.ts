import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { SweetAlertService } from '../../../core/services/sweetalert.service';

interface Question {
    _id: string;
    questionText: string;
    type: string;
    difficulty: string;
    marks: number;
    hierarchy: {
        grade: string;
        subject: string;
        topic: string;
    };
}

interface TestQuestion {
    question: string;
    marks: number;
    order: number;
}

@Component({
    selector: 'app-test-creator',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './test-creator.component.html',
    styleUrls: ['./test-creator.component.css']
})
export class TestCreatorComponent implements OnInit {
    testForm!: FormGroup;
    testId: string | null = null;
    isEditMode = false;
    loading = false;
    saving = false;
    currentStep = 1;
    totalSteps = 3;

    // Question bank
    availableQuestions: Question[] = [];
    selectedQuestions: TestQuestion[] = [];
    loadingQuestions = false;

    // Filters for question bank
    filterGrade = '';
    filterSubject = '';
    filterTopic = '';
    filterDifficulty = '';

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.initForm();
        this.testId = this.route.snapshot.paramMap.get('id');

        if (this.testId) {
            this.isEditMode = true;
            this.loadTest();
        }

        this.loadQuestions();
    }

    initForm(): void {
        this.testForm = this.fb.group({
            title: ['', Validators.required],
            description: [''],
            type: ['question_bank', Validators.required],
            duration: [60, [Validators.required, Validators.min(1)]],
            totalMarks: [100, [Validators.required, Validators.min(1)]],
            passingMarks: [40, [Validators.required, Validators.min(0)]],
            settings: this.fb.group({
                shuffleQuestions: [false],
                shuffleOptions: [false],
                showResultsImmediately: [false],
                allowReview: [true],
                showCorrectAnswers: [true]
            }),
            pdfUrl: [''],
            answerKeyUrl: ['']
        });
    }

    loadTest(): void {
        this.loading = true;
        this.http.get<any>(`${environment.apiUrl}/tests/${this.testId}`).subscribe({
            next: (res) => {
                const test = res.data;
                this.testForm.patchValue({
                    title: test.title,
                    description: test.description,
                    type: test.type,
                    duration: test.duration,
                    totalMarks: test.totalMarks,
                    passingMarks: test.passingMarks,
                    settings: test.settings,
                    pdfUrl: test.pdfUrl,
                    answerKeyUrl: test.answerKeyUrl
                });

                if (test.questions && test.questions.length > 0) {
                    this.selectedQuestions = test.questions.map((q: any) => ({
                        question: q.question._id || q.question,
                        marks: q.marks,
                        order: q.order
                    }));
                }

                this.loading = false;
            },
            error: (err) => {
                SweetAlertService.error('Error', 'Failed to load test');
                this.loading = false;
            }
        });
    }

    loadQuestions(): void {
        this.loadingQuestions = true;
        const params: any = { approvalStatus: 'approved' };

        if (this.filterGrade) params['hierarchy.grade'] = this.filterGrade;
        if (this.filterSubject) params['hierarchy.subject'] = this.filterSubject;
        if (this.filterTopic) params['hierarchy.topic'] = this.filterTopic;
        if (this.filterDifficulty) params.difficulty = this.filterDifficulty;

        this.http.get<any>(`${environment.apiUrl}/questions`, { params }).subscribe({
            next: (res) => {
                this.availableQuestions = res.data;
                this.loadingQuestions = false;
            },
            error: (err) => {
                console.error('Error loading questions:', err);
                this.loadingQuestions = false;
            }
        });
    }

    addQuestion(question: Question): void {
        const exists = this.selectedQuestions.find(q => q.question === question._id);
        if (!exists) {
            this.selectedQuestions.push({
                question: question._id,
                marks: question.marks,
                order: this.selectedQuestions.length + 1
            });
            this.updateTotalMarks();
        }
    }

    removeQuestion(index: number): void {
        this.selectedQuestions.splice(index, 1);
        this.reorderQuestions();
        this.updateTotalMarks();
    }

    moveQuestionUp(index: number): void {
        if (index > 0) {
            [this.selectedQuestions[index], this.selectedQuestions[index - 1]] =
                [this.selectedQuestions[index - 1], this.selectedQuestions[index]];
            this.reorderQuestions();
        }
    }

    moveQuestionDown(index: number): void {
        if (index < this.selectedQuestions.length - 1) {
            [this.selectedQuestions[index], this.selectedQuestions[index + 1]] =
                [this.selectedQuestions[index + 1], this.selectedQuestions[index]];
            this.reorderQuestions();
        }
    }

    reorderQuestions(): void {
        this.selectedQuestions.forEach((q, index) => {
            q.order = index + 1;
        });
    }

    updateTotalMarks(): void {
        const total = this.selectedQuestions.reduce((sum, q) => sum + q.marks, 0);
        this.testForm.patchValue({ totalMarks: total });
    }

    nextStep(): void {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
        }
    }

    previousStep(): void {
        if (this.currentStep > 1) {
            this.currentStep--;
        }
    }

    async saveAsDraft(): Promise<void> {
        await this.saveTest('draft');
    }

    async submitForApproval(): Promise<void> {
        await this.saveTest('pending');
    }

    async saveTest(approvalStatus: string): Promise<void> {
        if (this.testForm.invalid) {
            SweetAlertService.error('Error', 'Please fill all required fields');
            return;
        }

        if (this.testForm.value.type === 'question_bank' && this.selectedQuestions.length === 0) {
            SweetAlertService.error('Error', 'Please add at least one question');
            return;
        }

        this.saving = true;

        const testData = {
            ...this.testForm.value,
            questions: this.selectedQuestions,
            approvalStatus
        };

        const request = this.isEditMode
            ? this.http.put<any>(`${environment.apiUrl}/tests/${this.testId}`, testData)
            : this.http.post<any>(`${environment.apiUrl}/tests`, testData);

        request.subscribe({
            next: (res) => {
                SweetAlertService.success('Success',
                    approvalStatus === 'draft' ? 'Test saved as draft' : 'Test submitted for approval'
                );
                this.saving = false;
                this.router.navigate(['/test-admin/tests']);
            },
            error: (err) => {
                SweetAlertService.error('Error', err.error?.message || 'Failed to save test');
                this.saving = false;
            }
        });
    }

    getQuestionById(id: string): Question | undefined {
        return this.availableQuestions.find(q => q._id === id);
    }

    cancel(): void {
        this.router.navigate(['/test-admin/tests']);
    }
}
