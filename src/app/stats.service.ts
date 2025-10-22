import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { Observable, of } from 'rxjs';
import { UserStats, NormalModeStats, CustomModeStats, MultiplayerModeStats } from './stats.model';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  constructor(private afs: AngularFirestore) { }

  getUserStats(uid: string): Observable<UserStats | undefined> {
    if (!uid) {
      return of(undefined);
    }
    return this.afs.doc<UserStats>(`userStats/${uid}`).valueChanges();
  }

  private async initializeStats(uid: string, gameMode: keyof UserStats) {
    const statsDocRef: AngularFirestoreDocument<UserStats> = this.afs.doc(`userStats/${uid}`);
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
    await statsDocRef.set(initialData, { merge: true });
  }

  updateNormalModeStats(uid: string, score: number, stars: number): Promise<void> {
    const statsDocRef: AngularFirestoreDocument<UserStats> = this.afs.doc(`userStats/${uid}`);
    const increment = firebase.firestore.FieldValue.increment;
    return statsDocRef.update({
      'normal.gamesPlayed': increment(1),
      'normal.totalScore': increment(score),
      'normal.totalStars': increment(stars)
    } as any).catch(err => {
      // If the document or 'normal' field doesn't exist, initialize it and then update.
      if (err.code === 'not-found' || err.message.includes('No document to update') || err.message.includes('does not exist')) {
        return this.initializeStats(uid, 'normal').then(() => this.updateNormalModeStats(uid, score, stars));
      }
      throw err;
    });
  }

  updateCustomModeStats(uid: string, rounds: number, totalScore: number): Promise<void> {
    const statsDocRef: AngularFirestoreDocument<UserStats> = this.afs.doc(`userStats/${uid}`);
    const increment = firebase.firestore.FieldValue.increment;
    return statsDocRef.update({
      'custom.gamesPlayed': increment(1),
      'custom.totalRounds': increment(rounds),
      'custom.totalScore': increment(totalScore)
    } as any).catch(err => {
      if (err.code === 'not-found' || err.message.includes('No document to update') || err.message.includes('does not exist')) {
        return this.initializeStats(uid, 'custom').then(() => this.updateCustomModeStats(uid, rounds, totalScore));
      }
      throw err;
    });
  }

  updateMultiplayerModeStats(uid: string, rounds: number, totalScore: number): Promise<void> {
    const statsDocRef: AngularFirestoreDocument<UserStats> = this.afs.doc(`userStats/${uid}`);
    const increment = firebase.firestore.FieldValue.increment;
    return statsDocRef.update({
      'multiplayer.gamesPlayed': increment(1),
      'multiplayer.totalRounds': increment(rounds),
      'multiplayer.totalScore': increment(totalScore)
    } as any).catch(err => {
      if (err.code === 'not-found' || err.message.includes('No document to update') || err.message.includes('does not exist')) {
        return this.initializeStats(uid, 'multiplayer').then(() => this.updateMultiplayerModeStats(uid, rounds, totalScore));
      }
      throw err;
    });
  }
}
