import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { first, map, switchMap, tap, debounceTime } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { BibleService } from '../bible.service';
import { GameSettings } from '../game-settings.model';
import { Lobby, LobbyService, Player } from '../lobby.service';

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

  settings: GameSettings;
  allBooks: string[] = [];
  bookGroups: { groupName: string, books: string[] }[] = [];

  timeOptions = [
    { value: 0, label: 'No Time Limit' },
    { value: 30, label: '30 Seconds' },
    { value: 60, label: '1 Minute' },
    { value: 120, label: '2 Minutes' },
    { value: 300, label: '5 Minutes' },
    { value: 600, label: '10 Minutes' }
  ];

  private settingsSubscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private lobbyService: LobbyService,
    private authService: AuthService,
    private bibleService: BibleService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.lobbyId = this.route.snapshot.paramMap.get('id');

    this.lobby$ = this.lobbyService.getLobby(this.lobbyId).valueChanges().pipe(
      // Add a small debounce time to wait for the lobby data to be available after creation.
      debounceTime(50),
      tap(lobby => {
        if (!lobby) {
          // If lobby is deleted or doesn't exist, go back home
          this.router.navigate(['/']);
          return;
        }
        // Keep local settings in sync with Firestore
        this.settings = lobby.gameSettings;
      })
    );

    this.players$ = this.lobbyService.getLobbyPlayers(this.lobbyId);

    this.isHost$ = this.authService.user$.pipe(
      switchMap(user => this.lobby$.pipe(map(lobby => user?.uid === lobby?.hostId)))
    );

    this.bibleService.getBooks().subscribe(books => {
      this.allBooks = books;
      this.bookGroups = this.bibleService.getGroupedBooks();
    });
  }

  ngOnDestroy(): void {
    if (this.settingsSubscription) {
      this.settingsSubscription.unsubscribe();
    }
  }

  // --- Host-only Methods ---

  onSettingsChange(): void {
    // Debounce or directly update Firestore
    this.lobbyService.updateLobbySettings(this.lobbyId, this.settings);
  }

  toggleBook(book: string): void {
    this.isHost$.pipe(first()).subscribe(isHost => {
      if (!isHost) return;
      const index = this.settings.books.indexOf(book);
      if (index > -1) {
        this.settings.books.splice(index, 1);
      } else {
        this.settings.books.push(book);
      }
      this.onSettingsChange();
    });
  }

  toggleBookGroup(group: { groupName: string, books: string[] }): void {
    this.isHost$.pipe(first()).subscribe(isHost => {
      if (!isHost) return;
      const allBooksInGroupSelected = group.books.every(b => this.settings.books.includes(b));
      if (allBooksInGroupSelected) {
        this.settings.books = this.settings.books.filter(b => !group.books.includes(b));
      } else {
        group.books.forEach(b => {
          if (!this.settings.books.includes(b)) {
            this.settings.books.push(b);
          }
        });
      }
      this.onSettingsChange();
    });
  }

  startGame(): void {
    // TODO: Implement game start logic
    // 1. Generate verse IDs based on settings
    // 2. Update lobby with verseIds and set gameState to 'in-progress'
    console.log('Starting game with settings:', this.settings);
  }
}
