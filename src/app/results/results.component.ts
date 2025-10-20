import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RoundResult } from '../game/game.component';
import { GameSettings } from '../game-settings.model';
import { Lobby } from '../lobby.service';
import { ShareService } from '../share.service';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit {
  results: RoundResult[] = [];
  lobby: Lobby | null = null;
  settings: GameSettings;
  totalScore = 0;
  shareCode = '';
  copyButtonText = 'Copy Share Code';
  expandedIndex: number | null = null;

  constructor(private router: Router, private shareService: ShareService) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { results?: RoundResult[], settings?: GameSettings, lobby?: Lobby, mode?: string } | undefined;

    if (state?.mode === 'multiplayer' && state.lobby) {
      this.lobby = state.lobby;
      this.settings = state.lobby.gameSettings;
      // In multiplayer, we don't have individual round results yet, just the final lobby state.
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
      // Logic for multiplayer results can be added here.
    } else if (this.results.length > 0) {
      this.totalScore = this.results.reduce((acc, r) => acc + r.score, 0);
      const verseIds = this.results.map(r => r.verse.verseId);
      this.shareCode = this.shareService.encodeGame({
        mode: 'created', // The results page always shares a 'created' game type
        verseIds: verseIds,
        settings: this.settings // Include the game settings
      });
    }
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
