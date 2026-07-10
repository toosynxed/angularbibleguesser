import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-scroll-balance',
  templateUrl: './scroll-balance.component.html',
  styleUrls: ['./scroll-balance.component.css']
})
export class ScrollBalanceComponent {
  @Input() amount = 0;
  @Input() label = 'Remaining Balance';
}
