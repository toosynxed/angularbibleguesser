import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { ShareService } from '../share.service';
import { AuthService } from '../auth.service';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  user$: Observable<firebase.User | null>;
  isNewUser$: Observable<boolean>;
  profileForm: FormGroup;
  loginForm: FormGroup;
  signUpForm: FormGroup;

  activeTab: 'profile' | 'login' | 'signup' = 'profile';
  error: string | null = null;
  successMessage: string | null = null;
  showUsernameForm = false;
  showDeleteConfirm = false;
  deletePassword = '';
  deleteConfirmChecked = false;

  private successSub: Subscription;
  private errorSub: Subscription;

  constructor(
    public authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private shareService: ShareService
  ) { }

  ngOnInit(): void {
    this.user$ = this.authService.user$;

    this.profileForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.maxLength(15)]]
    });

    this.isNewUser$ = this.user$.pipe(
      map(user => user && !user.isAnonymous && !user.displayName)
    );

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.signUpForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.user$.pipe(first()).subscribe(user => {
      if (user && user.displayName) {
        this.profileForm.patchValue({ displayName: user.displayName });
      }
    });

    this.successSub = this.shareService.successMessage$.subscribe(msg => this.successMessage = msg);
    this.errorSub = this.shareService.errorMessage$.subscribe(msg => this.error = msg);
  }

  ngOnDestroy(): void {
    this.successSub.unsubscribe();
    this.errorSub.unsubscribe();
  }

  async onSetProfile(): Promise<void> {
    if (this.profileForm.invalid) { return; }
    const displayName = this.profileForm.value.displayName;
    try {
      await this.authService.updateProfile(displayName);
      this.shareService.setSuccessMessage('Profile updated successfully!');
      this.showUsernameForm = false;
    } catch (err) {
      this.error = err.message;
    }
  }

  async onEmailSignUp(): Promise<void> {
    if (this.signUpForm.invalid) { return; }
    const { email, password } = this.signUpForm.value;
    try {
      await this.authService.emailSignUp(email, password);
      this.activeTab = 'profile'; // Switch to profile tab to set display name
    } catch (err) {
      this.error = err.message;
    }
  }

  async onEmailSignIn(): Promise<void> {
    if (this.loginForm.invalid) { return; }
    const { email, password } = this.loginForm.value;
    try {
      await this.authService.emailSignIn(email, password);
      this.router.navigate(['/']);
    } catch (err) {
      this.error = err.message;
    }
  }

  async onGoogleSignIn(): Promise<void> {
    try {
      const credential = await this.authService.googleSignIn();
      if (credential.user) {
        // Ensure the user document is created/updated on Google Sign-In
        await this.authService.updateProfile(credential.user.displayName);
      }
      this.router.navigate(['/']);
    } catch (err) {
      this.error = err.message;
    }
  }

  async onSignOut(): Promise<void> {
    await this.authService.signOut();
    // After signing out, ensure we have an anonymous user session
    this.authService.ensureAuthenticated();
    this.router.navigate(['/']);
  }

  async onDeleteAccount(): Promise<void> {
    if (!this.deleteConfirmChecked) {
      this.error = 'You must check the confirmation box.';
      return;
    }
    try {
      await this.authService.reauthenticate(this.deletePassword);
      await this.authService.deleteAccount();
      alert('Account deleted successfully.');
      this.router.navigate(['/']);
    } catch (err) {
      this.error = 'Failed to delete account. The password may be incorrect.';
    }
  }

  maskEmail(email: string): string {
    if (!email) {
      return '';
    }
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) return email;
    return `${localPart.substring(0, 2)}...` + '@' + domain;
  }
}
