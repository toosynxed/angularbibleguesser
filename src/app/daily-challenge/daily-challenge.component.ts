import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { DailyChallengeService } from '../daily-challenge.service';
import { StatsService } from '../stats.service';
import { DailyModeStats } from '../stats.model';

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isCompleted: boolean;
  isStreak: boolean;
}

@Component({
  selector: 'app-daily-challenge',
  templateUrl: './daily-challenge.component.html',
  styleUrls: ['./daily-challenge.component.css']
})
export class DailyChallengeComponent implements OnInit, OnDestroy {
  calendar: CalendarDay[] = [];
  monthDisplay: string;
  dailyStats$: Observable<DailyModeStats>;
  hasPlayedToday$: Observable<boolean>;
  countdown$: Observable<string>;

  private userSub: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private statsService: StatsService,
    private dailyChallengeService: DailyChallengeService
  ) { }

  ngOnInit(): void {
    this.userSub = this.authService.user$.subscribe(user => {
      if (user && !user.isAnonymous) {
        this.dailyStats$ = this.statsService.getUserStats(user.uid).pipe(
          map(stats => stats?.daily || { currentStreak: 0, highestStreak: 0, completionHistory: {}, totalScore: 0, totalStars: 0, totalRoundsPlayed: 0 })
        );

        // When stats are loaded, generate the calendar with completion data
        this.dailyStats$.subscribe(stats => {
          this.generateCalendar(new Date(), stats.completionHistory);
        });

        this.hasPlayedToday$ = this.dailyStats$.pipe(
          map(stats => {
            const todayStr = new Date().toISOString().split('T')[0];
            return !!stats.completionHistory[todayStr];
          })
        );
      } else {
        // If user is not logged in, generate a calendar without any stats.
        this.generateCalendar(new Date(), {});
      }
    });

    this.countdown$ = interval(1000).pipe(
      startWith(0),
      map(() => this.getTimeUntilMidnight())
    );
  }

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

  // Helper function to get a 'YYYY-MM-DD' string in the local timezone
  private toLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  generateCalendar(date: Date, completionHistory: { [date: string]: boolean }): void {
    this.calendar = [];
    const year = date.getFullYear();
    const month = date.getMonth();
    this.monthDisplay = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Add days from previous month to fill the first week
    const startDayOfWeek = firstDayOfMonth.getDay();
    for (let i = startDayOfWeek; i > 0; i--) {
      const prevMonthDay = new Date(year, month, 1 - i);
      this.calendar.push({ date: prevMonthDay, dayOfMonth: prevMonthDay.getDate(), isCurrentMonth: false, isToday: false, isCompleted: false, isStreak: false });
    }

    // Add days of the current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const currentDay = new Date(year, month, i);
      const isToday = currentDay.toDateString() === new Date().toDateString();
      const dateStr = this.toLocalDateString(currentDay);

      const yesterday = new Date(currentDay);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = this.toLocalDateString(yesterday);

      const isCompleted = !!completionHistory[dateStr];
      const isStreak = isCompleted && !!completionHistory[yesterdayStr];

      this.calendar.push({ date: currentDay, dayOfMonth: i, isCurrentMonth: true, isToday: isToday, isCompleted: isCompleted, isStreak: isStreak });
    }
  }

  async playDaily(): Promise<void> {
    const challenge = await this.dailyChallengeService.getTodaysChallenge();
    this.router.navigate(['/game'], {
      state: {
        mode: 'daily',
        verseIds: challenge.verseIds,
        settings: { rounds: 5, contextSize: 250, timeLimit: 0, books: [] }
      }
    });
  }

  getTimeUntilMidnight(): string {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0); // Next midnight
    const diff = midnight.getTime() - now.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
