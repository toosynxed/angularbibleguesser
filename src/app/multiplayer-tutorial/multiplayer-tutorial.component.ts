import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-multiplayer-tutorial',
  templateUrl: './multiplayer-tutorial.component.html',
  styleUrls: ['./multiplayer-tutorial.component.css']
})
export class MultiplayerTutorialComponent {
  @Output() close = new EventEmitter<void>();

  closeTutorial() {
    this.close.emit();
  }
}
