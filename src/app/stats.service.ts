import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { combineLatest, Observable, of } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
import { UserProfile, UserStats, UserProfileWithStats } from './stats.model';
import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root'
})
export class StatsService {

  constructor(private afs: AngularFirestore) { }

  getUserStats(uid: string): Observable<UserStats | undefined> {
    return this.afs.collection('stats').doc<UserStats>(uid).valueChanges();
  }

  searchUsersAndGetStats(displayName: string): Observable<UserProfileWithStats[]> {
    if (!displayName.trim()) {
      return of([]);
    }

    // Firestore doesn't support case-insensitive or 'contains' queries well.
    // This 'startsWith' query is a common and effective workaround.
    const end = displayName.slice(0, -1) + String.fromCharCode(displayName.charCodeAt(displayName.length - 1) + 1);

    return this.afs.collection<UserProfile>('users', ref => ref
      .where('displayName_lowercase', '>=', displayName.toLowerCase())
      .where('displayName_lowercase', '<', end.toLowerCase())
      .limit(10)
    ).valueChanges({ idField: 'uid' }).pipe(
      switchMap(users => {
        if (users.length === 0) {
          return of([]);
        }
        const statsObservables = users.map(user =>
          this.getUserStats(user.uid).pipe(
            // Ensure the observable emits immediately, even if the doc doesn't exist.
            // This prevents combineLatest from getting stuck.
            startWith(undefined),
            map(stats => ({ ...user, stats: stats || undefined }))
          )
        );
        return combineLatest(statsObservables);
      })
    );
  }

  private getStatsDoc(uid: string): AngularFirestoreDocument<UserStats> {
    return this.afs.collection('stats').doc<UserStats>(uid);
  }

  updateUserStats(uid: string, data: Partial<UserStats>): Promise<void> {
    return this.getStatsDoc(uid).set(data, { merge: true });
  }

  async updateNormalModeStats(uid: string, score: number, stars: number): Promise<void> {
    const statsRef = this.getStatsDoc(uid).ref;
    try {
      return await this.afs.firestore.runTransaction(async (transaction) => {
        const doc = await transaction.get(statsRef);
        const stats = doc.data() || {};

        const newNormalStats = {
          ...stats.normal,
          totalScore: (stats.normal?.totalScore || 0) + score,
          totalStars: (stats.normal?.totalStars || 0) + stars,
        };

        transaction.set(statsRef, { ...stats, normal: newNormalStats }, { merge: true });
      });
    } catch (error) {
      console.error(`Error updating normal mode stats for user ${uid}:`, error);
      throw error; // Re-throw to propagate the error if necessary
    }
  }

  async incrementNormalGamesPlayed(uid: string): Promise<void> {
    const statsRef = this.getStatsDoc(uid).ref;
    try {
      return await this.afs.firestore.runTransaction(async (transaction) => {
        const doc = await transaction.get(statsRef);
        const stats = doc.data() || {};

        const newNormalStats = {
          ...stats.normal,
          gamesPlayed: (stats.normal?.gamesPlayed || 0) + 1,
        };

        transaction.set(statsRef, { ...stats, normal: newNormalStats }, { merge: true });
      });
    } catch (error) {
      console.error(`Error incrementing normal games played for user ${uid}:`, error);
      throw error;
    }
  }

  async updateCustomModeStats(uid:string, rounds: number, score: number): Promise<void> {
    const statsRef = this.getStatsDoc(uid).ref;
    try {
      return await this.afs.firestore.runTransaction(async (transaction) => {
        const doc = await transaction.get(statsRef);
        const stats = doc.data() || {};

        const newCustomStats = {
          gamesPlayed: (stats.custom?.gamesPlayed || 0) + 1,
          totalRounds: (stats.custom?.totalRounds || 0) + rounds,
          totalScore: (stats.custom?.totalScore || 0) + score,
        };

        transaction.set(statsRef, { ...stats, custom: newCustomStats }, { merge: true });
      });
    } catch (error) {
      console.error(`Error updating custom mode stats for user ${uid}:`, error);
      throw error;
    }
  }

  async updateMultiplayerModeStats(uid: string, rounds: number, score: number): Promise<void> {
    const statsRef = this.getStatsDoc(uid).ref;
    try {
      return await this.afs.firestore.runTransaction(async (transaction) => {
        const doc = await transaction.get(statsRef);
        const stats = doc.data() || {};

        const newMultiplayerStats = {
          gamesPlayed: (stats.multiplayer?.gamesPlayed || 0) + 1,
          totalRounds: (stats.multiplayer?.totalRounds || 0) + rounds,
          totalScore: (stats.multiplayer?.totalScore || 0) + score,
        };

        transaction.set(statsRef, { ...stats, multiplayer: newMultiplayerStats }, { merge: true });
      });
    } catch (error) {
      console.error(`Error updating multiplayer mode stats for user ${uid}:`, error);
      throw error;
    }
  }
}
