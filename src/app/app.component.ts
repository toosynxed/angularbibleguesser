import { Component } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Better Bible Guesser';

  // Inject AuthService to initialize it on app start
  constructor(private authService: AuthService) {}
}
