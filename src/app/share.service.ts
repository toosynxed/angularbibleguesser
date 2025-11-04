import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { GameSettings } from './game-settings.model';

export interface SharedGame {
  id?: string;
  verseIds: number[];
  gameSettings?: GameSettings;
  settings?: GameSettings; // For backward compatibility with old base64 links
  createdAt?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ShareService {
  private errorMessageSubject = new BehaviorSubject<string | null>(null);
  errorMessage$ = this.errorMessageSubject.asObservable();

  private successMessageSubject = new BehaviorSubject<string | null>(null);
  successMessage$ = this.successMessageSubject.asObservable();

  constructor(private afs: AngularFirestore) { }

  setErrorMessage(message: string) {
    this.errorMessageSubject.next(message);
  }

  clearErrorMessage() {
    this.errorMessageSubject.next(null);
  }

  setSuccessMessage(message: string) {
    this.successMessageSubject.next(message);
    setTimeout(() => this.clearSuccessMessage(), 3000); // Auto-clear after 3 seconds
  }

  clearSuccessMessage() {
    this.successMessageSubject.next(null);
  }

  getSharedGame(code: string): Observable<SharedGame | undefined> {
    return this.afs.collection('shared_games').doc<SharedGame>(code).valueChanges();
  }

  async findSharedGame(code: string): Promise<SharedGame | undefined> {
    // First, check the temporary collection
    let gameDoc = await this.afs.collection('shared_games').doc<SharedGame>(code).get().toPromise();
    if (gameDoc.exists) {
      return gameDoc.data();
    }
    // If not found, check the permanent collection
    gameDoc = await this.afs.collection('permanent_shared_games').doc<SharedGame>(code).get().toPromise();
    return gameDoc.exists ? gameDoc.data() : undefined;
  }
  // This is a placeholder for the old decoding logic.
  // You might want to remove this if old codes are no longer supported.
  decodeGameData(code: string): any {
    // Implement decoding logic for old codes if necessary
    return null;
  }

  encodeGameData(gameData: SharedGame): string {
    const jsonString = JSON.stringify(gameData);
    return btoa(jsonString); // btoa creates a base-64 encoded ASCII string
  }

  async createShortCodeGame(gameData: SharedGame): Promise<string> {
    const code = this.generateShortCode();
    await this.afs.collection('shared_games').doc(code).set({
      ...gameData,
      createdAt: new Date() // Ensure createdAt is a fresh timestamp
    });
    return code;
  }

  private generateShortCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async createPermanentSharedGame(gameData: SharedGame): Promise<string> {
    const docRef = this.afs.collection('permanent_shared_games').doc();
    await docRef.set({
      ...gameData,
      // No need for a createdAt timestamp for expiration
    });
    return docRef.ref.id;
  }
}
