import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { combineLatest, Observable, of, from } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
import { UserProfile, UserStats, UserProfileWithStats } from './stats.model';
import firebase from 'firebase/compat/app';

export interface LeaderboardPlayer {
  displayName: string;
  value: number;
  gamesPlayed?: number;
}

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

  private getLeaderboard(
    field: string,
    limit: number = 20,
    filterFn?: (stats: UserStats) => boolean,
    mapFn?: (stats: UserStats) => number,
    gamesPlayedFn?: (stats: UserStats) => number
  ): Observable<LeaderboardPlayer[]> {
    return this.afs.collection<UserStats>('stats', ref => ref.orderBy(field, 'desc').limit(limit))
      .valueChanges({ idField: 'uid' }).pipe(
        switchMap(statsList => {
          if (statsList.length === 0) return of([]);

          let filteredStats = filterFn ? statsList.filter(filterFn) : statsList;

          const userProfiles$ = filteredStats.map(stats =>
            this.afs.collection('users').doc(stats.uid).get().pipe(
              map(doc => doc.data() as UserProfile)
            )
          );

          return combineLatest(userProfiles$).pipe(
            map(profiles => {
              return filteredStats.map((stats, index) => {
                const profile = profiles[index];
                return {
                  displayName: profile?.displayName || 'Anonymous',
                  value: mapFn ? mapFn(stats) : stats[field.split('.')[1]], // Simplified access
                  gamesPlayed: gamesPlayedFn ? gamesPlayedFn(stats) : undefined
                };
              }).sort((a, b) => b.value - a.value); // Re-sort after client-side calculation
            })
          );
        })
      );
  }

  getNormalLeaderboard(): Observable<LeaderboardPlayer[]> {
    // Firestore can't order by a calculated value.
    // We fetch by gamesPlayed to get active users, then calculate and sort on the client.
    return this.afs.collection<UserStats>('stats', ref => ref
      .where('normal.gamesPlayed', '>=', 10)
      .orderBy('normal.gamesPlayed', 'desc') // Order by something to get a list
      .limit(50) // Get a larger pool to sort from
    ).valueChanges({ idField: 'uid' }).pipe(
      switchMap(statsList => this.mapStatsToLeaderboardPlayers(statsList, (stats) => (stats.normal.totalScore / stats.normal.gamesPlayed), (stats) => stats.normal.gamesPlayed)),
      map(players => players.sort((a, b) => b.value - a.value).slice(0, 20)) // Final sort and slice
    );
  }

  getDailyStreakLeaderboard(): Observable<LeaderboardPlayer[]> {
    return this.getLeaderboard(
      'daily.highestStreak',
      20,
      stats => stats?.daily?.highestStreak > 0,
      stats => stats.daily.highestStreak // Explicitly map the value
    );
  }

  getDailyScoreLeaderboard(): Observable<LeaderboardPlayer[]> {
    return this.afs.collection<UserStats>('stats', ref => ref
      .where('daily.totalRoundsPlayed', '>', 0)
      .orderBy('daily.totalRoundsPlayed', 'desc')
      .limit(50)
    ).valueChanges({ idField: 'uid' }).pipe(
      switchMap(statsList => this.mapStatsToLeaderboardPlayers(statsList, (stats) => (stats.daily.totalScore / stats.daily.totalRoundsPlayed), (stats) => (stats.daily.totalRoundsPlayed / 5))),
      map(players => players.sort((a, b) => b.value - a.value).slice(0, 20))
    );
  }

  private getStatsDoc(uid: string): AngularFirestoreDocument<UserStats> {
    return this.afs.collection('stats').doc<UserStats>(uid);
  }

  updateUserStats(uid: string, data: Partial<UserStats>): Promise<void> {
    return this.getStatsDoc(uid).set(data, { merge: true });
  }

  deleteUserStats(uid: string): Promise<void> {
    return this.getStatsDoc(uid).delete();
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

  private mapStatsToLeaderboardPlayers(statsList: (UserStats & {uid: string})[], valueFn: (stats: UserStats) => number, gamesPlayedFn: (stats: UserStats) => number): Observable<LeaderboardPlayer[]> {
    if (statsList.length === 0) return of([]);

    const userProfiles$ = statsList.map(stats =>
      this.afs.collection('users').doc(stats.uid).get().pipe(map(doc => doc.data() as UserProfile))
    );

    return combineLatest(userProfiles$).pipe(
      map(profiles => {
        const players: LeaderboardPlayer[] = [];
        statsList.forEach((stats, index) => {
          const profile = profiles[index];
          // Only include players that have a user profile document with a display name.
          // This effectively filters out anonymous users.
          if (profile && profile.displayName) {
            players.push({ displayName: profile.displayName, value: valueFn(stats), gamesPlayed: gamesPlayedFn(stats) });
          }
        });
        return players;
      })
    );
  }
}
