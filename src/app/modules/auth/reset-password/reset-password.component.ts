import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
    newPassword = '';
    confirmPassword = '';
    error = '';
    success = '';
    loading = false;
    resetToken = '';
    showPassword = false;
    showConfirmPassword = false;

    // Password strength indicators
    passwordStrength = {
        hasMinLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false
    };

    constructor(
        private http: HttpClient,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        // Get reset token from URL
        this.resetToken = this.route.snapshot.params['token'];

        if (!this.resetToken) {
            this.error = 'Invalid reset link. Please request a new password reset.';
        }
    }

    onPasswordChange(): void {
        // Update password strength indicators
        this.passwordStrength.hasMinLength = this.newPassword.length >= 8;
        this.passwordStrength.hasUpperCase = /[A-Z]/.test(this.newPassword);
        this.passwordStrength.hasLowerCase = /[a-z]/.test(this.newPassword);
        this.passwordStrength.hasNumber = /[0-9]/.test(this.newPassword);
    }

    isPasswordValid(): boolean {
        return this.passwordStrength.hasMinLength &&
            this.passwordStrength.hasUpperCase &&
            this.passwordStrength.hasLowerCase &&
            this.passwordStrength.hasNumber;
    }

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }

    toggleConfirmPasswordVisibility(): void {
        this.showConfirmPassword = !this.showConfirmPassword;
    }

    onSubmit(): void {
        this.error = '';
        this.success = '';

        if (!this.newPassword || !this.confirmPassword) {
            this.error = 'Please fill in all fields';
            return;
        }

        if (!this.isPasswordValid()) {
            this.error = 'Password does not meet the requirements';
            return;
        }

        if (this.newPassword !== this.confirmPassword) {
            this.error = 'Passwords do not match';
            return;
        }

        this.loading = true;

        this.http.put<any>(`${environment.apiUrl}/auth/reset-password/${this.resetToken}`, {
            newPassword: this.newPassword,
            confirmPassword: this.confirmPassword
        }).subscribe({
            next: (res) => {
                this.loading = false;
                this.success = res.message || 'Password reset successfully. Redirecting to login...';

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    this.router.navigate(['/auth/login']);
                }, 3000);
            },
            error: (err) => {
                this.loading = false;
                this.error = err.error?.message || 'Failed to reset password. Please try again.';
                console.error('Reset password error:', err);
            }
        });
    }
}
