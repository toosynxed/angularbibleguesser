import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { LeaderboardEntry, LeaderboardService } from '../leaderboard.service';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css']
})
export class LeaderboardComponent implements OnInit {
  normalScores$!: Observable<LeaderboardEntry[]>;
  marathonScores$!: Observable<LeaderboardEntry[]>;

  constructor(private leaderboardService: LeaderboardService) { }

  ngOnInit(): void {
    this.normalScores$ = this.leaderboardService.getHighScores('normal', 10);
    this.marathonScores$ = this.leaderboardService.getHighScores('marathon', 10);
  }
}
