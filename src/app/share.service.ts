import { Injectable } from '@angular/core';

export interface GameSeed {
  mode: 'normal' | 'marathon';
  verseIds: number[];
}

@Injectable({
  providedIn: 'root'
})
export class ShareService {

  constructor() { }

  /**
   * Encodes a game session into a shareable Base64 string.
   * @param verseIds An array of verse IDs from the game.
   * @returns A shareable code string.
   */
  encodeGame(verseIds: number[]): string {
    const mode = verseIds.length > 1 ? 'marathon' : 'normal';
    const dataString = `${mode}:${verseIds.join(',')}`;
    // btoa provides simple obfuscation to make the code not human-readable.
    return btoa(dataString);
  }

  /**
   * Decodes a shareable code back into a game session object.
   * @param code The shareable code string.
   * @returns A GameSeed object or null if the code is invalid.
   */
  decodeGame(code: string): GameSeed | null {
    try {
      const decodedString = atob(code);
      const [mode, idsString] = decodedString.split(':');

      if ((mode !== 'normal' && mode !== 'marathon') || !idsString) {
        return null;
      }

      const verseIds = idsString.split(',').map(id => parseInt(id, 10));
      return { mode: mode as 'normal' | 'marathon', verseIds };
    } catch (e) {
      // This will catch errors from invalid Base64 strings or other parsing issues.
      return null;
    }
  }
}
