import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, of } from 'rxjs';
import { switchMap, first } from 'rxjs/operators';
import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<firebase.User | null>;

  constructor(private afAuth: AngularFireAuth) {
    this.user$ = this.afAuth.authState;
  }

  // Ensure anonymous sign-in only happens if no user is logged in.
  // This should be called from AppComponent on startup.
  ensureAuthenticated() {
    this.user$.pipe(
      first(), // take the first emission and complete
      switchMap(user => {
        if (user) {
          return of(user); // User is already logged in
        }
        return this.signInAnonymously(); // No user, so sign in anonymously
      })
    ).subscribe();
  }

  private signInAnonymously() {
    return this.afAuth.signInAnonymously();
  }

  async googleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return this.afAuth.signInWithPopup(provider);
  }

  async emailSignUp(email: string, password: string) {
    return this.afAuth.createUserWithEmailAndPassword(email, password);
  }

  async emailSignIn(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  signOut() {
    return this.afAuth.signOut();
  }

  async updateProfile(displayName: string): Promise<void> {
    const user = await this.user$.pipe(first()).toPromise();
    if (user) {
      return user.updateProfile({ displayName: displayName });
    }
  }
}
