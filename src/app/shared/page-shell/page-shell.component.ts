import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-shell',
  templateUrl: './page-shell.component.html',
  styleUrls: ['./page-shell.component.css']
})
export class PageShellComponent {
  @Input() size: 'narrow' | 'default' | 'wide' | 'full' = 'default';
  @Input() centered = true;
  @Input() fullHeight = false;

  get shellClasses(): Record<string, boolean> {
    return {
      container: true,
      'container--narrow': this.size === 'narrow',
      'container--wide': this.size === 'wide',
      'container--full': this.size === 'full',
      'container--full-height': this.fullHeight,
      'u-text-center': this.centered
    };
  }
}
