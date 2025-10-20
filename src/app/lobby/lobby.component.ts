import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Lobby, LobbyService, Player } from '../lobby.service';

@Component({
  selector: 'app-lobby',
  template: `
    <div class="container" *ngIf="lobby$ | async as lobby">
      <h1>Lobby: {{ lobby.gameCode }}</h1>
      <p>Waiting for players...</p>

      <h2>Players</h2>
      <ul>
        <li *ngFor="let player of players$ | async">{{ player.displayName }} {{ player.isHost ? '(Host)' : '' }}</li>
      </ul>

      <button>Start Game</button>
    </div>
  `,
  styles: [`.container { text-align: center; }`]
})
export class LobbyComponent implements OnInit {
  lobbyId: string;
  lobby$: Observable<Lobby>;
  players$: Observable<Player[]>;

  constructor(
    private route: ActivatedRoute,
    private lobbyService: LobbyService
  ) { }

  ngOnInit(): void {
    this.lobbyId = this.route.snapshot.paramMap.get('id');
    this.lobby$ = this.lobbyService.getLobby(this.lobbyId).valueChanges();
    this.players$ = this.lobbyService.getLobbyPlayers(this.lobbyId);
  }
}
