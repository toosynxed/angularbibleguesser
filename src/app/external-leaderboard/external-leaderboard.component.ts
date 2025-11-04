import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Lobby, LobbyService, Player } from '../lobby.service';

interface RankedPlayer extends Player {
  rank: number;
  totalScore: number;
}

@Component({
  selector: 'app-external-leaderboard',
  templateUrl: './external-leaderboard.component.html',
  styleUrls: ['./external-leaderboard.component.css']
})
export class ExternalLeaderboardComponent implements OnInit {
  lobbyId: string;
  lobby$: Observable<Lobby>;
  leaderboard$: Observable<RankedPlayer[]>;
  isLoading$: Observable<boolean>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lobbyService: LobbyService
  ) { }

  ngOnInit(): void {
    this.lobbyId = this.route.snapshot.paramMap.get('id');
    if (!this.lobbyId) {
      this.router.navigate(['/']);
      return;
    }

    this.lobby$ = this.lobbyService.getLobby(this.lobbyId).valueChanges();
    const players$ = this.lobbyService.getLobbyPlayers(this.lobbyId);

    this.isLoading$ = this.lobby$.pipe(map(lobby => !lobby));

    this.leaderboard$ = combineLatest([this.lobby$, players$]).pipe(
      map(([lobby, players]) => {
        if (!lobby || !players) {
          return [];
        }

        const rankedPlayers = players.map(player => {
          let totalScore = 0;
          // Calculate total score from all rounds' guesses
          if (lobby.guesses) {
            Object.keys(lobby.guesses).forEach(roundKey => {
              const roundGuesses = lobby.guesses[roundKey];
              if (roundGuesses && roundGuesses[player.uid]) {
                totalScore += roundGuesses[player.uid].score;
              }
            });
          }
          return { ...player, totalScore };
        })
        .sort((a, b) => b.totalScore - a.totalScore) // Sort by score descending
        .map((player, index) => ({ // Assign ranks
          ...player,
          rank: index + 1
        }));

        return rankedPlayers;
      })
    );
  }

  copyLink(): void {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('Leaderboard link copied to clipboard!');
    });
  }
}

