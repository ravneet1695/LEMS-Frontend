import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-external-user',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './external-user.component.html',
    styleUrls: ['./external-user.component.css']
})
export class ExternalUserComponent {
    registrationForm: FormGroup;
    loading = false;
    errorMessage = '';
    successMessage = '';

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        private router: Router
    ) {
        this.registrationForm = this.fb.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', Validators.required],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required],
            country: ['', Validators.required],
            agreeToTerms: [false, Validators.requiredTrue]
        }, { validators: this.passwordMatchValidator });
    }

    passwordMatchValidator(g: FormGroup) {
        return g.get('password')?.value === g.get('confirmPassword')?.value
            ? null : { 'mismatch': true };
    }

    onSubmit(): void {
        if (this.registrationForm.invalid) {
            return;
        }

        this.loading = true;
        this.errorMessage = '';
        this.successMessage = '';

        const userData = {
            ...this.registrationForm.value,
            role: 'learner',
            isExternal: true
        };

        this.http.post<any>(`${environment.apiUrl}/auth/register`, userData).subscribe({
            next: (response) => {
                this.loading = false;
                if (response.success) {
                    this.successMessage = 'Registration successful! Redirecting to login...';
                    setTimeout(() => {
                        this.router.navigate(['/auth/login']);
                    }, 2000);
                }
            },
            error: (error) => {
                this.loading = false;
                this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
            }
        });
    }
}
