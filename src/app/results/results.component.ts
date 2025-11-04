import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Lobby, LobbyService, Player } from '../lobby.service';
import { RoundResult } from '../game/game.component';
import { ShareService } from '../share.service';
import { AuthService } from '../auth.service';
import { StatsService } from '../stats.service';
import { BibleService, } from '../bible.service';
import { first, map, switchMap, tap, take } from 'rxjs/operators';
import { combineLatest, of, Observable } from 'rxjs';
import firebase from 'firebase/compat/app';
import { GameSettings } from '../game-settings.model';

export interface GameState {
  results: RoundResult[];
  settings: GameSettings;
  mode: 'normal' | 'custom' | 'created' | 'shared' | 'daily';
}

interface LeaderboardPlayer {
  uid: string;
  isHost: boolean;
  displayName: string;
  rank?: number;
  totalScore: number;
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
  isFinalRound = false;
  gameDataForSharing: any;

  // Multiplayer
  lobby: Lobby | null = null;
  leaderboard: LeaderboardPlayer[] = [];
  multiplayerUserResults$: Observable<(RoundResult & { roundNumber: number })[]>;
  currentUser: firebase.User | null = null;

  // Common
  totalScore = 0;
  totalStars = 0;
  shortShareCode = '';
  longShareUrl = '';
  shortCodeCopyButtonText = 'Create and Copy';
  isShortCodeGenerating = false;
  isLongCodeGenerating = false;
  longCodeCopyButtonText = 'Copy Link';
  copyResultsButtonText = 'Copy Results';
  expandedIndex: number | null = null;

  constructor(
    private router: Router,
    private shareService: ShareService,
    private authService: AuthService,
    private statsService: StatsService,
    private bibleService: BibleService,
    private lobbyService: LobbyService
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state;

    if (state?.lobby) { // Multiplayer results
      this.lobby = state.lobby;
      // Calculate leaderboard from lobby data
      if (this.lobby) {
        this.lobbyService.getLobbyPlayers(this.lobby.id).pipe(take(1)).subscribe(players => {
          const playerMap = new Map<string, Player>(players.map(p => [p.uid, p]));
          const playerScores: { [uid: string]: { displayName: string, totalScore: number } } = {};

          // Aggregate scores
          if (this.lobby.guesses) {
            Object.values(this.lobby.guesses).forEach(roundGuesses => {
              Object.entries(roundGuesses).forEach(([uid, guessData]) => {
                if (!playerScores[uid]) {
                  playerScores[uid] = { displayName: playerMap.get(uid)?.displayName || 'Player', totalScore: 0 };
                }
                playerScores[uid].totalScore += guessData.score;
              });
            });
          }

          this.leaderboard = Object.entries(playerScores).map(([uid, data]) => ({ uid, ...data, isHost: this.lobby.hostId === uid }))
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, 10) // Show only top 10
            .map((player, index) => ({ ...player, rank: index + 1 })); // Assign rank after slicing
          });
        this.gameDataForSharing = { verseIds: this.lobby.verseIds, gameSettings: this.lobby.gameSettings };
      }

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
              this.totalScore = results.reduce((acc, r) => acc + (r?.score || 0), 0);
              this.totalStars = results.reduce((acc, r) => acc + (r?.stars || 0), 0);
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
        this.gameDataForSharing = { verseIds: this.results.map(r => r.verse.verseId), gameSettings: this.gameState.settings };
        this.isFinalRound = this.results.length >= this.gameState.settings.rounds;
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

  async createAndCopyShortCode(): Promise<void> {
    if (this.isShortCodeGenerating) return;

    if (!this.shortShareCode) {
      this.isShortCodeGenerating = true;
      this.shortCodeCopyButtonText = 'Creating...';
      this.shortShareCode = await this.shareService.createShortCodeGame(this.gameDataForSharing);
      this.isShortCodeGenerating = false;
    }

    navigator.clipboard.writeText(this.shortShareCode).then(() => {
      this.shortCodeCopyButtonText = 'Copied!';
      setTimeout(() => this.shortCodeCopyButtonText = 'Copy Code', 2000);
    });
  }

  private async updateStats(): Promise<void> {
    console.log('updateStats called.');
    const user = await this.authService.user$.pipe(first()).toPromise();

    if (!user || user.isAnonymous) {
      console.log('Stats not saved: User is anonymous or null.');
      return;
    }
    console.log('User is logged in:', user.uid);

    if (this.lobby) { // Multiplayer
      console.log('Branch: Multiplayer');
      const userRounds = Object.values(this.lobby.guesses || {}).filter(round => round[user.uid]);
      const totalScore = userRounds.reduce((sum, round) => sum + round[user.uid].score, 0);
      if (userRounds.length > 0) {
        console.log(`Multiplayer: uid=${user.uid}, rounds=${userRounds.length}, score=${totalScore}`);
        await this.statsService.updateMultiplayerModeStats(user.uid, userRounds.length, totalScore);
        console.log('Multiplayer stats update initiated.');
      } else {
        console.log('Multiplayer: No rounds played by user, skipping stats update.');
      }
    } else if (this.gameState && this.gameState.results && this.gameState.mode && this.gameState.settings) { // Single Player
      console.log('Branch: Single Player');
      const { mode, results } = this.gameState;
      const totalScore = this.totalScore;
      console.log('Single Player GameState:', this.gameState);

      if (mode === 'normal') {
        const totalStars = results.reduce((sum, r) => sum + r.stars, 0);
        // Only update total score and stars per round.
        // gamesPlayed is updated only when all rounds are complete.
        await this.statsService.updateNormalModeStats(user.uid, results[results.length - 1].score, results[results.length - 1].stars);
        if (results.length === this.gameState.settings.rounds) {
          await this.statsService.incrementNormalGamesPlayed(user.uid);
        }
        console.log(`Normal stats update initiated for round ${results.length}.`);
      } else if (mode === 'custom' || mode === 'created' || mode === 'shared') {
        await this.statsService.updateCustomModeStats(user.uid, results.length, totalScore);
        console.log('Custom/Create/Shared stats update initiated.');
      } else {
        console.log('Single Player: Unknown mode, skipping stats update.');
      }
    }
    else {
      console.log('Branch: No lobby, or missing gameState.results/mode/settings. Skipping stats update.');
    }
  }

  async createAndCopyPermanentUrl(): Promise<void> {
    if (this.isLongCodeGenerating) return;

    if (!this.longShareUrl) {
      this.isLongCodeGenerating = true;
      this.longCodeCopyButtonText = 'Creating...';
      const permanentId = await this.shareService.createPermanentSharedGame(this.gameDataForSharing);
      this.longShareUrl = `${window.location.origin}/game/${permanentId}`;
      this.isLongCodeGenerating = false;
    }

    navigator.clipboard.writeText(this.longShareUrl).then(() => {
      this.longCodeCopyButtonText = 'Copied!';
      setTimeout(() => this.longCodeCopyButtonText = 'Copy Link', 2000);
    });
  }

  toggleExpand(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  getStarArray(count: number): any[] {
    return new Array(Math.round(count));
  }

  continueGame(): void {
    // Navigate back to the game component, passing the current results
    // The game component will see the results and start the next round
    this.router.navigate(['/game'], {
      state: {
        ...this.gameState
      }
    });
  }

  copyResults(): void {
    let resultsText = '';
    let modeName = 'Game';
    let roundsPlayed = 0;
    let resultsForCopy: { stars: number, score: number }[] = [];

    // 1. Title
    if (this.lobby) { // Multiplayer
      modeName = 'Multiplayer';
      roundsPlayed = this.lobby.gameSettings.rounds;
      // We need to get the results from the observable
      this.multiplayerUserResults$.pipe(take(1)).subscribe(results => {
        resultsForCopy = results.map(r => ({ stars: r.stars, score: r.score }));
        this.generateAndCopy(modeName, roundsPlayed, resultsForCopy);
      });
      return; // Async handling
    } else if (this.gameState) { // Single Player
      roundsPlayed = this.gameState.results.length;
      switch (this.gameState.mode) {
        case 'normal': modeName = 'Normal'; break;
        case 'custom':
        case 'created':
        case 'shared': modeName = 'Custom'; break;
        case 'daily': modeName = `Daily ${new Date().toLocaleDateString()}`; break;
      }
      resultsForCopy = this.gameState.results.map(r => ({ stars: r.stars, score: r.score }));
      this.generateAndCopy(modeName, roundsPlayed, resultsForCopy);
    }
  }

  private generateAndCopy(modeName: string, roundsPlayed: number, results: { stars: number, score: number }[]): void {
    let resultsText = `Better Bible Guesser - ${modeName} ${roundsPlayed} Rounds\n\n`;

    // 2. Result Rows
    results.forEach(result => {
      const greenBox = '🟩';
      const redBox = '🟥';
      const starsDisplay = greenBox.repeat(result.stars) + redBox.repeat(3 - result.stars);
      resultsText += `${starsDisplay} ${result.score}/100\n`;
    });

    // 3. URL
    resultsText += `\n${this.longShareUrl}`;

    navigator.clipboard.writeText(resultsText).then(() => {
      this.copyResultsButtonText = 'Copied!';
      setTimeout(() => this.copyResultsButtonText = 'Copy Results', 2000);
    });
  }
}
