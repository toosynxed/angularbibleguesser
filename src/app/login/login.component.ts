import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  user$: Observable<firebase.User | null>;
  isNewUser$: Observable<boolean>;

  loginForm: FormGroup;
  signUpForm: FormGroup;
  profileForm: FormGroup;

  error: string | null = null;
  showUsernameForm = false;
  showDeleteConfirm = false;
  deleteConfirmChecked = false;
  deletePassword = '';
  successMessage: string | null = null;

  constructor(
    public authService: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user$ = this.authService.user$;
    this.isNewUser$ = this.user$.pipe(
      map(user => {
        // A user is "new" if they have a real account and it's their very first sign-in.
        const metadata = user?.metadata;
        return !!user && !user.isAnonymous && (metadata.creationTime === metadata.lastSignInTime);
      })
    );

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.signUpForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.profileForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(15)]]
    });
  }

  async onGoogleSignIn() {
    try {
      await this.authService.googleSignIn();
      // The observable will handle the redirect for new users
    } catch (err) {
      this.error = err.message;
    }
  }

  async onEmailSignIn() {
    if (this.loginForm.invalid) return;
    try {
      const { email, password } = this.loginForm.value;
      await this.authService.emailSignIn(email, password);
      this.router.navigate(['/']);
    } catch (err) {
      this.error = err.message;
    }
  }

  async onEmailSignUp() {
    if (this.signUpForm.invalid) return;
    try {
      const { email, password } = this.signUpForm.value;
      await this.authService.emailSignUp(email, password);
      // The observable will handle showing the profile form
    } catch (err) {
      this.error = err.message;
    }
  }

  async onSetProfile() {
    if (this.profileForm.invalid) return;
    try {
      this.error = null;
      const { displayName } = this.profileForm.value;
      await this.authService.updateProfile(displayName);
      this.showUsernameForm = false;
      this.successMessage = 'Username updated successfully!';
      setTimeout(() => this.successMessage = null, 3000);
    } catch (err) {
      this.error = err.message;
    }
  }

  maskEmail(email: string): string {
    if (!email) return '';
    const atIndex = email.indexOf('@');
    if (atIndex <= 3) return email; // Not enough characters to mask
    const prefix = email.substring(0, 3);
    return `${prefix}*******${email.substring(atIndex)}`;
  }

  async onDeleteAccount() {
    if (!this.deleteConfirmChecked) return;
    this.error = null;

    try {
      const user = await this.authService.user$.pipe(first()).toPromise();
      // Re-authenticate if the user signed up with email/password
      if (user?.providerData[0]?.providerId === 'password') {
        if (!this.deletePassword) {
          this.error = 'Password is required to delete your account.';
          return;
        }
        await this.authService.reauthenticate(this.deletePassword);
      }

      // If re-authentication is successful (or not needed for Google), delete the account.
      await this.authService.deleteAccount();
      alert('Account deleted successfully.');
      this.router.navigate(['/']);
    } catch (err) {
      this.error = err.code === 'auth/wrong-password' ? 'Incorrect password.' : 'Failed to delete account. Please try again.';
    }
  }

  async signOut() {
    await this.authService.signOut();
    // After signing out, we sign them back in anonymously to maintain a UID
    this.authService.ensureAuthenticated();
  }
}
