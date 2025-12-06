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
    isDeletable?: boolean;
    isDefault?: boolean;
    canManageOrganizations?: boolean;
    canManageSettings?: boolean;
    canManageRoles?: boolean;
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
    selectedOrganization: string | undefined = undefined;
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
        console.log('[onOrganizationChange] Organization changed to:', this.selectedOrganization);
        this.selectedRole = null;
        this.saveMessage = '';
        this.loadRoles();
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
        this.saveMessage = '';

        // Construct query parameters
        const params = this.selectedOrganization
            ? `?organizationId=${this.selectedOrganization}`
            : '';

        console.log('[loadRoles] Loading roles with params:', params);
        console.log('[loadRoles] Selected organization:', this.selectedOrganization);

        this.http.get<any>(`${environment.apiUrl}/role-config${params}`).subscribe({
            next: (response) => {
                console.log('[loadRoles] Response:', response);

                if (response.success && response.data) {
                    // Map the role configurations to the frontend Role interface
                    this.roles = response.data.map((config: any) => {
                        const role: Role = {
                            id: config._id, // Use MongoDB _id as the unique identifier
                            name: config.roleName,
                            displayName: config.displayName,
                            description: config.description || '',
                            moduleAccess: config.moduleAccess || [],
                            organization: config.organization,
                            isSystemRole: config.isSystemRole,
                            isDeletable: config.isDeletable,
                            isDefault: config.isDefault,
                            canManageOrganizations: config.canManageOrganizations,
                            canManageSettings: config.canManageSettings,
                            canManageRoles: config.canManageRoles
                        };
                        return role;
                    });

                    console.log('[loadRoles] Loaded', this.roles.length, 'roles');

                    // If we had a selected role, try to re-select it
                    if (this.selectedRole) {
                        const stillExists = this.roles.find(r => r.id === this.selectedRole!.id);
                        if (!stillExists) {
                            this.selectedRole = null;
                        }
                    }
                } else {
                    console.warn('[loadRoles] Unexpected response format:', response);
                    this.roles = [];
                    this.saveMessage = 'Unexpected response format from server';
                    this.saveMessageType = 'error';
                }

                this.loading = false;
            },
            error: (error) => {
                console.error('[loadRoles] Error:', error);
                this.roles = [];
                this.loading = false;

                // Provide user-friendly error messages
                if (error.status === 0) {
                    this.saveMessage = 'Cannot connect to server. Please check if the backend is running.';
                } else if (error.status === 401) {
                    this.saveMessage = 'Session expired. Please log in again.';
                } else if (error.status === 403) {
                    this.saveMessage = 'Access denied. You do not have permission to view role configurations.';
                } else if (error.error?.message) {
                    this.saveMessage = error.error.message;
                } else {
                    this.saveMessage = 'Failed to load roles. Please try again.';
                }

                this.saveMessageType = 'error';

                // Auto-clear error message after 5 seconds
                setTimeout(() => {
                    this.saveMessage = '';
                }, 5000);
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
        console.log("moduleId", moduleId);
        if (!this.selectedRole) return;

        const index = this.selectedRole.moduleAccess.indexOf(moduleId);
        console.log("index", index);

        if (index > -1) {
            this.selectedRole.moduleAccess.splice(index, 1);
        } else {
            this.selectedRole.moduleAccess.push(moduleId);
        }
        console.log("this.selectedRole", this.selectedRole);

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
            console.log('[autoSaveModuleAccess] selectedOrganization:', this.selectedOrganization);
            console.log('[autoSaveModuleAccess] selectedOrganization type:', typeof this.selectedOrganization);
            console.log('[autoSaveModuleAccess] selectedRole:', this.selectedRole);

            // Prepare payload with moduleAccess and organizationId (if selected)
            const payload: any = {
                moduleAccess: this.selectedRole!.moduleAccess
            };

            // Include organizationId if an organization is selected
            // Make sure it's not null, undefined, or the string 'null'
            if (this.selectedOrganization && this.selectedOrganization !== 'null') {
                payload.organizationId = this.selectedOrganization;
                console.log('[autoSaveModuleAccess] Including organizationId:', payload.organizationId);
            } else {
                console.log('[autoSaveModuleAccess] No organization selected, updating global config');
            }

            console.log('[autoSaveModuleAccess] Final payload:', JSON.stringify(payload, null, 2));

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
        // Fully database-driven check - no hardcoded role names
        return role.isSystemRole === true;
    }

    isDeletableRole(role: Role): boolean {
        // Check if role is deletable from database
        return role.isDeletable !== false;
    }
}
