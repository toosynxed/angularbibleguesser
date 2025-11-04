import { Component, Input } from '@angular/core';

// A simplified profile type for this component's input
interface NameProfile {
  displayName: string;
  customization?: {
    nameColor?: string;
    nameEffect?: string;
    icon?: string;
    nameplate?: string;
  }
}

@Component({
  selector: 'app-decorated-name',
  templateUrl: './decorated-name.component.html',
  styleUrls: ['./decorated-name.component.css']
})
export class DecoratedNameComponent {
  @Input() profile: NameProfile;

  get nameStyles() {
    const styles: any = {};
    if (this.profile?.customization?.nameColor && this.profile.customization.nameEffect !== 'rainbow') {
      styles.color = this.profile.customization.nameColor;
    }
    return styles;
  }
}
