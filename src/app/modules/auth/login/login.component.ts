import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="container-fluid vh-100">
      <div class="row h-100">
        <!-- Left Side - Branding -->
        <div class="col-md-6 d-none d-md-flex align-items-center justify-content-center bg-primary text-white">
          <div class="text-center">
            <h1 class="display-3 fw-bold mb-4">
              <i class="bi bi-mortarboard-fill"></i> Learning Platform
            </h1>
            <p class="lead">Empower your learning journey with our comprehensive quiz and test platform</p>
          </div>
        </div>

        <!-- Right Side - Login Form -->
        <div class="col-md-6 d-flex align-items-center justify-content-center">
          <div class="w-100" style="max-width: 400px; padding: 20px;">
            <div class="text-center mb-4">
              <h2 class="fw-bold">Welcome Back</h2>
              <p class="text-muted">Sign in to your account</p>
            </div>

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              <!-- Email -->
              <div class="form-floating mb-3">
                <input
                  type="email"
                  class="form-control"
                  id="email"
                  placeholder="name@example.com"
                  formControlName="email"
                  [class.is-invalid]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
                >
                <label for="email">Email address</label>
                <div class="invalid-feedback" *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
                  <span *ngIf="loginForm.get('email')?.errors?.['required']">Email is required</span>
                  <span *ngIf="loginForm.get('email')?.errors?.['email']">Please enter a valid email</span>
                </div>
              </div>

              <!-- Password -->
              <div class="form-floating mb-3">
                <input
                  type="password"
                  class="form-control"
                  id="password"
                  placeholder="Password"
                  formControlName="password"
                  [class.is-invalid]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
                >
                <label for="password">Password</label>
                <div class="invalid-feedback" *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
                  Password is required
                </div>
              </div>

              <!-- Forgot Password Link -->
              <div class="text-end mb-3">
                <a routerLink="/auth/forgot-password" class="text-primary text-decoration-none">
                  <i class="bi bi-key"></i> Forgot Password?
                </a>
              </div>

              <!-- Error Message -->
              <div class="alert alert-danger" *ngIf="errorMessage">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ errorMessage }}
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="btn btn-primary w-100 mb-3"
                [disabled]="loginForm.invalid || loading"
              >
                <span *ngIf="!loading">Sign In</span>
                <span *ngIf="loading">
                  <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Signing in...
                </span>
              </button>

              <!-- Register Link -->
              <div class="text-center">
                <p class="text-muted">
                  Don't have an account?
                  <a routerLink="/auth/register" class="text-primary fw-bold">Sign up</a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bg-primary {
      background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          // Small delay to ensure token is saved to localStorage
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 100);
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Login failed. Please try again.';
      }
    });
  }
}
