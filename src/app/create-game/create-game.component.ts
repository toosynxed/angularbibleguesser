import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { BibleService } from '../bible.service';
import { ShareService } from '../share.service';

@Component({
  selector: 'app-create-game',
  templateUrl: './create-game.component.html',
  styleUrls: ['./create-game.component.css']
})
export class CreateGameComponent implements OnInit {
  createForm: FormGroup;
  generatedCode: string | null = null;
  isGenerating = false;
  errorMessage: string | null = null;

  timeOptions = [
    { value: 0, label: 'No Time Limit' },
    { value: 30, label: '30 Seconds' },
    { value: 60, label: '1 Minute' },
    { value: 120, label: '2 Minutes' },
    { value: 300, label: '5 Minutes' },
    { value: 600, label: '10 Minutes' }
  ];

  constructor(
    private fb: FormBuilder,
    private bibleService: BibleService,
    private shareService: ShareService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.createForm = this.fb.group({
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
        this.verses.push(this.fb.control('', Validators.required));
      } else {
        this.verses.removeAt(this.verses.length - 1);
      }
    }
  }

  generateCode(): void {
    if (this.createForm.invalid) {
      this.errorMessage = 'Please fill out all verse fields.';
      return;
    }
    this.isGenerating = true;
    this.errorMessage = null;
    this.generatedCode = null;

    const verseRefs: string[] = this.verses.value;
    const verseLookups$ = verseRefs.map(ref => {
      const parsed = this.bibleService.parseVerseReference(ref);
      if (!parsed) return of(null);
      return this.bibleService.getVerseIndex(parsed).pipe(
        switchMap(index => this.bibleService.getVerseIdFromIndex(index))
      );
    });

    forkJoin(verseLookups$).subscribe(verseIds => {
      this.isGenerating = false;
      const validVerseIds = verseIds.filter(id => id !== null) as number[];

      if (validVerseIds.length !== verseRefs.length) {
        this.errorMessage = 'One or more verses could not be found. Please check your spelling and format (e.g., "John 3:16").';
        return;
      }

      const gameSettings = {
        rounds: this.createForm.value.rounds,
        contextSize: this.createForm.value.contextSize,
        timeLimit: this.createForm.value.timeLimit,
        books: [] // Not needed for created games
      };

      this.generatedCode = this.shareService.encodeGame({
        mode: 'custom',
        verseIds: validVerseIds,
        settings: gameSettings
      });
    });
  }

  copyCode(): void {
    if (this.generatedCode) {
      navigator.clipboard.writeText(this.generatedCode).then(() => {
        // Optional: show a "Copied!" message
      });
    }
  }
}
