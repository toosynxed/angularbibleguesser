import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay, of, switchMap, first } from 'rxjs';
import * as Papa from 'papaparse';
import { Verse } from './verse.model';

@Injectable({
  providedIn: 'root'
})
export class BibleService {
  private csvUrl = 'assets/net.csv';
  private verses$: Observable<Verse[]>;

  // For book name normalization
  private bookNameMap: Map<string, string> = new Map();
  private books: string[] = [];
  private allVerses: Verse[] = [];


  constructor(private http: HttpClient) {
    // Fetch and parse the CSV data once, then cache it for all subscribers.
    this.verses$ = this.http.get(this.csvUrl, { responseType: 'text' }).pipe(
      map(csvData => this.parseCsv(csvData)),
      map(verses => {
        this.allVerses = verses; // Store the verses locally for synchronous access
        return this.initializeBookMap(verses);
      }),
      shareReplay(1) // Cache the result to avoid re-fetching and re-parsing
    );
  }

  /**
   * Fetches and parses the Bible verses from the CSV file.
   * @returns An observable array of Verse objects.
   */
  getVerses(): Observable<Verse[]> {
    return this.verses$;
  }

  private initializeBookMap(verses: Verse[]): Verse[] {
    const bookSet = new Set<string>();
    verses.forEach(verse => {
      bookSet.add(verse.bookName);
    });
    this.books = [...bookSet];

    this.books.forEach(bookName => {
      const normalized = this.normalizeBookNameInternal(bookName);
      this.bookNameMap.set(normalized, bookName);

      // Handle common variations like "1 John" vs "First John"
      if (bookName.match(/^\d\s/)) { // e.g., "1 John"
        const parts = bookName.split(' ');
        const num = parts[0];
        const name = parts.slice(1).join(' ');
        let word = '';
        if (num === '1') word = 'first';
        if (num === '2') word = 'second';
        if (num === '3') word = 'third';
        if (word) {
          this.bookNameMap.set(this.normalizeBookNameInternal(`${word} ${name}`), bookName);
        }
      }
    });
    return verses;
  }

  private normalizeBookNameInternal(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  normalizeBookName(name: string): string | undefined {
    const normalized = this.normalizeBookNameInternal(name);
    return this.bookNameMap.get(normalized);
  }

  parseVerseReference(ref: string): { book: string, chapter: number, verse: number } | null {
    // Regex to capture book name, chapter, and verse
    const regex = /^\s*([1-3]?\s*[a-zA-Z]+(?:\s*[a-zA-Z]+)*)\s*(\d+)(?::(\d+))?\s*$/;
    const match = ref.match(regex);

    if (!match) {
      return null;
    }

    const bookInput = match[1].trim();
    const chapter = parseInt(match[2], 10);
    const verse = match[3] ? parseInt(match[3], 10) : 1; // Default to verse 1 if not specified

    const book = this.normalizeBookName(bookInput);

    if (!book) {
      return null; // Book not found
    }

    return { book, chapter, verse };
  }

  getVerseIndex(verseRef: { book: string, chapter: number, verse: number }): Observable<number> {
    return this.getVerses().pipe(
      // Use `first()` to ensure the observable completes after emitting the verses array once.
      first(),
      map(verses =>
        verses.findIndex(v =>
          v.bookName === verseRef.book &&
          v.chapter === verseRef.chapter &&
          v.verse === verseRef.verse
        )
      )
    );
  }

  getVerseWithContext(verse: Verse, contextSize: number): Observable<Verse[]> {
    return this.getVerseIndex({ book: verse.bookName, chapter: verse.chapter, verse: verse.verse }).pipe(
      map(verseIndex => {
        if (verseIndex === -1) {
          return [verse]; // Return just the single verse if not found in the main list
        }
        const startIndex = Math.max(0, verseIndex - contextSize);
        // Use the locally cached `allVerses` array for synchronous operations
        const endIndex = Math.min(this.allVerses.length - 1, verseIndex + contextSize);

        return this.allVerses.slice(startIndex, endIndex + 1);
      })
    );
  }

  private parseCsv(csvData: string): Verse[] {
    const parsedData = Papa.parse<any>(csvData, {
      header: true,
      skipEmptyLines: true,
      // The CSV has 5 metadata lines before the header row.
      // PapaParse's `header: true` will correctly use the 6th line as the header.
      // We will find the header row dynamically to make it more robust.
      beforeFirstChunk: chunk => {
        const lines = chunk.split('\n');
        // Find the header row index by looking for the "Verse ID" column
        const headerIndex = lines.findIndex(line => line.startsWith('"Verse ID"'));
        if (headerIndex !== -1) {
          return lines.slice(headerIndex).join('\n');
        }
        return chunk; // Fallback in case the header isn't found
      },
      transformHeader: header => header.trim(),
    });

    if (parsedData.errors.length > 0) {
      console.error('CSV parsing errors:', parsedData.errors);
    }

    // Map the parsed data to our strongly-typed Verse interface
    return parsedData.data.map(row => {
      return {
        verseId: Number(row['Verse ID']),
        bookName: row['Book Name'],
        bookNumber: Number(row['Book Number']),
        chapter: Number(row['Chapter']),
        verse: Number(row['Verse']),
        text: row['Text']
      };
    }).filter(v => v.verseId && v.bookName && v.text); // Filter out any potentially empty/invalid rows
  }
}
