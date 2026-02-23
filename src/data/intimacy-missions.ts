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
  instruction: string;       // fallback כללי
  instructionMAN?: string;   // לגבר — לשון זכר
  instructionWOMAN?: string; // לאשה — לשון נקבה
  tips?: string[];           // טיפים איך לעשות את זה נכון
  photoUrl?: string;         // תמונה ממחישה (Unsplash photo ID)
  forWho: 'MAN' | 'WOMAN' | 'BOTH';
  duration?: number;
  significant?: boolean;     // האם לעצור את השיחה (false = ב-actionTip בלבד)
  choices?: IntimacyChoice[];
}

// ===== WARM — מגע ראשוני, קרבה, נשיקה =====
export const WARM_MISSIONS: IntimacyMission[] = [
  {
    id: 'first-touch',
    phase: 'WARM',
    minTension: 28,
    title: 'מגע ראשון',
    instruction: 'הנח יד על ידה/ידו לאט — בלי מילים. תחזיק שנייה שלמה.',
    instructionMAN: 'הנח את ידך על ידה לאט — בלי מילים. תחזיק שנייה שלמה ותסתכל לה לעיניים.',
    instructionWOMAN: 'הניחי את ידך על ידו לאט — בלי מילים. תחזיקי שנייה שלמה ותסתכלי לו לעיניים.',
    photoUrl: 'https://images.unsplash.com/photo-1516589091380-5d8e87df6999',
    forWho: 'BOTH',
    significant: false,   // לא עוצרים לזה — רק כ-actionTip
    duration: 30
  },
  {
    id: 'first-kiss',
    phase: 'WARM',
    minTension: 42,
    title: 'נשיקה ראשונה 💋',
    instruction: 'נשיקה ממושכת — דקה וחצי. שפתיים עדינות, אל תמהר.',
    instructionMAN: 'נשיקה ממושכת — דקה וחצי שלמות. קרב לאט, שפתיים על שפתיה, אל תמהר. תיתן לה להתקרב אליך.',
    instructionWOMAN: 'נשיקה ממושכת — דקה וחצי שלמות. תתקרבי לאט, שפתיים על שפתיו, אל תמהרי. תיתני לו להתקרב אלייך.',
    tips: [
      'התחל בעדינות — שפתיים סגורות, לחץ קל. אל תפתח פה מיד.',
      'לאחר 20 שניות — שפתיים קצת יותר פתוחות, נשיפה קלה דרך האף.',
      'תחזיק את הלחיים שלה בשתי ידיים — תוסיף חום ובטחון.',
      'האיטיות היא הנשק — כל פעם שרוצים למהר, לאט עוד יותר.',
      'בסוף — עצור שנייה עם השפתיים צמודות, לפני שמפרידים.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1518386048-76e4a20e1ef3',
    forWho: 'BOTH',
    significant: true,
    duration: 90
  },
  {
    id: 'deep-kiss',
    phase: 'WARM',
    minTension: 48,
    title: 'נשיקה עמוקה',
    instruction: 'נשיקה עמוקה ומוצלבת — ידיים על הלחיים, קחו את הזמן.',
    instructionMAN: 'נשיקה עמוקה — שים ידיים על לחייה, ותן לזה להיות איטי ועמוק. קח את הזמן.',
    instructionWOMAN: 'נשיקה עמוקה — שימי ידיים על לחייו, ותני לזה להיות איטי ועמוק. קחי את הזמן.',
    photoUrl: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954',
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
    instruction: 'הסר פריט אחד ממנה/ממנו — לאט מאוד, בלי להזדרז.',
    instructionMAN: 'הסר ממנה פריט לבוש אחד — לאט מאוד, כפתור כפתור. בלי להזדרז. תסתכל לה לעיניים בזמן.',
    instructionWOMAN: 'הסירי ממנו פריט לבוש אחד — לאט מאוד, בלי להזדרז. תסתכלי לו לעיניים בזמן שאת עושה את זה.',
    photoUrl: 'https://images.unsplash.com/photo-1516589178581-6cd256986b56',
    forWho: 'BOTH',
    duration: 30
  },
  {
    id: 'body-kiss',
    phase: 'HOT',
    minTension: 60,
    title: 'נשיקות על הגוף',
    instruction: 'נשיקות על הצוואר ← כתפיים ← חזה. לאט. ממושך. בלי קפיצות.',
    instructionMAN: 'נשיקות על צווארה ← כתפיה ← חזה. לאט, ממושך. תחזיק את הכוח — אל תמהר למטה.',
    instructionWOMAN: 'נשיקות על צווארו ← כתפיו ← חזה. לאט, ממושך. תחזיקי את הכוח — אל תמהרי למטה.',
    photoUrl: 'https://images.unsplash.com/photo-1512317022600-44bb2b8e6a12',
    forWho: 'BOTH',
    duration: 60
  },
  {
    id: 'oral-start',
    phase: 'HOT',
    minTension: 68,
    title: 'אוראלי — התחלה',
    instruction: 'התחל בעדינות — לשון ושפתיים, קצב איטי, קשב לתגובות.',
    instructionMAN: 'התחל בעדינות — לשון ושפתיים על הפות שלה, קצב איטי. תקשיב לתגובות שלה ותתכוונן.',
    instructionWOMAN: 'התחילי בעדינות — לשון ושפתיים על הזין שלו, קצב איטי. תקשיבי לתגובות שלו ותתכווני.',
    photoUrl: 'https://images.unsplash.com/photo-1519755901980-8adcdfe1cc97',
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
    instructionMAN: 'בחר את הסגנון — ותתמסר לזה לגמרי. תסתכל לה לעיניים אם אתה יכול.',
    instructionWOMAN: 'בחרי את הסגנון — ותתמסרי לזה לגמרי. תסתכלי לו לעיניים אם את יכולה.',
    photoUrl: 'https://images.unsplash.com/photo-1536363853082-2f0b6cb0a8a7',
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
    instruction: 'ודא שהיא רטובה לחלוטין — הכנה מלאה לפני שממשיכים.',
    instructionMAN: 'ודא שהיא רטובה לחלוטין — אל תמהר. הכנה מלאה לפני שממשיכים.',
    instructionWOMAN: 'אמרי לו מה את צריכה — הוא ממתין להכין אותך לחלוטין לפני שממשיכים.',
    photoUrl: 'https://images.unsplash.com/photo-1530023470208-8d6d8afbce05',
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
    instructionMAN: 'כניסה ראשונה לאט מאוד — עצור באמצע, תנשום, ותסתכל לה לעיניים. קח את הזמן.',
    instructionWOMAN: 'כניסה ראשונה לאט מאוד — עצרי באמצע, תנשמי, ותסתכלי לו לעיניים. קחי את הזמן.',
    photoUrl: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00',
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

// קבל את ההוראה הנכונה לפי מין
export function getMissionInstruction(mission: IntimacyMission, gender: 'MAN' | 'WOMAN'): string {
  if (gender === 'MAN' && mission.instructionMAN) return mission.instructionMAN;
  if (gender === 'WOMAN' && mission.instructionWOMAN) return mission.instructionWOMAN;
  return mission.instruction;
}
