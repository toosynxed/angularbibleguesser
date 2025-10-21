import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GameResult, GameState, Lobby, PlayerResult } from '../game.model';
import { ShareService } from '../share.service';
import { AuthService } from '../auth.service';
import { StatsService } from '../core/stats.service';
import { first } from 'rxjs/operators';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit {
  // Single Player
  results: GameResult[] = [];
  gameState: GameState;

  // Multiplayer
  lobby: Lobby | null = null;
  leaderboard: { rank: number, player: { uid: string, displayName: string, isHost: boolean }, totalScore: number }[] = [];
  playerResults: PlayerResult[] = [];
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
    private statsService: StatsService
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state;

    if (state?.lobby) { // Multiplayer results
      this.lobby = state.lobby;
      this.leaderboard = state.leaderboard;
      this.authService.user$.pipe(first()).subscribe(user => {
        this.currentUser = user;
        if (this.currentUser && this.lobby) {
          this.playerResults = this.lobby.playerResults[this.currentUser.uid] || [];
          this.totalScore = this.playerResults.reduce((acc, r) => acc + r.score, 0);
        }
      });
      if (this.lobby.seed) {
        this.shareCode = this.shareService.encodeSeed(this.lobby.seed);
      }

    } else if (state?.results) { // Single player results
      this.gameState = state as GameState;
      if (this.gameState && this.gameState.results) {
        this.results = this.gameState.results;
        this.totalScore = this.results.reduce((acc, r) => acc + r.score, 0);
        this.totalStars = this.results.reduce((acc, r) => acc + r.stars, 0);
        this.shareCode = this.shareService.encodeSeed(this.gameState.seed);
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
      const rounds = this.lobby.gameSettings.rounds;
      const totalScore = this.playerResults.reduce((sum, r) => sum + r.score, 0);
      await this.statsService.updateMultiplayerModeStats(user.uid, rounds, totalScore);
    } else if (this.gameState) { // Single Player
      const { mode, results } = this.gameState;
      const totalScore = results.reduce((sum, r) => sum + r.score, 0);

      if (mode === 'normal') {
        const totalStars = results.reduce((sum, r) => sum + r.stars, 0);
        await this.statsService.updateNormalModeStats(user.uid, totalScore, totalStars);
      } else if (mode === 'custom' || mode === 'create' || mode === 'shared') {
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
