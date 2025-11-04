import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AuthService } from '../auth.service';
import { ProfileCustomization, UserProfile } from '../stats.model';
import { first } from 'rxjs/operators';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-profile-customization',
  templateUrl: './profile-customization.component.html',
  styleUrls: ['./profile-customization.component.css']
})
export class ProfileCustomizationComponent implements OnInit {
  @Input() user: firebase.User;
  @Output() close = new EventEmitter<void>();

  customization: ProfileCustomization = {};
  isSaving = false;
  saveButtonText = 'Save Changes';

  // Options for dropdowns
  nameEffects = [
    { value: 'none', label: 'None' },
    { value: 'rainbow', label: 'Animated Rainbow' },
    { value: 'glow', label: 'Glow' },
    { value: 'bold', label: 'Bold' },
    { value: 'italic', label: 'Italic' },
    { value: 'underline', label: 'Underline' }
  ];

  icons = ['None', '👑', '🔥', '⭐', '✝️', '🕊️', '⚔️', '🛡️', '🏆', '🥇'];

  nameplates = [
    { value: 'none', label: 'None' },
    { value: 'gold-plate', label: 'Gold Plate' },
    { value: 'fire-animated', label: 'Animated Fire' },
    { value: 'ice-plate', label: 'Ice Plate' }
  ];

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    // Here is where you could check if the user has a subscription to enable/disable customization
    // For now, it's free for everyone.

    this.authService.getUserProfile(this.user.uid).pipe(first()).subscribe(profile => {
      if (profile?.customization) {
        this.customization = { ...profile.customization };
      }
    });
  }

  async saveCustomization(): Promise<void> {
    if (this.isSaving) return;

    this.isSaving = true;
    this.saveButtonText = 'Saving...';

    try {
      // Get the full profile to merge with
      const profile = await this.authService.getUserProfile(this.user.uid).pipe(first()).toPromise();
      const updatedProfile: Partial<UserProfile> = {
        ...profile,
        customization: this.customization
      };
      await this.authService.updateUserCollection(this.user.uid, updatedProfile);

      this.saveButtonText = 'Saved!';
      setTimeout(() => {
        this.close.emit();
      }, 1000);

    } catch (error) {
      console.error("Error saving customization:", error);
      this.saveButtonText = 'Error!';
    } finally {
      setTimeout(() => {
        this.isSaving = false;
        this.saveButtonText = 'Save Changes';
      }, 2000);
    }
  }
}
