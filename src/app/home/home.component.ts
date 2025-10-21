import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { ShareService } from '../share.service';
import { AuthService } from '../auth.service';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  showCodeInput = false;
  gameCode = '';
  error: string | null = null;
  showChangelog = false;
  showHelp = false;
  activeHelpTab: 'rules' | 'about' = 'rules';
  user$: Observable<firebase.User | null>;

  // Content for the "Rules" tab
  rulesContent = `
<h3>How to Play</h3>
<p>Your goal is to guess the book, chapter, and verse number of the highlighted verse. A passage from the Bible will be displayed with one verse highlighted in purple. Use the context slider to show more or fewer surrounding verses to help you guess.</p>
<h4>Game Modes</h4>
<ul>
  <li><b>Normal Mode:</b> A quick game with a single random verse.</li>
  <li><b>Custom Mode:</b> Customize your game by setting the number of rounds, time limit, and which books of the Bible to draw verses from.</li>
  <li><b>Create Mode:</b> Hand-pick specific verses to create a custom challenge for yourself or to share with friends.</li>
  <li><b>Play with Code:</b> Enter a game code you've received to play a specific set of verses created by another player.</li>
</ul>
<p>After finishing any game, you can get a share code so friends can play the exact same rounds you did.</p>
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
<h3>Version 1.5.0 "Login"</h3>
<ul>
  <li>Players can now create accounts and log in using Google Sign-In or Email.</li>
  <li><s>New profile system to track user statistics and game history.</s> - Coming Soon!</li>
</ul>

<h3>Version 1.4.2</h3>
<ul>
  <li>Fixed bugs in Online Multiplayer Mode.</li>
  <li>Innactive Multiplayer lobbies now expire after 30 minutes.</li>
  <li>You can now enter your own name in Multiplayer Lobbies.</li>
</ul>

<h3>Version 1.4.1 "Online"</h3>
<ul>
  <s><li>Sign-in to save progress and scores!</li></s>
  <s><li>Google Account sign-in options. - Coming Soon!</li></s>
  <s><li>Tracking statistics.</li></s>
  <li>New Online Multiplayer Mode allows you to create
  lobbies and play with other players!</li>
</ul>

<h3>Version 1.4.0 open-beta</h3>
<ul>
  <li>Released onto the web using IONIS Hosting!</li>
  <li>Implemented Create Mode.</li>
  <li>Players can now copy their game codes for all modes, including Create Mode.</li>
  <li>Join the NEW Discord to see more updates and view other player's games!</li>
  <li>Join the Discord at: <a href="https://discord.gg/XtTbvV2p" target="_blank" rel="noopener noreferrer">https://discord.gg/XtTbvV2p</a></li>
</ul>

<h3><s>Version 1.3.0 alpha (Recalled - In Progress)</s></h3>
<ul>
  <li><s>Implemented custom gamemodes.</s></li>
  <li><s>Added user profiles and statistics tracking.</s></li>
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

<h3>Version 1.2.0 pre-alpha</h3>
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

  private errorSubscription: Subscription;

  constructor(private router: Router, private shareService: ShareService, private authService: AuthService) { }

  ngOnInit(): void {
    this.user$ = this.authService.user$;
    this.errorSubscription = this.shareService.errorMessage$.subscribe(message => {
      this.error = message;
      // Clear the error from the service so it doesn't reappear on navigation
      if (message) {
        this.shareService.clearErrorMessage();
      }
    });
  }

  ngOnDestroy(): void {
    this.errorSubscription.unsubscribe();
  }

  startGame(mode: 'normal' | 'custom'): void {
    if (mode === 'custom') {
      this.router.navigate(['/custom-settings']);
    } else {
      this.router.navigate(['/game'], { state: { mode: 'normal' } });
    }
  }

  createGame(): void {
    this.router.navigate(['/create-game']);
  }
  playFromCode(): void {
    this.error = null;
    const seed = this.shareService.decodeGame(this.gameCode);

    if (seed && seed.verseIds.length > 0) {
      this.router.navigate(['/game'], {
        state: {
          mode: seed.mode,
          verseIds: seed.verseIds,
          settings: seed.settings // Pass the full settings object
        }
      });
    } else {
      this.error = 'Invalid game code. Please check and try again.';
    }
  }

  goToMultiplayer(): void {
    this.router.navigate(['/multiplayer']);
  }
}
