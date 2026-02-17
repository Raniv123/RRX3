// Intimacy Missions — מיסיות אינטימיות לפי שלב

export interface IntimacyChoice {
  id: string;
  label: string;
  description: string;
  emoji: string;
}

export interface IntimacyMission {
  id: string;
  phase: 'WARM' | 'HOT' | 'FIRE';
  minTension: number;
  title: string;
  instruction: string;     // הוראה קצרה
  forWho: 'MAN' | 'WOMAN' | 'BOTH';
  duration?: number;       // שניות לביצוע
  choices?: IntimacyChoice[];  // אם יש בחירה
}

// ===== WARM — מגע ראשוני, קרבה, נשיקה =====
export const WARM_MISSIONS: IntimacyMission[] = [
  {
    id: 'first-touch',
    phase: 'WARM',
    minTension: 28,
    title: 'מגע ראשון',
    instruction: 'הנח/י יד על ידו/ידה לאט — בלי מילים. תחזיק/י שניה שלמה.',
    forWho: 'BOTH',
    duration: 30
  },
  {
    id: 'first-kiss',
    phase: 'WARM',
    minTension: 42,
    title: 'נשיקה ראשונה',
    instruction: 'נשיקה עדינה אחת — שפתיים בלבד, ממושכת. אל תזוז/י.',
    forWho: 'BOTH',
    duration: 20
  },
  {
    id: 'deep-kiss',
    phase: 'WARM',
    minTension: 48,
    title: 'נשיקה עמוקה',
    instruction: 'נשיקה עמוקה ומוצלבת — ידיים על הלחיים, קחו את הזמן.',
    forWho: 'BOTH',
    duration: 40
  }
];

// ===== HOT — גוף, עירום, אוראלי מתחיל =====
export const HOT_MISSIONS: IntimacyMission[] = [
  {
    id: 'undress',
    phase: 'HOT',
    minTension: 52,
    title: 'פשטו לאט',
    instruction: 'הסר/י פריט אחד ממנה/ממנו — לאט מאוד, בלי להזדרז.',
    forWho: 'BOTH',
    duration: 30
  },
  {
    id: 'body-kiss',
    phase: 'HOT',
    minTension: 60,
    title: 'נשיקות על הגוף',
    instruction: 'נשיקות על הצוואר ← כתפיים ← חזה. לאט. ממושך. בלי קפיצות.',
    forWho: 'BOTH',
    duration: 60
  },
  {
    id: 'oral-start',
    phase: 'HOT',
    minTension: 68,
    title: 'אוראלי — התחלה',
    instruction: 'התחל/י בעדינות — לשון ושפתיים, קצב איטי, קשיב/י לתגובות.',
    forWho: 'BOTH',
    duration: 90,
    choices: [
      {
        id: 'classic-oral',
        label: 'קלאסי',
        description: 'קצב איטי ועמוק, ידיים על הירכיים',
        emoji: '💋'
      },
      {
        id: '69',
        label: '69',
        description: 'שניהם בו-זמנית — גוף על גוף',
        emoji: '🔄'
      },
      {
        id: 'hands-too',
        label: 'ידיים + פה',
        description: 'שפתיים ויד יחד, קצב מסונכרן',
        emoji: '✋'
      }
    ]
  }
];

// ===== FIRE — אוראלי מלא, בחירות מתקדמות, חדירה =====
export const FIRE_MISSIONS: IntimacyMission[] = [
  {
    id: 'oral-deep',
    phase: 'FIRE',
    minTension: 75,
    title: 'אוראלי מלא',
    instruction: 'בחרו את הסגנון שלכם — קחו את הזמן, אין למהר.',
    forWho: 'BOTH',
    duration: 120,
    choices: [
      {
        id: '69-deep',
        label: '69',
        description: 'גוף על גוף, שניהם נותנים ומקבלים בו-זמנית',
        emoji: '🔄'
      },
      {
        id: 'suck-perineum',
        label: 'שאיבה + פרינאום',
        description: 'שאיבה עדינה + לחיצה קצבית על הפרינאום בזמן',
        emoji: '💫'
      },
      {
        id: 'full-deep',
        label: 'עמוק ואיטי',
        description: 'כניסה עמוקה, ידיים על הירכיים, קצב גלי איטי',
        emoji: '🌊'
      },
      {
        id: 'tongue-circle',
        label: 'עיגולים עם הלשון',
        description: 'עיגולים קטנים ולחץ נקודתי, עלייה הדרגתית בקצב',
        emoji: '⭕'
      }
    ]
  },
  {
    id: 'pre-entry',
    phase: 'FIRE',
    minTension: 85,
    title: 'לפני החדירה',
    instruction: 'ודאו שהיא רטובה לחלוטין — הכנה מלאה לפני שממשיכים.',
    forWho: 'MAN',
    duration: 60,
    choices: [
      {
        id: 'fingers-first',
        label: 'אצבעות תחילה',
        description: 'אחת ↔ שתיים, קצב G-spot',
        emoji: '✌️'
      },
      {
        id: 'oral-then-enter',
        label: 'אוראלי ← חדירה',
        description: 'סיים עם האוראלי ועבור ישירות',
        emoji: '→'
      },
      {
        id: 'toys-prep',
        label: 'וייבריישן קצר',
        description: 'הכנה עם ויברטור קטן על הדגדגן',
        emoji: '⚡'
      }
    ]
  },
  {
    id: 'penetration',
    phase: 'FIRE',
    minTension: 88,
    title: 'חדירה — בחרו תנוחה',
    instruction: 'כניסה ראשונה לאטאאאא — עצרו, תנשמו, תהנו מהרגע.',
    forWho: 'MAN',
    duration: 0,
    choices: [
      {
        id: 'missionary',
        label: 'מיסיונר',
        description: 'פנים מול פנים, קשר עין, ידיים מסביב',
        emoji: '👁️'
      },
      {
        id: 'doggy',
        label: 'מאחור',
        description: 'היא מתכופפת, הוא שולט בקצב',
        emoji: '🔥'
      },
      {
        id: 'cowgirl',
        label: 'היא למעלה',
        description: 'היא שולטת בעומק ובקצב',
        emoji: '👑'
      },
      {
        id: 'spoon',
        label: 'כפיות',
        description: 'מהצד, אינטימי ועדין, ידיו מחבקות',
        emoji: '🤝'
      }
    ]
  }
];

export const ALL_MISSIONS = [...WARM_MISSIONS, ...HOT_MISSIONS, ...FIRE_MISSIONS];

// מצא מיסיה מתאימה לרמת מתח נוכחית
export function getNextMission(
  tension: number,
  completedIds: string[]
): IntimacyMission | null {
  return ALL_MISSIONS.find(m =>
    m.minTension <= tension &&
    !completedIds.includes(m.id)
  ) ?? null;
}
