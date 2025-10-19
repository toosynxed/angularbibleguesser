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
  showHelp = false;
  activeHelpTab: 'rules' | 'about' = 'rules';

  // Content for the "Rules" tab
  rulesContent = `
<h3>How to Play</h3>
<ul>
  <li>Select a game mode: Normal (1 round) or Custom Mode.</li>
  <li>A passage from the Bible will be displayed with one verse highlighted in purple.</li>
  <li>Your goal is to guess the book, chapter, and verse number of the highlighted verse.</li>
  <li>Use the context slider to show more or fewer surrounding verses to help you guess.</li>
  <li>After finishing a game, you can share a code with friends so they can play the exact same rounds you did.</li>
</ul>
  `;

  // Content for the "About" tab
  aboutContent = `
<h3>About Better Bible Guesser</h3>
<p>This project was inspired by the original <a href="https://bibleguesser.com/" target="_blank" rel="noopener noreferrer">bibleguesser.com</a> by Alain R.</p>
<p>The goal is to provide a fun and engaging way to test and improve your knowledge of the Holy Scripture. Whether you're a seasoned scholar or just beginning your journey, we hope this game is a blessing to you.</p>
  `;

  // You can update the changelog text here.
  // Using backticks (`) allows for multi-line strings.
  changelogContent = `
<h3><s>Version 1.3.0 (Recalled - In Progress)</s></h3>
<ul>
  <li><s>Implemented custom gamemodes.</s></li>
  <li><s>Added user profiles and statistics tracking.</s></li>
  <li><s>Added accounts and login functionality (Email, Google).</s></li>
</ul>

<h3>Version 1.2.3</h3>
<ul>
  <li>Changed game theme to dark mode.</li>
  <li>Improved result cards layout for better readability.</li>
  <li>Fixed bug with result card indicators not displaying correctly.</li>
</ul>

<h3>Version 1.2.2</h3>
<ul>
  <li>Fixed an issue with verse context not displaying correctly in Marathon mode.</li>
  <li>Improved responsiveness of the home page on smaller devices.</li>
  <li>Added a changelog to keep you updated!</li>
</ul>

<h3>Version 1.2.1</h3>
<ul>
  <li>Integrated all verses into a single paragraph on the game screen.</li>
  <li>The verse to be guessed is now highlighted in purple.</li>
  <li>Increased the difficulty slider range to 250 verses.</li>
  <li>Added a "Refocus" button to scroll back to the verse being guessed.</li>
</ul>

<h3>Version 1.2.0-beta</h3>
<ul>
  <li>Implemented Marathon mode for extended gameplay.</li>
  <li>Added game code sharing functionality.</li>
</ul>

<h3>Version 1.0.1</h3>
<ul>
  <li>Fixed a bug where the verse context was not displaying correctly in some cases.</li>
  <li>Improved performance when loading verses.</li>
  <li>Enhanced user feedback display for incorrect guesses.</li>
</ul>

<h3>Version 1.0.0</h3>
<ul>
  <li>Initial release of the "Better Bible Guesser".</li>
  <li>Kudos to Alain R. at bibleguesser.com for the original concept!</li>
</ul>
  `;

  constructor(private router: Router, private shareService: ShareService) { }

  startGame(mode: 'normal' | 'custom'): void {
    if (mode === 'custom') {
      this.router.navigate(['/custom-settings']);
    } else {
      this.router.navigate(['/game'], { state: { mode: 'normal' } });
    }
  }

  navigateTo(path: string): void {
    this.router.navigate([`/${path}`]);
  }
  playFromCode(): void {
    this.error = null;
    const seed = this.shareService.decodeGame(this.gameCode);

    if (seed && seed.verseIds.length > 0) {
      this.router.navigate(['/game'], {
        state: {
          mode: seed.mode,
          verseIds: seed.verseIds,
          settings: seed.settings // Pass the settings from the decoded seed
        }
      });
    } else {
      this.error = 'Invalid game code. Please check and try again.';
    }
  }
}
