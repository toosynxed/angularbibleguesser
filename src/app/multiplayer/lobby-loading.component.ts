import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { timer } from 'rxjs';
import { first } from 'rxjs/operators';
import { LobbyService } from '../lobby.service';
import { ShareService } from '../share.service';

@Component({
  selector: 'app-lobby-loading',
  template: `<div class="loading-container">Loading Lobby...</div>`,
  styles: [`.loading-container { text-align: center; padding: 4rem; font-size: 1.5rem; }`]
})
export class LobbyLoadingComponent implements OnInit {
  lobbyId: string;

  constructor(
    private router: Router,
    private lobbyService: LobbyService,
    private shareService: ShareService
  ) {
    const navigation = this.router.getCurrentNavigation();
    this.lobbyId = navigation?.extras?.state?.['lobbyId'];
  }

  ngOnInit(): void {
    if (!this.lobbyId) {
      this.shareService.setErrorMessage('Lobby ID was not provided.');
      this.router.navigate(['/']);
      return;
    }

    // Wait for the lobby data to become available
    this.lobbyService.getLobby(this.lobbyId).valueChanges().pipe(
      first(lobby => !!lobby) // Wait for the first emission that is not null/undefined
    ).subscribe(lobby => {
      // Once we have the lobby, navigate to the real lobby page
      this.router.navigate(['/multiplayer/lobby', this.lobbyId]);
    });
  }
}
