export interface GameModeStats {
  gamesPlayed: number;
  totalScore: number;
}

export interface NormalModeStats extends GameModeStats {
  totalStars: number;
}

export interface CustomModeStats extends GameModeStats {
  totalRounds: number;
}

export interface MultiplayerModeStats extends GameModeStats {
  totalRounds: number;
}

export interface UserStats {
  normal?: NormalModeStats;
  custom?: CustomModeStats;
  multiplayer?: MultiplayerModeStats;
  daily?: DailyModeStats;
}

export interface DailyModeStats {
  currentStreak: number;
  highestStreak: number;
  completionHistory: { [date: string]: boolean }; // e.g. { '2024-05-21': true }
  totalScore: number;
  totalStars: number;
  totalRoundsPlayed: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  displayName_lowercase: string;
  hasSeenMultiplayerTutorial?: boolean;
}

export interface UserProfileWithStats extends UserProfile {
  stats: UserStats | undefined;
}
