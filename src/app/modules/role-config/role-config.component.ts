import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Module {
    id: string;
    name: string;
    description: string;
    icon: string;
}

interface Role {
    id: string;
    name: string;
    displayName: string;
    description: string;
    moduleAccess: string[];
    organization?: {
        _id: string;
        name: string;
    };
    isSystemRole?: boolean;
}

@Component({
    selector: 'app-role-config',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './role-config.component.html',
    styleUrls: ['./role-config.component.css']
})
export class RoleConfigComponent implements OnInit {
    roles: Role[] = [];
    modules: Module[] = [];
    selectedRole: Role | null = null;
    loading = false;
    saveMessage = '';
    saveMessageType: 'success' | 'error' = 'success';
    showCreateModal = false;
    showDeleteModal = false;
    roleToDelete: Role | null = null;
    organizations: any[] = [];
    selectedOrganization: string | null = null;
    private autoSaveTimer: any = null;  // Timer for debouncing
    newRole: Role = {
        id: '',
        name: '',
        displayName: '',
        description: '',
        moduleAccess: []
    };

    constructor(private http: HttpClient) { }

    ngOnInit(): void {
        this.loadOrganizations();
        this.loadModules();
        this.loadRoles();
    }

    loadOrganizations(): void {
        this.http.get<any>(`${environment.apiUrl}/organizations`).subscribe({
            next: (response) => {
                console.log("1", response);
                if (response.success) {
                    this.organizations = response.data;
                }
            },
            error: (error) => {
                console.error('Error loading organizations:', error);
            }
        });
    }

    onOrganizationChange(): void {
        this.loadRoles();
        this.selectedRole = null;
    }

    loadModules(): void {
        this.http.get<any>(`${environment.apiUrl}/role-config/modules`).subscribe({
            next: (response) => {
                console.log("2", response);
                if (response.success) {
                    this.modules = response.data;
                }
            },
            error: (error) => {
                console.error('Error loading modules:', error);
                this.modules = [];
                this.saveMessage = 'Failed to load available modules. Please refresh the page.';
                this.saveMessageType = 'error';
            }
        });
    }

    loadRoles(): void {
        this.loading = true;
        const params = this.selectedOrganization ? `?organizationId=${this.selectedOrganization}` : '';
        console.log("params", params);
        this.http.get<any>(`${environment.apiUrl}/role-config${params}`).subscribe({
            next: (response) => {
                console.log("3", response);
                if (response.success) {
                    this.roles = response.data.map((config: any) => ({
                        id: config.roleName,
                        name: config.roleName,
                        displayName: config.displayName,
                        description: config.description,
                        moduleAccess: config.moduleAccess,
                        organization: config.organization,
                        isSystemRole: config.isSystemRole
                    }));
                }
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading roles:', error);
                this.roles = [];
                this.loading = false;
                this.saveMessage = 'Failed to load roles. Please check your connection and try again.';
                this.saveMessageType = 'error';
            }
        });
    }

    selectRole(role: Role): void {
        this.selectedRole = { ...role };
        this.saveMessage = '';
    }

    hasModuleAccess(moduleId: string): boolean {
        return this.selectedRole?.moduleAccess.includes(moduleId) || false;
    }

    toggleModuleAccess(moduleId: string): void {
        if (!this.selectedRole) return;

        const index = this.selectedRole.moduleAccess.indexOf(moduleId);
        if (index > -1) {
            this.selectedRole.moduleAccess.splice(index, 1);
        } else {
            this.selectedRole.moduleAccess.push(moduleId);
        }

        // Auto-save the module access changes
        this.autoSaveModuleAccess();
    }

    autoSaveModuleAccess(): void {
        if (!this.selectedRole) return;

        // Clear existing timer
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }

        // Debounce: wait 500ms before saving
        this.autoSaveTimer = setTimeout(() => {
            // Use the new PATCH endpoint for module access updates
            const payload = {
                moduleAccess: this.selectedRole!.moduleAccess
            };

            this.http.patch<any>(
                `${environment.apiUrl}/role-config/${this.selectedRole!.name}/module-access`,
                payload
            ).subscribe({
                next: (response) => {
                    if (response.success) {
                        // Update the role in the list
                        const roleIndex = this.roles.findIndex(r => r.id === this.selectedRole!.id);
                        if (roleIndex > -1) {
                            this.roles[roleIndex].moduleAccess = [...this.selectedRole!.moduleAccess];
                        }

                        // Show brief success message
                        this.saveMessage = 'Module access updated';
                        this.saveMessageType = 'success';

                        setTimeout(() => {
                            this.saveMessage = '';
                        }, 2000);
                    }
                },
                error: (error) => {
                    console.error('Error auto-saving module access:', error);
                    this.saveMessage = error.error?.message || 'Error updating module access';
                    this.saveMessageType = 'error';

                    setTimeout(() => {
                        this.saveMessage = '';
                    }, 3000);
                }
            });
        }, 500);  // 500ms debounce delay
    }

    saveRoleConfig(): void {
        if (!this.selectedRole) return;

        this.loading = true;
        this.saveMessage = '';

        const payload = {
            roleName: this.selectedRole.name,
            displayName: this.selectedRole.displayName,
            description: this.selectedRole.description,
            moduleAccess: this.selectedRole.moduleAccess
        };

        this.http.post<any>(`${environment.apiUrl}/role-config`, payload).subscribe({
            next: (response) => {
                if (response.success) {
                    const roleIndex = this.roles.findIndex(r => r.id === this.selectedRole!.id);
                    if (roleIndex > -1) {
                        this.roles[roleIndex] = { ...this.selectedRole! };
                    }

                    this.saveMessage = 'Role configuration saved successfully!';
                    this.saveMessageType = 'success';
                }
                this.loading = false;

                setTimeout(() => {
                    this.saveMessage = '';
                }, 3000);
            },
            error: (error) => {
                this.loading = false;
                this.saveMessage = error.error?.message || 'Error saving role configuration';
                this.saveMessageType = 'error';

                setTimeout(() => {
                    this.saveMessage = '';
                }, 5000);
            }
        });
    }

    cancelEdit(): void {
        this.selectedRole = null;
        this.saveMessage = '';
    }

    isSystemRole(role: Role): boolean {
        // Check if it's marked as system role or is one of the core system roles
        return role.isSystemRole || ['super_admin', 'org_admin', 'learner'].includes(role.name);
    }
}
