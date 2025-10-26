import { Injectable } from '@angular/core';
import { doc, docData, Firestore, setDoc, updateDoc, increment } from '@angular/fire/firestore';
import { from, Observable, of } from 'rxjs';
import { UserStats, NormalModeStats, CustomModeStats, MultiplayerModeStats } from './stats.model';

@Injectable({
  providedIn: 'root'
})
export class StatsService {

  constructor(private firestore: Firestore) { }

  getUserStats(uid: string): Observable<UserStats | undefined> {
    if (!uid) {
      return of(undefined);
    }
    const statsDocRef = doc(this.firestore, `userStats/${uid}`);
    return docData(statsDocRef) as Observable<UserStats | undefined>;
  }

  private async initializeStats(uid: string, gameMode: keyof UserStats) {
    const statsDocRef = doc(this.firestore, `userStats/${uid}`);
    let initialModeStats: NormalModeStats | CustomModeStats | MultiplayerModeStats;

    switch (gameMode) {
      case 'normal':
        initialModeStats = { gamesPlayed: 0, totalScore: 0, totalStars: 0 };
        break;
      case 'custom':
        initialModeStats = { gamesPlayed: 0, totalScore: 0, totalRounds: 0 };
        break;
      case 'multiplayer':
        initialModeStats = { gamesPlayed: 0, totalScore: 0, totalRounds: 0 };
        break;
    }

    const initialData: Partial<UserStats> = { [gameMode]: initialModeStats };

    // Use setDoc with merge to avoid overwriting other game mode stats
    await setDoc(statsDocRef, initialData, { merge: true });
  }

  updateNormalModeStats(uid: string, score: number, stars: number): Promise<void> {
    const statsDocRef = doc(this.firestore, `userStats/${uid}`);
    // This method is called after each round. We only increment score and stars.
    // gamesPlayed is incremented separately on the final results page.
    return updateDoc(statsDocRef, {
      'normal.totalScore': increment(score),
      'normal.totalStars': increment(stars)
    }).catch(err => {
      // If the document or 'normal' field doesn't exist, initialize it and then update.
      if (err.code === 'not-found' || err.message.includes('No document to update')) {
        return this.initializeStats(uid, 'normal').then(() => this.updateNormalModeStats(uid, score, stars));
      }
      throw err;
    });
  }

  updateCustomModeStats(uid: string, rounds: number, totalScore: number): Promise<void> {
    const statsDocRef = doc(this.firestore, `userStats/${uid}`);
    return updateDoc(statsDocRef, {
      'custom.gamesPlayed': increment(1),
      'custom.totalRounds': increment(rounds),
      'custom.totalScore': increment(totalScore)
    }).catch(err => {
      if (err.code === 'not-found' || err.message.includes('No document to update')) {
        return this.initializeStats(uid, 'custom').then(() => this.updateCustomModeStats(uid, rounds, totalScore));
      }
      throw err;
    });
  }

  updateMultiplayerModeStats(uid: string, rounds: number, totalScore: number): Promise<void> {
    const statsDocRef = doc(this.firestore, `userStats/${uid}`);
    return updateDoc(statsDocRef, {
      'multiplayer.gamesPlayed': increment(1),
      'multiplayer.totalRounds': increment(rounds),
      'multiplayer.totalScore': increment(totalScore)
    }).catch(err => {
      if (err.code === 'not-found' || err.message.includes('No document to update')) {
        return this.initializeStats(uid, 'multiplayer').then(() => this.updateMultiplayerModeStats(uid, rounds, totalScore));
      }
      throw err;
    });
  }
}
