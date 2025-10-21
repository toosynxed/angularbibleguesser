import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GameSettings } from './game.model';

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

  constructor() { }

  // Encodes a full game definition (used by create-game)
  encodeGame(data: GameData): string {
    const jsonString = JSON.stringify({
      m: data.mode.charAt(0), // c for custom/create
      v: data.verseIds,
      s: {
        r: data.settings.rounds,
        t: data.settings.timeLimit,
        b: data.settings.books,
      }
    });
    return btoa(jsonString);
  }

  // NEW METHOD: Encodes just a seed string (used by results page)
  encodeSeed(seed: string): string {
    const jsonString = JSON.stringify({ seed: seed });
    return btoa(jsonString);
  }

  // decodeGame needs to be updated to handle both formats
  decodeGame(code: string): GameData | { seed: string } | null {
    try {
      const jsonString = atob(code);
      const data = JSON.parse(jsonString);
      // Check if it's the new seed format
      if (data.seed) {
        return { seed: data.seed };
      }
      // Assume old format if not
      return data;
    } catch (e) {
      this.errorMessageSubject.next('Invalid game code.');
      return null;
    }
  }

  clearErrorMessage(): void {
    this.errorMessageSubject.next(null);
  }
}
