import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { first } from 'rxjs/operators';
import { BibleService } from './bible.service';
import { StatsService } from './stats.service';
import firebase from 'firebase/compat/app';

export interface DailyChallenge {
  date: string; // YYYY-MM-DD
  verseIds: number[];
}

@Injectable({
  providedIn: 'root'
})
export class DailyChallengeService {

  constructor(
    private afs: AngularFirestore,
    private bibleService: BibleService,
    private statsService: StatsService
  ) { }

  // Gets today's date in YYYY-MM-DD format (UTC)
  private getTodayDateString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Fetches today's challenge, creating it if it doesn't exist
  async getTodaysChallenge(): Promise<DailyChallenge> {
    const todayStr = this.getTodayDateString();
    const challengeRef = this.afs.collection('daily_challenges').doc<DailyChallenge>(todayStr);
    const doc = await challengeRef.get().pipe(first()).toPromise();

    if (doc.exists) {
      return doc.data();
    } else {
      return this.generateNewDailyChallenge();
    }
  }

  // Admin function to force-generate a new challenge for today
  async generateNewDailyChallenge(): Promise<DailyChallenge> {
    const todayStr = this.getTodayDateString();
    const verseIds = await this.bibleService.getRandomVerseIds(5).toPromise(); // 5 rounds
    const newChallenge: DailyChallenge = {
      date: todayStr,
      verseIds: verseIds
    };
    await this.afs.collection('daily_challenges').doc(todayStr).set(newChallenge);
    return newChallenge;
  }

  // Updates user stats after completing a daily challenge
  async completeDailyChallenge(uid: string, score: number, stars: number): Promise<void> {
    const todayStr = this.getTodayDateString();
    const stats = await this.statsService.getUserStats(uid).pipe(first()).toPromise();

    const dailyStats = stats?.daily || {
      currentStreak: 0,
      highestStreak: 0,
      completionHistory: {},
      totalScore: 0,
      totalStars: 0,
      totalRoundsPlayed: 0
    };

    // Avoid double-counting for the same day
    if (dailyStats.completionHistory[todayStr]) {
      return;
    }

    // Streak Logic
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dailyStats.completionHistory[yesterdayStr]) {
      dailyStats.currentStreak++; // Continue streak
    } else {
      dailyStats.currentStreak = 1; // Start a new streak
    }

    if (dailyStats.currentStreak > dailyStats.highestStreak) {
      dailyStats.highestStreak = dailyStats.currentStreak;
    }

    // Update stats
    dailyStats.completionHistory[todayStr] = true;
    dailyStats.totalScore += score;
    dailyStats.totalStars += stars;
    dailyStats.totalRoundsPlayed += 5; // Daily game is always 5 rounds

    return this.statsService.updateUserStats(uid, { daily: dailyStats });
  }
}
