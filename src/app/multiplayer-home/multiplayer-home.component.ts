import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { LobbyService } from '../lobby.service';

@Component({
  selector: 'app-multiplayer-home',
  template: `
    <div class="container">
      <h1>Multiplayer</h1>
      <p>Create a lobby or join one with a code.</p>
      <div class="actions">
        <button (click)="createLobby()">Create Lobby</button>
        <input placeholder="Enter Lobby Code" />
        <button>Join Lobby</button>
      </div>
    </div>
  `,
  styles: [`.container { text-align: center; } .actions { margin-top: 2rem; }`]
})
export class MultiplayerHomeComponent implements OnInit {

  constructor(private lobbyService: LobbyService, private authService: AuthService, private router: Router) { }

  ngOnInit(): void { }

  async createLobby() {
    const user = await this.authService.user$.pipe(first()).toPromise();
    const lobbyId = await this.lobbyService.createLobby({ uid: user.uid, displayName: 'Host', isHost: true }, { rounds: 5, contextSize: 10, timeLimit: 0 });
    this.router.navigate(['/lobby', lobbyId]);
  }
}
