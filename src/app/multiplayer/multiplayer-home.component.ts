import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { LobbyService } from '../lobby.service';

@Component({
  selector: 'app-multiplayer-home',
  templateUrl: './multiplayer-home.component.html',
  styleUrls: ['./multiplayer-home.component.css']
})
export class MultiplayerHomeComponent implements OnInit {

  lobbyCode = '';

  constructor(private lobbyService: LobbyService, private authService: AuthService, private router: Router) { }

  ngOnInit(): void { }

  async createLobby() {
    const user = await this.authService.user$.pipe(first()).toPromise();
    if (!user) { console.error('User not authenticated!'); return; }
    const lobbyId = await this.lobbyService.createLobby({ uid: user.uid, displayName: 'Host', isHost: true }, { rounds: 5, contextSize: 10, timeLimit: 0, books: [] });
    this.router.navigate(['/multiplayer/loading'], { state: { lobbyId: lobbyId } });
  }

  joinLobby() {
    if (!this.lobbyCode.trim()) return;

    this.lobbyService.findLobbyByCode(this.lobbyCode.trim().toUpperCase()).pipe(first()).toPromise().then(async lobbies => {
      if (lobbies && lobbies.length > 0) {
        const lobby = lobbies[0];
        const user = await this.authService.user$.pipe(first()).toPromise();
        if (!user) { console.error('User not authenticated!'); return; }
        const displayName = `Player${Math.floor(100 + Math.random() * 900)}`; // e.g., Player123
        await this.lobbyService.joinLobby(lobby.id, { uid: user.uid, displayName: displayName, isHost: false });
        this.router.navigate(['/multiplayer/loading'], { state: { lobbyId: lobby.id } });
      } else {
        alert('Lobby not found. Please check the code and try again.');
      }
    });
  }
}
