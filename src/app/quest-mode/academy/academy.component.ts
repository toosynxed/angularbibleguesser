import { Component, OnInit } from '@angular/core';
import { Observable, of, forkJoin, throwError } from 'rxjs';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import { ScrollsService } from '../../scrolls.service';
import { first, map, switchMap } from 'rxjs/operators';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BibleService } from '../../bible.service';
import { Verse } from '../../verse.model';
import {
  ACADEMY_VIDEO_SETS,
  AcademyVideoSet,
  DEFAULT_ACADEMY_VIDEO_SET_ID,
  getAcademyVideoSetById
} from '../../academy-video-sets.config';

type AcademyStage = 'cover' | 'video' | 'quiz' | 'results';

interface AcademyQuizRound {
  verse: Verse;
  contextVerses: Verse[];
  options: string[];
  correctAnswer: string;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  score: number;
  startedAtMs: number;
}

// Academy is a single page (/academy) that walks the user through four
// in-page states, all without ever navigating away:
//   'cover'   - browse sets in the sidebar; main area shows a cover image.
//   'video'   - a set was picked: main area shows its BibleProject embed
//               (or a "no video" fallback); the sidebar becomes a greyed-out
//               preview of the coming multiple-choice rounds until the user
//               skips/continues.
//   'quiz'    - self-contained multiple-choice quiz (5 rounds) rendered in
//               the sidebar, which expands to become the main interaction
//               area while the video shrinks alongside it (see the
//               .quiz-active layout rules in academy.component.css).
//   'results' - a local score summary; no navigation to /results, since
//               this multiple-choice format doesn't match that page's
//               typed-guess data shape.
// This intentionally does not reuse GameComponent: the interaction model
// (multiple choice, no typed input) is different enough that forcing it
// through the existing single-verse-guess game runner would be riskier
// than a small self-contained quiz here.
@Component({
  selector: 'app-shop-page',
  templateUrl: './academy.component.html',
  styleUrls: ['./academy.component.css']
})
export class academyComponent implements OnInit {
  private static readonly QUIZ_CONTEXT_SIZE = 2;

  user$!: Observable<firebase.User | null>;
  showCustomization = false;
  userScrolls$!: Observable<number | undefined>;
  readonly videoSets: AcademyVideoSet[] = ACADEMY_VIDEO_SETS;
  readonly lockedPlaceholders = [1, 2, 3, 4];

  stage: AcademyStage = 'cover';
  selectedSet: AcademyVideoSet | undefined = DEFAULT_ACADEMY_VIDEO_SET_ID
    ? getAcademyVideoSetById(DEFAULT_ACADEMY_VIDEO_SET_ID)
    : ACADEMY_VIDEO_SETS[0];
  safeEmbedUrl: SafeResourceUrl | null = null;

  quizRounds: AcademyQuizRound[] = [];
  currentRoundIndex = 0;
  quizTotalScore = 0;
  isLoadingQuiz = false;
  quizError: string | null = null;

  private allVerses: Verse[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private scrollsService: ScrollsService,
    private sanitizer: DomSanitizer,
    private bibleService: BibleService
  ) { }

  ngOnInit(): void {
    this.user$ = this.authService.user$;
    this.userScrolls$ = this.user$.pipe(
      switchMap((user) => user?.uid ? this.scrollsService.getUserScrolls(user.uid) : of(undefined))
    );
  }

  get currentRound(): AcademyQuizRound | null {
    return this.quizRounds[this.currentRoundIndex] ?? null;
  }

  get maxPossibleScore(): number {
    return this.quizRounds.length * 100;
  }

  // Picking a set from the sidebar goes straight into video mode for it -
  // there is no separate "confirm" step, matching the required flow
  // (select -> video immediately, sidebar locks).
  selectSet(set: AcademyVideoSet): void {
    this.selectedSet = set;
    this.quizError = null;
    this.quizRounds = [];
    this.currentRoundIndex = 0;
    this.quizTotalScore = 0;
    this.safeEmbedUrl = set.embedUrl
      ? this.sanitizer.bypassSecurityTrustResourceUrl(set.embedUrl)
      : null;
    this.stage = 'video';
  }

  // Because iframe playback completion cannot be reliably detected across
  // platforms without a platform-specific player API, Skip/Continue always
  // shows the "recommended to finish" warning rather than trying to guess
  // whether playback finished.
  onSkipOrContinue(): void {
    const proceedAnyway = window.confirm(
      'It is recommended that you finish the video before playing the set. Do you still want to continue?'
    );
    if (!proceedAnyway) {
      return; // Stay in video mode.
    }

    this.beginQuiz();
  }

  selectAnswer(option: string): void {
    const round = this.currentRound;
    if (!round || round.selectedAnswer) {
      return; // Already answered this round.
    }

    const elapsedSeconds = (Date.now() - round.startedAtMs) / 1000;
    round.selectedAnswer = option;
    round.isCorrect = option === round.correctAnswer;
    round.score = this.computeRoundScore(round.isCorrect, elapsedSeconds, this.selectedSet?.timeLimit ?? 0);
    this.quizTotalScore += round.score;
  }

  goToNextRound(): void {
    if (this.currentRoundIndex < this.quizRounds.length - 1) {
      this.currentRoundIndex++;
      const round = this.currentRound;
      if (round) {
        round.startedAtMs = Date.now();
      }
    } else {
      this.stage = 'results';
    }
  }

  resetToSelection(): void {
    this.stage = 'cover';
    this.safeEmbedUrl = null;
    this.quizRounds = [];
    this.currentRoundIndex = 0;
    this.quizTotalScore = 0;
    this.quizError = null;
  }

  private beginQuiz(): void {
    if (!this.selectedSet) {
      return;
    }

    if (!this.selectedSet.verseIds || this.selectedSet.verseIds.length === 0) {
      alert('This set\'s verses have not been configured yet. Please check back later!');
      return;
    }

    this.stage = 'quiz';
    this.loadQuizRounds(this.selectedSet);
  }

  private loadQuizRounds(set: AcademyVideoSet): void {
    this.quizError = null;
    this.isLoadingQuiz = true;

    this.bibleService.getVerses().pipe(first()).subscribe(allVerses => {
      this.allVerses = allVerses;

      const verseRequests = set.verseIds.map(id => this.bibleService.getVerseById(id));
      forkJoin(verseRequests).pipe(
        switchMap(verses => {
          if (verses.some(v => !v)) {
            return throwError(() => new Error('Missing verse text for one or more curated verseIds.'));
          }
          const confirmedVerses = verses as Verse[];
          const contextRequests = confirmedVerses.map(v =>
            this.bibleService.getVerseWithContext(v, academyComponent.QUIZ_CONTEXT_SIZE)
          );
          return forkJoin(contextRequests).pipe(
            map(contexts => ({ verses: confirmedVerses, contexts }))
          );
        })
      ).subscribe({
        next: ({ verses, contexts }) => {
          this.quizRounds = verses.map((verse, i) => this.buildRound(verse, contexts[i]));
          this.currentRoundIndex = 0;
          this.quizTotalScore = 0;
          this.isLoadingQuiz = false;
        },
        error: () => {
          this.isLoadingQuiz = false;
          this.quizError = 'Sorry, we couldn\'t load the verses for this set. Please try again later.';
        }
      });
    });
  }

  private buildRound(verse: Verse, contextVerses: Verse[]): AcademyQuizRound {
    const correctAnswer = this.formatReference(verse);
    const distractors = this.pickDistractorReferences(verse, 3);
    return {
      verse,
      contextVerses,
      options: this.shuffle([correctAnswer, ...distractors]),
      correctAnswer,
      selectedAnswer: null,
      isCorrect: null,
      score: 0,
      startedAtMs: Date.now()
    };
  }

  // Plausible incorrect references: real, valid verses from the shared
  // corpus (never invented), simply excluding the correct verse itself.
  private pickDistractorReferences(correctVerse: Verse, count: number): string[] {
    const correctRef = this.formatReference(correctVerse);
    const pool = this.allVerses.filter(v => v.verseId !== correctVerse.verseId);
    const usedRefs = new Set<string>([correctRef]);
    const results: string[] = [];

    let attempts = 0;
    while (results.length < count && attempts < pool.length * 2 && pool.length > 0) {
      attempts++;
      const candidate = pool[Math.floor(Math.random() * pool.length)];
      const ref = this.formatReference(candidate);
      if (!usedRefs.has(ref)) {
        usedRefs.add(ref);
        results.push(ref);
      }
    }

    return results;
  }

  // Simple, explainable scoring: a correct answer always earns at least 50
  // points, plus up to 50 bonus points for answering quickly relative to
  // the set's time limit (untimed sets just award the full 100).
  private computeRoundScore(isCorrect: boolean, elapsedSeconds: number, timeLimit: number): number {
    if (!isCorrect) {
      return 0;
    }
    if (!timeLimit || timeLimit <= 0) {
      return 100;
    }
    const remainingFraction = Math.max(0, 1 - elapsedSeconds / timeLimit);
    return Math.round(50 + 50 * remainingFraction);
  }

  private formatReference(verse: Verse): string {
    return `${verse.bookName} ${verse.chapter}:${verse.verse}`;
  }

  private shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  confirmGoHome(): void {
    this.router.navigate(['/']);
  }

  backToMap(): void {
    this.router.navigate(['../quest']);
    console.log('Navigated to: /quest');
  }
}
