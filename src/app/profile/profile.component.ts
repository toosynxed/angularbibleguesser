import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { StatsService } from '../stats.service';
import { UserStats } from '../stats.model';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user$: Observable<firebase.User | null>;
  stats$: Observable<UserStats | undefined>;
  showCustomization = false;

  constructor(
    private authService: AuthService,
    private statsService: StatsService
  ) {}

  ngOnInit(): void {
    this.user$ = this.authService.user$;
    this.stats$ = this.user$.pipe(
      switchMap(user => {
        if (user && !user.isAnonymous) {
          return this.statsService.getUserStats(user.uid);
        }
        return of(undefined); // No stats for guests or if not logged in
      })
    );
  }

  getAverage(total: number, count: number): string {
    const safeTotal = Number(total);
    const safeCount = Number(count);

    if (!Number.isFinite(safeTotal) || !Number.isFinite(safeCount) || safeCount === 0) {
      return '0.00';
    }
    return (safeTotal / safeCount).toFixed(2);
  }
}
