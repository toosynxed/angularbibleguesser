import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AppSettings {
  effectsAudio: boolean;
  gameAudio: boolean;
  highContrast: boolean;
  hidePlayerNames: boolean;
  fontScale: number;
  theme: 'dark' | 'light';
}

const DEFAULT_SETTINGS: AppSettings = {
  effectsAudio: true,
  gameAudio: true,
  highContrast: false,
  hidePlayerNames: false,
  fontScale: 1,
  theme: 'dark'
};

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly storageKey = 'bbg_app_settings';
  private readonly settingsSubject = new BehaviorSubject<AppSettings>(this.loadSettings());
  readonly settings$ = this.settingsSubject.asObservable();

  get currentSettings(): AppSettings {
    return this.settingsSubject.value;
  }

  updateSettings(settings: Partial<AppSettings>): void {
    const nextSettings = {
      ...this.settingsSubject.value,
      ...settings
    };

    this.settingsSubject.next(nextSettings);
    localStorage.setItem(this.storageKey, JSON.stringify(nextSettings));
    this.applySettings(nextSettings);
  }

  resetSettings(): void {
    this.settingsSubject.next(DEFAULT_SETTINGS);
    localStorage.setItem(this.storageKey, JSON.stringify(DEFAULT_SETTINGS));
    this.applySettings(DEFAULT_SETTINGS);
  }

  applySettings(settings = this.settingsSubject.value): void {
    document.documentElement.style.setProperty('--user-font-scale', String(settings.fontScale));
    document.body.classList.toggle('settings-high-contrast', settings.highContrast);
    document.body.classList.toggle('settings-light-theme', settings.theme === 'light');
  }

  private loadSettings(): AppSettings {
    const rawSettings = localStorage.getItem(this.storageKey);

    if (!rawSettings) {
      return DEFAULT_SETTINGS;
    }

    try {
      return {
        ...DEFAULT_SETTINGS,
        ...JSON.parse(rawSettings)
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
}
