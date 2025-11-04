import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Observable, of } from 'rxjs';
import { StatsService, LeaderboardPlayer } from '../stats.service';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css']
})
export class LeaderboardComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  activeTab: 'normal' | 'dailyStreak' | 'dailyScore' | 'multiplayer' = 'normal';

  normalLeaderboard$: Observable<LeaderboardPlayer[]>;
  dailyStreakLeaderboard$: Observable<LeaderboardPlayer[]>;
  dailyScoreLeaderboard$: Observable<LeaderboardPlayer[]>;

  constructor(private statsService: StatsService) { }

  ngOnInit(): void {
    this.loadLeaderboardData();
  }

  loadLeaderboardData(): void {
    switch (this.activeTab) {
      case 'normal':
        if (!this.normalLeaderboard$) {
          this.normalLeaderboard$ = this.statsService.getNormalLeaderboard();
        }
        break;
      case 'dailyStreak':
        if (!this.dailyStreakLeaderboard$) {
          this.dailyStreakLeaderboard$ = this.statsService.getDailyStreakLeaderboard();
        }
        break;
      case 'dailyScore':
        if (!this.dailyScoreLeaderboard$) {
          this.dailyScoreLeaderboard$ = this.statsService.getDailyScoreLeaderboard();
        }
        break;
    }
  }

  changeTab(tab: 'normal' | 'dailyStreak' | 'dailyScore' | 'multiplayer'): void {
    this.activeTab = tab;
    this.loadLeaderboardData();
  }
}
