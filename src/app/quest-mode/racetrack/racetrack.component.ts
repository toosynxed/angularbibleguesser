import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import { ScrollsService } from '../../scrolls.service';
import { switchMap } from 'rxjs/operators';
import { RacetrackChallengeSet, RacetrackService } from '../../racetrack.service';

@Component({
  selector: 'app-shop-page',
  templateUrl: './racetrack.component.html',
  styleUrls: ['./racetrack.component.css']
})
export class racetrackComponent implements OnInit {
  user$!: Observable<firebase.User | null>;
  showCustomization = false;
  userScrolls$!: Observable<number | undefined>;

  todaysSets: RacetrackChallengeSet[] = [];
  isLoadingSets = true;
  loadError: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private scrollsService: ScrollsService,
    private racetrackService: RacetrackService
  ) { }

  ngOnInit(): void {
    this.user$ = this.authService.user$;
    this.userScrolls$ = this.user$.pipe(
      switchMap((user) => user?.uid ? this.scrollsService.getUserScrolls(user.uid) : of(undefined))
    );

    void this.loadTodaysSets();
  }

  private async loadTodaysSets(): Promise<void> {
    this.isLoadingSets = true;
    this.loadError = null;
    try {
      const daily = await this.racetrackService.getTodaysRacetrackSets();
      this.todaysSets = daily.sets;
    } catch (error) {
      console.error('Failed to load racetrack sets:', error);
      this.loadError = 'Could not load today\'s challenges. Please try again later.';
    } finally {
      this.isLoadingSets = false;
    }
  }

  getDifficultyLabel(difficulty: string): string {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  }

  // Navigates into the existing GameComponent using its standard router-state
  // contract (mode/verseIds/settings), plus an additional `racetrackMeta` field
  // carrying the info needed for the reward calculation added in a later stage.
  playSet(set: RacetrackChallengeSet): void {
    this.router.navigate(['/game'], {
      state: {
        mode: 'racetrack',
        verseIds: set.verseIds,
        settings: {
          rounds: set.verseIds.length,
          contextSize: 250,
          timeLimit: set.timeLimit,
          books: []
        },
        racetrackMeta: {
          setId: set.setId,
          difficulty: set.difficulty,
          timeLimit: set.timeLimit,
          baseReward: set.baseReward
        }
      }
    });
  }

  confirmGoHome(): void {
    this.router.navigate(['/']);
  }

  backToMap(): void {
    this.router.navigate(['../quest'])
    console.log('Navigated to: /quest')
  }
}
