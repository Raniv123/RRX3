import { Surprise } from '../types';

export const SURPRISES: Surprise[] = [
  // DARE - מעשים נועזים (COMMON)
  {
    id: 'dare-secret-touch',
    type: 'DARE',
    title: 'משימה: מגע סודי',
    description: 'תוך 30 שניות הבאים - גע/י במקום שהצד השני לא מצפה לו',
    forWho: 'BOTH',
    minTension: 30,
    maxTension: 60,
    rarity: 'COMMON',
    duration: 30
  },
  {
    id: 'dare-whisper',
    type: 'DARE',
    title: 'אתגר הלחישה',
    description: 'לחש/י משהו מלוכלך באוזן - רק לוחש/ת, לא אומר/ת בקול',
    forWho: 'BOTH',
    minTension: 40,
    maxTension: 70,
    rarity: 'COMMON'
  },
  {
    id: 'dare-slow-undress',
    type: 'DARE',
    title: 'הילוך איטי',
    description: 'הסר/י פריט בגד אחד - אבל לאט, מאוד לאט',
    forWho: 'BOTH',
    minTension: 50,
    maxTension: 80,
    rarity: 'RARE'
  },

  // GAME - משחקים (RARE)
  {
    id: 'game-yes-master',
    type: 'GAME',
    title: 'משחק כן אדוני',
    description: 'למשך דקה - צד אחד שואל, השני חייב/ת לענות "כן, אדוני/גברתי"',
    forWho: 'BOTH',
    minTension: 50,
    maxTension: 75,
    rarity: 'RARE',
    duration: 60
  },
  {
    id: 'game-freeze',
    type: 'GAME',
    title: 'משחק הקפאה',
    description: 'קפאו באמצע! אסור לזוז למשך 20 שניות - רק נשימות',
    forWho: 'BOTH',
    minTension: 45,
    maxTension: 70,
    rarity: 'COMMON',
    duration: 20
  },
  {
    id: 'game-mirror',
    type: 'GAME',
    title: 'חקה אותי',
    description: 'צד אחד עושה תנועה לאטית - השני מחקה בדיוק',
    forWho: 'BOTH',
    minTension: 35,
    maxTension: 65,
    rarity: 'COMMON',
    duration: 45
  },

  // CHALLENGE - אתגרים (COMMON)
  {
    id: 'challenge-language-switch',
    type: 'CHALLENGE',
    title: 'החלפת שפה',
    description: 'עברו לדבר רק בצרפתית/ספרדית/איטלקית למשך דקה',
    forWho: 'BOTH',
    minTension: 40,
    maxTension: 70,
    rarity: 'COMMON',
    duration: 60
  },
  {
    id: 'challenge-no-hands',
    type: 'CHALLENGE',
    title: 'בלי ידיים',
    description: 'אסור לגעת בידיים - רק שאר הגוף',
    forWho: 'BOTH',
    minTension: 55,
    maxTension: 80,
    rarity: 'RARE',
    duration: 90
  },
  {
    id: 'challenge-eyes-closed',
    type: 'CHALLENGE',
    title: 'עיניים עצומות',
    description: 'אחד סוגר עיניים - השני מפתיע',
    forWho: 'BOTH',
    minTension: 50,
    maxTension: 75,
    rarity: 'COMMON',
    duration: 60
  },

  // TWIST - עלילות פתע (EPIC)
  {
    id: 'twist-phone-ring',
    type: 'TWIST',
    title: 'צלצול טלפון',
    description: 'מישהו מתקשר! המשיכו תוך כדי שיחה שקטה',
    forWho: 'BOTH',
    minTension: 60,
    maxTension: 90,
    rarity: 'EPIC'
  },
  {
    id: 'twist-neighbor',
    type: 'TWIST',
    title: 'התראת שכן',
    description: 'שכן דופק על הדלת! תתנהגו נורמלי (אבל תמשיכו בחשאי)',
    forWho: 'BOTH',
    minTension: 65,
    maxTension: 90,
    rarity: 'EPIC'
  },
  {
    id: 'twist-lights-out',
    type: 'TWIST',
    title: 'חושך מוחלט',
    description: 'כבו את כל האורות - המשיכו בחושך',
    forWho: 'BOTH',
    minTension: 55,
    maxTension: 85,
    rarity: 'RARE'
  },

  // LEGENDARY - נדירים מאוד
  {
    id: 'legendary-roleswitch',
    type: 'TWIST',
    title: 'החלפת תפקידים',
    description: 'החליפו תפקידים! השולט נהיה נשלט והפוך',
    forWho: 'BOTH',
    minTension: 70,
    maxTension: 95,
    rarity: 'LEGENDARY'
  },
  {
    id: 'legendary-timer-challenge',
    type: 'CHALLENGE',
    title: 'נגד השעון',
    description: 'יש לכם רק 2 דקות להביא את השני לקצה - אחר כך תפסיקו',
    forWho: 'BOTH',
    minTension: 75,
    maxTension: 100,
    rarity: 'LEGENDARY',
    duration: 120
  }
];

// פונקציה לבחירת הפתעה מתאימה
export function getRandomSurprise(tensionLevel: number, messageCount: number, lastSurpriseTime: number): Surprise | null {
  const now = Date.now();
  const timeSinceLastSurprise = now - lastSurpriseTime;

  // בדיקות:
  // 1. עבר מספיק זמן מההפתעה האחרונה (לפחות 2 דקות)
  if (timeSinceLastSurprise < 120000) return null;

  // 2. מספיק הודעות (לפחות 10)
  if (messageCount < 10) return null;

  // 3. סיכוי אקראי (20%)
  if (Math.random() > 0.2) return null;

  // סינון הפתעות מתאימות
  const suitable = SURPRISES.filter(s =>
    tensionLevel >= s.minTension &&
    tensionLevel <= s.maxTension
  );

  if (suitable.length === 0) return null;

  // משקל לפי נדירות
  const weighted: Surprise[] = [];
  suitable.forEach(s => {
    const weight = s.rarity === 'COMMON' ? 10 :
                   s.rarity === 'RARE' ? 5 :
                   s.rarity === 'EPIC' ? 2 : 1;

    for (let i = 0; i < weight; i++) {
      weighted.push(s);
    }
  });

  return weighted[Math.floor(Math.random() * weighted.length)];
}
