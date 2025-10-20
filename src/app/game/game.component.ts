import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, from, of, Subject, Subscription, timer, Observable, combineLatest } from 'rxjs';
import { concatMap, switchMap, takeUntil, tap, map, first } from 'rxjs/operators';
import { BibleService } from '../bible.service'; // Correct
import { Verse } from '../verse.model'; // Corrected import path
import { ShareService } from '../share.service';
import { GameSettings } from '../game-settings.model';
import { Lobby, LobbyService, Player } from '../lobby.service';
import { AuthService } from '../auth.service';

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

  // Game State
  gameMode: 'normal' | 'custom' | 'created' | 'multiplayer' = 'normal';
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

  currentRound = 0;

  currentVerse: Verse | null = null;
  verseTextWithContext: Verse[] = []; // Changed type from string to Verse[]
  contextSize = 1; // Start with context of 1

  guessForm: FormGroup;
  isRoundOver = false;
  feedback: string | null = null;
  isLoading = true;

  results: RoundResult[] = [];

  private destroy$ = new Subject<void>();
  private roundState$ = new Subject<void>();

  constructor(
    private bibleService: BibleService,
    private fb: FormBuilder,
    private router: Router,
    private shareService: ShareService,
    private lobbyService: LobbyService,
    private authService: AuthService
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as {
      mode: 'normal' | 'custom' | 'created' | 'multiplayer',
      verseIds?: number[],
      settings?: GameSettings,
      lobbyId?: string
    };
    this.lobbyId = state?.lobbyId || null;
    this.seededVerseIds = state?.verseIds || null;
    this.gameMode = state?.mode || (this.seededVerseIds ? 'created' : 'normal');
    if ((this.gameMode === 'custom' || this.gameMode === 'created') && state?.settings) {
      this.gameSettings = state.settings;
    }

    this.guessForm = this.fb.group({
      guess: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.gameMode === 'multiplayer' && this.lobbyId) {
      this.setupMultiplayerGame();
    } else {
      this.setupSinglePlayerGame();
    }
  }

  setupSinglePlayerGame(): void {
      this.totalRounds = this.seededVerseIds?.length || this.gameSettings?.rounds || 1;

      if (this.gameSettings) {
        this.contextSize = this.gameSettings.contextSize;
        if (this.gameSettings.timeLimit > 0) {
          this.timeLeft = this.gameSettings.timeLimit;
          this.startTimer();
        }
      }

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
        if (verse) this.updateVerseContext();
      });

      this.startNewRound();
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

      // Set game settings from the lobby
      this.totalRounds = lobby.gameSettings.rounds;

      // If the round has changed, reset the view
      if (this.currentRound !== lobby.currentRound + 1) {
        this.currentRound = lobby.currentRound + 1;
        this.isRoundOver = false;
        this.feedback = null;
        this.isLoading = true;
        this.guessForm.reset();
        const verseId = lobby.verseIds[lobby.currentRound];
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
    if (this.gameMode !== 'multiplayer') {
      this.currentRound++;
      this.isRoundOver = false;
      this.feedback = null;
      this.isLoading = true;
      this.guessForm.reset();
      this.roundState$.next();
    }
  }

  startTimer(): void {
    this.timerSubscription = timer(1000, 1000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.timeLeft !== null && this.timeLeft > 0) {
        this.timeLeft--;
      } else if (this.timeLeft === 0) {
        this.timerSubscription.unsubscribe();
        alert("Time's up!");
        this.finishGame();
      }
    });
  }

  updateVerseContext(): void {
    if (!this.currentVerse) return;
    this.bibleService.getVerseWithContext(this.currentVerse, this.contextSize)
      .subscribe(verses => {
        this.verseTextWithContext = verses;
        this.isLoading = false;
      });
  }

  onSliderChange(event: Event): void {
    this.contextSize = parseInt((event.target as HTMLInputElement).value, 10);
    this.updateVerseContext();
  }

  submitGuess(): void {
    if (this.gameMode === 'multiplayer' && this.isRoundOver) {
      return; // Already submitted for this round
    }

    if (this.guessForm.invalid || !this.currentVerse) {
      return;
    }

    const rawGuess: string = this.guessForm.value.guess;
    const parsedGuess = this.bibleService.parseVerseReference(rawGuess);

    // If the guess is not in a valid format, show feedback and let the user try again.
    if (!parsedGuess) {
      this.feedback = "Invalid format or spelling. Please use a format like 'John 3:16'.";
      return;
    }

    const { book, chapter, verse } = parsedGuess;
    const answer = this.currentVerse;

    const isBookCorrect = this.bibleService.normalizeBookName(book) === this.bibleService.normalizeBookName(answer.bookName);
    const isChapterCorrect = chapter === answer.chapter;
    const isVerseCorrect = verse === answer.verse;

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

    const answerIndex$ = this.bibleService.getVerseIndex({ bookName: answer.bookName, chapter: answer.chapter, verse: answer.verse });
    const guessIndex$ = this.bibleService.getVerseIndex({ bookName: book, chapter, verse });

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
    if (this.gameMode !== 'multiplayer') {
      this.router.navigate(['/results'], { state: { results: this.results, settings: this.gameSettings } });
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
