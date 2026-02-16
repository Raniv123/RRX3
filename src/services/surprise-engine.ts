// מנוע הפתעות - מחליט מתי ואיזו הפתעה להציג

import { Surprise, SurpriseRarity } from '../types';
import { SURPRISES, getRandomSurprise } from '../data/surprises';

// מצב מעקב אחר הפתעות
interface SurpriseTracking {
  lastSurpriseTime: number;
  totalSurprises: number;
  surpriseHistory: string[]; // IDs של הפתעות שכבר הוצגו
}

// אתחול מעקב
export function initSurpriseTracking(): SurpriseTracking {
  return {
    lastSurpriseTime: 0,
    totalSurprises: 0,
    surpriseHistory: []
  };
}

// בדוק אם זמן להפעיל הפתעה
export function shouldTriggerSurprise(
  tensionLevel: number,
  messageCount: number,
  tracking: SurpriseTracking
): boolean {
  const now = Date.now();
  const timeSinceLastSurprise = now - tracking.lastSurpriseTime;

  // תנאים בסיסיים:
  // 1. עברו לפחות 2 דקות מההפתעה האחרונה
  if (timeSinceLastSurprise < 120000) return false;

  // 2. לפחות 10 הודעות בסך הכל
  if (messageCount < 10) return false;

  // 3. רמת מתח מינימלית של 30%
  if (tensionLevel < 30) return false;

  // 4. סיכוי אקראי - ככל שעברו יותר הודעות, הסיכוי גדל
  const baseChance = 0.15; // 15% סיכוי בסיסי
  const bonusChance = Math.min(0.25, (messageCount - 10) * 0.01); // עד 25% בונוס
  const totalChance = baseChance + bonusChance;

  return Math.random() < totalChance;
}

// בחר הפתעה מתאימה
export function selectSurprise(
  tensionLevel: number,
  messageCount: number,
  tracking: SurpriseTracking
): Surprise | null {
  // מצא הפתעות מתאימות לפי רמת המתח
  const suitable = SURPRISES.filter(s =>
    tensionLevel >= s.minTension &&
    tensionLevel <= s.maxTension &&
    !tracking.surpriseHistory.includes(s.id) // עדיין לא הוצגה
  );

  if (suitable.length === 0) {
    // אם כל ההפתעות כבר הוצגו - אפשר לחזור על הפתעות ישנות
    return getRandomSurprise(tensionLevel, messageCount, tracking.lastSurpriseTime);
  }

  // חישוב משקולות לפי נדירות
  const weighted: Surprise[] = [];
  suitable.forEach(s => {
    const weight = getWeight(s.rarity);
    for (let i = 0; i < weight; i++) {
      weighted.push(s);
    }
  });

  // בחירה אקראית עם משקולות
  const selected = weighted[Math.floor(Math.random() * weighted.length)];

  return selected;
}

// משקל לפי נדירות
function getWeight(rarity: SurpriseRarity): number {
  switch (rarity) {
    case 'COMMON': return 10;
    case 'RARE': return 5;
    case 'EPIC': return 2;
    case 'LEGENDARY': return 1;
  }
}

// עדכון מעקב אחרי הפתעה
export function updateSurpriseTracking(
  tracking: SurpriseTracking,
  surpriseId: string
): SurpriseTracking {
  return {
    lastSurpriseTime: Date.now(),
    totalSurprises: tracking.totalSurprises + 1,
    surpriseHistory: [...tracking.surpriseHistory, surpriseId]
  };
}

// קבל הפתעה לפי ID (לשימוש חוזר)
export function getSurpriseById(id: string): Surprise | undefined {
  return SURPRISES.find(s => s.id === id);
}

// סינון הפתעות לפי סוג (לתצוגה למשתמש)
export function getSurprisesByType(type: string) {
  return SURPRISES.filter(s => s.type === type);
}

// קבל את כל ההפתעות האפשריות לרמת מתח נוכחית
export function getAvailableSurprises(tensionLevel: number): Surprise[] {
  return SURPRISES.filter(s =>
    tensionLevel >= s.minTension &&
    tensionLevel <= s.maxTension
  );
}

// נקה היסטוריה (אם רוצים לאפס את ההפתעות)
export function resetSurpriseHistory(tracking: SurpriseTracking): SurpriseTracking {
  return {
    ...tracking,
    surpriseHistory: []
  };
}
