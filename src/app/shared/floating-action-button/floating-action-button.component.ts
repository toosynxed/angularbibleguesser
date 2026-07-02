import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-floating-action-button',
  templateUrl: './floating-action-button.component.html',
  styleUrls: ['./floating-action-button.component.css']
})
export class FloatingActionButtonComponent {
  @Input() label = '';
  @Input() ariaLabel = '';
  @Input() position: 'bottom-left' | 'bottom-right' | 'bottom-center' = 'bottom-right';
  @Input() shape: 'circle' | 'pill' = 'circle';
  @Input() variant: 'primary' | 'secondary' | 'muted' = 'secondary';

  @Output() pressed = new EventEmitter<void>();

  get fabClasses(): string[] {
    return [
      'fab',
      `fab--${this.position}`,
      `fab--${this.shape}`,
      `fab--${this.variant}`
    ];
  }
}
