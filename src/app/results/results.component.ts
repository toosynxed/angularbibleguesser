import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RoundResult,  } from '../game/game.component';
import { GameSettings } from '../game-settings.model';
import { Lobby, LobbyService, Player } from '../lobby.service';
import { ShareService } from '../share.service';
import { AuthService } from '../auth.service';
import { BibleService } from '../bible.service';
import { combineLatest, forkJoin, from } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { Verse } from '../verse.model';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit {
  // Multiplayer state
  leaderboard: { player: Player, totalScore: number, rank: number }[] = [];
  playerResults: RoundResult[] = [];

  // Single-player state
  results: RoundResult[] = [];
  lobby: Lobby | null = null;
  settings: GameSettings;
  totalScore = 0;
  shareCode = '';
  copyButtonText = 'Copy Share Code';
  expandedIndex: number | null = null;

  constructor(
    private router: Router,
    private shareService: ShareService,
    private lobbyService: LobbyService,
    private authService: AuthService,
    private bibleService: BibleService
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { results?: RoundResult[], settings?: GameSettings, lobby?: Lobby, mode?: string } | undefined;

    if (state?.mode === 'multiplayer' && state.lobby) {
      this.lobby = state.lobby;
      this.settings = state.lobby.gameSettings;
      this.totalScore = 0; // This will be calculated per player
      this.processMultiplayerResults();
    } else if (state?.results && state.settings) {
      this.results = state.results;
      this.settings = state.settings;
    } else {
      // No results, go home
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    if (this.lobby) {
      // Generate share code for multiplayer game
      this.shareCode = this.shareService.encodeGame({
        mode: 'created',
        verseIds: this.lobby.verseIds!,
        settings: this.settings
      });
    } else if (this.results.length > 0) { // For single player
      this.totalScore = this.results.reduce((acc, r) => acc + r.score, 0);
      const verseIds = this.results.map(r => r.verse.verseId);
      this.shareCode = this.shareService.encodeGame({
        mode: 'created', // The results page always shares a 'created' game type
        verseIds: verseIds,
        settings: this.settings // Include the game settings
      });
    }
  }

  processMultiplayerResults(): void {
    if (!this.lobby) return;

    const players$ = this.lobbyService.getLobbyPlayers(this.lobby.id!);
    const user$ = this.authService.user$.pipe(first(user => !!user));

    combineLatest([players$, user$]).pipe(first()).subscribe(([players, user]) => {
      // Calculate total scores for the leaderboard
      const rankedPlayers = players.map(player => {
        let totalScore = 0;
        if (this.lobby?.guesses) {
          Object.values(this.lobby.guesses).forEach(roundGuesses => {
            if (roundGuesses[player.uid]) {
              totalScore += roundGuesses[player.uid].score;
            }
          });
        }
        return { player, totalScore };
      }).sort((a, b) => b.totalScore - a.totalScore);

      // Assign ranks
      this.leaderboard = rankedPlayers.map((p, index) => ({ ...p, rank: index + 1 }));

      // Prepare individual results for the current user
      if (this.lobby?.guesses && this.lobby.verseIds) {
        const verseLookups = this.lobby.verseIds.map(id => this.bibleService.getVerseById(id));
        forkJoin(verseLookups).subscribe(verses => {
          this.playerResults = verses.map((verse, i) => {
            const roundKey = `round_${i}`;
            const playerGuessData = this.lobby!.guesses![roundKey]?.[user!.uid] ?? { guess: 'No Guess', score: 0 };
            const parsedGuess = this.bibleService.parseVerseReference(playerGuessData.guess);

            let stars = 0;
            let isBookCorrect = false;
            let isChapterCorrect = false;
            let isVerseCorrect = false;

            if (parsedGuess && verse) {
              isBookCorrect = this.bibleService.normalizeBookName(parsedGuess.book) === this.bibleService.normalizeBookName(verse.bookName);
              isChapterCorrect = parsedGuess.chapter === verse.chapter;
              isVerseCorrect = parsedGuess.verse === verse.verse;

              if (isBookCorrect) {
                stars = 1;
                if (isChapterCorrect) {
                  stars = 2;
                  if (isVerseCorrect) {
                    stars = 3;
                  }
                }
              }
            }

            return { verse: verse!, guess: parsedGuess, score: playerGuessData.score, stars, isBookCorrect, isChapterCorrect, isVerseCorrect };
          });

          // Calculate the current user's total score
          this.totalScore = this.playerResults.reduce((acc, r) => acc + r.score, 0);
        });
      }
    });
  }

  copyCode(): void {
    navigator.clipboard.writeText(this.shareCode).then(() => {
      this.copyButtonText = 'Copied!';
      setTimeout(() => this.copyButtonText = 'Copy Share Code', 2000);
    }).catch(err => console.error('Failed to copy text: ', err));
  }

  getStarArray(starCount: number): any[] {
    return new Array(starCount);
  }

  toggleExpand(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }
}
