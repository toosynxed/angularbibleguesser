import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ShareService } from '../share.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  showCodeInput = false;
  gameCode = '';
  error: string | null = null;

  constructor(
    private router: Router,
    private shareService: ShareService,
    public authService: AuthService
  ) { }

  startGame(mode: 'normal' | 'marathon'): void {
    this.router.navigate(['/game'], { state: { mode: mode } });
  }

  playFromCode(): void {
    this.error = null;
    const seed = this.shareService.decodeGame(this.gameCode);

    if (seed && seed.verseIds.length > 0) {
      this.router.navigate(['/game'], {
        state: {
          mode: seed.mode,
          verseIds: seed.verseIds
        }
      });
    } else {
      this.error = 'Invalid game code. Please check and try again.';
    }
  }
}
