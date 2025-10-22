import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LobbyService, Lobby, Player } from '../lobby.service';
import { AuthService } from '../auth.service';
import { BibleService } from '../bible.service';
import { RoundResult } from '../game/game.component';
import { Verse } from '../verse.model';
import { Observable, Subscription, combineLatest, of } from 'rxjs';
import { switchMap, map, first } from 'rxjs/operators';

@Component({
  selector: 'app-multiplayer-leaderboard',
  templateUrl: './multiplayer-leaderboard.component.html',
  styleUrls: ['./multiplayer-leaderboard.component.css']
})
export class MultiplayerLeaderboardComponent implements OnInit, OnDestroy {
  lobbyId: string;
  lobby$: Observable<Lobby>;
  players$: Observable<Player[]>;
  userId: string;
  isHost = false;
  isGameOver = false;

  lastRoundResult$: Observable<RoundResult | null>;
  lastRoundNumber: number;

  private lobbySub: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public lobbyService: LobbyService,
    private authService: AuthService,
    private bibleService: BibleService
  ) { }

  ngOnInit(): void {
    this.lobbyId = this.route.snapshot.paramMap.get('id');
    this.lobby$ = this.lobbyService.getLobby(this.lobbyId).valueChanges();
    this.players$ = this.lobbyService.getLobbyPlayers(this.lobbyId).pipe(
      map(players => players.sort((a, b) => b.score - a.score))
    );

    this.lobbySub = combineLatest([
      this.lobby$,
      this.authService.user$.pipe(first(user => !!user))
    ]).subscribe(([lobby, user]) => {
      if (!lobby) {
        this.router.navigate(['/']);
        return;
      }
      this.userId = user.uid;
      this.isHost = lobby.hostId === this.userId;
      this.isGameOver = lobby.currentRound >= lobby.gameSettings.rounds - 1 && lobby.gameState === 'leaderboard';

      if (lobby.gameState === 'in-progress') {
        this.router.navigate(['/game'], { state: { mode: 'multiplayer', lobbyId: this.lobbyId } });
      }
    });

    this.lastRoundResult$ = this.lobby$.pipe(
      first(), // We only need the lobby state once to calculate the result
      switchMap(lobby => {
        if (!lobby || lobby.currentRound < 0) return of(null);

        this.lastRoundNumber = lobby.currentRound + 1;
        const roundKey = `round_${lobby.currentRound}`;
        const userGuessData = lobby.guesses?.[roundKey]?.[this.userId];
        const correctVerseId = lobby.verseIds[lobby.currentRound];

        if (!userGuessData || correctVerseId === undefined) return of(null);

        return this.bibleService.getVerseById(correctVerseId).pipe(
          map(correctVerse => {
            if (!correctVerse) return null;

            const parsedGuess = this.bibleService.parseVerseReference(userGuessData.guess);

            const isBookCorrect = parsedGuess ? this.bibleService.normalizeBookName(parsedGuess.book) === this.bibleService.normalizeBookName(correctVerse.bookName) : false;
            const isChapterCorrect = parsedGuess ? parsedGuess.chapter === correctVerse.chapter : false;
            const isVerseCorrect = parsedGuess ? parsedGuess.verse === correctVerse.verse : false;

            let stars = 0;
            if (isBookCorrect) {
              stars = 1;
              if (isChapterCorrect) {
                stars = 2;
                if (isVerseCorrect) stars = 3;
              }
            }

            const result: RoundResult = {
              verse: correctVerse,
              guess: parsedGuess,
              score: userGuessData.score,
              isBookCorrect,
              isChapterCorrect,
              isVerseCorrect,
              stars
            };
            return result;
          })
        );
      })
    );
  }

  ngOnDestroy(): void {
    if (this.lobbySub) {
      this.lobbySub.unsubscribe();
    }
  }

  nextRound(): void {
    this.lobbyService.startNextRound(this.lobbyId);
  }

  finishGame(): void {
    this.lobbyService.endGame(this.lobbyId);
  }
}
