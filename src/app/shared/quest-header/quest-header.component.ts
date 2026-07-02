import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-quest-header',
  templateUrl: './quest-header.component.html',
  styleUrls: ['./quest-header.component.css']
})
export class QuestHeaderComponent {
  @Input() title = '';
  @Input() user: any | null = null;
  @Input() scrollBalance: number | null = null;
  @Input() backRoute: string | any[] = '/quest';
  @Input() backLabel = '‹ Quest Map';
  @Input() backMode: 'home' | 'previous' | 'route' | 'emit' = 'route';
  @Input() logoRoute: string | any[] = '/';
  @Input() logoMode: 'home' | 'previous' | 'route' | 'emit' = 'route';

  @Output() backClick = new EventEmitter<void>();
  @Output() logoClick = new EventEmitter<void>();
}
