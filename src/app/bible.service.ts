import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Book, Verse } from './bible';

@Injectable({
  providedIn: 'root'
})
export class BibleService {
  private bibleData$: Observable<{ books: Book[], verses: Verse[] }>;

  constructor(private http: HttpClient) {
    this.bibleData$ = this.http.get<{ books: Book[], verses: Verse[] }>('assets/bible.json');
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

  getMaskedVerseText(text: string): string {
    const words = text.split(' ');
    const wordCount = words.length;
    // Mask roughly 1/3 of the words, but at least one.
    const wordsToMask = Math.max(1, Math.floor(wordCount / 3));
    const indicesToMask = new Set<number>();
    while (indicesToMask.size < wordsToMask) {
      indicesToMask.add(Math.floor(Math.random() * wordCount));
    }
    return words.map((word, index) => indicesToMask.has(index) ? '_____' : word).join(' ');
  }
}
