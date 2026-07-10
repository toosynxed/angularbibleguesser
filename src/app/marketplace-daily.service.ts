import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { first } from 'rxjs/operators';

export interface DailyMarketSeed {
  date: string; // YYYY-MM-DD
  seed: number; // Drives deterministic per-user item selection for the day (see marketplace-bitmask.ts)
}

/**
 * Mirrors the get-or-create pattern used by DailyChallengeService: the first
 * visitor each day lazily creates today's shared "seed" document. No scheduled
 * Cloud Function is required. Admins can force a same-day reshuffle for every
 * user by calling generateNewMarketSeed() again (overwrites today's seed).
 */
@Injectable({
  providedIn: 'root'
})
export class MarketplaceDailyService {

  constructor(private afs: AngularFirestore) { }

  // Gets today's date in YYYY-MM-DD format (UTC), matching DailyChallengeService.
  private getTodayDateString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Fetches today's shared market seed, creating it if it doesn't exist yet.
  async getTodaysMarketSeed(): Promise<DailyMarketSeed> {
    const todayStr = this.getTodayDateString();
    const seedRef = this.afs.collection('daily_market_seeds').doc<DailyMarketSeed>(todayStr);
    const doc = await seedRef.get().pipe(first()).toPromise();

    if (doc.exists) {
      return doc.data();
    } else {
      return this.generateNewMarketSeed();
    }
  }

  // Admin function to force a new shop reshuffle for today (used by the future "Reset Shop" button).
  async generateNewMarketSeed(): Promise<DailyMarketSeed> {
    const todayStr = this.getTodayDateString();
    const newSeed: DailyMarketSeed = {
      date: todayStr,
      seed: Math.floor(Math.random() * 2 ** 31)
    };
    await this.afs.collection('daily_market_seeds').doc(todayStr).set(newSeed);
    return newSeed;
  }
}
