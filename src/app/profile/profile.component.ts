import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { StatsService } from '../core/stats.service';
import { UserStats, NormalModeStats, CustomModeStats, MultiplayerModeStats } from '../core/stats.model';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user$: Observable<firebase.User | null>;
  stats$: Observable<UserStats | undefined>;

  constructor(private authService: AuthService, private statsService: StatsService) { }

  ngOnInit(): void {
    this.user$ = this.authService.user$;
    this.stats$ = this.user$.pipe(
      switchMap(user => {
        if (user && !user.isAnonymous) {
          return this.statsService.getUserStats(user.uid);
        }
        return of(undefined); // Return empty observable if no user or anonymous
      })
    );
  }

  // Helper methods to calculate and format averages
  getAverage(total: number, count: number): string {
    if (!count) return '0';
    return (total / count).toFixed(2);
  }
}
