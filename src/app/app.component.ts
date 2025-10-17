import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { BibleService } from './bible.service';
import { Book, Verse } from './bible';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  books$: Observable<Book[]>;
  currentVerse: Verse | null = null;
  maskedVerseText: string = '';
  guessForm: FormGroup;
  showAnswer = false;
  guessResult: string | null = null;
  gameOver = false;

  constructor(private bibleService: BibleService, private fb: FormBuilder) {
    this.books$ = this.bibleService.getBooks();
    this.guessForm = this.fb.group({
      book: ['', Validators.required],
      chapter: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      verse: ['', [Validators.required, Validators.pattern('^[0-9]*$')]]
    });
  }

  ngOnInit(): void {
    this.loadNewVerse();
  }

  loadNewVerse(): void {
    this.showAnswer = false;
    this.guessResult = null;
    this.gameOver = false;
    this.guessForm.reset();

    this.bibleService.getRandomVerse().subscribe(verse => {
      this.currentVerse = verse;
      this.maskedVerseText = this.bibleService.getMaskedVerseText(verse.text);
    });
  }

  submitGuess(): void {
    if (this.guessForm.invalid || !this.currentVerse) {
      return;
    }

    const guess = this.guessForm.value;
    const isBookCorrect = guess.book === this.currentVerse.book;
    const isChapterCorrect = parseInt(guess.chapter, 10) === this.currentVerse.chapter;
    const isVerseCorrect = parseInt(guess.verse, 10) === this.currentVerse.verse;

    if (isBookCorrect && isChapterCorrect && isVerseCorrect) {
      this.guessResult = 'Correct! Well done!';
      this.showAnswer = true;
      this.gameOver = true;
    } else {
      let feedback = 'Not quite. ';
      if (isBookCorrect) {
        feedback += 'You got the book right!';
        if (isChapterCorrect) {
          feedback += ' And the chapter!';
        }
      } else {
        feedback += 'Keep trying!';
      }
      this.guessResult = feedback;
    }
  }

  giveUp(): void {
    this.showAnswer = true;
    this.gameOver = true;
    this.guessResult = 'Here is the answer:';
  }

  get answerText(): string {
    if (!this.currentVerse) {
      return '';
    }
    return `${this.currentVerse.book} ${this.currentVerse.chapter}:${this.currentVerse.verse}`;
  }

  get fullVerseText(): string {
    if (!this.currentVerse) {
      return '';
    }
    return this.currentVerse.text;
  }
}
