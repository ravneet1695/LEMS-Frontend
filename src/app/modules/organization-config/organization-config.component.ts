import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface ConfigItem {
    configKey: string;
    defaultValue: any;
    currentValue: any;
    dataType: string;
    description: string;
    isCustomized: boolean;
}

interface CategoryConfigs {
    [key: string]: ConfigItem;
}

@Component({
    selector: 'app-organization-config',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './organization-config.component.html',
    styleUrls: ['./organization-config.component.css']
})
export class OrganizationConfigComponent implements OnInit {
    configs: { [category: string]: CategoryConfigs } = {};
    categories: string[] = ['general', 'testing', 'notifications', 'branding'];
    activeCategory: string = 'general';
    loading = false;
    saveMessage = '';
    saveMessageType: 'success' | 'error' = 'success';
    hasUnsavedChanges = false;
    modifiedConfigs: Set<string> = new Set();

    constructor(private http: HttpClient) { }

    ngOnInit(): void {
        this.loadConfigs();
    }

    loadConfigs(): void {
        this.loading = true;
        this.saveMessage = '';

        this.http.get<any>(`${environment.apiUrl}/organization-configs/available`).subscribe({
            next: (response) => {
                if (response.success) {
                    this.configs = response.data;
                    console.log('Loaded configs:', this.configs);
                }
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading configs:', error);
                this.saveMessage = error.error?.message || 'Error loading configurations';
                this.saveMessageType = 'error';
                this.loading = false;
            }
        });
    }

    setActiveCategory(category: string): void {
        if (this.hasUnsavedChanges) {
            if (!confirm('You have unsaved changes. Do you want to discard them?')) {
                return;
            }
        }
        this.activeCategory = category;
        this.hasUnsavedChanges = false;
        this.modifiedConfigs.clear();
    }

    onConfigChange(configKey: string): void {
        this.hasUnsavedChanges = true;
        this.modifiedConfigs.add(configKey);
    }

    saveConfig(configKey: string, category: string): void {
        const config = this.configs[category][configKey];

        this.http.post<any>(`${environment.apiUrl}/organization-configs`, {
            configKey,
            configValue: config.currentValue,
            category
        }).subscribe({
            next: (response) => {
                if (response.success) {
                    config.isCustomized = true;
                    this.modifiedConfigs.delete(configKey);
                    if (this.modifiedConfigs.size === 0) {
                        this.hasUnsavedChanges = false;
                    }
                    this.showSuccessMessage(`${configKey} saved successfully`);
                }
            },
            error: (error) => {
                console.error('Error saving config:', error);
                this.showErrorMessage(error.error?.message || 'Error saving configuration');
            }
        });
    }

    saveAllChanges(): void {
        if (this.modifiedConfigs.size === 0) {
            this.showErrorMessage('No changes to save');
            return;
        }

        const configsToSave = Array.from(this.modifiedConfigs).map(key => {
            // Find the category for this key
            let category = '';
            let configValue = null;

            for (const cat in this.configs) {
                if (this.configs[cat][key]) {
                    category = cat;
                    configValue = this.configs[cat][key].currentValue;
                    break;
                }
            }

            return { configKey: key, configValue, category };
        });

        this.loading = true;
        this.http.post<any>(`${environment.apiUrl}/organization-configs/bulk`, {
            configs: configsToSave
        }).subscribe({
            next: (response) => {
                if (response.success) {
                    // Mark all as customized
                    configsToSave.forEach(({ configKey, category }) => {
                        if (this.configs[category] && this.configs[category][configKey]) {
                            this.configs[category][configKey].isCustomized = true;
                        }
                    });

                    this.modifiedConfigs.clear();
                    this.hasUnsavedChanges = false;
                    this.showSuccessMessage(`Saved ${configsToSave.length} configurations`);
                }
                this.loading = false;
            },
            error: (error) => {
                console.error('Error bulk saving configs:', error);
                this.showErrorMessage(error.error?.message || 'Error saving configurations');
                this.loading = false;
            }
        });
    }

    discardChanges(): void {
        if (!confirm('Are you sure you want to discard all unsaved changes?')) {
            return;
        }
        this.loadConfigs();
        this.hasUnsavedChanges = false;
        this.modifiedConfigs.clear();
    }

    resetToDefault(configKey: string, category: string): void {
        if (!confirm(`Reset ${configKey} to default value?`)) {
            return;
        }

        this.http.delete<any>(`${environment.apiUrl}/organization-configs/${configKey}`).subscribe({
            next: (response) => {
                if (response.success) {
                    const config = this.configs[category][configKey];
                    config.currentValue = config.defaultValue;
                    config.isCustomized = false;
                    this.modifiedConfigs.delete(configKey);
                    if (this.modifiedConfigs.size === 0) {
                        this.hasUnsavedChanges = false;
                    }
                    this.showSuccessMessage(`${configKey} reset to default`);
                }
            },
            error: (error) => {
                console.error('Error resetting config:', error);
                this.showErrorMessage(error.error?.message || 'Error resetting configuration');
            }
        });
    }

    resetAllToDefaults(): void {
        if (!confirm('Are you sure you want to reset ALL configurations to defaults? This cannot be undone.')) {
            return;
        }

        this.loading = true;
        this.http.post<any>(`${environment.apiUrl}/organization-configs/reset`, {}).subscribe({
            next: (response) => {
                if (response.success) {
                    this.loadConfigs();
                    this.hasUnsavedChanges = false;
                    this.modifiedConfigs.clear();
                    this.showSuccessMessage('All configurations reset to defaults');
                }
                this.loading = false;
            },
            error: (error) => {
                console.error('Error resetting all configs:', error);
                this.showErrorMessage(error.error?.message || 'Error resetting configurations');
                this.loading = false;
            }
        });
    }

    getConfigKeys(category: string): string[] {
        return this.configs[category] ? Object.keys(this.configs[category]) : [];
    }

    isModified(configKey: string): boolean {
        return this.modifiedConfigs.has(configKey);
    }

    formatLabel(key: string): string {
        return key.replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    private showSuccessMessage(message: string): void {
        this.saveMessage = message;
        this.saveMessageType = 'success';
        setTimeout(() => {
            this.saveMessage = '';
        }, 3000);
    }

    private showErrorMessage(message: string): void {
        this.saveMessage = message;
        this.saveMessageType = 'error';
        setTimeout(() => {
            this.saveMessage = '';
        }, 5000);
    }
}
