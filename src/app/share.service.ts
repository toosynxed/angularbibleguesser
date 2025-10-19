import { Injectable } from '@angular/core';
import { GameSettings } from './game-settings.model';

export interface GameSeed {
  mode: 'normal' | 'custom' | 'created';
  verseIds?: number[];
  settings?: GameSettings;
}

@Injectable({
  providedIn: 'root'
})
export class ShareService {

  constructor() { }

  /**
   * Encodes a game session into a shareable Base64 string.
   * @param seed The GameSeed object to encode.
   * @returns A shareable code string.
   */
  encodeGame(seed: GameSeed): string {
    const dataString = JSON.stringify(seed);
    // btoa provides simple obfuscation to make the URL less messy.
    return btoa(encodeURIComponent(dataString));
  }

  /**
   * Decodes a shareable code back into a game session object.
   * @param code The shareable code string.
   * @returns A GameSeed object or null if the code is invalid.
   */
  decodeGame(code: string): GameSeed | null {
    try {
      const decodedString = decodeURIComponent(atob(code));
      const seed: GameSeed = JSON.parse(decodedString);

      // Basic validation to ensure the decoded object has the expected shape.
      if (!seed.mode || (seed.mode === 'created' && !seed.verseIds)) {
        return null;
      }

      return seed;

    } catch (e) {
      // This will catch errors from invalid Base64 strings or other parsing issues.
      return null;
    }
  }
}
