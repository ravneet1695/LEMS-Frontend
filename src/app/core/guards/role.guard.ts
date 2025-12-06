import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {
    constructor(
        private router: Router,
        private authService: AuthService
    ) { }

    canActivate(route: ActivatedRouteSnapshot): boolean {
        const expectedRoles = route.data['roles'] as string[];

        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/auth/login']);
            return false;
        }

        if (this.authService.hasRole(expectedRoles)) {
            return true;
        }

        // Role not authorized, redirect to appropriate dashboard
        const user = this.authService.getCurrentUser();
        if (user?.role === 'super_admin') {
            this.router.navigate(['/super-admin/dashboard']);
        } else {
            this.router.navigate(['/dashboard/learner']);
        }
        return false;
    }
}
