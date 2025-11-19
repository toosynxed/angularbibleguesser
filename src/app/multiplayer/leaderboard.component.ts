import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { map, switchMap, tap, filter } from 'rxjs/operators';
import { BibleService } from '../bible.service';
import { AuthService } from '../auth.service';
import { Lobby, LobbyService, Player, Verse } from '../lobby.service';

interface LeaderboardPlayer extends Player {
  totalScore: number;
  rank: number;
}

@Component({
  selector: 'app-leaderboard',
  template: `
    <div class="container" *ngIf="lobby$ | async as lobby">
      <h1>Round {{ lobby.currentRound + 1 }} Results</h1>

      <div class="correct-answer" *ngIf="correctVerse$ | async as verse">
        <p>The correct answer was:</p>
        <h3>{{ verse.bookName }} {{ verse.chapter }}:{{ verse.verse }}</h3>
      </div>

      <div class="leaderboard-list">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let player of leaderboard$ | async">
              <td>{{ player.rank }}</td>
              <td><app-decorated-name [profile]="player"></app-decorated-name> <span *ngIf="player.isHost">(Host)</span></td>
              <td>{{ player.totalScore }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="actions" *ngIf="isHost$ | async">
        <button *ngIf="!(isFinalRound$ | async)" (click)="startNextRound(lobby)">Start Next Round</button>
        <button *ngIf="isFinalRound$ | async" (click)="seeFinalResults()">See Final Results</button>
      </div>
      <p *ngIf="!(isHost$ | async)">Waiting for host to continue...</p>
    </div>
  `,
  styleUrls: ['./leaderboard.component.css']
})
export class LeaderboardComponent implements OnInit {
  lobbyId: string;
  lobby$: Observable<Lobby>;
  leaderboard$: Observable<LeaderboardPlayer[]>;
  isHost$: Observable<boolean>;
  isFinalRound$: Observable<boolean>;
  correctVerse$: Observable<Verse>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lobbyService: LobbyService,
    private authService: AuthService,
    private bibleService: BibleService
  ) {}

  ngOnInit(): void {
    this.lobbyId = this.route.snapshot.paramMap.get('id');

    this.lobby$ = this.lobbyService.getLobby(this.lobbyId).valueChanges().pipe(
      tap(lobby => {
        // When the host starts the next round, navigate everyone back to the game.
        if (lobby?.gameState === 'in-progress') {
          this.router.navigate(['/game'], { state: { lobbyId: this.lobbyId, mode: 'multiplayer' } });
        } else if (lobby?.gameState === 'finished') {
          // When the host ends the game, navigate to the final results page.
          this.router.navigate(['/results'], { state: { lobby: lobby, mode: 'multiplayer' } });
        }
      }),
      filter(lobby => !!lobby) // Ensure we don't process null/undefined lobbies
    );
    const players$ = this.lobbyService.getLobbyPlayers(this.lobbyId);

    this.isFinalRound$ = this.lobby$.pipe(
      map(lobby => lobby.currentRound >= lobby.gameSettings.rounds - 1)
    );

    this.correctVerse$ = this.lobby$.pipe(
      switchMap(lobby => {
        const verseId = lobby.verseIds[lobby.currentRound];
        return this.bibleService.getVerseById(verseId);
      })
    );

    this.leaderboard$ = combineLatest([this.lobby$, players$]).pipe(
      map(([lobby, players]) => {
        const rankedPlayers = players.map(player => {
          let totalScore = 0;
          if (lobby['guesses']) {
            for (let i = 0; i <= lobby.currentRound; i++) {
              const roundGuesses = lobby['guesses'][`round_${i}`];
              if (roundGuesses && roundGuesses[player.uid]) {
                totalScore += roundGuesses[player.uid].score;
              }
            }
          }
          return { ...player, totalScore };
        }).sort((a, b) => b.totalScore - a.totalScore);

        // Assign ranks
        return rankedPlayers.map((player, index) => ({ ...player, rank: index + 1 }));
      })
    );

    this.isHost$ = this.authService.user$.pipe(
      switchMap(user => this.lobby$.pipe(map(lobby => user?.uid === lobby?.hostId)))
    );
  }

  startNextRound(lobby: Lobby): void {
    this.lobbyService.nextRound(this.lobbyId, lobby.currentRound + 1);
  }

  seeFinalResults(): void {
    this.lobbyService.finishGame(this.lobbyId);
  }
}
