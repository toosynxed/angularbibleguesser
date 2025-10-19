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

### <s>Version 1.3.0 (Recalled - In Progress)</s>
<s>- Implemented custom gamemodes.</s>
<s>- Added user profiles and statistics tracking.</s>
<s>- Added accounts and login functionality.</s>
  <s>- Email</s>
  <s>- Google</s>

### Version 1.2.3
- Changed game theme to dark mode.
- Improved result cards layout for better readability.
- Fixed bug with result card indicators not displaying correctly.

### Version 1.2.2
- Fixed an issue with verse context not displaying correctly in Marathon mode.
- Improved responsiveness of the home page on smaller devices.
- Added a changelog to keep you updated!

### Version 1.2.1
- Integrated all verses into a single paragraph on the game screen.
- The verse to be guessed is now highlighted in purple.
- Increased the difficulty slider range to 250 verses.
- Added a "Refocus" button to scroll back to the verse being guessed.

### Version 1.2.0-beta
- Implemented Marathon mode for extended gameplay.
- Added game code sharing functionality.

### Version 1.0.1
- Fixed a bug where the verse context was not displaying correctly in some cases.
- Improved performance when loading verses.
- Enhanced user feedback display for incorrect guesses.

### Version 1.0.0
- Initial release of the "Better Bible Guesser".
- Kudos to Alain R. at bibleguesser.com for the original concept!
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
