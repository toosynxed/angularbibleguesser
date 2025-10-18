export interface GameModeStats {
  gamesPlayed: number;
  totalScore: number;
  totalStars: number;
  avgScore: number;
  avgStars: number;
}

export interface UserStats {
  uid: string;
  normal: GameModeStats;
  marathon: GameModeStats;
}
