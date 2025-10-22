import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Lobby } from '../lobby.service';
import { RoundResult } from '../game/game.component';
import { ShareService } from '../share.service';
import { AuthService } from '../auth.service';
import { StatsService } from '../stats.service';
import { BibleService } from '../bible.service';
import { first, map, switchMap, tap } from 'rxjs/operators';
import { combineLatest, from, of, Observable } from 'rxjs';
import firebase from 'firebase/compat/app';
import { GameSettings } from '../game-settings.model';

export interface GameState {
  results: RoundResult[];
  settings: GameSettings;
  mode: 'normal' | 'custom' | 'created' | 'shared';
}

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit {
  // Single Player
  results: RoundResult[] = [];
  gameState: GameState;

  // Multiplayer
  lobby: Lobby | null = null;
  leaderboard: (any)[] = []; // Simplified for this context
  multiplayerUserResults$: Observable<(RoundResult & { roundNumber: number })[]>;
  currentUser: firebase.User | null = null;

  // Common
  totalScore = 0;
  totalStars = 0;
  shareCode = '';
  copyButtonText = 'Copy Code';
  expandedIndex: number | null = null;

  constructor(
    private router: Router,
    private shareService: ShareService,
    private authService: AuthService,
    private statsService: StatsService,
    private bibleService: BibleService
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state;

    if (state?.lobby) { // Multiplayer results
      this.lobby = state.lobby;
      this.leaderboard = state.leaderboard;
      this.shareCode = this.shareService.encodeGame({ mode: 'shared', verseIds: this.lobby.verseIds, settings: this.lobby.gameSettings });

      this.multiplayerUserResults$ = this.authService.user$.pipe(
        first(user => !!user),
        switchMap(user => {
          this.currentUser = user;
          if (!this.lobby?.guesses || !user) return of([]);

          const roundKeys = Object.keys(this.lobby.guesses).sort();
          const userResultsObservables = roundKeys.map((roundKey, index) => {
            const userGuessData = this.lobby.guesses[roundKey][user.uid];
            const correctVerseId = this.lobby.verseIds[index];

            if (!userGuessData) return of(null);

            return this.bibleService.getVerseById(correctVerseId).pipe(
              map(correctVerse => {
                if (!correctVerse) return null;

                const parsedGuess = this.bibleService.parseVerseReference(userGuessData.guess);
                const isBookCorrect = parsedGuess ? this.bibleService.normalizeBookName(parsedGuess.book) === this.bibleService.normalizeBookName(correctVerse.bookName) : false;
                const isChapterCorrect = parsedGuess ? parsedGuess.chapter === correctVerse.chapter : false;
                const isVerseCorrect = parsedGuess ? parsedGuess.verse === correctVerse.verse : false;

                let stars = 0;
                if (isBookCorrect) {
                  stars = 1;
                  if (isChapterCorrect) {
                    stars = 2;
                    if (isVerseCorrect) stars = 3;
                  }
                }

                return {
                  roundNumber: index + 1,
                  verse: correctVerse,
                  guess: parsedGuess,
                  score: userGuessData.score,
                  isBookCorrect, isChapterCorrect, isVerseCorrect, stars
                };
              })
            );
          });

          return combineLatest(userResultsObservables).pipe(
            map(results => results.filter(r => r !== null)),
            tap(results => {
              this.totalScore = results.reduce((acc, r) => acc + r.score, 0);
            })
          );
        })
      );

    } else if (state?.results) { // Single player results
      this.gameState = state as any; // Cast to any to handle old GameState model
      if (this.gameState && this.gameState.results) {
        this.results = this.gameState.results;
        this.totalScore = this.results.reduce((acc, r) => acc + r.score, 0);
        this.totalStars = this.results.reduce((acc, r) => acc + r.stars, 0);
        this.shareCode = this.shareService.encodeGame({ mode: 'shared', verseIds: this.results.map(r => r.verse.verseId), settings: this.gameState.settings });
      }
    } else {
      // If there's no state, redirect home
      this.router.navigate(['/']);
    }
  }

  async ngOnInit(): Promise<void> {
    // The constructor now handles initialization based on state.
    // We'll call the stat update logic here, after everything is initialized.
    await this.updateStats();
  }

  private async updateStats(): Promise<void> {
    const user = await this.authService.user$.pipe(first()).toPromise();

    // Don't save stats for guests or if there's no game state
    if (!user || user.isAnonymous) {
      return; // Don't save stats for guests or if there's no game state
    }

    if (this.lobby) { // Multiplayer
      const userRounds = Object.values(this.lobby.guesses || {}).filter(round => round[user.uid]);
      const totalScore = userRounds.reduce((sum, round) => sum + round[user.uid].score, 0);
      if (userRounds.length > 0) {
        await this.statsService.updateMultiplayerModeStats(user.uid, userRounds.length, totalScore);
      }
    } else if (this.gameState && this.gameState.results) { // Single Player
      const { mode, results } = this.gameState;
      const totalScore = this.totalScore;

      if (mode === 'normal') {
        const totalStars = results.reduce((sum, r) => sum + r.stars, 0);
        await this.statsService.updateNormalModeStats(user.uid, totalScore, totalStars);
      } else if (mode === 'custom' || mode === 'created' || mode === 'shared') {
        await this.statsService.updateCustomModeStats(user.uid, results.length, totalScore);
      }
    }
  }

  copyCode(): void {
    navigator.clipboard.writeText(this.shareCode).then(() => {
      this.copyButtonText = 'Copied!';
      setTimeout(() => this.copyButtonText = 'Copy Code', 2000);
    });
  }

  toggleExpand(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  getStarArray(count: number): any[] {
    return new Array(Math.round(count));
  }
}
