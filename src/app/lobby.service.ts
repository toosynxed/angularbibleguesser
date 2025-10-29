import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { Verse as BibleVerse } from './verse.model';
import { GameSettings } from './game-settings.model';
import firebase from 'firebase/compat/app';

// Re-exporting or defining Verse here to avoid circular dependency issues if imported from game.component
export interface Verse extends BibleVerse {}

export interface Player {
  uid: string;
  displayName: string;
  isHost: boolean;
  kicked?: boolean;
  joinedAt?: any;
}

export interface PlayerGuess {
  [playerId: string]: { guess: string, score: number };
}

export interface Lobby {
  id?: string;
  hostId: string;
  gameCode: string; // A short, user-friendly code
  gameState: 'waiting' | 'in-progress' | 'leaderboard' | 'finished';
  currentRound: number; // 0-indexed
  gameSettings: GameSettings;
  verseIds?: number[];
  guesses?: { [roundKey: string]: PlayerGuess }; // To store all guesses
  createdAt: any;
  lastUpdatedAt?: any;
}

export interface SharedGame {
  id?: string; // The short code
  verseIds: number[];
  gameSettings: GameSettings;
  createdAt: any;
}

@Injectable({
  providedIn: 'root'
})
export class LobbyService {

  constructor(
    private afs: AngularFirestore,
    public db: AngularFireDatabase,
    private authService: AuthService
  ) { }

  private generateGameCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async createLobby(host: Player, settings: GameSettings): Promise<string> {
    // Enforce a maximum of 100 rounds
    if (settings.rounds > 100) {
      settings.rounds = 100;
    }

    const id = this.afs.createId();
    host.joinedAt = firebase.firestore.FieldValue.serverTimestamp();
    const lobbyData: Lobby = {
      id,
      hostId: host.uid,
      gameCode: this.generateGameCode(),
      gameState: 'waiting',
      currentRound: 0,
      gameSettings: settings,
      guesses: {}, // Initialize the guesses map
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    await this.afs.collection('lobbies').doc(id).set(lobbyData);
    await this.afs.collection('lobbies').doc(id).collection('players').doc(host.uid).set(host);
    return id;
  }

  getLobby(lobbyId: string): AngularFirestoreDocument<Lobby> {
    return this.afs.collection('lobbies').doc<Lobby>(lobbyId);
  }

  getLobbyPlayers(lobbyId: string): Observable<Player[]> {
    return this.afs.collection('lobbies').doc(lobbyId).collection<Player>('players').valueChanges();
  }

  findLobbyByCode(code: string): Observable<Lobby[]> {
    return this.afs.collection<Lobby>('lobbies', ref =>
      ref.where('gameCode', '==', code).limit(1)
    ).valueChanges({ idField: 'id' }); // Use idField to get the document ID
  }

  async joinLobby(lobbyId: string, player: Player): Promise<void> {
    player.joinedAt = firebase.firestore.FieldValue.serverTimestamp();
    // Add the new player to the 'players' subcollection of the lobby
    await this.afs.collection('lobbies').doc(lobbyId).collection('players').doc(player.uid).set(player);
  }

  async kickPlayer(lobbyId: string, playerId: string): Promise<void> {
    return this.afs.collection('lobbies').doc(lobbyId).collection('players').doc(playerId).update({ kicked: true });
  }

  async assignNewHost(lobbyId: string, newHostId: string): Promise<void> {
    // This transaction ensures that we don't have a race condition for host migration
    return this.afs.collection('lobbies').doc(lobbyId).update({ hostId: newHostId });
  }

  async updateLobbySettings(lobbyId: string, settings: GameSettings): Promise<void> {
    // Enforce a maximum of 100 rounds
    if (settings.rounds > 100) {
      settings.rounds = 100;
    }

    // Update the gameSettings field on the lobby document
    await this.afs.collection('lobbies').doc(lobbyId).update({
      gameSettings: settings,
      lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async startGame(lobbyId: string, verseIds: number[]): Promise<void> {
    // Set the verse IDs for the game and change the state to start the game for all players
    await this.afs.collection('lobbies').doc(lobbyId).update({
      verseIds: verseIds,
      gameState: 'in-progress',
      lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async submitGuess(lobbyId: string, round: number, playerId: string, guess: string, score: number): Promise<void> {
    const guessPath = `guesses.round_${round}.${playerId}`;
    await this.afs.collection('lobbies').doc(lobbyId).update({
      [guessPath]: { guess, score },
      lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async showLeaderboard(lobbyId: string): Promise<void> {
    await this.afs.collection('lobbies').doc(lobbyId).update({
      gameState: 'leaderboard',
      lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async nextRound(lobbyId: string, nextRound: number): Promise<void> {
    await this.afs.collection('lobbies').doc(lobbyId).update({
      gameState: 'in-progress',
      currentRound: nextRound,
      lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async finishGame(lobbyId: string): Promise<void> {
    await this.afs.collection('lobbies').doc(lobbyId).update({
      gameState: 'finished',
      lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  // --- Presence Management using RTDB ---

  handlePlayerPresence(lobbyId: string, uid: string): void {
    const userStatusRef = this.db.database.ref(`/lobbies/${lobbyId}/presence/${uid}`);

    const isOfflineForDatabase = {
      online: false,
      last_changed: firebase.database.ServerValue.TIMESTAMP,
    };

    const isOnlineForDatabase = {
      lobbyId, // Store lobbyId for potential cleanup functions
      online: true,
      last_changed: firebase.database.ServerValue.TIMESTAMP,
    };

    this.db.object('.info/connected').valueChanges().subscribe(connected => {
      if (connected) {
        userStatusRef.onDisconnect().set(isOfflineForDatabase).then(() => {
          userStatusRef.set(isOnlineForDatabase);
        });
      }
    });
  }

  getActiveLobbies(): Observable<Lobby[]> {
    // Get lobbies updated in the last 30 minutes.
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return this.afs.collection<Lobby>('lobbies', ref =>
      ref.where('lastUpdatedAt', '>', thirtyMinutesAgo)
         .orderBy('lastUpdatedAt', 'desc')
    ).valueChanges({ idField: 'id' });
  }
}
