import { Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public readonly user$: Observable<User | null> = user(this.auth);

  constructor(private auth: Auth) { }

  async googleSignIn(): Promise<void> {
    try {
      await signInWithPopup(this.auth, new GoogleAuthProvider());
    } catch (error) {
      console.error('Google Sign-In failed', error);
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('Sign-Out failed', error);
    }
  }
}
