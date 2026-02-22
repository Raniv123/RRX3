// Core Types
export type Screen = 'LOGIN' | 'CONNECT' | 'GENDER_SELECTION' | 'PROTOCOL';
export type UserGender = 'MAN' | 'WOMAN';
export type Phase = 'ICE' | 'WARM' | 'HOT' | 'FIRE';
export type ActionType = 'SAY' | 'DO' | 'ORDER' | 'SURPRISE';
export type Language = 'french' | 'spanish' | 'italian' | 'english';
export type GameType = 'TRUTH' | 'DARE' | 'SEXY_CARD';

// Message Types
export interface Message {
  id: string;
  senderGender: UserGender;
  text: string;
  timestamp: number;
  deviceId: string;
  type: 'CHAT' | 'ACTION' | 'DIRECTIVE' | 'SURPRISE';
  language?: Language;
  translation?: string;
  payload?: any;
}

// Game Card — for truth/dare/sexy cards
export interface GameCard {
  type: GameType;
  title: string;
  content: string;      // The challenge or question
  duration?: number;    // Countdown seconds
  forWho: 'MAN' | 'WOMAN' | 'BOTH';
  intensity: number;    // 1-10
}

// AI Response — simplified with word chips
export interface AIResponse {
  readingBetweenLines?: string; // what the partner REALLY meant — subtext analysis
  strategicAdvice: {
    forMan: string;
    forWoman: string;
  };
  wordChips: string[];      // full sentences (6-12 words) to append to input
  actionTip: string;        // what to DO right now (behavior, not text to send)
  actionTips?: string[];    // 2 specific recommendations for the current stage
  gameCard?: GameCard;      // optional game trigger
  tension: number;          // 0-100
  phase: Phase;
  currentGoal: string;
}

// Tension State
export interface TensionState {
  level: number;
  phase: Phase;
  rate: number;
  goal: string;
}

// Scenario & Casting
export interface Scenario {
  id: string;
  title: string;
  location: string;
  atmosphere: string;
  roles: {
    MAN: {
      name: string;
      archetype: string;
      personality: string;
      accent?: Language;
      visualPrompt: string;
      forbidden?: string;
    };
    WOMAN: {
      name: string;
      archetype: string;
      personality: string;
      accent?: Language;
      visualPrompt: string;
      forbidden?: string;
    };
  };
  twists: string[];
  scenarios: string[];
  sceneKeywords?: {
    ICE: string;   // e.g. "elegant restaurant paris evening"
    WARM: string;  // e.g. "candlelit private garden night"
    HOT: string;   // e.g. "luxury hotel suite balcony"
    FIRE: string;  // e.g. "intimate bedroom candles dark sensual"
  };
  secrets?: {
    MAN: string;   // מה הכי מטריף את הגבר (האשה תראה)
    WOMAN: string; // מה הכי מטריפה את האשה (הגבר יראה)
  };
}

// Avatar Images (CGI generated or fallback)
export interface AvatarImages {
  MAN: string | null;
  WOMAN: string | null;
}

// Surprise System
export type SurpriseType = 'DARE' | 'GAME' | 'CHALLENGE' | 'TWIST';
export type SurpriseRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface Surprise {
  id: string;
  type: SurpriseType;
  title: string;
  description: string;
  forWho: 'MAN' | 'WOMAN' | 'BOTH';
  minTension: number;
  maxTension: number;
  rarity: SurpriseRarity;
  duration?: number;
  language?: Language;
}

// Gamification
export interface UserProgress {
  streak: number;
  totalSessions: number;
  favoriteScenarios: string[];
  achievements: string[];
  level: number;
  experience: number;
}
