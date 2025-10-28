import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { BibleService } from '../bible.service';
import { StatsService } from '../stats.service';
import { LobbyService } from '../lobby.service';

@Component({
  selector: 'app-multiplayer-home',
  templateUrl: './multiplayer-home.component.html',
  styleUrls: ['./multiplayer-home.component.css']
})
export class MultiplayerHomeComponent implements OnInit, OnDestroy {

  lobbyCode = '';
  displayName = '';
  isLoggedIn = false;
  private userSubscription: Subscription;
  showTutorial = false;

  constructor(
    private lobbyService: LobbyService,
    private authService: AuthService,
    private router: Router,
    private bibleService: BibleService,
    private statsService: StatsService
  ) { }

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['showTutorial']) {
      this.showTutorial = true;
    }

    this.userSubscription = this.authService.user$.subscribe(user => {
      if (user && !user.isAnonymous) {
        this.isLoggedIn = true;
        this.displayName = user.displayName;
      } else {
        this.isLoggedIn = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
  }

  async createLobby() {
    if (!this.displayName.trim()) {
      alert('Please enter a display name.');
      return;
    }
    const user = await this.authService.user$.pipe(first()).toPromise();
    if (!user) { console.error('User not authenticated!'); return; }

    // Get all books to set as the default for the new lobby
    const allBooks = await this.bibleService.getBooks().pipe(first()).toPromise();

    const lobbyId = await this.lobbyService.createLobby(
      { uid: user.uid, displayName: this.displayName.trim(), isHost: true },
      { rounds: 5, contextSize: 10, timeLimit: 0, books: allBooks || [] }
    );

    this.router.navigate(['/multiplayer/loading'], { state: { lobbyId: lobbyId } });
  }

  joinLobby() {
    if (!this.displayName.trim()) {
      alert('Please enter a display name.');
      return;
    }
    if (!this.lobbyCode.trim()) { return; }

    this.lobbyService.findLobbyByCode(this.lobbyCode.trim().toUpperCase()).pipe(first()).toPromise().then(async lobbies => {
      if (lobbies && lobbies.length > 0) {
        const lobby = lobbies[0];
        const user = await this.authService.user$.pipe(first()).toPromise();
        if (!user) { console.error('User not authenticated!'); return; }
        await this.lobbyService.joinLobby(lobby.id, { uid: user.uid, displayName: this.displayName.trim(), isHost: false });
        this.router.navigate(['/multiplayer/loading'], { state: { lobbyId: lobby.id } });
      } else {
        alert('Lobby not found. Please check the code and try again.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  closeTutorial(): void {
    // TEMPORARY: Just hide the tutorial. Do not save the state.
    this.showTutorial = false;
  }
}
