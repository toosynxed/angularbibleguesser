import { Injectable } from '@angular/core';
import {
  collection,
  collectionData,
  Firestore,
  limit,
  orderBy,
  query,
  addDoc,
  Timestamp
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface LeaderboardEntry {
  username: string;
  score: number;
  mode: 'normal' | 'marathon';
  date: Timestamp;
}

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService {
  constructor(private firestore: Firestore) {}

  getHighScores(mode: 'normal' | 'marathon', count: number): Observable<LeaderboardEntry[]> {
    const scoresCollection = collection(this.firestore, `leaderboard/${mode}/scores`);
    const q = query(scoresCollection, orderBy('score', 'desc'), limit(count));
    return collectionData(q) as Observable<LeaderboardEntry[]>;
  }

  addHighScore(entry: Omit<LeaderboardEntry, 'date'>): Promise<any> {
    const scoresCollection = collection(this.firestore, `leaderboard/${entry.mode}/scores`);
    const entryWithDate = { ...entry, date: Timestamp.now() };
    return addDoc(scoresCollection, entryWithDate);
  }
}
