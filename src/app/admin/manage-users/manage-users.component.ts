import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Lobby, LobbyService, Player } from '../../lobby.service';
import { ShareService } from '../../share.service';

export interface PlayerWithLobbyInfo extends Player {
  lobbyId: string;
  lobbyCode: string;
  lobbyState: string;
}

@Component({
  selector: 'app-manage-users',
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.css']
})
export class ManageUsersComponent implements OnInit {
  allPlayers$: Observable<PlayerWithLobbyInfo[]>;
  filteredPlayers$: Observable<PlayerWithLobbyInfo[]>;
  searchTerm = '';

  constructor(
    private lobbyService: LobbyService,
    private shareService: ShareService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadAllPlayers();
  }

  loadAllPlayers(): void {
    this.allPlayers$ = this.lobbyService.getActiveLobbies().pipe(
      switchMap(lobbies => {
        if (lobbies.length === 0) {
          return of([]);
        }
        const playerObservables = lobbies.map(lobby =>
          this.lobbyService.getLobbyPlayers(lobby.id).pipe(
            map(players => players.map(player => ({
              ...player,
              lobbyId: lobby.id,
              lobbyCode: lobby.gameCode,
              lobbyState: this.getGameState(lobby)
            } as PlayerWithLobbyInfo)))
          )
        );
        return combineLatest(playerObservables).pipe(
          map(playersByLobby => playersByLobby.reduce((acc, val) => acc.concat(val), [])) // Flatten the array of arrays for wider compatibility
        );
      })
    );
    this.applyFilter();
  }

  applyFilter(): void {
    this.filteredPlayers$ = this.allPlayers$.pipe(
      map(players => players.filter(player =>
        player.displayName.toLowerCase().includes(this.searchTerm.toLowerCase())
      ))
    );
  }

  getGameState(lobby: Lobby): string {
    // This logic can be shared or moved to a service if needed elsewhere
    switch (lobby.gameState) {
      case 'waiting': return 'In Lobby';
      case 'in-progress': return `In-Game (Round ${lobby.currentRound + 1})`;
      case 'leaderboard': return 'Round Results';
      case 'finished': return 'Final Results';
      default: return 'Unknown';
    }
  }

  joinLobby(lobbyId: string): void {
    this.router.navigate(['/multiplayer/lobby', lobbyId]);
  }

  async kickPlayer(lobbyId: string, playerId: string): Promise<void> {
    if (confirm('Are you sure you want to kick this player?')) {
      await this.lobbyService.kickPlayer(lobbyId, playerId);
      this.shareService.setSuccessMessage('Player kicked successfully.');
    }
  }
}
