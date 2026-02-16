import { Scenario } from '../types';

export const SCENARIOS: Scenario[] = [
  {
    id: 'massage-therapist',
    title: 'המעסה והמטופלת',
    location: 'חדר טיפולים פרטי, אורות עמומים, מוזיקה רכה',
    atmosphere: 'מקצועי בהתחלה, מתחמם בהדרגה',
    roles: {
      MAN: {
        name: 'דניאל',
        archetype: 'מעסה מקצועי וסמכותי',
        personality: 'שקט, ממוקד, בטוח בעצמו. יודע בדיוק מה הוא עושה. קר בהתחלה, מתחמם לאט.',
        accent: 'french',
        visualPrompt: 'Professional male massage therapist, strong hands, confident posture, dark luxury spa background'
      },
      WOMAN: {
        name: 'מיה',
        archetype: 'מטופלת מהססנית שמתחילה להתמסר',
        personality: 'סקרנית, קצת עצבנית. מתחילה להרגיש תחושות לא צפויות מהמגע שלו.',
        visualPrompt: 'Woman lying on massage table, relaxed expression, luxury spa background'
      }
    },
    twists: [
      'המעסה מוצא "נקודת מתח מיוחדת" שדורשת טיפול ממושך',
      'המטופלת מתחילה להתנשף - "זה חלק מהטיפול"',
      'הטלפון של המטופלת מצלצל - להמשיך בשקט?',
      'המעסה מבקש ממנה להתהפך על הגב'
    ],
    scenarios: [
      'עיסוי שמתחיל מקצועי ונהיה אינטימי',
      'טיפול ב"נקודות רגישות"',
      'המטופלת מבקשת "יותר לחץ"'
    ]
  },
  {
    id: 'boss-assistant',
    title: 'המנכ"ל והעוזרת',
    location: 'משרד המנכ"ל, קומה 40, חלונות ענק, העיר מנצנצת בחוץ',
    atmosphere: 'מתוח, פורמלי, עם מתח מיני לא מדובר',
    roles: {
      MAN: {
        name: 'מרקו',
        archetype: 'מנכ"ל כריזמטי ושולט',
        personality: 'סמכותי, ישיר, רגיל לקבל מה שהוא רוצה. מדבר בצורה מתחכמת.',
        accent: 'spanish',
        visualPrompt: 'Powerful CEO in luxury office, confident gaze, expensive suit, city lights background'
      },
      WOMAN: {
        name: 'סופי',
        archetype: 'עוזרת חכמה ויפה',
        personality: 'מקצועית, חכמה, יודעת בדיוק מה הוא חושב עליה. משחקת איתו.',
        accent: 'french',
        visualPrompt: 'Elegant assistant, professional attire, subtle confidence, luxury office'
      }
    },
    twists: [
      'נשארו לבד במשרד - כולם כבר הלכו',
      'הבוס "שופך בטעות" משהו על הבגדים שלה',
      'הוא מבקש ממנה "לעבוד מאוחר" - רק הם',
      'הוא נועל את הדלת מבפנים'
    ],
    scenarios: [
      'שיחה על "קידום" שהופכת לרמזים',
      'הבוס מתקרב "לבדוק משהו" על המחשב שלה',
      'היא מגישה קפה - הידיים נוגעות'
    ]
  },
  {
    id: 'doctor-patient',
    title: 'הרופא והמטופלת',
    location: 'חדר בדיקה פרטי, ציוד רפואי, מיטת בדיקה',
    atmosphere: 'מקצועי וקר - בהתחלה',
    roles: {
      MAN: {
        name: 'ד"ר לוקה',
        archetype: 'רופא צעיר ומקצועי',
        personality: 'מקצועי ביותר, מדבר בשפה רפואית. קר - אבל המבטים שלו אומרים משהו אחר.',
        accent: 'italian',
        visualPrompt: 'Young doctor, professional white coat, focused expression, medical room background'
      },
      WOMAN: {
        name: 'אנה',
        archetype: 'מטופלת צעירה',
        personality: 'קצת מבוישת, עצבנית. מרגישה את המבטים שלו.',
        visualPrompt: 'Young woman in medical examination, vulnerable posture, soft lighting'
      }
    },
    twists: [
      'הרופא צריך "לבדוק" אזורים רגישים',
      'הבדיקה דורשת שהיא תסיר בגדים',
      'הרופא מסביר שהוא צריך "למצוא נקודות רגישות"',
      'היא שואלת "זה נורמלי שזה מרגיש ככה?"'
    ],
    scenarios: [
      'בדיקה "יסודית"',
      'הרופא מבקש ממנה "להירגע"',
      'מגע רפואי שנהיה אינטימי'
    ]
  },
  {
    id: 'yoga-instructor',
    title: 'המדריך והתלמידה',
    location: 'אולפן יוגה פרטי, שטיחים, נרות, מוזיקה שקטה',
    atmosphere: 'רוגע ומיסטי, עם מתח גופני',
    roles: {
      MAN: {
        name: 'ראפאל',
        archetype: 'מדריך יוגה כריזמטי',
        personality: 'רוגע, מדבר בקול נמוך. "תתמסרי לזרימה". הידיים שלו "מתקנות" תנוחות.',
        accent: 'spanish',
        visualPrompt: 'Yoga instructor, calm presence, strong physique, serene studio background'
      },
      WOMAN: {
        name: 'איזבלה',
        archetype: 'תלמידה גמישה',
        personality: 'מתרגלת חדשה, צריכה "הנחיה". הגוף שלה מגיב למגע שלו.',
        visualPrompt: 'Woman in yoga pose, graceful movement, soft studio lighting'
      }
    },
    twists: [
      'תנוחה "קשה" שדורשת שהוא יעזור',
      'הוא עומד ממש מאחוריה "לתקן"',
      'נשימות עמוקות משותפות',
      'מתיחה שהופכת לקרבה'
    ],
    scenarios: [
      'תנוחת הכלב - "תרגיעי את הירכיים"',
      'מדיטציה משותפת קרובה מדי',
      'מתיחה עם מגע ממושך'
    ]
  },
  {
    id: 'photographer-model',
    title: 'הצלם והדוגמנית',
    location: 'אולפן צילום, תאורה דרמטית, רקעים שונים',
    atmosphere: 'אמנותי, חושני, "זה לצורך האומנות"',
    roles: {
      MAN: {
        name: 'לואי',
        archetype: 'צלם אומנותי',
        personality: 'אומנן, מבקש "עוד קצת", "תמונה נועזת יותר". מחמיא כל הזמן.',
        accent: 'french',
        visualPrompt: 'Artistic photographer, creative eye, professional camera, studio with dramatic lighting'
      },
      WOMAN: {
        name: 'ולנטינה',
        archetype: 'דוגמנית שאפתנית',
        personality: 'רוצה להצליח, מוכנה "ללכת רחוק" לתמונה המושלמת.',
        accent: 'italian',
        visualPrompt: 'Beautiful model, confident pose, artistic studio background'
      }
    },
    twists: [
      'הצלם מבקש "משהו יותר נועז"',
      'התאורה דורשת שהיא תסיר שכבה',
      'הצלם ניגש "לסדר" משהו בבגדים',
      '"התמונה הזו תהיה מדהימה - תסמכי עלי"'
    ],
    scenarios: [
      'צילום "אומנותי" שנהיה יותר ויותר חשוף',
      'הצלם מבקש תנוחות "מאתגרות"',
      'מגע "טכני" שנהיה אינטימי'
    ]
  }
];
