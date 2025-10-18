import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import * as Papa from 'papaparse';
import { Verse } from './verse.model';

@Injectable({
  providedIn: 'root'
})
export class BibleService {
  private csvUrl = 'assets/net.csv';
  private verses$: Observable<Verse[]>;

  constructor(private http: HttpClient) {
    // Fetch and parse the CSV data once, then cache it for all subscribers.
    this.verses$ = this.http.get(this.csvUrl, { responseType: 'text' }).pipe(
      map(csvData => this.parseCsv(csvData)),
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

  private parseCsv(csvData: string): Verse[] {
    const parsedData = Papa.parse<any>(csvData, {
      header: true,
      skipEmptyLines: true,
      // The CSV has 5 metadata lines before the header row.
      // PapaParse's `header: true` will correctly use the 6th line as the header.
      // We just need to tell it to skip the first 5.
      preview: 0, // This is a bit of a hack to read all lines
      beforeFirstChunk: chunk => chunk.split('\n').slice(5).join('\n'),
      transformHeader: header => header.trim(),
    });

    if (parsedData.errors.length > 0) {
      console.error('CSV parsing errors:', parsedData.errors);
    }

    // Map the parsed data to our strongly-typed Verse interface
    return parsedData.data.map(row => ({
      verseId: Number(row['Verse ID']),
      bookName: row['Book Name'],
      bookNumber: Number(row['Book Number']),
      chapter: Number(row['Chapter']),
      verse: Number(row['Verse']),
      text: row['Text']
    }));
  }
}
