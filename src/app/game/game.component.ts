import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, Subject, Subscription } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { BibleService } from '../bible.service'; // Correct
import { Verse } from '../verse.model'; // Corrected import path

export interface RoundResult {
  verse: Verse;
  guess: { book: string; chapter: number; verse: number; } | null;
  score: number;
  stars: number;
}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {
  gameMode: 'normal' | 'marathon' = 'normal';
  totalRounds = 1;
  currentRound = 0;

  currentVerse: Verse | null = null;
  verseTextWithContext: Verse[] = []; // Changed type from string to Verse[]
  contextSize = 1; // Start with context of 1

  guessForm: FormGroup;
  isRoundOver = false;
  feedback: string | null = null;
  isLoading = true;

  results: RoundResult[] = [];

  private destroy$ = new Subject<void>();
  private roundState$ = new Subject<void>();

  constructor(
    private bibleService: BibleService,
    private fb: FormBuilder,
    private router: Router
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { mode: 'normal' | 'marathon' };
    this.gameMode = state?.mode || 'normal';

    this.guessForm = this.fb.group({
      guess: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.totalRounds = this.gameMode === 'normal' ? 1 : 5;
    this.roundState$.pipe(
      switchMap(() => this.bibleService.getRandomVerse()),
      takeUntil(this.destroy$)
    ).subscribe(verse => {
      this.currentVerse = verse;
      this.updateVerseContext();
    });

    this.startNewRound(); // Start the first round directly
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  startNewRound(): void {
    this.currentRound++;
    this.isRoundOver = false;
    this.feedback = null;
    this.isLoading = true;
    this.guessForm.reset();
    this.roundState$.next();
  }

  updateVerseContext(): void {
    if (!this.currentVerse) return;
    this.bibleService.getVerseWithContext(this.currentVerse, this.contextSize)
      .subscribe(verses => {
        this.verseTextWithContext = verses;
        this.isLoading = false;
      });
  }

  onSliderChange(event: Event): void {
    this.contextSize = parseInt((event.target as HTMLInputElement).value, 10);
    this.updateVerseContext();
  }

  submitGuess(): void {
    if (this.guessForm.invalid || !this.currentVerse) {
      return;
    }

    const rawGuess: string = this.guessForm.value.guess;
    const parsedGuess = this.bibleService.parseVerseReference(rawGuess);

    // If the guess is not in a valid format, show feedback and let the user try again.
    if (!parsedGuess) {
      this.feedback = "Invalid format or spelling. Please use a format like 'John 3:16'.";
      return;
    }

    // A valid guess was made, so end the round.
    this.isRoundOver = true;
    const { book, chapter, verse } = parsedGuess;
    const answer = this.currentVerse;

    const isBookCorrect = this.bibleService.normalizeBookName(book) === this.bibleService.normalizeBookName(answer.bookName);
    const isChapterCorrect = chapter === answer.chapter;
    const isVerseCorrect = verse === answer.verse;

    let stars = 0;
    if (isBookCorrect) {
      stars = 1;
      if (isChapterCorrect) {
        stars = 2;
        if (isVerseCorrect) {
          stars = 3;
        }
      }
    }

    if (stars === 3) {
      this.feedback = 'Perfect! You got it exactly right!';
    } else {
      this.feedback = `The correct answer was ${answer.bookName} ${answer.chapter}:${answer.verse}.`;
    }

    const answerIndex$ = this.bibleService.getVerseIndex({ bookName: answer.bookName, chapter: answer.chapter, verse: answer.verse });
    const guessIndex$ = this.bibleService.getVerseIndex({ bookName: book, chapter, verse });

    forkJoin([answerIndex$, guessIndex$]).subscribe(([answerIndex, guessIndex]) => {
      const distance = (guessIndex === -1) ? 100 : Math.abs(answerIndex - guessIndex);
      const score = Math.max(0, 100 - distance);
      this.results.push({ verse: answer, guess: parsedGuess, score, stars });
    });
  }

  next(): void {
    if (this.currentRound < this.totalRounds) {
      this.startNewRound();
    } else {
      this.finishGame();
    }
  }

  finishGame(): void {
    this.router.navigate(['/results'], { state: { results: this.results } });
  }

  get answerText(): string {
    if (!this.currentVerse) return '';
    return `${this.currentVerse.bookName} ${this.currentVerse.chapter}:${this.currentVerse.verse}`;
  }
}
