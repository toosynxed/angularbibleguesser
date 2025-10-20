import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<firebase.User | null>;

  constructor(private afAuth: AngularFireAuth) {
    this.user$ = this.afAuth.authState;
    this.signInAnonymously();
  }

  signInAnonymously() {
    return this.afAuth.signInAnonymously();
  }

  signOut() {
    return this.afAuth.signOut();
  }
}
