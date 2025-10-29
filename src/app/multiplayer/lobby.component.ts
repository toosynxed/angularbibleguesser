import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { filter, first, map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { BibleService } from '../bible.service';
import { GameSettings } from '../game-settings.model';
import { Lobby, LobbyService, Player } from '../lobby.service';
import { ShareService } from '../share.service';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.css']
})
export class LobbyComponent implements OnInit, OnDestroy {
  lobbyId: string;
  lobby$: Observable<Lobby>;
  players$: Observable<Player[]>;
  isHost$: Observable<boolean>;
  currentUid: string;
  copyButtonText = 'Click to copy';

  // Properties for game settings
  settings: GameSettings;
  bookGroups: { groupName: string, books: string[] }[] = [];
  timeOptions = [
    { value: 0, label: 'No Time Limit' },
    { value: 30, label: '30 Seconds' },
    { value: 60, label: '1 Minute' },
    { value: 120, label: '2 Minutes' },
    { value: 300, label: '5 Minutes' },
    { value: 600, label: '10 Minutes' }
  ];

  private lobbySettingsSubscription: Subscription;
  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lobbyService: LobbyService,
    private authService: AuthService,
    private bibleService: BibleService,
    private shareService: ShareService
  ) { }

  ngOnInit(): void {
    this.lobbyId = this.route.snapshot.paramMap.get('id');
    if (!this.lobbyId) {
      this.router.navigate(['/multiplayer']);
      return;
    }

    const user$ = this.authService.user$.pipe(
      filter(user => !!user),
      first()
    );

    this.subscriptions.add(user$.subscribe(user => {
      this.currentUid = user.uid;
      this.lobbyService.handlePlayerPresence(this.lobbyId, this.currentUid);
      this.setupLobbyStreams();
      // Load book groups once
      this.bookGroups = this.bibleService.getGroupedBooks();
    }));
  }

  private setupLobbyStreams(): void {
    this.lobby$ = this.lobbyService.getLobby(this.lobbyId).valueChanges().pipe(
      tap(lobby => {
        if (!lobby) {
          this.shareService.setErrorMessage('Lobby does not exist or has expired.');
          this.router.navigate(['/multiplayer']);
        } else if (lobby.gameSettings) {
          // Sync local settings with lobby settings
          this.settings = lobby.gameSettings;
        } else if (lobby.gameState === 'in-progress' || lobby.gameState === 'leaderboard' || lobby.gameState === 'finished') {
          this.router.navigate(['/game'], {
            state: {
              mode: 'multiplayer',
              lobbyId: this.lobbyId
            }
          });
        }
      }),
      filter(lobby => !!lobby)
    );

    this.players$ = this.lobbyService.getLobbyPlayers(this.lobbyId);

    // Listen for kicked status
    const playerKicked$ = this.players$.pipe(
      map(players => players.find(p => p.uid === this.currentUid)),
      filter(player => !!player && player.kicked)
    );

    this.subscriptions.add(playerKicked$.subscribe(() => {
      this.shareService.setErrorMessage('You have been kicked from the lobby.');
      this.router.navigate(['/']);
    }));

    this.isHost$ = this.lobby$.pipe(
      map(lobby => lobby.hostId === this.currentUid)
    );

    // Host migration logic
    const hostLeft$ = combineLatest([this.lobby$, this.players$]).pipe(
      filter(([lobby, players]) => {
        const hostIsPresent = players.some(p => p.uid === lobby.hostId);
        return !hostIsPresent && players.length > 0;
      })
    );

    this.subscriptions.add(hostLeft$.subscribe(([lobby, players]) => {
      if (lobby.hostId === this.currentUid) {
        // This should not happen if host left, but as a safeguard
        return;
      }
      // Find the next player who joined to be the new host
      const sortedPlayers = players.sort((a, b) => a.joinedAt?.toMillis() - b.joinedAt?.toMillis());
      const newHost = sortedPlayers[0];

      if (newHost && newHost.uid === this.currentUid) {
        this.lobbyService.assignNewHost(this.lobbyId, this.currentUid);
      }
    }));
  }

  async onStartGame(settings: GameSettings): Promise<void> {
    if (!this.settings) {
      console.error('Settings not loaded, cannot start game.');
      return;
    }
    const verseIds = await this.bibleService.getRandomVerseIds(settings.rounds, settings.books).toPromise();
    await this.lobbyService.startGame(this.lobbyId, verseIds);
  }

  onSettingsChanged(): void {
    // This method is called by ngModelChange, so we pass the current state of `this.settings`
    this.lobbyService.updateLobbySettings(this.lobbyId, this.settings);
  }

  toggleBook(book: string): void {
    this.isHost$.pipe(first()).subscribe(isHost => {
      if (!isHost || !this.settings) return;

      const index = this.settings.books.indexOf(book);
      if (index > -1) {
        this.settings.books.splice(index, 1);
      } else {
        this.settings.books.push(book);
      }
      this.onSettingsChanged();
    });
  }

  toggleBookGroup(group: { groupName: string, books: string[] }): void {
    this.isHost$.pipe(first()).subscribe(isHost => {
      if (!isHost || !this.settings) return;

      const allBooksInGroupSelected = group.books.every(b => this.settings.books.includes(b));
      if (allBooksInGroupSelected) {
        // Deselect all
        this.settings.books = this.settings.books.filter(b => !group.books.includes(b));
      } else {
        // Select all
        group.books.forEach(b => {
          if (!this.settings.books.includes(b)) {
            this.settings.books.push(b);
          }
        });
      }
      this.onSettingsChanged();
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    // Note: Firebase onDisconnect will handle presence update.
    // No need to manually remove the player here.
  }

  copyGameCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.copyButtonText = 'Copied!';
      setTimeout(() => this.copyButtonText = 'Click to copy', 2000);
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}


//These changes introduce the "Manage Users" panel, allowing admins to see all active players and kick them from their lobbies. The kicked player will be gracefully removed from their session and notified.
