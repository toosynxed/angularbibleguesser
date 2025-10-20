import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GameSettings } from './game-settings.model';

export interface GameData {
  mode: 'normal' | 'custom' | 'marathon' | 'created';
  verseIds: number[];
  settings: GameSettings;
}

@Injectable({
  providedIn: 'root'
})
export class ShareService {
  private errorMessageSubject = new BehaviorSubject<string | null>(null);
  public errorMessage$: Observable<string | null> = this.errorMessageSubject.asObservable();

  constructor() { }

  setErrorMessage(message: string | null): void {
    this.errorMessageSubject.next(message);
  }

  clearErrorMessage(): void {
    this.errorMessageSubject.next(null);
  }

  encodeGame(data: GameData): string {
    const jsonString = JSON.stringify(data);
    return btoa(jsonString); // Base64 encode
  }

  decodeGame(code: string): GameData | null {
    try {
      const jsonString = atob(code); // Base64 decode
      const data = JSON.parse(jsonString);
      // Basic validation
      if (data && data.verseIds && data.settings) {
        return data as GameData;
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}
