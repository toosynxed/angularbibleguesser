import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RoundResult } from '../game/game.component';
import { ShareService } from '../share.service';
import { AuthService } from '../auth.service';
import { StatsService } from '../stats.service';
import { first } from 'rxjs/operators';
import { LeaderboardService } from '../leaderboard.service';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit {
  results: RoundResult[] = [];
  totalScore = 0;
  shareCode = '';
  copyButtonText = 'Copy Share Code';
  expandedIndex: number | null = null;

  constructor(
    private router: Router,
    private shareService: ShareService,
    private authService: AuthService,
    private statsService: StatsService,
    private leaderboardService: LeaderboardService
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { results: RoundResult[], username?: string } | undefined;
    if (state?.results) {
      this.results = state.results;
    } else if (!state?.results) {
      // No results, go home
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    if (this.results.length === 0) return;

    this.totalScore = this.results.reduce((acc, r) => acc + r.score, 0);
    const verseIds = this.results.map(r => r.verse.verseId);
    this.shareCode = this.shareService.encodeGame(verseIds);

    this.saveAllStats();
  }

  private saveAllStats(): void {
    this.authService.user$.pipe(first()).subscribe(user => {
      // Save personal stats for logged-in users
      if (user && this.results.length > 0) {
        this.statsService.updateUserStats(user, this.results);
      }

      // Save to public leaderboard
      const gameMode = this.results.length > 1 ? 'marathon' : 'normal';
      const playerName = user?.displayName || (this.router.getCurrentNavigation()?.extras.state as any)?.username || 'Anonymous';
      this.leaderboardService.addHighScore({ username: playerName, score: this.totalScore, mode: gameMode });
    });
  }

  copyCode(): void {
    navigator.clipboard.writeText(this.shareCode).then(() => {
      this.copyButtonText = 'Copied!';
      setTimeout(() => this.copyButtonText = 'Copy Share Code', 2000);
    }).catch(err => console.error('Failed to copy text: ', err));
  }

  getStarArray(starCount: number): any[] {
    return new Array(starCount);
  }

  toggleExpand(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }
}
