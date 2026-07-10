export interface NormalModeStats {
  gamesPlayed: number;
  totalScore: number; // We'll store totals and calculate averages on the client
  totalStars: number;
}

export interface CustomModeStats {
  gamesPlayed: number;
  totalRounds: number;
  totalScore: number; // This is total score across all rounds
}

export interface MultiplayerModeStats {
  gamesPlayed: number;
  totalRounds: number;
  totalScore: number;
}

export interface UserStats {
  normal?: NormalModeStats;
  custom?: CustomModeStats;
  multiplayer?: MultiplayerModeStats;
}
