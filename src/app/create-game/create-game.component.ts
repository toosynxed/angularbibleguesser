import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of, timer, Observable } from 'rxjs';
import { map, switchMap, debounceTime, first, filter } from 'rxjs/operators';
import { BibleService } from '../bible.service';
import { SharedGame, ShareService, } from '../share.service';
import { GameSettings } from '../game-settings.model';
import { AuthService } from '../auth.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-create-game',
  templateUrl: './create-game.component.html',
  styleUrls: ['./create-game.component.css']
})
export class CreateGameComponent implements OnInit {
  createForm: FormGroup;
  isGenerating = false;
  errorMessage: string | null = null;
  longShareUrl: string | null = null;
  shortShareCode: string | null = null;
  gameDataForSharing: SharedGame | null = null;
  setId: string | null = null;
  isSavingSet = false;

  timeOptions = [
    { value: 0, label: 'No Time Limit' },
    { value: 30, label: '30 Seconds' },
    { value: 60, label: '1 Minute' },
    { value: 120, label: '2 Minutes' },
    { value: 300, label: '5 Minutes' },
    { value: 600, label: '10 Minutes' }
  ];

  shortCodeCopyButtonText = 'Create and Copy';
  isShortCodeGenerating = false;
  longCodeCopyButtonText = 'Copy Link';
  saveSetButtonText = 'Save to My Sets';

  constructor(
    private fb: FormBuilder,
    private bibleService: BibleService,
    private shareService: ShareService,
    private router: Router,
    private authService: AuthService,
    private afs: AngularFirestore
  ) {}





  ngOnInit(): void {
    this.createForm = this.fb.group({
      setName: ['', Validators.maxLength(100)],
      rounds: [5, [Validators.required, Validators.min(1), Validators.max(50)]],
      contextSize: [10, [Validators.required, Validators.min(0), Validators.max(250)]],
      timeLimit: [0],
      verses: this.fb.array([])
    });

    this.onRoundsChange(); // Initialize with default number of verse inputs

    this.createForm.get('rounds')?.valueChanges.subscribe(() => {
      this.onRoundsChange();
    });
  }

  get verses(): FormArray {
    return this.createForm.get('verses') as FormArray;
  }

  onRoundsChange(): void {
    const numberOfRounds = this.createForm.get('rounds')?.value || 0;
    while (this.verses.length !== numberOfRounds) {
      if (this.verses.length < numberOfRounds) {
        this.verses.push(this.fb.control('', { validators: [Validators.required], asyncValidators: [this.verseValidator], updateOn: 'blur' }));
      } else {
        this.verses.removeAt(this.verses.length - 1);
      }
    }
  }

  generateCode(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      this.errorMessage = 'Please fix the errors in the form before generating a code.';
      return;
    }

    if (this.createForm.pending) {
      this.errorMessage = 'Please wait for all verses to be validated.';
      return;
    }

    this.isGenerating = true;
    this.errorMessage = null;
    this.longShareUrl = null;
    this.shortShareCode = null;
    this.gameDataForSharing = null;
    this.shortCodeCopyButtonText = 'Create and Copy';
    this.longCodeCopyButtonText = 'Copy Link';

    const verseRefs: string[] = this.verses.value;
    const verseLookups$ = verseRefs.map(ref => {
      const parsed = this.bibleService.parseVerseReference(ref);
      if (!parsed) {
        return of(null); // Should not happen due to validation, but a good safeguard.
      }
      return this.bibleService.getVerseIndex({
        bookName: parsed.book,
        chapter: parsed.chapter,
        verse: parsed.verse
      }).pipe(switchMap(index => this.bibleService.getVerseIdFromIndex(index)));
    }
    );

    forkJoin(verseLookups$).subscribe(results => {
      this.isGenerating = false;
      // Filter out any nulls that might have slipped through, just in case.
      const validVerseIds = results.filter((id): id is number => id !== null);

      // Final check to ensure the number of valid verses matches the number of rounds.
      if (validVerseIds.length !== this.createForm.value.rounds) {
        this.errorMessage = 'Could not generate code. One or more verses failed to be validated. Please review your entries.';
        return;
      }

      const gameSettings: GameSettings = {
        rounds: this.createForm.value.rounds,
        contextSize: this.createForm.value.contextSize,
        timeLimit: this.createForm.value.timeLimit,
        books: [] // The 'books' property is not needed here because verses are explicitly defined.
      };

      this.gameDataForSharing = {
        verseIds: validVerseIds,
        gameSettings: gameSettings,
        createdAt: new Date()
      };

      // Convert verse IDs to comma-separated string for storage
      const verseIdString = validVerseIds.join(',');
      (this.gameDataForSharing as any)['verseIdString'] = verseIdString;

      const longCode = this.shareService.encodeGameData(this.gameDataForSharing);
      this.longShareUrl = `${window.location.origin}/game/${longCode}`;
    });
  }

  async createAndCopyShortCode(): Promise<void> {
    if (this.isShortCodeGenerating || !this.gameDataForSharing) return;

    if (!this.shortShareCode) {
      this.isShortCodeGenerating = true;
      this.shortCodeCopyButtonText = 'Creating...';
      this.shortShareCode = await this.shareService.createShortCodeGame(this.gameDataForSharing);
      this.isShortCodeGenerating = false;
    }

    navigator.clipboard.writeText(this.shortShareCode).then(() => {
      this.shortCodeCopyButtonText = 'Copied!';
      setTimeout(() => this.shortCodeCopyButtonText = 'Copy Code', 2000);
    });
  }

  async saveSetToDatabase(): Promise<void> {
    if (this.isSavingSet || !this.gameDataForSharing || this.setId) return;

    this.isSavingSet = true;
    this.saveSetButtonText = 'Saving...';

    try {
      const user = await this.authService.user$.pipe(first()).toPromise();
      if (!user) {
        this.errorMessage = 'You must be logged in to save a set.';
        this.isSavingSet = false;
        this.saveSetButtonText = 'Save to My Sets';
        return;
      }

      const setName = this.createForm.get('setName')?.value?.trim() || `My Custom Set (${new Date().toLocaleDateString()})`;
      const gameSettings = this.gameDataForSharing.gameSettings;

      // Generate a randomly generated setId (like "n5EcEcjD49KbGtLnvySK")
      const randomSetId = this.generateRandomId();

      // Create a short code to use as the document name
      const shortCode = this.shareService['generateShortCode']();

      // Update gameDataForSharing with the setId and short code for sharing
      this.gameDataForSharing['setId'] = randomSetId;
      this.gameDataForSharing['shortCode'] = shortCode;

      // Save to sets collection with shortCode as document name
      await this.afs.collection('sets').doc(shortCode).set({
        name: setName,
        verseID: shortCode,  // verseID is the short code
        uid: user.uid,
        uploadDate: new Date(),
        totalRounds: gameSettings?.rounds || 5,
        gamesPlayed: 0,
        setId: randomSetId  // Randomly generated ID
      });

      // Create a short code game in shared_games with the setId reference if needed
      if (!this.shortShareCode) {
        this.shortShareCode = shortCode;
        // Optionally save to shared_games collection as well
        await this.afs.collection('shared_games').doc(shortCode).set({
          ...this.gameDataForSharing,
          createdAt: new Date()
        });
      }

      this.setId = randomSetId;

      this.saveSetButtonText = 'Saved!';
      setTimeout(() => {
        this.saveSetButtonText = 'Save to My Sets';
      }, 2000);
    } catch (error) {
      console.error('Error saving set:', error);
      this.errorMessage = 'Failed to save the set. Please try again.';
      this.saveSetButtonText = 'Save to My Sets';
    } finally {
      this.isSavingSet = false;
    }
  }

  private generateRandomId(): string {
    // Generate a random ID similar to Firebase IDs (20 characters, alphanumeric)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 20; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  copyLongUrl(): void {
    if (this.longShareUrl) {
      navigator.clipboard.writeText(this.longShareUrl).then(() => {
        this.longCodeCopyButtonText = 'Copied!';
        setTimeout(() => this.longCodeCopyButtonText = 'Copy Link', 2000);
      });
    }
  }

  verseValidator: AsyncValidatorFn = (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) {
      return of(null); // Don't validate empty values, let `Validators.required` handle it.
    }
    return timer(300).pipe( // Debounce input
      switchMap(() => {
        // A more robust regex that handles book names with numbers (e.g., "1 John")
        // and allows for flexible spacing.
        const verseRegex = /^\s*([1-3]?\s*[a-zA-Z]+)\s+(\d+):(\d+)\s*$/;
        const match = control.value.trim().match(verseRegex);

        if (!match) {
          return of({ invalidFormat: true });
        }

        const [, book, chapter, verse] = match;

        return this.bibleService.getVerseIndex({
          // We pass the parsed components to the service
          bookName: book.trim(),
          chapter: parseInt(chapter, 10),
          verse: parseInt(verse, 10)
        }).pipe(
          map(index => (index === -1 ? { verseNotFound: true } : null))
        );
      }),
      first() // Ensure the observable completes
    );
  };
}
