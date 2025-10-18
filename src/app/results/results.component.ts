import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RoundResult } from '../game/game.component';
import { ShareService } from '../share.service';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit {
  results: RoundResult[] = [];
  totalScore = 0;
  shareCode = '';
  copyButtonText = 'Copy Share Code';

  constructor(private router: Router, private shareService: ShareService) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { results: RoundResult[] } | undefined;
    if (state?.results) {
      this.results = state.results;
    } else {
      // No results, go home
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    if (this.results.length === 0) return;

    this.totalScore = this.results.reduce((acc, r) => acc + r.score, 0);
    const verseIds = this.results.map(r => r.verse.verseId);
    this.shareCode = this.shareService.encodeGame(verseIds);
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
}
