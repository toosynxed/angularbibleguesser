import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.css']
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() logoSrc = 'assets/logo.png';
  @Input() logoAlt = 'Better Bible Guesser Logo';
  @Input() showLogo = true;
  @Input() showBackButton = false;
  @Input() backLabel = '‹ Home';
  @Input() backTitle = 'Back to Home';
  @Input() backMode: 'home' | 'previous' | 'route' | 'emit' = 'home';
  @Input() backRoute: string | any[] = '/';
  @Input() clickableLogo = true;
  @Input() logoMode: 'home' | 'previous' | 'route' | 'emit' = 'home';
  @Input() logoRoute: string | any[] = '/';
  @Input() timer: number | null = null;
  @Input() timerSuffix = 's';

  @Output() backClick = new EventEmitter<void>();
  @Output() logoClick = new EventEmitter<void>();

  constructor(private router: Router, private location: Location) {}

  onBackClick(): void {
    this.navigate(this.backMode, this.backRoute, this.backClick);
  }

  onLogoClick(): void {
    if (!this.clickableLogo) {
      return;
    }
    this.navigate(this.logoMode, this.logoRoute, this.logoClick);
  }

  private navigate(
    mode: 'home' | 'previous' | 'route' | 'emit',
    route: string | any[],
    emitter: EventEmitter<void>
  ): void {
    switch (mode) {
      case 'home':
        this.router.navigate(['/']);
        break;
      case 'previous':
        this.location.back();
        break;
      case 'route':
        this.router.navigate(Array.isArray(route) ? route : [route]);
        break;
      case 'emit':
        emitter.emit();
        break;
    }
  }
}
