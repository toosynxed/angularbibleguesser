import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AuthService } from '../auth.service';
import { ProfileCustomization, UserProfile } from '../stats.model';
import { first } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import { INITIAL_BITMARKET_MASK, isItemUnlocked } from '../marketplace-bitmask';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile-customization',
  templateUrl: './profile-customization.component.html',
  styleUrls: ['./profile-customization.component.css']
})
export class ProfileCustomizationComponent implements OnInit, OnDestroy {
  @Input() user: firebase.User | null;
  @Output() close = new EventEmitter<void>();

  customization: ProfileCustomization = {};
  isSaving = false;
  saveButtonText = 'Save Changes';
  private currentBitMarket: number | string | null | undefined = INITIAL_BITMARKET_MASK;
  private profileSub?: Subscription;
  private readonly unlockedEffectBits: Record<string, number> = {
    rainbow: 1,
    glow: 2,
    bold: 4,
    underline: 8,
    italic: 16
  };
  private readonly unlockedNameplateBits: Record<string, number> = {
    'gold-plate': 32,
    'fire-animated': 64,
    'ice-plate': 128
  };
  private readonly unlockedIconBits: Record<string, number> = {
    '👑': 256,
    '🔥': 512,
    '⭐': 1024,
    '✝️': 2048,
    '🕊️': 4096,
    '⚔️': 8192,
    '🛡️': 16384,
    '🏆': 32768,
    '🥇': 65536
  };

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
    if (!this.user?.uid) {
      this.close.emit();
      return;
    }

    this.profileSub = this.authService.getUserProfile(this.user.uid).subscribe(profile => {
      this.currentBitMarket = profile?.BitMarket ?? INITIAL_BITMARKET_MASK;

      if (profile?.customization) {
        this.customization = { ...profile.customization };
      }

      this.applyUnlockedCustomizationOptions();
    });
  }

  ngOnDestroy(): void {
    this.profileSub?.unsubscribe();
  }

  private applyUnlockedCustomizationOptions(): void {
    // Fallback to "none" when saved customization is no longer unlocked.
    if (this.customization.nameEffect && !this.isNameEffectUnlocked(this.customization.nameEffect)) {
      this.customization.nameEffect = 'none';
    }

    if (this.customization.nameplate && !this.isNameplateUnlocked(this.customization.nameplate)) {
      this.customization.nameplate = '';
    }

    if (this.customization.icon && !this.isIconUnlocked(this.customization.icon)) {
      this.customization.icon = '';
    }
  }

  isNameEffectUnlocked(effectValue: string): boolean {
    if (effectValue === 'none') {
      return true;
    }

    const bitValue = this.unlockedEffectBits[effectValue];
    return bitValue ? isItemUnlocked(this.currentBitMarket, bitValue) : false;
  }

  isNameplateUnlocked(nameplateValue: string): boolean {
    if (nameplateValue === 'none') {
      return true;
    }

    const bitValue = this.unlockedNameplateBits[nameplateValue];
    return bitValue ? isItemUnlocked(this.currentBitMarket, bitValue) : false;
  }

  isIconUnlocked(iconValue: string): boolean {
    if (iconValue === 'None') {
      return true;
    }

    const bitValue = this.unlockedIconBits[iconValue];
    return bitValue ? isItemUnlocked(this.currentBitMarket, bitValue) : false;
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
