import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Book, Verse } from './bible';
import { shareReplay, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BibleService {
  private bibleData$: Observable<{ books: Book[], verses: Verse[] }>;

  constructor(private http: HttpClient) {
    // Cache the data so we don't re-fetch the JSON file on every call
    this.bibleData$ = this.http.get<{ books: Book[], verses: Verse[] }>('assets/bible.json').pipe(
      shareReplay(1)
    );
  }

  getBooks(): Observable<Book[]> {
    return this.bibleData$.pipe(map(data => data.books));
  }

  getVerses(): Observable<Verse[]> {
    return this.bibleData$.pipe(map(data => data.verses));
  }

  getRandomVerse(): Observable<Verse> {
    return this.getVerses().pipe(
      map(verses => {
        const randomIndex = Math.floor(Math.random() * verses.length);
        return verses[randomIndex];
      })
    );
  }

  getVerseWithContext(targetVerse: Verse, contextSize: number): Observable<string> {
    return this.getVerses().pipe(
      map(verses => {
        const targetIndex = verses.findIndex(v =>
          v.book === targetVerse.book && v.chapter === targetVerse.chapter && v.verse === targetVerse.verse
        );

        if (targetIndex === -1) return targetVerse.text;

        const startIndex = Math.max(0, targetIndex - contextSize);
        const endIndex = Math.min(verses.length - 1, targetIndex + contextSize);

        let fullText = '';
        for (let i = startIndex; i <= endIndex; i++) {
          fullText += verses[i].text + ' ';
        }
        return fullText.trim();
      })
    );
  }

  getVerseIndex(targetVerse: Verse): Observable<number> {
    return this.getVerses().pipe(
      map(verses => {
        if (!targetVerse) return -1;
        return verses.findIndex(v =>
          v.book === targetVerse.book && v.chapter === targetVerse.chapter && v.verse === targetVerse.verse
        );
      })
    );
  }

  normalizeBookName(name: string): string {
    return name.toLowerCase().replace(/ /g, '');
  }

  parseVerseReference(ref: string): { book: string, chapter: number, verse: number } | null {
    // Regex to capture book name, chapter, and verse. Handles book names with spaces and numbers.
    const regex = /^(\d?\s?[a-zA-Z\s]+)\s(\d+):(\d+)$/;
    const match = ref.trim().match(regex);

    if (!match) return null;

    const bookName = match[1].trim();
    const chapter = parseInt(match[2], 10);
    const verse = parseInt(match[3], 10);

    return { book: bookName, chapter, verse };
  }
}
