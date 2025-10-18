import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ShareService } from '../share.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  showCodeInput = false;
  gameCode = '';
  error: string | null = null;
  showChangelog = false;

  // You can update the changelog text here.
  // Using backticks (`) allows for multi-line strings.
  changelogContent = `
### Version 1.2.0
- Added a changelog to keep you updated!

### Version 1.1.0
- Integrated all verses into a single paragraph on the game screen.
- The verse to be guessed is now highlighted in purple.
- Increased the difficulty slider range to 250 verses.
- Added a "Refocus" button to scroll back to the verse being guessed.

### Version 1.0.0
- Initial release of Better Bible Guesser.
  `;

  constructor(private router: Router, private shareService: ShareService) { }

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
