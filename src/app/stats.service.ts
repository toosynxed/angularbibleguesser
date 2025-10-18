import { Injectable } from '@angular/core';
import { doc, docData, Firestore, runTransaction, setDoc } from '@angular/fire/firestore';
import { User } from '@angular/fire/auth';
import { from, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { RoundResult } from './game/game.component';
import { GameModeStats, UserStats } from './user-stats.model';

@Injectable({
  providedIn: 'root'
})
export class StatsService {

  constructor(private firestore: Firestore) { }

  getUserStats(user: User | null): Observable<UserStats | null> {
    if (!user) {
      return of(null);
    }
    const userDocRef = doc(this.firestore, `users/${user.uid}`);
    return docData(userDocRef) as Observable<UserStats>;
  }

  async updateUserStats(user: User, results: RoundResult[]): Promise<void> {
    const gameMode = results.length > 1 ? 'marathon' : 'normal';
    const gameScore = results.reduce((acc, r) => acc + r.score, 0);
    const gameStars = results.reduce((acc, r) => acc + r.stars, 0);

    const userDocRef = doc(this.firestore, `users/${user.uid}`);

    try {
      await runTransaction(this.firestore, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);

        let currentStats: UserStats;
        if (!userDoc.exists()) {
          // Create initial stats if they don't exist
          currentStats = {
            uid: user.uid,
            normal: { gamesPlayed: 0, totalScore: 0, totalStars: 0, avgScore: 0, avgStars: 0 },
            marathon: { gamesPlayed: 0, totalScore: 0, totalStars: 0, avgScore: 0, avgStars: 0 },
          };
        } else {
          currentStats = userDoc.data() as UserStats;
        }

        const modeStats = currentStats[gameMode];
        modeStats.gamesPlayed += 1;
        modeStats.totalScore += gameScore;
        modeStats.totalStars += gameStars;
        modeStats.avgScore = modeStats.totalScore / modeStats.gamesPlayed;
        modeStats.avgStars = modeStats.totalStars / (modeStats.gamesPlayed * results.length); // Avg stars per round

        transaction.set(userDocRef, currentStats, { merge: true });
      });
    } catch (e) {
      console.error("Transaction failed: ", e);
    }
  }
}
