import { Component, OnInit } from '@angular/core';
import { AppSettings, SettingsService } from './settings.service';

@Component({
  selector: 'app-improved-settings',
  templateUrl: './improved-settings.component.html',
  styleUrls: ['./improved-settings.component.css']
})
export class ImprovedSettingsComponent implements OnInit {
  settings!: AppSettings;

  constructor(private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.settings = { ...this.settingsService.currentSettings };
    this.settingsService.applySettings(this.settings);
  }

  save(): void {
    this.settingsService.updateSettings(this.settings);
  }

  reset(): void {
    this.settingsService.resetSettings();
    this.settings = { ...this.settingsService.currentSettings };
  }
}
