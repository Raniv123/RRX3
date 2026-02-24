// ביטויים סקסיים בשפות שונות

export interface LanguagePhrase {
  original: string;
  translation: string;
  intensity: number;  // 1-10
  context: string;    // מתי להשתמש
}

export const FRENCH_PHRASES: LanguagePhrase[] = [
  // Level 1-3: רכות וחיבה
  {
    original: "Ma belle",
    translation: "היפה שלי",
    intensity: 2,
    context: "התחלה, חיבה עדינה"
  },
  {
    original: "Tu es magnifique",
    translation: "את מהממת",
    intensity: 3,
    context: "מחמאה"
  },
  {
    original: "J'ai envie de toi",
    translation: "אני רוצה אותך",
    intensity: 5,
    context: "ביטוי רצון ברור"
  },
  {
    original: "Touche-moi",
    translation: "גע בי",
    intensity: 6,
    context: "בקשה אינטימית"
  },
  {
    original: "Laisse-toi aller",
    translation: "תתמסר",
    intensity: 4,
    context: "עידוד להתמסר"
  },

  // Level 4-6: מתחמם
  {
    original: "Tu me rends fou/folle",
    translation: "משגע אותי",
    intensity: 6,
    context: "עוצמת משיכה"
  },
  {
    original: "Embrasse-moi",
    translation: "נשק אותי",
    intensity: 5,
    context: "בקשה לנשיקה"
  },
  {
    original: "Tu es si tendue, ma belle",
    translation: "את כל כך מתוחה, יפה שלי",
    intensity: 4,
    context: "עיסוי, קרבה"
  },
  {
    original: "Laisse-moi t'aider à te détendre",
    translation: "תני לי לעזור לך להירגע",
    intensity: 5,
    context: "הצעה אינטימית"
  },

  // Level 7-10: חם
  {
    original: "Prends-moi",
    translation: "קח אותי",
    intensity: 8,
    context: "בקשה נועזת"
  },
  {
    original: "Je te veux maintenant",
    translation: "אני רוצה אותך עכשיו",
    intensity: 9,
    context: "עוצמה גבוהה"
  },
  {
    original: "Tu me fais tellement envie",
    translation: "אני רוצה אותך כל כך",
    intensity: 7,
    context: "תשוקה"
  },
  {
    original: "Ne t'arrête pas",
    translation: "אל תעצור",
    intensity: 9,
    context: "המשך"
  }
];

export const SPANISH_PHRASES: LanguagePhrase[] = [
  // Level 1-3
  {
    original: "Mi amor",
    translation: "אהובי",
    intensity: 2,
    context: "חיבה"
  },
  {
    original: "Eres hermosa",
    translation: "את יפה",
    intensity: 3,
    context: "מחמאה"
  },
  {
    original: "Me gustas mucho",
    translation: "מוצא חן בעיני מאוד",
    intensity: 4,
    context: "משיכה"
  },
  {
    original: "Papi/Mami",
    translation: "כינוי חיבה",
    intensity: 5,
    context: "כינוי חיבה סקסי"
  },

  // Level 4-6
  {
    original: "Me vuelves loco/loca",
    translation: "משגע אותי",
    intensity: 6,
    context: "תשוקה"
  },
  {
    original: "Tócame",
    translation: "גע בי",
    intensity: 6,
    context: "בקשה למגע"
  },
  {
    original: "Bésame",
    translation: "נשק אותי",
    intensity: 5,
    context: "בקשה לנשיקה"
  },
  {
    original: "Caliente",
    translation: "חם/לוהט",
    intensity: 7,
    context: "תיאור מצב"
  },

  // Level 7-10
  {
    original: "Te deseo",
    translation: "אני חושק בך",
    intensity: 8,
    context: "תשוקה חזקה"
  },
  {
    original: "Dame más",
    translation: "תן/תני לי יותר",
    intensity: 9,
    context: "בקשה נועזת"
  },
  {
    original: "No pares",
    translation: "אל תעצור/י",
    intensity: 9,
    context: "המשך"
  },
  {
    original: "Quiero sentirte",
    translation: "אני רוצה להרגיש אותך",
    intensity: 8,
    context: "קרבה"
  }
];

export const ITALIAN_PHRASES: LanguagePhrase[] = [
  // Level 1-3
  {
    original: "Bella/Bello",
    translation: "יפה",
    intensity: 2,
    context: "מחמאה"
  },
  {
    original: "Amore mio",
    translation: "אהובי/אהובתי",
    intensity: 3,
    context: "חיבה"
  },
  {
    original: "Sei bellissima/bellissimo",
    translation: "את/ה יפה/יפה מאוד",
    intensity: 3,
    context: "מחמאה"
  },
  {
    original: "Vieni qui",
    translation: "בוא/י לכאן",
    intensity: 4,
    context: "בקשה להתקרב"
  },

  // Level 4-6
  {
    original: "Baciami",
    translation: "נשק/י אותי",
    intensity: 5,
    context: "בקשה לנשיקה"
  },
  {
    original: "Mi fai impazzire",
    translation: "את/ה משגע/ת אותי",
    intensity: 6,
    context: "תשוקה"
  },
  {
    original: "Toccami",
    translation: "גע/י בי",
    intensity: 6,
    context: "בקשה למגע"
  },
  {
    original: "Ti voglio",
    translation: "אני רוצה אותך",
    intensity: 7,
    context: "רצון"
  },

  // Level 7-10
  {
    original: "Prendimi",
    translation: "קח/קחי אותי",
    intensity: 8,
    context: "בקשה נועזת"
  },
  {
    original: "Spogliati",
    translation: "התפשט/י",
    intensity: 9,
    context: "הוראה ישירה"
  },
  {
    original: "Non fermarti",
    translation: "אל תעצור/י",
    intensity: 9,
    context: "המשך"
  },
  {
    original: "Ti desidero",
    translation: "אני חושק/ת בך",
    intensity: 8,
    context: "תשוקה"
  }
];

// פונקציה לבחירת ביטוי מתאים
export function getPhrase(language: 'french' | 'spanish' | 'italian', intensity: number): LanguagePhrase {
  const phrases = language === 'french' ? FRENCH_PHRASES :
                  language === 'spanish' ? SPANISH_PHRASES :
                  ITALIAN_PHRASES;

  // מצא ביטויים בטווח עוצמה מתאים
  const suitable = phrases.filter(p => Math.abs(p.intensity - intensity) <= 2);

  if (suitable.length === 0) return phrases[0];

  // בחר אקראי מהמתאימים
  return suitable[Math.floor(Math.random() * suitable.length)];
}
