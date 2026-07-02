import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-lobby-mini-game',
  templateUrl: './lobby-mini-game.component.html',
  styleUrls: ['./lobby-mini-game.component.css']
})
export class LobbyMiniGameComponent {
  @Input() disabled = false;

  score = 0;
  highScore = Number(localStorage.getItem('bbg_lobby_mini_game_high_score') || 0);
  targetPosition = 50;

  hitTarget(): void {
    if (this.disabled) {
      return;
    }

    this.score += 1;
    this.targetPosition = 10 + Math.floor(Math.random() * 80);

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('bbg_lobby_mini_game_high_score', String(this.highScore));
    }
  }

  reset(): void {
    this.score = 0;
    this.targetPosition = 50;
  }
}
