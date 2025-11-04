import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of } from 'rxjs';
import { UserProfile } from './stats.model';
import { switchMap, first } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import { StatsService } from './stats.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<firebase.User | null>;

  // --- ADMIN MANAGEMENT ---
  // Add the UIDs of your admin accounts here.
  private adminUids = [
    'OHxIav7wuAYOowB7NG1P4cRKU1o2'
  ];

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private statsService: StatsService // Inject StatsService
    ) {
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
    const oldUser = await this.user$.pipe(first()).toPromise();
    const provider = new firebase.auth.GoogleAuthProvider();
    const credential = await this.afAuth.signInWithPopup(provider);
    if (credential.user) {
      await this.updateUserCollection(credential.user.uid, {
        displayName: credential.user.displayName,
        displayName_lowercase: credential.user.displayName.toLowerCase()
      });
      // After creating the new user, merge old stats if they exist
      await this.mergeAnonymousStats(oldUser, credential.user);
    }
    return credential;
  }

  async emailSignUp(email: string, password: string) {
    const credential = await this.afAuth.createUserWithEmailAndPassword(email, password);
    if (credential.user) {
      // Create a basic user profile document on sign-up
      await this.updateUserCollection(credential.user.uid, {
        displayName: 'New User', // A default name
        displayName_lowercase: 'new user'
      });
      // After creating the new user, merge old stats if they exist
      await this.mergeAnonymousStats(null, credential.user); // Pass null for oldUser as we don't have it before createUser
    }
    return credential;
  }

  async emailSignIn(email: string, password: string) {
    // No profile creation needed here, as the user should already exist.
    // If you wanted to sync on every sign-in, you could add logic here.
    const oldUser = await this.user$.pipe(first()).toPromise();
    const credential = await this.afAuth.signInWithEmailAndPassword(email, password);
    // Merge stats on sign-in as well, in case they were anonymous before
    await this.mergeAnonymousStats(oldUser, credential.user);
    return credential;
  }

  signOut() {
    return this.afAuth.signOut();
  }

  async updateProfile(displayName: string): Promise<void> {
    const user = await this.user$.pipe(first()).toPromise();
    if (user) {
      await user.updateProfile({ displayName: displayName });
      // Also update the searchable 'users' collection in Firestore
      return this.updateUserCollection(user.uid, {
        displayName: displayName,
        displayName_lowercase: displayName.toLowerCase()
      });
    }
  }

  // New method to keep the 'users' collection in sync
  updateUserCollection(uid: string, data: Partial<UserProfile>): Promise<void> {
    const userRef = this.afs.collection('users').doc(uid);
    return userRef.set({ uid, ...data }, { merge: true });
  }

  getUserProfile(uid: string): Observable<UserProfile | undefined> {
    return this.afs.collection('users').doc<UserProfile>(uid).valueChanges();
  }

  async deleteAccount(): Promise<void> {
    const user = await this.user$.pipe(first()).toPromise();
    if (user) {
      return user.delete();
    }
  }

  async reauthenticate(password: string): Promise<void> {
    const user = await this.user$.pipe(first()).toPromise();
    if (user && user.email) {
      const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
      await user.reauthenticateWithCredential(credential);
    } else {
      throw new Error('Cannot reauthenticate. User or email not found.');
    }
  }

  isAdmin(uid: string): boolean {
    return this.adminUids.includes(uid);
  }

  private async mergeAnonymousStats(oldUser: firebase.User | null, newUser: firebase.User | null): Promise<void> {
    if (!oldUser || !newUser || !oldUser.isAnonymous || oldUser.uid === newUser.uid) {
      return; // Only proceed if there was an old anonymous user and a new permanent user
    }

    try {
      const oldStats = await this.statsService.getUserStats(oldUser.uid).pipe(first()).toPromise();

      if (oldStats && oldStats.daily) {
        // We have daily stats to merge
        const newStats = await this.statsService.getUserStats(newUser.uid).pipe(first()).toPromise();

        const mergedDailyStats = {
          ...newStats?.daily,
          ...oldStats.daily
        };

        await this.statsService.updateUserStats(newUser.uid, { daily: mergedDailyStats });
        await this.statsService.deleteUserStats(oldUser.uid); // Clean up old anonymous stats
      }
    } catch (error) {
      console.error('Error merging anonymous stats:', error);
    }
  }
}
