import { Component, Input } from '@angular/core';
import { RoundResult } from '../game/game.component';

@Component({
  selector: 'app-result-card',
  templateUrl: './result-card.component.html',
  styleUrls: ['./result-card.component.css']
})
export class ResultCardComponent {
  @Input() result: RoundResult;
  @Input() roundNumber: number;

  constructor() { }

}
