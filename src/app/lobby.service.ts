import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { GameSettings } from './game-settings.model';
import firebase from 'firebase/compat/app';

export interface Player {
  uid: string;
  displayName: string;
  isHost: boolean;
}

export interface PlayerGuess {
  [playerId: string]: { guess: string, score: number };
}

export interface Lobby {
  id?: string;
  hostId: string;
  gameCode: string; // A short, user-friendly code
  gameState: 'waiting' | 'in-progress' | 'finished';
  currentRound: number; // 0-indexed
  gameSettings: GameSettings;
  verseIds?: number[];
  createdAt: any;
}

@Injectable({
  providedIn: 'root'
})
export class LobbyService {

  constructor(private afs: AngularFirestore) { }

  private generateGameCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async createLobby(host: Player, settings: GameSettings): Promise<string> {
    const id = this.afs.createId();
    const lobbyData: Lobby = {
      id,
      hostId: host.uid,
      gameCode: this.generateGameCode(),
      gameState: 'waiting',
      currentRound: 0,
      gameSettings: settings,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
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
    // Add the new player to the 'players' subcollection of the lobby
    await this.afs.collection('lobbies').doc(lobbyId).collection('players').doc(player.uid).set(player);
  }

  async updateLobbySettings(lobbyId: string, settings: GameSettings): Promise<void> {
    // Update the gameSettings field on the lobby document
    await this.afs.collection('lobbies').doc(lobbyId).update({ gameSettings: settings });
  }

  async startGame(lobbyId: string, verseIds: number[]): Promise<void> {
    // Set the verse IDs for the game and change the state to start the game for all players
    await this.afs.collection('lobbies').doc(lobbyId).update({ verseIds: verseIds, gameState: 'in-progress' });
  }

  async submitGuess(lobbyId: string, round: number, playerId: string, guess: string, score: number): Promise<void> {
    const guessPath = `guesses.round_${round}.${playerId}`;
    await this.afs.collection('lobbies').doc(lobbyId).update({
      [guessPath]: { guess, score }
    });
  }

  async showLeaderboard(lobbyId: string): Promise<void> {
    await this.afs.collection('lobbies').doc(lobbyId).update({ gameState: 'leaderboard' });
  }

  async nextRound(lobbyId: string, nextRound: number): Promise<void> {
    await this.afs.collection('lobbies').doc(lobbyId).update({ gameState: 'in-progress', currentRound: nextRound });
  }
}
