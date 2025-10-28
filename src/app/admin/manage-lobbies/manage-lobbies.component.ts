import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Lobby, LobbyService, Player } from '../../lobby.service';

interface LobbyWithPlayerCount extends Lobby {
  playerCount: number;
  hostDisplayName: string;
}

@Component({
  selector: 'app-manage-lobbies',
  templateUrl: './manage-lobbies.component.html',
  styleUrls: ['./manage-lobbies.component.css']
})
export class ManageLobbiesComponent implements OnInit {
  lobbies$: Observable<LobbyWithPlayerCount[]>;

  constructor(private lobbyService: LobbyService, private router: Router) { }

  ngOnInit(): void {
    this.loadLobbies();
  }

  loadLobbies(): void {
    this.lobbies$ = this.lobbyService.getActiveLobbies().pipe(
      switchMap(lobbies => {
        if (lobbies.length === 0) {
          return of([]);
        }
        const lobbyObservables = lobbies.map(lobby =>
          this.lobbyService.getLobbyPlayers(lobby.id).pipe(
            map(players => {
              const host = players.find(p => p.uid === lobby.hostId);
              return {
                ...lobby,
                playerCount: players.length,
                hostDisplayName: host ? host.displayName : 'N/A'
              } as LobbyWithPlayerCount;
            })
          )
        );
        return combineLatest(lobbyObservables);
      })
    );
  }

  getGameState(lobby: Lobby): string {
    switch (lobby.gameState) {
      case 'waiting':
        return 'In Lobby';
      case 'in-progress':
        return `Round ${lobby.currentRound + 1}`;
      case 'leaderboard':
        return 'Round Results';
      case 'finished':
        return 'Final Results';
      default:
        return 'Unknown';
    }
  }

  joinLobby(lobbyId: string): void {
    // Admin joins will likely need a specific flow, for now, just navigate.
    // This assumes the admin has a display name set or will be prompted.
    // A more robust solution might involve passing an admin flag.
    this.router.navigate(['/multiplayer/lobby', lobbyId]);
  }
}
