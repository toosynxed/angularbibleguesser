import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, from, of, Subject, Subscription, timer, Observable, combineLatest, } from 'rxjs';
import { concatMap, switchMap, takeUntil, tap, map, first, } from 'rxjs/operators';
import { BibleService } from '../bible.service'; // Correct
import { Verse } from '../verse.model'; // Corrected import path
import { ShareService } from '../share.service';
import { GameSettings } from '../game-settings.model';
import { Lobby, LobbyService, Player } from '../lobby.service';
import { AuthService } from '../auth.service';
import { DailyChallengeService } from '../daily-challenge.service';

export interface RoundResult {
  verse: Verse;
  guess: { book: string; chapter: number; verse: number; } | null;
  score: number;
  isBookCorrect: boolean;
  isChapterCorrect: boolean;
  isVerseCorrect: boolean;
  stars: number;
}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {
  @ViewChild('verseContextContainer') private verseContextContainer: ElementRef<HTMLElement>;

  // Game State - Added 'shared' to the possible game modes
  gameMode: 'normal' | 'custom' | 'created' | 'shared' | 'multiplayer' | 'daily' = 'normal';
  totalRounds = 1;
  seededVerseIds: number[] | null = null;
  gameSettings: GameSettings | null = null; // To hold marathon settings
  timeLeft: number | null = null;
  private timerSubscription: Subscription;

  // Multiplayer State
  lobbyId: string | null = null;
  lobby$: Observable<Lobby>;
  players$: Observable<Player[]>;
  userId: string;
  isHost = false;
  isMultiplayerRoundOver = false;
  correctAnswer: string | null = null;

  currentRound = 0;

  currentVerse: Verse | null = null;
  verseTextWithContext: Verse[] = []; // Changed type from string to Verse[]
  contextSize = 1; // Start with context of 1

  isRoundOver = false;
  feedback: string | null = null;
  isLoading = true;

  // --- Scroll Picker State ---
  bookOptions: string[] = [];
  chapterOptions: number[] = [];
  verseOptions: number[] = [];

  selectedBook: string | null = null;
  selectedChapter: number | null = null;
  selectedVerse: number | null = null;

  results: RoundResult[] = [];

  private destroy$ = new Subject<void>();
  private roundState$ = new Subject<void>();

  constructor(
    private bibleService: BibleService,
    private router: Router,
    private shareService: ShareService,
    private lobbyService: LobbyService,
    private authService: AuthService,
    private dailyChallengeService: DailyChallengeService
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as {
      mode: 'normal' | 'custom' | 'created' | 'shared' | 'multiplayer' | 'daily',
      verseIds?: number[],
      settings?: GameSettings,
      lobbyId?: string,
      results?: RoundResult[]
    };
    this.results = state?.results || []; // Restore results if coming back from inter-round results page
    this.lobbyId = state?.lobbyId || null;
    this.seededVerseIds = state?.verseIds || null;
    this.gameMode = state?.mode || 'normal';
    if ((this.gameMode === 'custom' || this.gameMode === 'created' || this.gameMode === 'shared') && state?.settings) {
      this.gameSettings = state.settings;
    }
  }

  ngOnInit(): void {
    // Load book options for the picker
    this.bibleService.getBooks().subscribe(books => {
      this.bookOptions = books;
    });

    if (this.gameMode === 'multiplayer' && this.lobbyId) {
      this.setupMultiplayerGame();
    } else if (this.results.length > 0) {
      this.continueSinglePlayerGame();
    } else {
      this.setupSinglePlayerGame();
    }
  }

  setupSinglePlayerGame(): void {
    if (this.gameMode === 'daily') {
      this.totalRounds = 5;
      this.contextSize = 250; // Lock context size for daily mode
      this.gameSettings = { rounds: 5, contextSize: 250, timeLimit: 0, books: [] };
    } else {
      this.totalRounds = (this.gameMode === 'normal') ? 5 : (this.seededVerseIds?.length || this.gameSettings?.rounds || 1);
    }

    this.currentRound = 0; // Start at 0 for a new game

    if (this.gameSettings && this.gameMode !== 'daily') { // Don't override daily settings
      this.contextSize = this.gameSettings.contextSize;
      if (this.gameSettings.timeLimit > 0) {
        this.timeLeft = this.gameSettings.timeLimit;
        this.startTimer();
      }
    }

      this.subscribeToRoundState();
      this.startNewRound();
  }

  continueSinglePlayerGame(): void {
    // This method is for when we navigate back from the results page
    this.totalRounds = (this.gameMode === 'normal') ? 5 : (this.seededVerseIds?.length || this.gameSettings?.rounds || 1);
    this.currentRound = this.results.length; // Restore round number
    this.subscribeToRoundState();
    this.startNewRound();
  }

  private subscribeToRoundState(): void {
    this.roundState$.pipe(
      concatMap(() => {
        this.isLoading = true;
        if (this.seededVerseIds && this.seededVerseIds.length > 0) {
          const verseId = this.seededVerseIds[this.currentRound - 1];
          return this.bibleService.getVerseById(verseId);
        } else {
          if (this.gameMode === 'custom' && this.gameSettings?.books && this.gameSettings.books.length > 0) {
            return this.bibleService.getRandomVerse(this.gameSettings.books);
          }
          return this.bibleService.getRandomVerse();
        }
      }),
      takeUntil(this.destroy$)
    ).subscribe(verse => {
      this.currentVerse = verse;
      if (verse) {
        this.updateVerseContext();
      }
    });
  }

  setupMultiplayerGame(): void {
    this.lobby$ = this.lobbyService.getLobby(this.lobbyId).valueChanges();
    this.players$ = this.lobbyService.getLobbyPlayers(this.lobbyId);
    this.authService.user$.pipe(first(user => !!user)).subscribe(user => this.userId = user.uid);


    this.lobby$.pipe(takeUntil(this.destroy$)).subscribe(lobby => {
      if (!lobby) {
        this.router.navigate(['/']); // Lobby was deleted
        return;
      }

      if (lobby.gameState === 'leaderboard') {
        this.router.navigate(['/multiplayer/leaderboard', this.lobbyId]);
        return;
      }

      // Determine if the current user is the host
      this.isHost = lobby.hostId === this.userId;

      // Set game settings from the lobby
      this.totalRounds = lobby.gameSettings.rounds;
      this.contextSize = lobby.gameSettings.contextSize;

      // If the round has changed, reset the view
      if (this.currentRound !== lobby.currentRound + 1) {
        this.currentRound = lobby.currentRound + 1;
        this.isRoundOver = false;
        this.feedback = null;
        this.isLoading = true;
        const verseId = lobby.verseIds[lobby.currentRound];
        // Reset and restart timer for the new round
        if (lobby.gameSettings.timeLimit > 0) {
          this.timeLeft = lobby.gameSettings.timeLimit;
          this.startTimer();
        }
        this.bibleService.getVerseById(verseId).subscribe(verse => {
          this.currentVerse = verse;
          if (verse) this.updateVerseContext();
        });
      }

      // This subscription now correctly combines the lobby and players observables
      // to persistently check if the round is over.
      combineLatest([this.lobby$, this.players$]).pipe(
        takeUntil(this.destroy$)
      ).subscribe(([lobby, players]) => {
        if (lobby && players.length > 0) {
          const currentRoundGuesses = lobby.guesses?.[`round_${lobby.currentRound}`];
          if (currentRoundGuesses && Object.keys(currentRoundGuesses).length === players.length) {
            // Once all players have guessed, the host will advance the game state.
            this.checkIfAllPlayersGuessed(lobby);
          }
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  startNewRound(): void {
    if (this.currentRound >= this.totalRounds) {
      this.finishGame();
      return;
    }

    if (this.gameMode !== 'multiplayer') {
      this.currentRound++;
      this.isRoundOver = false;
      this.feedback = null;
      this.isLoading = true;
      this.roundState$.next();
          // Reset and restart timer for the new round
      if (this.gameSettings && this.gameSettings.timeLimit > 0) {
        this.timeLeft = this.gameSettings.timeLimit;
        this.startTimer();
      }
    }
  }

  startTimer(): void {
    // Unsubscribe from any existing timer to prevent multiple timers running at once.
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    this.timerSubscription = timer(1000, 1000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.timeLeft !== null && this.timeLeft > 0) {
        this.timeLeft--;
      } else if (this.timeLeft === 0) {
        this.handleTimeUp();
      }
    });
  }

  handleTimeUp(): void {
    if (this.isRoundOver) return; // Don't do anything if round is already over

    if (this.gameMode === 'multiplayer') {
      // In multiplayer, just submit a score of 0. The game flow is controlled by the host.
      this.lobbyService.submitGuess(this.lobbyId, this.currentRound - 1, this.userId, 'No Guess', 0);
      this.isRoundOver = true;
      this.feedback = "Time's up! Your score for this round is 0.";
    } else {
      // In single-player, end the round and record a zero-score result.
      this.isRoundOver = true;
      this.feedback = `Time's up! The correct answer was ${this.answerText}.`;
      this.results.push({
        verse: this.currentVerse!,
        guess: null, // No guess
        score: 0,
        stars: 0,
        isBookCorrect: false,
        isChapterCorrect: false,
        isVerseCorrect: false
      });
    };
  }

  updateVerseContext(): void {
    if (!this.currentVerse) return;
    this.bibleService.getVerseWithContext(this.currentVerse, this.contextSize)
      .subscribe(verses => {
        this.verseTextWithContext = verses;
        this.isLoading = false;
        // Automatically scroll to the highlighted verse
        setTimeout(() => this.scrollToGuessingVerse(), 0);
      });
  }

  onSliderChange(event: Event): void {
    this.contextSize = parseInt((event.target as HTMLInputElement).value, 10);
    this.updateVerseContext();
  }

  // --- Scroll Picker Handlers ---
  onBookSelected(book: string | number): void {
    this.selectedBook = book as string;
    this.bibleService.getChaptersForBook(this.selectedBook).subscribe(chapters => {
      this.chapterOptions = Array.from({ length: chapters }, (_, i) => i + 1);
    });
  }

  onChapterSelected(chapter: string | number): void {
    this.selectedChapter = chapter as number;
    if (this.selectedBook) {
      this.bibleService.getVersesForChapter(this.selectedBook, this.selectedChapter).subscribe(verses => {
        this.verseOptions = Array.from({ length: verses }, (_, i) => i + 1);
      });
    }
  }

  onVerseSelected(verse: string | number): void {
    this.selectedVerse = verse as number;
  }

  submitGuess(): void {
    if (this.gameMode === 'multiplayer' && this.isRoundOver) {
      return; // Already submitted for this round
    }

    if (!this.currentVerse || !this.selectedBook || !this.selectedChapter || !this.selectedVerse) {
      this.feedback = "Please select a book, chapter, and verse.";
      return;
    }

    const parsedGuess = {
      book: this.selectedBook,
      chapter: this.selectedChapter,
      verse: this.selectedVerse
    };
    const rawGuess = `${this.selectedBook} ${this.selectedChapter}:${this.selectedVerse}`;
    const answer = this.currentVerse;

    const isBookCorrect = this.bibleService.normalizeBookName(parsedGuess.book) === this.bibleService.normalizeBookName(answer.bookName);
    const isChapterCorrect = parsedGuess.chapter === answer.chapter;
    const isVerseCorrect = parsedGuess.verse === answer.verse;

    let stars = 0;
    if (isBookCorrect) {
      stars = 1;
      if (isChapterCorrect) {
        stars = 2;
        if (isVerseCorrect) {
          stars = 3;
        }
      }
    }

    const answerIndex$ = this.bibleService.getVerseIndex(answer);
    const guessIndex$ = this.bibleService.getVerseIndex({
      bookName: parsedGuess.book,
      chapter: parsedGuess.chapter,
      verse: parsedGuess.verse
    });

    forkJoin([answerIndex$, guessIndex$]).subscribe(([answerIndex, guessIndex]) => {
      const distance = (guessIndex === -1) ? 100 : Math.abs(answerIndex - guessIndex);
      const score = Math.max(0, 100 - distance);

      if (this.gameMode === 'multiplayer') {
        this.lobbyService.submitGuess(this.lobbyId, this.currentRound - 1, this.userId, rawGuess, score);
        this.isRoundOver = true; // Mark as submitted for this player
        if (stars === 3) {
          this.feedback = 'Perfect! You got it exactly right!';
        } else {
          this.feedback = 'Your guess has been submitted! Waiting for other players...';
        }
      } else {
        this.isRoundOver = true;
        if (stars === 3) {
          this.feedback = 'Perfect! You got it exactly right!';
        } else {
          this.feedback = `The correct answer was ${answer.bookName} ${answer.chapter}:${answer.verse}.`;
        }

        this.results.push({
          verse: answer,
          guess: parsedGuess,
          score,
          stars,
          isBookCorrect,
          isChapterCorrect,
          isVerseCorrect
        });
      }
    });
  }

  checkIfAllPlayersGuessed(lobby: Lobby): void {
    // Only the host should trigger the next state.
    if (this.userId === lobby.hostId) {
      this.lobbyService.showLeaderboard(this.lobbyId);
    }
  }

  next(): void {
    if (this.currentRound < this.totalRounds) {
      this.startNewRound();
    } else {
      this.finishGame();
    }
  }

  finishGame(): void {
    // In single-player, we pass the results. Multiplayer is handled by the LeaderboardComponent.
    if (this.gameMode === 'daily') {
      this.authService.user$.pipe(first(user => !!user)).subscribe(user => {
        const totalScore = this.results.reduce((acc, r) => acc + r.score, 0);
        const totalStars = this.results.reduce((acc, r) => acc + r.stars, 0);
        this.dailyChallengeService.completeDailyChallenge(user.uid, totalScore, totalStars);
      });
    }

    if (this.gameMode !== 'multiplayer') {
      // For normal mode, gameSettings might be null. Create a default one.
      const settings = this.gameSettings ?? {
        rounds: this.totalRounds,
        contextSize: this.contextSize,
        timeLimit: 0, books: []
      };
      this.router.navigate(['/results'], {
        state: {
          results: this.results,
          settings: settings,
          mode: this.gameMode,
          verseIds: this.seededVerseIds
        }
      });
    }
  }

  skipRoundForEveryone(): void {
    if (this.isHost && this.gameMode === 'multiplayer') {
      // The host forces the game to the leaderboard state.
      this.lobbyService.showLeaderboard(this.lobbyId);
    }
  }

  get answerText(): string {
    if (!this.currentVerse) return '';
    return `${this.currentVerse.bookName} ${this.currentVerse.chapter}:${this.currentVerse.verse}`;
  }

  confirmGoHome(): void {
    const confirmation = window.confirm('Are you sure you want to leave? Your current game progress will be lost.');
    if (confirmation) {
      this.router.navigate(['/']);
    }
  }

  scrollToGuessingVerse(): void {
    if (this.verseContextContainer) {
      const verseElement = this.verseContextContainer.nativeElement.querySelector('.highlight');
      if (verseElement) {
        verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
}
