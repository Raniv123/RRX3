// מנוע מתח - מנהל את רמת המתח ומחליט מתי לעבור שלב

import { Phase, TensionState } from '../types';

// חישוב השלב לפי רמת המתח
export function calculatePhase(tension: number): Phase {
  if (tension < 25) return 'ICE';
  if (tension < 50) return 'WARM';
  if (tension < 75) return 'HOT';
  return 'FIRE';
}

// חישוב קצב עליה (איטי/רגיל/מהיר)
export function calculateTensionRate(
  messageCount: number,
  timeSinceStart: number,
  currentTension: number,
  _targetPhase: Phase
): number {
  // ברירת מחדל - עלייה איטית ובהדרגה
  let baseRate = 2; // 2% לכל הודעה

  // אם יש הרבה הודעות אבל המתח נמוך מדי - האט
  if (messageCount > 15 && currentTension < 30) {
    baseRate = 1.5; // עליה איטית יותר
  }

  // אם השלב הנוכחי נמשך הרבה זמן - האץ קצת
  const minutesPerPhase = 10; // ממוצע רצוי לכל שלב
  const minutesSinceStart = timeSinceStart / 60000;

  if (minutesSinceStart > minutesPerPhase * 2 && currentTension < 50) {
    baseRate = 3; // קצב מוגבר
  }

  // אם כבר בשלב FIRE - לא להעלות יותר מדי מהר
  if (currentTension >= 75) {
    baseRate = 1; // עלייה איטית כדי לא לסיים מהר מדי
  }

  return baseRate;
}

// עדכון מצב המתח לפי הודעה חדשה
export function updateTension(
  currentState: TensionState,
  messageIntensity: number, // 1-10 עוצמת ההודעה
  messageCount: number,
  timeSinceStart: number
): TensionState {
  const rate = calculateTensionRate(
    messageCount,
    timeSinceStart,
    currentState.level,
    currentState.phase
  );

  // חישוב עלייה - בהתאם לעוצמת ההודעה
  const increase = rate * (messageIntensity / 5); // נורמליזציה

  // עדכן רמה חדשה (מקסימום 100)
  const newLevel = Math.min(100, currentState.level + increase);

  // חישוב שלב חדש
  const newPhase = calculatePhase(newLevel);

  // מטרה משתנה לפי השלב
  const goals: Record<Phase, string> = {
    ICE: 'לבנות אמון ונוחות, מגע עדין ראשוני',
    WARM: 'להתחמם, מגע אינטימי יותר, ביטויים ראשונים',
    HOT: 'להעז, פעולות נועזות, dirty talk, אוראלי עם טיימרים',
    FIRE: 'עוצמה מקסימלית, ביטויים מלוכלכים, פעולות קיצוניות'
  };

  return {
    level: Math.round(newLevel),
    phase: newPhase,
    rate,
    goal: goals[newPhase]
  };
}

// בדיקה אם מוכן לעבור לשלב הבא
export function shouldProgressPhase(
  currentTension: number,
  currentPhase: Phase,
  messageCount: number,
  timeSinceLastPhaseChange: number
): { should: boolean; reason: string } {
  const minutesSinceChange = timeSinceLastPhaseChange / 60000;

  // כל שלב צריך לפחות 5 דקות ו-8 הודעות
  const minMessages = 8;
  const minMinutes = 5;

  switch (currentPhase) {
    case 'ICE':
      if (currentTension >= 25 && messageCount >= minMessages && minutesSinceChange >= minMinutes) {
        return { should: true, reason: 'נבנה מספיק אמון, מוכנים להתחמם' };
      }
      return { should: false, reason: 'עדיין בונים אמון, צריך עוד זמן' };

    case 'WARM':
      if (currentTension >= 50 && messageCount >= minMessages + 5 && minutesSinceChange >= minMinutes) {
        return { should: true, reason: 'המתח עולה, אפשר להעז יותר' };
      }
      return { should: false, reason: 'המשיכו להתחמם, אל תמהרו' };

    case 'HOT':
      if (currentTension >= 75 && messageCount >= minMessages + 10 && minutesSinceChange >= minMinutes) {
        return { should: true, reason: 'המתח בשיא, זמן לעוצמה מקסימלית' };
      }
      return { should: false, reason: 'תהנו מהשלב, אין צורך למהר' };

    case 'FIRE':
      // כבר בשלב הגבוה ביותר
      return { should: false, reason: 'כבר בעוצמה מקסימלית, המשיכו ליהנות' };
  }
}

// אתחול מצב מתח ראשוני
export function initTensionState(): TensionState {
  return {
    level: 0,
    phase: 'ICE',
    rate: 2,
    goal: 'לבנות אמון ונוחות, מגע עדין ראשוני'
  };
}
