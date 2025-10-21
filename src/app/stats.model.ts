export interface NormalModeStats {
  gamesPlayed: number;
  totalScore: number;
  totalStars: number;
}

export interface CustomModeStats {
  gamesPlayed: number;
  totalRounds: number;
  totalScore: number;
}

export interface MultiplayerModeStats extends CustomModeStats {}

export interface UserStats {
  normal?: NormalModeStats;
  custom?: CustomModeStats;
  multiplayer?: MultiplayerModeStats;
}
