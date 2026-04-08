import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { combineLatest, Observable, of, from } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
import { UserProfile, UserStats, sets, UserProfileWithStats, ProfileCustomization } from './sets.model';
import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root'
})



export class SetsBoard{
  constructor(private afs: AngularFirestore) { }
  
  getDetailedSetsList(): Observable<any[]> {
    // We use idField: 'setId' to capture the document ID separately
    return this.afs.collection<sets>('sets').valueChanges({ idField: 'setId' }).pipe(
      switchMap(allSets => {
        if (allSets.length === 0) return of([]);

        // STEP 2: Create a list of observables for the "Join"
        const joins = allSets.map(set => {
          // STEP 3: For each set, go to the 'users' collection using the set's uid
          return this.afs.collection('users').doc<UserProfile>(set.uid).valueChanges().pipe(
            map(user => {
              // STEP 4: Return every field as a separate, flat value
              return {
                id: set.setId,                    // Document ID
                verseIDb: set.verseID,            // linked verses.
                setName: set.name,                // Set Name
                date: set.uploadDate,             // Upload Date
                rounds: set.totalRounds || 0,     // Individual field
                plays: set.gamesPlayed || 0,      // Individual field
                authorName: user?.displayName || 'Unknown' // Joined field
              };
            })
          );
        });

        return combineLatest(joins);
      })
    );
  }

  incrementGamesPlayed(setId: string): Promise<void> {
    return this.afs.collection('sets').doc(setId).update({
      gamesPlayed: firebase.firestore.FieldValue.increment(1)
    });
  }
}



