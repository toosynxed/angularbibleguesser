import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RoundResult } from '../game/game.component';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent {
  results: RoundResult[] = [];
  totalScore = 0;

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { results: RoundResult[] } | undefined;
    if (state?.results) {
      this.results = state.results;
      this.totalScore = this.results.reduce((acc, r) => acc + r.score, 0);
    } else {
      // No results, go home
      this.router.navigate(['/']);
    }
  }

  getStarArray(starCount: number): any[] {
    return new Array(starCount);
  }
}
