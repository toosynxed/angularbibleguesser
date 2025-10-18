import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { Book, Verse } from './bible';
import { shareReplay, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BibleService {
  private verses$: Observable<Verse[]>;

  constructor(private http: HttpClient) {
    // Cache the data so we don't re-fetch the JSON file on every call
    this.verses$ = this.http.get<any[]>('assets/bible.json').pipe(
      map(verses => {
        if (!verses || verses.length === 0) {
          return [];
        }

        // Dynamically find the correct property keys from the first verse object.
        const firstVerse = verses[0];
        const bookKey = Object.keys(firstVerse).find(k => k.toLowerCase().includes('book')) || 'book';
        const chapterKey = Object.keys(firstVerse).find(k => k.toLowerCase().includes('chapter')) || 'chapter';
        const verseKey = Object.keys(firstVerse).find(k => k.toLowerCase().includes('verse')) || 'verse';
        const textKey = Object.keys(firstVerse).find(k => k.toLowerCase().includes('text')) || 'text';

        // Map all verses using the discovered keys.
        return verses.map(v => {
          return {
            book: v[bookKey],
            chapter: v[chapterKey],
            verse: v[verseKey],
            text: v[textKey]
          } as Verse;
        });
      }),
      shareReplay(1)
    );
  }

  getBooks(): Observable<Book[]> {
    return this.getVerses().pipe(
      map(verses => {
        const bookNames = [...new Set(verses.map(v => v.book))];
        return bookNames.map(name => ({
          name: name,
          chapters: [], // This would require more processing to populate accurately
          abbrev: ''    // This would also require a mapping or more data
        }));
      })
    );
  }

  getVerses(): Observable<Verse[]> {
    return this.verses$;
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
