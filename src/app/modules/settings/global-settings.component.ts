import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SweetAlertService } from '../../core/services/sweetalert.service';

interface Setting {
    key: string;
    value: any;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description: string;
    isPublic: boolean;
    category?: string;
}

interface SettingsGroup {
    platform: Setting[];
    email: Setting[];
    security: Setting[];
    features: Setting[];
}

@Component({
    selector: 'app-global-settings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './global-settings.component.html',
    styleUrls: ['./global-settings.component.css']
})
export class GlobalSettingsComponent implements OnInit {
    settings: SettingsGroup = {
        platform: [],
        email: [],
        security: [],
        features: []
    };

    originalSettings: SettingsGroup = {
        platform: [],
        email: [],
        security: [],
        features: []
    };

    activeTab: 'platform' | 'email' | 'security' | 'features' = 'platform';
    loading = false;
    saving = false;
    error = '';
    success = '';
    hasChanges = false;

    constructor(private http: HttpClient) { }

    ngOnInit(): void {
        this.loadSettings();
    }

    loadSettings(): void {
        this.loading = true;
        this.http.get<any>(`${environment.apiUrl}/settings`).subscribe({
            next: (res) => {
                this.settings = {
                    platform: res.data.platform || [],
                    email: res.data.email || [],
                    security: res.data.security || [],
                    features: res.data.features || []
                };
                // Deep clone for comparison
                this.originalSettings = JSON.parse(JSON.stringify(this.settings));
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load settings';
                console.error('Error loading settings:', err);
                this.loading = false;
            }
        });
    }

    setActiveTab(tab: 'platform' | 'email' | 'security' | 'features'): void {
        this.activeTab = tab;
    }

    updateSettingValue(setting: Setting, value: any): void {
        // Convert value based on type
        if (setting.type === 'number') {
            const numValue = Number(value);
            if (!isNaN(numValue)) {
                setting.value = numValue;
            }
        } else if (setting.type === 'boolean') {
            setting.value = Boolean(value);
        } else {
            setting.value = value;
        }
        this.checkForChanges();
    }

    getSettingValue(setting: Setting): any {
        if (setting.type === 'boolean') {
            return setting.value === true || setting.value === 'true';
        }
        return setting.value;
    }

    checkForChanges(): void {
        this.hasChanges = JSON.stringify(this.settings) !== JSON.stringify(this.originalSettings);
    }

    isValid(setting: Setting): boolean {
        if (setting.type === 'number') {
            return !isNaN(Number(setting.value));
        }
        if (setting.key === 'email.fromEmail') {
            const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
            return emailPattern.test(setting.value);
        }
        return true;
    }

    get isFormValid(): boolean {
        const allSettings = [
            ...this.settings.platform,
            ...this.settings.email,
            ...this.settings.security,
            ...this.settings.features
        ];
        return allSettings.every(s => this.isValid(s));
    }

    saveSettings(): void {
        if (!this.isFormValid) {
            SweetAlertService.error('Error', 'Please fix validation errors before saving.');
            return;
        }

        this.saving = true;
        this.error = '';
        this.success = '';

        // Flatten all settings into a single array
        const allSettings = [
            ...this.settings.platform.map(s => ({ ...s, category: 'platform' })),
            ...this.settings.email.map(s => ({ ...s, category: 'email' })),
            ...this.settings.security.map(s => ({ ...s, category: 'security' })),
            ...this.settings.features.map(s => ({ ...s, category: 'features' }))
        ];

        this.http.post<any>(`${environment.apiUrl}/settings/bulk`, { settings: allSettings }).subscribe({
            next: (res) => {
                this.success = 'Settings saved successfully';
                this.originalSettings = JSON.parse(JSON.stringify(this.settings));
                this.hasChanges = false;
                this.saving = false;
                SweetAlertService.success('Success!', 'Settings saved successfully');
                setTimeout(() => this.success = '', 3000);
            },
            error: (err) => {
                this.error = err.error?.message || 'Failed to save settings';
                this.saving = false;
                SweetAlertService.error('Error', this.error);
            }
        });
    }

    async resetToDefaults(): Promise<void> {
        const confirmed = await SweetAlertService.confirm(
            'Reset to Defaults?',
            'This will reset all settings to default values. Continue?',
            'Yes, reset!'
        );
        if (!confirmed) return;

        this.saving = true;
        this.http.post<any>(`${environment.apiUrl}/settings/initialize`, {}).subscribe({
            next: (res) => {
                this.success = 'Settings reset to defaults successfully';
                this.loadSettings();
                this.saving = false;
                SweetAlertService.success('Success!', 'Settings reset to defaults');
            },
            error: (err) => {
                this.error = err.error?.message || 'Failed to reset settings';
                this.saving = false;
                SweetAlertService.error('Error', this.error);
            }
        });
    }

    discardChanges(): void {
        this.settings = JSON.parse(JSON.stringify(this.originalSettings));
        this.hasChanges = false;
        this.success = 'Changes discarded';
        setTimeout(() => this.success = '', 2000);
    }

    formatKey(key: string): string {
        // Convert 'platform.name' to 'Platform Name'
        const parts = key.split('.');
        const lastPart = parts[parts.length - 1];
        return lastPart
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    getTabIcon(tab: string): string {
        const icons: { [key: string]: string } = {
            platform: 'bi-gear',
            email: 'bi-envelope',
            security: 'bi-shield-lock',
            features: 'bi-toggles'
        };
        return icons[tab] || 'bi-gear';
    }

    getTabCount(tab: 'platform' | 'email' | 'security' | 'features'): number {
        return this.settings[tab]?.length || 0;
    }
}
