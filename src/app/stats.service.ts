import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { UserStats } from './stats.model';
import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root'
})
export class StatsService {

  constructor(private afs: AngularFirestore) { }

  getUserStats(uid: string): Observable<UserStats | undefined> {
    return this.afs.collection('stats').doc<UserStats>(uid).valueChanges();
  }

  private getStatsDoc(uid: string): AngularFirestoreDocument<UserStats> {
    return this.afs.collection('stats').doc<UserStats>(uid);
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
