import { Component } from '@angular/core';
import { AuthService } from './auth.service';
import { SettingsService } from './features/improved-settings/settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Better Bible Guesser';

  // Inject AuthService to initialize it on app start
  constructor(private authService: AuthService, private settingsService: SettingsService) {
    this.authService.ensureAuthenticated();
    this.settingsService.applySettings();
  }
}
