export interface Verse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface Book {
  name: string;
  chapters: number[][];
  abbrev: string;
}
