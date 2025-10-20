import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { Lobby, LobbyService, Player } from '../lobby.service';

interface LeaderboardPlayer extends Player {
  totalScore: number;
  rank: number;
}

@Component({
  selector: 'app-leaderboard',
  template: `
    <div class="container" *ngIf="lobby">
      <h1>Round {{ lobby.currentRound + 1 }} Results</h1>
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
              <td>{{ player.displayName }} <span *ngIf="player.isHost">(Host)</span></td>
              <td>{{ player.totalScore }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="actions" *ngIf="isHost$ | async">
        <button *ngIf="!isFinalRound" (click)="startNextRound()">Start Next Round</button>
        <button *ngIf="isFinalRound" (click)="seeFinalResults()">See Final Results</button>
      </div>
      <p *ngIf="!(isHost$ | async)">Waiting for host to continue...</p>
    </div>
  `,
  styleUrls: ['./leaderboard.component.css']
})
export class LeaderboardComponent implements OnInit {
  lobbyId: string;
  lobby: Lobby;
  leaderboard$: Observable<LeaderboardPlayer[]>;
  isHost$: Observable<boolean>;
  isFinalRound = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lobbyService: LobbyService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.lobbyId = this.route.snapshot.paramMap.get('id');

    const lobby$ = this.lobbyService.getLobby(this.lobbyId).valueChanges().pipe(
      tap(lobby => {
        // When the host starts the next round, navigate everyone back to the game.
        if (lobby?.gameState === 'in-progress') {
          this.router.navigate(['/game'], { state: { lobbyId: this.lobbyId, mode: 'multiplayer' } });
        }
      })
    );
    const players$ = this.lobbyService.getLobbyPlayers(this.lobbyId);

    this.leaderboard$ = combineLatest([lobby$, players$]).pipe(
      map(([lobby, players]) => {
        this.lobby = lobby;
        this.isFinalRound = lobby.currentRound >= lobby.gameSettings.rounds - 1;

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
      switchMap(user => lobby$.pipe(map(lobby => user?.uid === lobby?.hostId)))
    );
  }

  startNextRound(): void {
    this.lobbyService.nextRound(this.lobbyId, this.lobby.currentRound + 1);
  }

  seeFinalResults(): void {
    // TODO: Implement navigation to final results page
    alert('Final results page not yet implemented!');
  }
}
