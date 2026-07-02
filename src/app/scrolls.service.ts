import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { UserProfile } from './stats.model';
import { map } from 'rxjs/operators';
import { INITIAL_BITMARKET_MASK } from './marketplace-bitmask';

export interface ScrollsUpdate {
  value: number;
  type: 'spend' | 'earn';
}

@Injectable({
  providedIn: 'root'
})
export class ScrollsService {

  constructor(private afs: AngularFirestore) { }

  getUserScrolls(uid: string): Observable<number | undefined> {
    return this.afs.collection('users').doc<UserProfile>(uid).valueChanges().pipe(
      map(user => user?.scrolls)
    );
  }

  async updateUserScrolls(uid: string, update: ScrollsUpdate): Promise<void> {
    const userRef = this.afs.collection('users').doc(uid).ref;
    try {
      return await this.afs.firestore.runTransaction(async (transaction) => {
        const doc = await transaction.get(userRef);
        const currentUser = doc.exists ? (doc.data() as UserProfile) : undefined;
        const currentScrolls = currentUser?.scrolls || 0;

        if (update.type === 'spend' && currentScrolls < update.value) {
          throw new Error('Insufficient scrolls');
        }

        const newScrolls = currentScrolls + (update.type === 'spend' ? -update.value : update.value);
        const updates: Partial<UserProfile> = { scrolls: newScrolls };

        if (!currentUser?.uid) {
          updates.uid = uid;
        }

        if (currentUser?.BitMarket === undefined) {
          updates.BitMarket = INITIAL_BITMARKET_MASK;
        }

        transaction.set(userRef, updates, { merge: true });
      });
    } catch (error) {
      console.error(`Error updating scrolls for user ${uid}:`, error);
      throw error;
    }
  }

  async addScrolls(uid: string, amount: number): Promise<void> {
    const userRef = this.afs.collection('users').doc(uid).ref;
    try {
      return await this.afs.firestore.runTransaction(async (transaction) => {
        const doc = await transaction.get(userRef);
        const currentUser = doc.exists ? (doc.data() as UserProfile) : undefined;
        const currentScrolls = currentUser?.scrolls || 0;
        const newScrolls = currentScrolls + amount;

        const updates: Partial<UserProfile> = { scrolls: newScrolls };

        if (!currentUser?.uid) {
          updates.uid = uid;
        }

        if (currentUser?.BitMarket === undefined) {
          updates.BitMarket = INITIAL_BITMARKET_MASK;
        }

        transaction.set(userRef, updates, { merge: true });
      });
    } catch (error) {
      console.error(`Error adding scrolls for user ${uid}:`, error);
      throw error;
    }
  }

  async deductScrolls(uid: string, amount: number): Promise<boolean> {
    const userRef = this.afs.collection('users').doc(uid).ref;
    try {
      let success = false;
      await this.afs.firestore.runTransaction(async (transaction) => {
        const doc = await transaction.get(userRef);
        if (!doc.exists) {
          success = false;
          return;
        }
        const currentUser = doc.data() as UserProfile;
        const currentScrolls = currentUser?.scrolls || 0;

        if (currentScrolls < amount) {
          success = false;
          return; // Not enough scrolls
        }

        const newScrolls = currentScrolls - amount;
        const updates: Partial<UserProfile> = { scrolls: newScrolls };

        if (currentUser?.BitMarket === undefined) {
          updates.BitMarket = INITIAL_BITMARKET_MASK;
        }

        transaction.set(userRef, updates, { merge: true });
        success = true;
      });
      return success;
    } catch (error) {
      console.error(`Error deducting scrolls for user ${uid}:`, error);
      throw error;
    }
  }

  async initializeScrolls(uid: string): Promise<void> {
    const userRef = this.afs.collection('users').doc(uid).ref;
    await this.afs.firestore.runTransaction(async (transaction) => {
      const doc = await transaction.get(userRef);
      const existing = doc.exists ? (doc.data() as Partial<UserProfile>) : {};
      const updates: Partial<UserProfile> = {};

      if (!existing.uid) {
        updates.uid = uid;
      }

      if (existing.scrolls === undefined) {
        updates.scrolls = 0;
      }

      if (existing.BitMarket === undefined) {
        updates.BitMarket = INITIAL_BITMARKET_MASK;
      }

      if (!doc.exists || Object.keys(updates).length > 0) {
        transaction.set(userRef, updates, { merge: true });
      }
    });
  }
}
