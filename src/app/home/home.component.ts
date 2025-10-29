import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, Subscription } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';
import { ShareService } from '../share.service';
import { AuthService } from '../auth.service';
import { StatsService, } from '../stats.service';
import { UserStats } from '../stats.model';
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
  showCustomAndCodeMenu = false;
  activeHelpTab: 'rules' | 'about' | 'learn' = 'rules';
  showStats = false;
  user$: Observable<firebase.User | null>;
  stats$: Observable<UserStats | undefined>;
  isAdmin$: Observable<boolean>;

  // Content for the "Rules" tab
  rulesContent = `
<h3>How to Play</h3>
<p>Your goal is to guess the book, chapter, and verse number of the highlighted verse. A passage from the Bible will be displayed with one verse highlighted in purple. Use the context slider to show more or fewer surrounding verses to help you guess.</p>
<h4>Game Modes</h4>
<ul>
  <li><b>Normal Mode:</b> A standard 5-round game with random verses. See your results after each round!</li>
  <li><b>Custom Mode:</b> Customize your game by setting the number of rounds, time limit, and which books of the Bible to draw verses from.</li>
  <li><b>Create Mode:</b> Hand-pick specific verses to create a custom challenge for yourself or to share with friends.</li>
  <li><b>Play with Code:</b> Enter a game code you've received to play a specific set of verses created by another player.</li>
</ul>
<p>After finishing any game, you can get a share code so friends can play the exact same rounds you did.</p>
  `;

  // Content for the "About" tab
  aboutContent = `
<h3>About Better Bible Guesser</h3>
<p>This project was inspired by the original <a href="https://bibleguesser.com/" target="_blank" rel="noopener noreferrer">Bible Guesser</a> by Alain R.</p>
<p>The goal is to provide a fun and engaging way to test and improve your knowledge of the Holy Scripture. Whether you're a seasoned scholar or just beginning your journey, we hope this game is a blessing to you.</p>
  `;

  // Content for the "Learn" tab (SEO Content)
  learnMoreContent = `
<h2>🎯 Guess the Bible Verse Game – Interactive Scripture Challenges</h2>
<p>Engaging with Scripture can be meaningful—and enjoyable. The <b>Guess the Bible Verse Game</b> is a creative and interactive way to study God’s Word through clues, hints, and fun challenges. These games help increase familiarity with Scripture, encourage verse memorization, and promote meaningful discussion in group or ministry settings. Whether for youth ministry, Bible study groups, Christian classrooms, or personal devotion, Bible guessing games offer a fresh way to interact with the Bible.</p>

<h3>What is the Guess the Bible Verse Game?</h3>
<p>The <b>Guess the Bible Verse Game</b> challenges players to identify Bible verses using clues such as partial text, keywords, themes, or even emojis. A moderator or game host provides hints, and participants try to recognize the correct verse and sometimes its book and chapter. For example, "For God so loved the world…" would be identified as John 3:16. Variations of this game encourage different learning styles—visual, auditory, and competitive.</p>
<p>This type of Bible activity is ideal for <b>Sunday school sessions, church events, retreats, and family devotion nights.</b> It helps participants grow in biblical literacy and encourages engagement with Scripture beyond reading by rote. As <b>Psalm 119:11</b> says, “I have hidden your word in my heart that I might not sin against you.” Games like this make Scripture memorable in a joyful way.</p>

<h3>How do you play Guess the Bible Verse Emoji?</h3>
<p><b>Guess the Bible Verse Emoji</b> is a visual version of Scripture guessing. Players are shown a series of emojis that represent key words or themes from a Bible verse. Their goal is to decode the emoji sentence and identify the verse. For example: 📖❤️🌎✝️✨ This might represent <b>John 3:16</b> (“For God so loved the world…”).</p>
<p>This format is especially effective for younger players and youth ministries because emojis bring verses to life in a modern, visual context. To play:</p>
<ul>
  <li>Display or share emoji clues.</li>
  <li>Give players 30–60 seconds to guess.</li>
  <li>Allow hints if needed.</li>
  <li>Reveal the verse and discuss its meaning.</li>
</ul>
<p>This game works well on PowerPoint, printable worksheets, or social media ministry pages. Try a round to see how your group connects biblical truth with creative thinking.</p>

<h3>Is there a Bible Verse Wordle?</h3>
<p>Yes. <b>Bible Verse Wordle</b> is a Scripture-based word puzzle inspired by the popular Wordle game. Instead of guessing random five-letter words, players guess <b>Bible-related words or terms</b> within six tries. Common game words include grace, faith, cross, light, and sheep.</p>
<p>In faith-based versions, players receive hints connected to Bible themes. For example, a hint might be “This is a fruit of the Spirit” (Galatians 5:22–23), helping players solve the puzzle. Bible Wordle promotes vocabulary growth and increases familiarity with key biblical terms.</p>

<h3>What is a good Bible verse game for adults?</h3>
<p>Adults often enjoy Bible games that are <b>thought-provoking, competitive, and connected to Scripture study</b>. Good options include:</p>
<ul>
  <li><b>Verse Completion</b> – Players fill in missing words from memory (Psalm 23:1).</li>
  <li><b>Context Challenge</b> – Identify the book and chapter from a verse excerpt.</li>
  <li><b>Guess the Speaker</b> – Determine who said the verse (e.g. Paul, David, Jesus).</li>
  <li><b>Scripture Matching</b> – Match a Bible verse to its theme or teaching.</li>
</ul>
<p>Any of these games can be used in adult small groups, men’s and women’s Bible studies, or church fellowship nights. Working with Scripture context promotes deeper understanding, as encouraged in <b>2 Timothy 2:15</b>: “Do your best to present yourself to God as one approved… who correctly handles the word of truth.”</p>

<h3>How do you play Guess the Book of the Bible?</h3>
<p>In <b>Guess the Book of the Bible</b>, players hear or read a Bible verse and identify which book it comes from. For example, “The Lord is my shepherd; I shall not want” is recognized from <b>Psalm 23:1</b>. To play:</p>
<ul>
  <li>Select 10–20 verses of varying difficulty.</li>
  <li>Read each verse aloud or display it.</li>
  <li>Players write down or call out the book name.</li>
  <li>Award bonus points for naming the chapter.</li>
</ul>

<h3>What is the Guess Bible: Who Am I Game?</h3>
<p><b>Guess Bible: Who Am I?</b> is a character-based guessing game that provides clues about a person in Scripture, and players must identify who it is. For example: “I was swallowed by a great fish” – <b>Jonah</b>. “I led Israel out of Egypt” – <b>Moses</b>. “I denied Jesus three times” – <b>Peter</b>. This game reinforces Bible story awareness and character study.</p>

<h3>Can Bible guessing games help with Scripture memory?</h3>
<p>Absolutely. <b>Bible guessing games</b> improve recall, repetition, and contextual understanding, which are essential for long-term <b>Scripture</b> memory. Combining memory with interaction makes Scripture easier to retain. This matches the teaching in <b>Deuteronomy 6:6–7</b>, which instructs believers to repeat and discuss God’s Word regularly.</p>

<h3>Play Free Online Bible Verse Guessing Games</h3>
<p>Ready to start? Explore <b>free</b>, <b>interactive Bible games</b> on this site to grow your <b>Scripture familiarity</b> in a fun and engaging way!</p>
  `;

  // You can update the changelog text here.
  // Using backticks (`) allows for multi-line strings.
  changelogContent = `
<h3>Version 2.1.1 - beta</h3>
<ul>
  <li>Changed Normal Mode to 5 rounds by default.</li>
  <li>Mobile layout rework</li>
</ul>
<h3>Version 2.1.0 "Scroll"</h3>
<ul>
  <li>Added detailed breakdown of stats by game mode.</li>
  <li>Implemented NEW scroll-bar picker for guess input!</li>
  <li>Improved mobile responsiveness and layout.</li>
  <li>Enhanced performance for loading verses and game start times.</li>
</ul>
<h3>Version 2.0.0 "MultiStats"</h3>
<ul>
  <li>Added statistics tracking for all game modes.</li>
  <li>View your accuracy and average scores on the home page.</li>
  <li>Improved multiplayer lobby experience with real-time updates.</li>
  <li>Fixed various bugs and improved overall performance.</li>
  <li>Reworked/Added Short-Lived game codes to share with friends!</li>
</ul>
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

<h3>Version 1.4.0 pre-alpha</h3>
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

  constructor(
    private router: Router,
    private shareService: ShareService,
    private authService: AuthService,
    private statsService: StatsService
  ) { }

  ngOnInit(): void {
    this.user$ = this.authService.user$;

    this.isAdmin$ = this.user$.pipe(
      map(user => user ? this.authService.isAdmin(user.uid) : false)
    );

    this.stats$ = this.user$.pipe(
      switchMap(user => {
        if (user && !user.isAnonymous) {
          return this.statsService.getUserStats(user.uid);
        }
        return of(undefined); // No stats for guests or if not logged in
      })
    );

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
    const code = this.gameCode.trim().toUpperCase();
    if (!code) {
      return;
    }

    // It's a short code, fetch from Firestore
    this.shareService.getSharedGame(code).pipe(first()).subscribe((gameData: any) => {
      if (gameData) {
        this.router.navigate(['/game'], {
          state: {
            mode: 'shared',
            verseIds: gameData.verseIds,
            settings: gameData.gameSettings
          }
        });
      } else {
        // Fallback for old codes or if not found
        const decoded = this.shareService.decodeGameData(this.gameCode);
        if (decoded) {
          this.router.navigate(['/game'], { state: { ...decoded } });
        } else {
          this.error = 'Invalid game code. Please check and try again.';
        }
      }
    });
  }

  goToMultiplayer(): void {
    this.user$.pipe(first()).subscribe(user => {
      if (user && !user.isAnonymous) {
        // Logged-in user: check database
        this.authService.getUserProfile(user.uid).pipe(first()).subscribe(profile => {
          if (!profile || !profile.hasSeenMultiplayerTutorial) {
            // If stats don't exist or flag is not set, show tutorial
            this.router.navigate(['/multiplayer'], { state: { showTutorial: true } });
          } else {
            // User has already seen it
            this.router.navigate(['/multiplayer']);
          }
        });
      } else {
        // For anonymous users, just navigate without the tutorial for now.
        this.router.navigate(['/multiplayer']);
      }
    });
  }

  getAverage(total: number, count: number): string {
    if (!count || count === 0) {
      return '0.00';
    }
    return (total / count).toFixed(2);
  }
}
