export interface Verse {
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface Guess {
  book: string;
  chapter: number;
  verse: number;
}

export interface GameResult {
  verse: Verse;
  guess: Guess | null;
  score: number;
  stars: number;
  isBookCorrect: boolean;
  isChapterCorrect: boolean;
  isVerseCorrect: boolean;
}

export interface GameState {
  mode: 'normal' | 'custom' | 'create' | 'shared' | 'multiplayer';
  seed: string;
  results: GameResult[];
}

export interface Player {
  uid: string;
  displayName: string;
  isHost: boolean;
}

export interface GameSettings {
  rounds: number;
  timeLimit: number;
  contextSize: number;
  books: string[];
}

export interface PlayerResult {
  verse: Verse;
  guess: Guess | null;
  score: number;
  stars: number;
  isBookCorrect: boolean;
  isChapterCorrect: boolean;
  isVerseCorrect: boolean;
}

export interface Lobby {
  gameCode: string;
  hostId: string;
  players: { [uid: string]: Player };
  gameSettings: GameSettings;
  gameStarted: boolean;
  currentRound: number;
  verses: Verse[];
  playerResults: { [uid: string]: PlayerResult[] };
  seed?: string;
}
