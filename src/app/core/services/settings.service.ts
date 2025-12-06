import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private settings = new BehaviorSubject<any>({});
  public settings$ = this.settings.asObservable();
  private loaded = false;

  constructor(private http: HttpClient) {}

  loadSettings(): Promise<void> {
    if (this.loaded) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.http.get<any>(`${environment.apiUrl}/settings`).subscribe({
        next: (res) => {
          const settingsObj: any = {};
          if (res.data && Array.isArray(res.data)) {
            res.data.forEach((setting: any) => {
              settingsObj[setting.key] = setting.value;
            });
          }
          this.settings.next(settingsObj);
          this.loaded = true;
          resolve();
        },
        error: (err) => {
          console.error('Failed to load settings:', err);
          // Set defaults on error
          this.settings.next({ tablePageSize: 10 });
          this.loaded = true;
          resolve(); // Resolve anyway with defaults
        }
      });
    });
  }

  getTablePageSize(): number {
    const value = this.settings.value.tablePageSize;
    // Ensure it's a valid number between 5 and 100
    if (typeof value === 'number' && value >= 5 && value <= 100) {
      return value;
    }
    return 10; // Default fallback
  }

  getSetting(key: string, defaultValue?: any): any {
    return this.settings.value[key] ?? defaultValue;
  }

  getSettings(): any {
    return this.settings.value;
  }
}
