import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject } from 'rxjs';
import { GameSettings } from './game-settings.model';
import firebase from 'firebase/compat/app';

export interface GameData {
  mode: 'custom' | 'create' | 'shared';
  verseIds: number[];
  settings: GameSettings;
}

@Injectable({
  providedIn: 'root'
})
export class ShareService {
  private errorMessageSubject = new BehaviorSubject<string | null>(null);
  errorMessage$ = this.errorMessageSubject.asObservable();

  constructor(private afs: AngularFirestore) { }

  private generateShortCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Creates a temporary game in Firestore and returns a short code
  async createShortCodeGame(data: GameData): Promise<string> {
    const shortCode = this.generateShortCode();
    const gameDoc = {
      verseIds: data.verseIds,
      gameSettings: data.settings,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    await this.afs.collection('sharedGames').doc(shortCode).set(gameDoc);
    return shortCode;
  }

  // Encodes a full game definition into a long, permanent string (for URLs)
  encodeGameData(data: GameData): string {
    const jsonString = JSON.stringify({
      m: data.mode.charAt(0), // c for custom/create
      v: data.verseIds,
      s: {
        r: data.settings.rounds,
        t: data.settings.timeLimit,
        b: data.settings.books,
        cs: data.settings.contextSize
      }
    });
    return btoa(jsonString);
  }

  decodeGameData(code: string): GameData | null {
    try {
      const jsonString = atob(code);
      const data = JSON.parse(jsonString);

      if (data.v) {
        return {
          mode: 'shared',
          verseIds: data.v,
          settings: {
            rounds: data.s.r,
            timeLimit: data.s.t,
            books: data.s.b,
            contextSize: data.s.cs
          },
        };
      }

      throw new Error('Invalid code format');
    } catch (e) {
      this.errorMessageSubject.next('Invalid game code.');
      return null;
    }
  }

  getSharedGame(shortCode: string) {
    return this.afs.collection('sharedGames').doc(shortCode).valueChanges();
  }

  clearErrorMessage(): void {
    this.errorMessageSubject.next(null);
  }
}
