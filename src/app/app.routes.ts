import { Routes } from '@angular/router';
import { LoginComponent } from './modules/auth/login/login.component';
import { RegisterComponent } from './modules/registration/register.component';
import { ForgotPasswordComponent } from './modules/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './modules/auth/reset-password/reset-password.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { OrganizationManagementComponent } from './modules/registration/organizations/organization-management.component';
import { GlobalSettingsComponent } from './modules/settings/global-settings.component';
import { RoleConfigComponent } from './modules/access-config/access-config.component';
import { AuditLogsComponent } from './modules/audit-logs/audit-logs.component';
import { OrganizationUsersComponent } from './modules/registration/organization-users/organization-users.component';
import { OrganizationConfigComponent } from './modules/organization-config/organization-config.component';
import { TestListComponent } from './modules/test-admin/test-list/test-list.component';
import { TestCreatorComponent } from './modules/test-admin/test-creator/test-creator.component';
import { TestPreviewComponent } from './modules/test-admin/test-preview/test-preview.component';
import { QuestionBankComponent } from './modules/question-bank/question-bank/question-bank.component';
import { QuestionEditorComponent } from './modules/question-bank/question-editor/question-editor.component';
import { BulkUploadComponent } from './modules/question-bank/bulk-upload/bulk-upload.component';
import { ReportsComponent } from './modules/reports/reports.component';
import { ExternalUserComponent } from './modules/registration/external-user/external-user.component';
import { DepartmentsComponent } from './modules/organization-config/departments/departments';
import { SharedLayoutComponent } from './shared/components/shared-layout/shared-layout.component';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
    { path: 'auth/login', component: LoginComponent },
    { path: 'auth/register', component: RegisterComponent },
    { path: 'auth/forgot-password', component: ForgotPasswordComponent },
    { path: 'auth/reset-password/:token', component: ResetPasswordComponent },
    { path: 'register/external', component: ExternalUserComponent },

    // Routes with Shared Layout
    {
        path: '',
        component: SharedLayoutComponent,
        canActivate: [AuthGuard],
        children: [
            // Unified Dashboard for all roles
            {
                path: 'dashboard',
                component: DashboardComponent,
                data: { breadcrumb: 'Dashboard' }
            },

            // Super Admin Routes
            {
                path: 'settings',
                component: GlobalSettingsComponent,
                canActivate: [RoleGuard],
                data: { roles: ['super_admin'], breadcrumb: 'Global Settings' }
            },
            {
                path: 'access-config',
                component: RoleConfigComponent,
                canActivate: [RoleGuard],
                data: { roles: ['super_admin'], breadcrumb: 'Access Config' }
            },
            {
                path: 'audit-logs',
                component: AuditLogsComponent,
                canActivate: [RoleGuard],
                data: { roles: ['super_admin', 'org_admin'], breadcrumb: 'Audit Logs' }
            },
            {
                path: 'organization-config',
                component: OrganizationConfigComponent,
                canActivate: [RoleGuard],
                data: { roles: ['super_admin', 'org_admin'], breadcrumb: 'Organization Config' }
            },
            {
                path: 'register/organizations',
                component: OrganizationManagementComponent,
                canActivate: [RoleGuard],
                data: { roles: ['super_admin'], breadcrumb: 'Organizations' }
            },
            {
                path: 'super-admin/organizations/:id/users',
                component: OrganizationUsersComponent,
                canActivate: [RoleGuard],
                data: { roles: ['super_admin', 'org_admin'], breadcrumb: 'Organization Users' }
            },
            {
                path: 'register/organization-users',
                component: OrganizationUsersComponent,
                canActivate: [RoleGuard],
                data: { roles: ['super_admin', 'org_admin'], breadcrumb: 'Organization Users' }
            },
            {
                path: 'organization-config/departments',
                component: DepartmentsComponent,
                canActivate: [RoleGuard],
                data: { roles: ['super_admin', 'org_admin'], breadcrumb: 'Departments' }
            },

            // Test Administration Routes
            {
                path: 'test-admin/tests',
                component: TestListComponent,
                canActivate: [RoleGuard],
                data: {
                    roles: ['super_admin', 'org_admin', 'content_creator', 'content_approver', 'manager'],
                    breadcrumb: 'Tests'
                }
            },
            {
                path: 'test-admin/test-creator',
                component: TestCreatorComponent,
                canActivate: [RoleGuard],
                data: {
                    roles: ['super_admin', 'org_admin', 'content_creator', 'manager'],
                    breadcrumb: 'Create Test'
                }
            },
            {
                path: 'test-admin/test-creator/:id',
                component: TestCreatorComponent,
                canActivate: [RoleGuard],
                data: {
                    roles: ['super_admin', 'org_admin', 'content_creator', 'manager'],
                    breadcrumb: 'Edit Test'
                }
            },
            {
                path: 'test-admin/test-preview/:id',
                component: TestPreviewComponent,
                canActivate: [RoleGuard],
                data: {
                    roles: ['super_admin', 'org_admin', 'content_creator', 'content_approver', 'manager'],
                    breadcrumb: 'Test Preview'
                }
            },
            {
                path: 'questions/question-bank',
                component: QuestionBankComponent,
                canActivate: [RoleGuard],
                data: {
                    roles: ['super_admin', 'org_admin', 'content_creator', 'content_approver', 'manager'],
                    breadcrumb: 'Question Bank'
                }
            },
            {
                path: 'questions/question-editor',
                component: QuestionEditorComponent,
                canActivate: [RoleGuard],
                data: {
                    roles: ['super_admin', 'org_admin', 'content_creator', 'manager'],
                    breadcrumb: 'Create Question'
                }
            },
            {
                path: 'questions/question-editor/:id',
                component: QuestionEditorComponent,
                canActivate: [RoleGuard],
                data: {
                    roles: ['super_admin', 'org_admin', 'content_creator', 'manager'],
                    breadcrumb: 'Edit Question'
                }
            },
            {
                path: 'questions/bulk-upload',
                component: BulkUploadComponent,
                canActivate: [RoleGuard],
                data: {
                    roles: ['super_admin', 'org_admin', 'content_creator', 'manager'],
                    breadcrumb: 'Bulk Upload'
                }
            },
            {
                path: 'reports',
                component: ReportsComponent,
                canActivate: [RoleGuard],
                data: {
                    roles: ['super_admin', 'org_admin', 'manager'],
                    breadcrumb: 'Reports'
                }
            }
        ]
    },

    { path: '**', redirectTo: '/auth/login' }
];
