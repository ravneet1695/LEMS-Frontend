import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
    email = '';
    error = '';
    success = '';
    loading = false;

    constructor(
        private http: HttpClient,
        private router: Router
    ) { }

    onSubmit(): void {
        if (!this.email) {
            this.error = 'Please enter your email address';
            return;
        }

        this.loading = true;
        this.error = '';
        this.success = '';

        this.http.post<any>(`${environment.apiUrl}/auth/forgot-password`, { email: this.email }).subscribe({
            next: (res) => {
                this.loading = false;
                this.success = res.message || 'Password reset link has been sent to your email';
                this.email = '';

                // For development - log the reset token
                if (res.resetToken) {
                    console.log('Reset Token:', res.resetToken);
                    console.log('Reset URL:', res.resetUrl);
                }
            },
            error: (err) => {
                this.loading = false;
                this.error = err.error?.message || 'Failed to send reset email';
                console.error('Forgot password error:', err);
            }
        });
    }
}
