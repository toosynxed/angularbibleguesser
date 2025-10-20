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

export interface Lobby {
  id?: string;
  hostId: string;
  gameCode: string; // A short, user-friendly code
  gameState: 'waiting' | 'in-progress' | 'finished';
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
}
