# לוג שיחות — RRX3

---

## סשן 2026-02-22 (Session #1 — Initial Build)

### מה ביקשנו לעשות:
- בניית אפליקציית קרבה אינטימית חכמה לזוגות עם AI Director
- מבוססת React 19 + TypeScript + Vite + Tailwind CSS
- AI Engine מבוסס Google Gemini (gemini-2.5-pro + gemini-2.0-flash-exp)
- סנכרון בזמן אמת בין מכשירים דרך ntfy.sh (SSE)

### מה בוצע בפועל:
- **AI Director Engine** — ארכיטקטורה 4 שכבות (Context, Strategy, Recommendation, Pacing)
  - טיימרים חכמים (1:20 לגבר, 2:00-2:35 לאשה)
  - התאמה דינמית לפי מתח, מספר הודעות, זמן
  - Dirty talk עם דירוג עוצמה 1-10
  - Fallback responses בשגיאה
- **מערכת תפקידים ותרחישים** — 5 תרחישי roleplay מפורטים עם visual prompts, twists, accents
- **ביטויים בשפות זרות** — 40+ ביטויים בצרפתית/ספרדית/איטלקית עם דירוג עוצמה
- **מד מתח חכם** — 4 שלבים: ICE (0-25%) > WARM (25-50%) > HOT (50-75%) > FIRE (75-100%)
- **מערכת הפתעות** — 14 הפתעות ב-4 סוגים (DARE, GAME, CHALLENGE, TWIST), 4 רמות נדירות
- **סנכרון ntfy.sh** — SSE, קודי חיבור 4 ספרות, auto-reconnect
- **ממשק מלא** — LoginScreen, ConnectScreen, GenderSelection, ProtocolScreen
- **עיצוב פוטוריסטי** — Glassmorphism, backdrop blur, אנימציות, RTL support

### קבצים שנוצרו:
- `src/services/ai-engine.ts` — מנוע AI מרכזי
- `src/services/sync-service.ts` — סנכרון בזמן אמת
- `src/services/tension-engine.ts` — ניהול מתח ושלבים
- `src/services/surprise-engine.ts` — הפתעות ומשחקים
- `src/data/scenarios.ts` — 5 תרחישי roleplay
- `src/data/languages.ts` — ביטויים בשפות זרות
- `src/data/surprises.ts` — 14 הפתעות
- `src/data/prompts.ts` — AI system prompt
- `src/components/LoginScreen.tsx` — מסך כניסה
- `src/components/ConnectScreen.tsx` — מסך חיבור
- `src/components/GenderSelection.tsx` — בחירת מין
- `src/components/ProtocolScreen.tsx` — מסך ראשי
- `src/types.ts` — TypeScript interfaces
- `src/App.tsx` — רכיב ראשי

---

## סשן 2026-02-16 (Session #2 — Deploy + Fixes)

### מה ביקשנו לעשות:
- לפרוס את האפליקציה ל-GitHub Pages
- לתקן באגים שנמצאו

### מה בוצע בפועל:
- **פריסה ל-GitHub Pages** — https://raniv123.github.io/RRX3/
  - התקנת `gh-pages` package
  - הוספת `homepage`, `predeploy`, `deploy` ל-package.json
  - פריסה מוצלחת ל-gh-pages branch
- **תיקוני באגים:**
  - `languages.ts` — שבירת string ב-"Prends-moi"
  - `types.ts` — שבירת string ב-"favoriteScenarios"
  - הוספת `vite-env.d.ts` לתמיכה ב-`import.meta.env`
  - Null checks ב-`ai-engine.ts`
  - הסרת imports לא בשימוש
  - Underscore prefix למשתנים לא בשימוש (_gender, _targetPhase)
  - פישוט קודי חיבור — מ-"rrx3-xxxxxxxxxxxx" ל-4 ספרות בלבד
  - החלפת אימוג'ים ב-GenderSelection — מילדותיים לרומנטיים
- **עדכון מפתח API** — מפתח Gemini ישן פג תוקף, עודכן בכל המקומות

### קבצים שהשתנו:
- `src/data/languages.ts`
- `src/types.ts`
- `src/vite-env.d.ts` (חדש)
- `src/services/ai-engine.ts`
- `src/components/GenderSelection.tsx`
- `package.json`
- `.env`

---

## סשן 2026-02-20 (Session #3 — Scene Backgrounds + Character Badge)

### מה ביקשנו לעשות:
- רקעים דינמיים לפי מיקום התרחיש
- תג דמות (character badge) בפאנל ה-AI
- שיפור prompts

### מה בוצע בפועל:
- **תיקון באג** — `scene` > `currentScene` ב-background (הרקע לא השתנה לפי שלב)
- **prompts.ts** — AI מאמן מנקודת מבט הדמות הספציפית
  - `buildAIPrompt` מעביר שם דמות, ארכיטיפ, אישיות, forbidden ל-AI
- **ProtocolScreen** — character badge מוצג בפאנל AI (ארכיטיפ + forbidden)
- **sceneKeywords** — סצנות לפי שלב (ICE=ציבורי, WARM=חצי-פרטי, HOT=אינטימי, FIRE=פרטי)

### קבצים שהשתנו:
- `src/components/ProtocolScreen.tsx`
- `src/data/prompts.ts`
- `src/services/ai-engine.ts`

---

## סשן 2026-02-22 (Session #4 — InvitationScreen + ConnectScreen + BreathSyncScreen)

### מה ביקשנו לעשות:
- מסך הזמנה מפתה (InvitationScreen)
- מסך חיבור משופר (ConnectScreen)
- מסך סנכרון נשימה (BreathSyncScreen)

### מה בוצע בפועל:
- **InvitationScreen** — מסך הזמנה חדש
- **ConnectScreen** — עיצוב מחודש של מסך הקישור
- **BreathSyncScreen** — סנכרון נשימה בין המכשירים
- פריסה ל-GitHub Pages

### קבצים שנוצרו/השתנו:
- `src/components/InvitationScreen.tsx` (חדש)
- `src/components/BreathSyncScreen.tsx` (חדש)
- `src/components/ConnectScreen.tsx`
- `src/App.tsx`

---

## סשן 2026-02-23 (Session #5 — MissionCard Luxury + Gender AI + Deep Identity)

### מה ביקשנו לעשות:
01. עיצוב מחדש מלא ל-MissionCard (luxury fullscreen card)
02. Word chips ספציפיים לפי מין (לא עוד "שאתה/את")
03. ActionTip — מאמן AI חד וספציפי לגוף
04. Phase advance sync
05. זהות מועשרת לדמויות (desire, backstory ארוך, meetContext)
06. תמונות Unsplash למשימות
07. תיקון כל הצורות הכפולות ("שלו/שלה", "בוא/י" וכו')

### מה בוצע בפועל:

#### 1. MissionCard — עיצוב מחדש מלא (luxury fullscreen card)
**קובץ:** `src/components/ProtocolScreen.tsx` שורות 501-779

- **לפני:** inline card קטן בתוך הצ'אט
- **אחרי:** fullscreen overlay (`fixed inset-0 z-50`) עם:
  - רקע blur כבד (`backdrop-filter: blur(28px)`) + שחור 90%
  - תמונה ממחישה (Unsplash) בגובה 210px עם gradient overlay
  - Phase badge + כפתור X על התמונה
  - כותרת missions overlaid על תחתית התמונה
  - הוראה ראשית בטיפוגרפיה עדינה (font-weight 300, line-height 1.85)
  - Tips מספריים עם עיגולים צבעוניים
  - Choices grid עם premium hover effects
  - טיימר גדול (38px monospace) עם glow effect
  - כפתור Done עם gradient + box-shadow
  - **צד מחכה (inactive):** slim floating bar (`fixed bottom-24`)

#### 2. Photo URLs לכל משימה
**קובץ:** `src/data/intimacy-missions.ts`

- הוספת `photoUrl?: string` ל-`IntimacyMission` interface
- כל 9 משימות קיבלו URL של תמונה מ-Unsplash
- `onError` handler — fallback לגרדיאנט CSS אומנותי כשהתמונה לא נטענת
- הגרדיאנט: `radial-gradient` דינמי לפי phase color

#### 3. Word chips — לשון ספציפית לפי מין
**קובץ:** `src/data/prompts.ts` (buildAIPrompt)

- גבר: "אני לא אמור להסתכל עלייך ככה אבל..."
- אשה: "אני לא אמורה להרגיש ככה אבל..."
- בניית משתני gender-specific forms בתוך buildAIPrompt:
  - selfShaqet, selfAmur, selfYachol, selfChoshev, selfMargish, selfShomea
  - partnerAta, partnerOmer, partnerMedaber, partnerMargish, partnerMevin, partnerGoremet, partnerTen
- Phase instructions עם interpolation דינמי לפי מין
- חוק לשון מוחלט בסוף ה-prompt: "אסור צורות כפולות"

**קובץ:** `src/services/ai-engine.ts` (getDefaultChips, getDefaultAdvice, getDefaultActionTip)

- `getDefaultChips` — fallback chips מותאמי מין לכל phase
- `getDefaultAdvice` — עצות forMan/forWoman שונות לפי שלב
- `getDefaultActionTip` — טיפים פיזיים ספציפיים לכל מין ושלב

#### 4. ActionTip — מאמן AI חד וספציפי
**קובץ:** `src/services/ai-engine.ts` שורות 329-361

- הוראות גוף-ספציפיות, לא גנריות
- שינוי לפי phase: FIRE = פעולות פיזיות מתקדמות עם רמת מתח
- tension >= 93: קוביית תנוחה
- tension >= 87: אוראלי מלא
- tension >= 81: ליקוק עיגולים
- tension >= 76: הורדת פריט לבוש

#### 5. Phase advance sync
- לחיצת גבר על "קדם שלב" > BREATH_START message לשניהם
- האשה מקבלת עדכון tension אוטומטי

#### 6. זהות מועשרת
**קובץ:** `src/types.ts`

- `desire` field חדש ("מה אני מחפש/ת הלילה הזה")
- backstory ארוך יותר (3-4 משפטים)
- meetContext (2-3 משפטים + תגובה רגשית)
- כרטיס זהות: hero avatar + backstory + desire + secrets + personality

**קובץ:** `src/services/ai-engine.ts` (generateScenarioWithAI prompt)

- Prompt מורחב עם הוראות ל-backstory, meetContext, desire, secrets

### מה לא בוצע / נשאר:
- **27 ממצאי צורות כפולות** — ראו בפירוט למטה
- בדיקה שתמונות Unsplash נטענות (ייתכן ש-IDs לא נכונים)
- בדיקה ש-MissionCard נראה נכון על מובייל אמיתי

### קבצים שהשתנו:
- `src/data/intimacy-missions.ts` — photoUrl + interface field
- `src/components/ProtocolScreen.tsx` — MissionCard redesign מלא
- `src/data/prompts.ts` — gender-specific chips + actionTip coach
- `src/services/ai-engine.ts` — gender-aware fallbacks + scenario prompt
- `src/types.ts` — desire field

---

## סשן 2026-02-24 (Session #6 — תיקון צורות כפולות)

### מה ביקשנו לעשות:
תיקון כל 27 הממצאים של צורות כפולות (שלו/שלה, בוא/י, את/ה וכו') ב-4 קבצים.

### מה בוצע בפועל:

#### ProtocolScreen.tsx — 4 תיקונים:
01. **שורה 1275:** `title="הסוד שלו/שלה"` > `title={myGender === 'MAN' ? 'הסוד שלה' : 'הסוד שלו'}`
02. **שורה 1588:** `הסוד שלי — רק אתה יודע` > לפי מין: `רק את יודעת` / `רק אתה יודע`
03. **שורה 1640:** `בוא/י נתחיל` > `{myGender === 'MAN' ? 'בוא נתחיל' : 'בואי נתחיל'}`
04. **שורה 1653:** `הסוד שלו/שלה` > `{myGender === 'MAN' ? 'הסוד שלה' : 'הסוד שלו'}`
05. **שורה 1664:** `רק אתה/את רואה את זה` > לפי מין

#### prompts.ts — 4 תיקונים:
01. **שורה 213:** `אני משחק/ת:` > `{isMAN ? 'אני משחק:' : 'אני משחקת:'}`
02. **שורה 231:** `אמר/ה:` > `{lastSender === 'MAN' ? 'אמר:' : 'אמרה:'}`
03. **שורה 233:** `מה שאני מסתיר/ה` > `{isMAN ? 'מסתיר' : 'מסתירה'}`
04. **שורה 246:** `שלו/שלה` > `${isMAN ? 'שלה' : 'שלו'}`
05. **שורה 251:** `הציע/י "בוא/י נשחק בקובייה"` > לפי מין

#### ai-engine.ts — 2 תיקונים:
01. **שורה 170:** `רופא ומטופל.ת` > `רופא ומטופלת`
02. **שורה 171:** `מורה פרטי.ת ומשפחה: הגיע/ה ללמד את הילד, אבל מצא/ה את עצמו/ה מתוודע/ת להורה` > ניקוי צורות כפולות

#### languages.ts — 17 תיקוני תרגום:
- כל צורה כפולה בתרגום (את/ה, נשק/י, גע/י, וכו') הוחלפה בטקסט ניטרלי (גוף שני יחיד זכר כברירת מחדל, כי הביטויים הם בשפה זרה והתרגום הוא הסבר כללי)
- רשימת תיקונים מלאה:
  01. `את/ה משגע/ת אותי` > `משגיע אותי` (French)
  02. `נשק/י אותי` > `נשק אותי` (French)
  03. `אל תעצור/י` > `אל תעצור` (French)
  04. `אהובי/אהובתי` > `אהובי` (Spanish)
  05. `את/ה מאוד מוצא/ת חן בעיני` > `מוצא חן בעיני מאוד` (Spanish)
  06. `אבא/אמא (חיבה)` > `כינוי חיבה` (Spanish)
  07. `את/ה משגע/ת אותי` > `משגיע אותי` (Spanish)
  08. `גע/י בי` > `גע בי` (Spanish)
  09. `נשק/י אותי` > `נשק אותי` (Spanish)
  10. `אני חושק/ת בך` > `אני חושק בך` (Spanish)
  11. `תן/תני לי יותר` > `תן לי עוד` (Spanish)
  12. `אל תעצור/י` > `אל תעצור` (Spanish)
  13. `אהובי/אהובתי` > `אהובי` (Italian)
  14. `את/ה יפה/יפה מאוד` > `יפה מאוד` (Italian)
  15. `בוא/י לכאן` > `בוא הנה` (Italian)
  16. `נשק/י אותי` > `נשק אותי` (Italian)
  17. `את/ה משגע/ת אותי` > `משגיע אותי` (Italian)
  18. `גע/י בי` > `גע בי` (Italian)
  19. `קח/קחי אותי` > `קח אותי` (Italian)
  20. `התפשט/י` > `התפשט` (Italian)
  21. `אל תעצור/י` > `אל תעצור` (Italian)
  22. `אני חושק/ת בך` > `אני חושק בך` (Italian)

### קבצים שהשתנו:
- `src/components/ProtocolScreen.tsx`
- `src/data/prompts.ts`
- `src/services/ai-engine.ts`
- `src/data/languages.ts`

---

## ממצאי החוקר — רשימה מלאה (נמצאו ב-session #5, תוקנו ב-session #6)

### ProtocolScreen.tsx — 5 ממצאים:
| # | שורה | בעיה | תיקון |
|---|-------|------|-------|
| 1 | 1275 | `title="הסוד שלו/שלה"` | `title={myGender === 'MAN' ? 'הסוד שלה' : 'הסוד שלו'}` |
| 2 | 1588 | `הסוד שלי — רק אתה יודע` | לפי מין: `רק את יודעת` / `רק אתה יודע` |
| 3 | 1640 | `בוא/י נתחיל` | `{myGender === 'MAN' ? 'בוא נתחיל' : 'בואי נתחיל'}` |
| 4 | 1653 | `הסוד שלו/שלה` | `{myGender === 'MAN' ? 'הסוד שלה' : 'הסוד שלו'}` |
| 5 | 1664 | `רק אתה/את רואה את זה` | לפי מין: `רק אתה רואה` / `רק את רואה` |

### prompts.ts — 5 ממצאים:
| # | שורה | בעיה | תיקון |
|---|-------|------|-------|
| 1 | 213 | `אני משחק/ת:` | interpolation לפי isMAN |
| 2 | 231 | `אמר/ה:` | interpolation לפי lastSender |
| 3 | 233 | `מה שאני מסתיר/ה` | interpolation לפי isMAN |
| 4 | 246 | `שלו/שלה` | `${isMAN ? 'שלה' : 'שלו'}` |
| 5 | 251 | `הציע/י "בוא/י נשחק בקובייה"` | interpolation לפי isMAN |

### ai-engine.ts — 2 ממצאים:
| # | שורה | בעיה | תיקון |
|---|-------|------|-------|
| 1 | 170 | `רופא ומטופל.ת` | `רופא ומטופלת` |
| 2 | 171 | `מורה פרטי.ת`, `הגיע/ה`, `מצא/ה`, `עצמו/ה`, `מתוודע/ת` | ניקוי לטקסט נקי |

### languages.ts — 17+ ממצאים:
| # | קובץ | בעיה | תיקון |
|---|-------|------|-------|
| 1-3 | French | `את/ה משגע/ת`, `נשק/י`, `אל תעצור/י` | טקסט ניטרלי |
| 4-12 | Spanish | `אהובי/אהובתי`, `את/ה מוצא/ת`, `אבא/אמא`, `את/ה משגע/ת`, `גע/י`, `נשק/י`, `חושק/ת`, `תן/תני`, `אל תעצור/י` | טקסט ניטרלי |
| 13-22 | Italian | `אהובי/אהובתי`, `את/ה יפה/יפה`, `בוא/י`, `נשק/י`, `את/ה משגע/ת`, `גע/י`, `קח/קחי`, `התפשט/י`, `אל תעצור/י`, `חושק/ת` | טקסט ניטרלי |

---

## סיכום טכני כללי

### ארכיטקטורה:
```
User (Browser)
  |
  ├── LoginScreen > ConnectScreen > GenderSelection
  |
  ├── ProtocolScreen (main)
  |     ├── AI Panel (strategicAdvice, actionTip, wordChips)
  |     ├── Chat Messages (sync via ntfy.sh)
  |     ├── MissionCard (fullscreen luxury overlay)
  |     ├── Position Dice (random position selector)
  |     └── Secret Card (partner's secret)
  |
  ├── Services:
  |     ├── AIEngine (Gemini API — recommendations + avatars)
  |     ├── SyncService (ntfy.sh SSE — real-time messaging)
  |     ├── TensionEngine (tension 0-100%, 4 phases)
  |     └── SurpriseEngine (14 surprises, weighted random)
  |
  └── Data:
        ├── scenarios.ts (5 predefined + AI-generated)
        ├── prompts.ts (system prompt + buildAIPrompt)
        ├── languages.ts (French/Spanish/Italian phrases)
        ├── intimacy-missions.ts (9 missions: WARM/HOT/FIRE)
        └── surprises.ts (14 surprises: COMMON/RARE/EPIC/LEGENDARY)
```

### APIs:
- **Google Gemini** — `gemini-2.5-pro` (recommendations, scenarios) + `gemini-2.0-flash-exp` (avatars)
- **FAL.ai** — `flux/schnell` (avatar generation, fallback)
- **ntfy.sh** — SSE (real-time sync between devices)
- **Unsplash** — Mission card photos

### URLs:
- **GitHub:** https://github.com/Raniv123/RRX3
- **Live:** https://raniv123.github.io/RRX3/

---

_Last updated: 2026-02-24_
