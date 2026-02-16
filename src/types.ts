// Core Types
export type Screen = 'LOGIN' | 'CONNECT' | 'GENDER_SELECTION' | 'PROTOCOL';
export type UserGender = 'MAN' | 'WOMAN';
export type Phase = 'ICE' | 'WARM' | 'HOT' | 'FIRE';
export type ActionType = 'SAY' | 'DO' | 'ORDER' | 'SURPRISE';
export type Language = 'french' | 'spanish' | 'italian' | 'english';

// Message Types
export interface Message {
  id: string;
  senderGender: UserGender;
  text: string;
  timestamp: number;
  deviceId: string;
  type: 'CHAT' | 'ACTION' | 'DIRECTIVE' | 'SURPRISE';
  language?: Language;
  translation?: string;  // תרגום אם יש
  payload?: any;
}

// AI Director Types
export interface DirectorOption {
  label: string;          // מה המשתמש רואה (תיאור הפעולה)
  sendText: string;       // מה שנשלח לצד השני
  type: ActionType;
  intent: string;         // למה אנחנו עושים את זה
  intensity: number;      // 1-10
  language?: Language;
  translation?: string;   // תרגום אם זה בשפה זרה
  timer?: number;         // טיימר בשניות (אם רלוונטי)
  isDirty?: boolean;      // האם זה dirty talk
}

// Context Analysis
export interface ContextAnalysis {
  summary: string;                 // מה קורה עכשיו
  mood: string;                    // מצב הרוח הנוכחי
  readyForNext: boolean;           // האם מוכן לשלב הבא
  recommendation: string;          // מה לעשות עכשיו
  messageCount: number;            // כמה הודעות עד כה
  timeSinceStart: number;          // זמן מתחילת השיחה
}

// Progression Strategy
export interface ProgressionStrategy {
  currentPhase: Phase;
  shouldProgress: boolean | 'soon';
  reason: string;
  recommendedMessages: string;     // כמה הודעות עוד
  pacing: 'slow' | 'normal' | 'fast';
}

// AI Response
export interface AIResponse {
  contextAnalysis: ContextAnalysis;
  strategicAdvice: {
    forMan: string;
    forWoman: string;
  };
  options: DirectorOption[];
  pacing: ProgressionStrategy;
  tension: number;                  // 0-100
  phase: Phase;
  currentGoal: string;
}

// Tension State
export interface TensionState {
  level: number;          // 0-100
  phase: Phase;
  rate: number;           // מהירות עליה (כמה % לעלות בכל הודעה)
  goal: string;           // המטרה הנוכחית
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
      visualPrompt: string;  // לתמונת אווטר
      forbidden?: string;    // למה זה אסור לו (בגידה, אתיקה, וכו')
    };
    WOMAN: {
      name: string;
      archetype: string;
      personality: string;
      accent?: Language;
      visualPrompt: string;
      forbidden?: string;    // למה זה אסור לה
    };
  };
  twists: string[];        // עלילות פתע אפשריות
  scenarios: string[];     // תרחישים אפשריים
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
  minTension: number;      // מתי להפעיל (רמת tension מינימלית)
  maxTension: number;      // עד מתי (רמת tension מקסימלית)
  rarity: SurpriseRarity;
  duration?: number;       // כמה זמן (שניות) - אם רלוונטי
  language?: Language;     // אם ההפתעה כוללת שפה מסוימת
}

// Gamification
export interface UserProgress {
  streak: number;              // ימים רצופים
  totalSessions: number;       // סך הכל סשנים
  favoriteScenarios: string[];   // תרחישים מועדפים
  achievements: string[];      // הישגים
  level: number;               // רמה (1-100)
  experience: number;          // נקודות ניסיון
}
