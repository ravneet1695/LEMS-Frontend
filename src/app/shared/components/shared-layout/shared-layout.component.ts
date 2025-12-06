import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { filter, map, take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

interface Breadcrumb {
    label: string;
    url: string;
}

@Component({
    selector: 'app-shared-layout',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './shared-layout.component.html',
    styleUrls: ['./shared-layout.component.css']
})
export class SharedLayoutComponent implements OnInit, OnDestroy {
    user: any;
    sidebarCollapsed = false;
    breadcrumbs: Breadcrumb[] = [];
    openDropdowns: Set<string> = new Set();
    allowedModules: string[] = [];
    navigationItems: any[] = []; // Populated dynamically from backend
    private destroy$ = new Subject<void>();

    constructor(
        private authService: AuthService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private http: HttpClient
    ) {
        // Load sidebar state from localStorage
        const savedState = localStorage.getItem('sidebarCollapsed');
        this.sidebarCollapsed = savedState === 'true';
    }

    ngOnInit(): void {
        // Use take(1) to only subscribe once and get the current user
        this.authService.currentUser.pipe(
            take(1)
        ).subscribe(user => {
            this.user = user;
            if (user) {
                this.loadAllowedModules();
            }
        });

        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd),
            map(() => this.buildBreadcrumbs(this.activatedRoute.root)),
            takeUntil(this.destroy$)
        ).subscribe(breadcrumbs => {
            this.breadcrumbs = breadcrumbs;
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadAllowedModules(): void {
        this.http.get<any>(`${environment.apiUrl}/access-config/my-modules`).subscribe({
            next: (res) => {
                if (res.success) {
                    this.allowedModules = res.data.modules || [];
                    this.navigationItems = res.data.navigation || [];
                    console.log('Allowed modules:', this.allowedModules);
                    console.log('Navigation items:', this.navigationItems);
                }
            },
            error: (err) => {
                console.error('Error loading allowed modules:', err);
                // Fallback to empty navigation
                this.allowedModules = [];
                this.navigationItems = [];
            }
        });
    }

    toggleSidebar(): void {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed.toString());
    }

    hasAccess(item: any): boolean {
        // Navigation items are already filtered by backend
        // This method now just ensures item exists
        return !!item;
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/auth/login']);
    }

    toggleDropdown(label: string): void {
        if (this.openDropdowns.has(label)) {
            this.openDropdowns.delete(label);
        } else {
            this.openDropdowns.add(label);
        }
    }

    isDropdownOpen(label: string): boolean {
        return this.openDropdowns.has(label);
    }

    private buildBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: Breadcrumb[] = []): Breadcrumb[] {
        const children: ActivatedRoute[] = route.children;

        if (children.length === 0) {
            return breadcrumbs;
        }

        for (const child of children) {
            const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
            if (routeURL !== '') {
                url += `/${routeURL}`;
            }

            const label = child.snapshot.data['breadcrumb'];
            if (label) {
                breadcrumbs.push({ label, url });
            }

            return this.buildBreadcrumbs(child, url, breadcrumbs);
        }

        return breadcrumbs;
    }
}
