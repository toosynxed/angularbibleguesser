import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { first } from 'rxjs/operators';
import { BibleService } from './bible.service';

export type RacetrackDifficulty = 'easy' | 'medium' | 'hard';

export interface RacetrackChallengeSet {
  setId: string;
  verseIds: number[]; // 5 verses per set
  timeLimit: number; // seconds
  baseReward: number; // scrolls before the speed/score/star multiplier is applied
  difficulty: RacetrackDifficulty;
}

export interface RacetrackDailySets {
  date: string; // YYYY-MM-DD
  sets: RacetrackChallengeSet[];
}

export interface RacetrackRewardParams {
  score: number; // 0-100 per-round average, or total/rounds
  stars: number; // 0-3 per-round average, or total/rounds
  timeTakenSeconds: number;
  timeLimitSeconds: number;
  baseReward: number;
}

const ROUNDS_PER_SET = 5;

const DIFFICULTY_CONFIG: { difficulty: RacetrackDifficulty; timeLimit: number; baseReward: number }[] = [
  { difficulty: 'easy', timeLimit: 120, baseReward: 20 },
  { difficulty: 'medium', timeLimit: 90, baseReward: 35 },
  { difficulty: 'hard', timeLimit: 60, baseReward: 50 }
];

/**
 * Mirrors the get-or-create pattern used by DailyChallengeService, but stores
 * multiple challenge sets (one per difficulty) for the day instead of a single
 * global challenge. No scheduled Cloud Function is required.
 */
@Injectable({
  providedIn: 'root'
})
export class RacetrackService {

  constructor(
    private afs: AngularFirestore,
    private bibleService: BibleService
  ) { }

  private getTodayDateString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Fetches today's racetrack sets, creating them if they don't exist yet.
  async getTodaysRacetrackSets(): Promise<RacetrackDailySets> {
    const todayStr = this.getTodayDateString();
    const setsRef = this.afs.collection('racetrack_sets').doc<RacetrackDailySets>(todayStr);
    const doc = await setsRef.get().pipe(first()).toPromise();

    if (doc.exists) {
      return doc.data();
    } else {
      return this.generateNewRacetrackSets();
    }
  }

  // Admin function to force-generate new racetrack sets for today.
  async generateNewRacetrackSets(): Promise<RacetrackDailySets> {
    const todayStr = this.getTodayDateString();

    const sets: RacetrackChallengeSet[] = [];
    for (const config of DIFFICULTY_CONFIG) {
      const verseIds = await this.bibleService.getRandomVerseIds(ROUNDS_PER_SET).toPromise();
      sets.push({
        setId: `${todayStr}-${config.difficulty}`,
        verseIds,
        timeLimit: config.timeLimit,
        baseReward: config.baseReward,
        difficulty: config.difficulty
      });
    }

    const newDailySets: RacetrackDailySets = { date: todayStr, sets };
    await this.afs.collection('racetrack_sets').doc(todayStr).set(newDailySets);
    return newDailySets;
  }

  /**
   * Pure reward calculator: combines score, stars, and remaining time into a
   * single scroll reward. Not wired into GameComponent/ResultsComponent yet -
   * exposed here so the formula can be reviewed/tuned before that integration.
   *
   * Weighting: 50% score, 30% stars, 20% speed (time remaining vs time limit).
   */
  calculateReward(params: RacetrackRewardParams): number {
    const { score, stars, timeTakenSeconds, timeLimitSeconds, baseReward } = params;

    const scoreFactor = clamp01(score / 100);
    const starFactor = clamp01(stars / 3);

    const timeRemaining = Math.max(0, timeLimitSeconds - timeTakenSeconds);
    const speedFactor = timeLimitSeconds > 0 ? clamp01(timeRemaining / timeLimitSeconds) : 0;

    const multiplier = (0.5 * scoreFactor) + (0.3 * starFactor) + (0.2 * speedFactor);
    return Math.round(baseReward * multiplier);
  }
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
