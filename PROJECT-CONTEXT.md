# RRX3 — Project Context
📅 עדכון אחרון: 2026-02-22
💬 שיחה אחרונה: InvitationScreen + ConnectScreen (קישור מפתה) + BreathSyncScreen — deployed ל-GitHub Pages ✅

---

# 🔥 RRX3 v2.0 - Project Context

## מה הפרויקט עושה

**אפליקציית קרבה אינטימית חכמה לזוגות עם AI Director**

אפליקציה מתקדמת שמשלבת בינה מלאכותית עם תקשורת בזמן אמת, ליצירת חוויה אינטימית ייחודית ומותאמת אישית. ה-AI חושב על כל הודעה, מבין את ההקשר, ומנחה את הזוג בצורה הדרגתית דרך 4 שלבים (ICE → WARM → HOT → FIRE).

---

## טכנולוגיות ותלויות

- **שפה:** TypeScript 5.8.2
- **Framework:** React 19.2.0
- **Build Tool:** Vite 6.2.0
- **Styling:** Tailwind CSS 3.4.0
- **AI Engine:** Google Gemini AI
  - `gemini-3-pro-preview` - המלצות וניתוח
  - `gemini-2.5-flash-image` - אווטרים
- **Real-time Sync:** ntfy.sh
- **Package Manager:** npm

---

## מבנה הפרויקט

```
RRX3/
├── src/
│   ├── components/          # רכיבי UI
│   │   ├── LoginScreen.tsx
│   │   ├── ConnectScreen.tsx
│   │   ├── GenderSelection.tsx
│   │   └── ProtocolScreen.tsx (המסך הראשי)
│   │
│   ├── services/            # לוגיקת עסקית
│   │   ├── ai-engine.ts     # מנוע AI מרכזי
│   │   ├── sync-service.ts  # סנכרון בזמן אמת
│   │   ├── tension-engine.ts # ניהול מתח ושלבים
│   │   └── surprise-engine.ts # הפתעות ומשחקים
│   │
│   ├── data/                # נתונים סטטיים
│   │   ├── scenarios.ts     # 5 תרחישי roleplay
│   │   ├── languages.ts     # ביטויים בצרפתית/ספרדית/איטלקית
│   │   ├── surprises.ts     # 14 הפתעות (COMMON→LEGENDARY)
│   │   └── prompts.ts       # AI system prompt
│   │
│   ├── types.ts             # TypeScript interfaces
│   ├── App.tsx              # רכיב ראשי
│   ├── main.tsx             # נקודת כניסה
│   ├── index.css            # סגנונות גלובליים
│   └── vite-env.d.ts        # Vite type definitions
│
├── .env                     # מפתחות API (local only)
├── .env.example             # תבנית למפתחות
├── .gitignore
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## מה בנינו עד כה

### ✅ הושלם מלא - 100%

1. **AI Director Engine** ✅
   - ארכיטקטורה 4 שכבות (Context → Strategy → Recommendation → Pacing)
   - טיימרים חכמים (1:20 לגבר, 2:00-2:35 לאשה)
   - התאמה דינמית לפי מתח, מספר הודעות, זמן
   - Dirty talk עם דירוג עוצמה 1-10
   - Fallback responses במקרה שגיאה

2. **מערכת תפקידים ותרחישים** ✅
   - 5 תרחישי roleplay מפורטים
   - כל תרחיש עם תפקידים, אישיות, מבטא (french/spanish/italian)
   - Visual prompts לאווטרים
   - Twists ו-scenarios אפשריים

3. **ביטויים בשפות זרות** ✅
   - 40+ ביטויים בצרפתית/ספרדית/איטלקית
   - דירוג עוצמה 1-10 לכל ביטוי
   - תרגום והקשר שימוש

4. **מד מתח חכם** ✅
   - מעקב אחר tension 0-100%
   - 4 שלבים: ICE (0-25%) → WARM (25-50%) → HOT (50-75%) → FIRE (75-100%)
   - קצב התקדמות דינמי (slow/normal/fast)
   - בדיקות למעבר בין שלבים

5. **מערכת הפתעות** ✅
   - 14 הפתעות ייחודיות
   - 4 סוגים: DARE, GAME, CHALLENGE, TWIST
   - 4 רמות נדירות: COMMON (10x) → RARE (5x) → EPIC (2x) → LEGENDARY (1x)
   - בחירה משוקללת עם מעקב היסטוריה

6. **סנכרון בזמן אמת** ✅
   - חיבור דרך ntfy.sh SSE
   - שליחה/קבלה של הודעות בין מכשירים
   - קודי חיבור פשוטים (4 ספרות בלבד, כמו "1900")
   - Auto-reconnect במקרה נפילה

7. **ממשק משתמש מלא** ✅
   - LoginScreen - יצירה/הצטרפות למסע
   - ConnectScreen - תצוגת קוד חיבור
   - GenderSelection - בחירת גבר/אישה
   - ProtocolScreen - המסך הראשי עם ה-AI Director

8. **עיצוב פוטוריסטי** ✅
   - Glassmorphism עם backdrop blur
   - צבעים מותאמים (electric-blue, sexy-fuchsia, bordeaux, dark)
   - אנימציות חלקות (fade-in, slide-up, scale-in, pulse)
   - Responsive design
   - RTL support (עברית)

---

## החלטות חשובות

### למה Google Gemini ולא Claude/OpenAI?
- **Gemini 3 Pro Preview** מהיר ומדויק לניתוח הקשר
- **Gemini 2.5 Flash Image** יוצר אווטרים CGI איכותיים
- **JSON mode** מובנה - קל יותר לפרסור
- **עלות נמוכה** יחסית ל-Claude Opus

### למה ntfy.sh?
- **חינמי לחלוטין**
- **SSE מובנה** - קל לשילוב
- **אין צורך ב-WebSocket server**
- **עובד מכל מכשיר** עם חיבור אינטרנט

### למה Tailwind?
- **מהיר לפיתוח**
- **Utility-first** - עיצוב בקוד
- **טוב ל-RTL**
- **קטן בproduction** (tree-shaking)

### למה TypeScript?
- **Type safety** - פחות באגים
- **Auto-completion** טוב יותר
- **Refactoring** בטוח
- **תיעוד מובנה** (interfaces)

---

## מצב נוכחי

### עובד ✅

- ✅ Build מצליח (dist/ נוצר)
- ✅ GitHub Actions מ-deploy לGitHub Pages
- ✅ Gemini API key עובד
- ✅ סצינות לפי שלב (ICE=ציבורי, WARM=חצי-פרטי, HOT=אינטימי, FIRE=פרטי לחלוטין)
- ✅ word chips — משפטים מלאים 6-12 מילים (לא מילים בודדות)
- ✅ actionTip — ייעוץ התנהגותי ספציפי לדמות
- ✅ character badge בפאנל ה-AI (ארכיטיפ + forbidden)
- ✅ Game cards עם circular countdown timer
- ✅ CGI avatars (ניסיון Gemini + SVG fallback)
- ✅ תרחישים מגוונים (9 סוגים) + AI scenario generation
- ✅ ntfy.sh sync בזמן אמת בין מכשירים

### שופר ב-session האחרון 🔄
- תוקן bug קריטי: `scene` → `currentScene` בbackground
- prompts.ts: AI מאמן מנקודת מבט הדמות הספציפית
- buildAIPrompt: מעביר שם דמות, ארכיטיפ, אישיות, forbidden לAI
- ProtocolScreen: character badge מוצג בפאנל AI

### API Key ✅
- `.env` (לפיתוח מקומי)
- `.env.master` (גיבוי גלובלי)
- GitHub Secrets (production ב-GitHub Pages)

---

## צעדים הבאים

### לבדיקה ראשונית
1. ✅ השג Gemini API key
2. ✅ מלא ב-`.env`
3. ✅ הרץ `npm run dev`
4. ✅ פתח `http://localhost:5173`
5. ✅ בדוק כל מסך

### לפיתוח עתידי
- [ ] בדיקות E2E (Playwright/Cypress)
- [ ] PWA support (offline mode)
- [ ] אווטרים מותאמים אישית
- [ ] שמירת היסטוריה של מסעות
- [ ] מערכת הישגים (achievements)
- [ ] מוזיקת רקע אוטומטית
- [ ] שיתוף תרחישים בקהילה

---

## קבצים חשובים

| קובץ | תיאור |
|------|--------|
| `src/services/ai-engine.ts` | המוח של האפליקציה - AI Director |
| `src/data/prompts.ts` | System prompt מלא עם כל הכללים |
| `src/components/ProtocolScreen.tsx` | המסך הראשי - כל הלוגיקה |
| `src/services/sync-service.ts` | סנכרון בזמן אמת |
| `.env` | מפתחות API (לא בGit!) |
| `README.md` | מדריך מלא להתקנה ושימוש |

---

## פקודות נפוצות

```bash
# התקנת תלויות
npm install

# הרצת dev server
npm run dev

# בנייה לproduction
npm run build

# בדיקת TypeScript (ללא build)
npx tsc --noEmit

# preview של build
npm run preview
```

---

## בעיות ידועות

### אזהרות (לא קריטי)
- ⚠️ CSS import position warning בבנייה - לא משפיע על פונקציונליות

### מה לבדוק לפני הרצה ראשונה
1. ✅ Gemini API key בתוקף
2. ✅ חיבור אינטרנט
3. ✅ Node.js 18+ מותקן
4. ✅ npm מעודכן

---

## תיקונים שבוצעו במהלך הפיתוח

1. ✅ תיקון `languages.ts` - שבירת string ב-"Prends-moi"
2. ✅ תיקון `types.ts` - שבירת string ב-"favoriteScenarios"
3. ✅ הוספת `vite-env.d.ts` לתמיכה ב-`import.meta.env`
4. ✅ הוספת null checks ב-`ai-engine.ts`
5. ✅ הסרת imports לא בשימוש
6. ✅ שימוש ב-underscore prefix למשתנים לא בשימוש (_gender, _targetPhase)
7. ✅ פישוט קודי חיבור - מ-"rrx3-xxxxxxxxxxxx" ל-4 ספרות בלבד ("1900")
8. ✅ החלפת אימוג'ים ב-`GenderSelection.tsx` - מילדותיים (👦👧) לרומנטיים (🕺💃)
9. ✅ **שדרוג מפתח API** - המפתח הישן פג תוקף, עודכן מפתח חדש בכל המקומות:
   - `index.html` (window.ENV)
   - `.env` (פיתוח מקומי)
   - `.env.master` (גיבוי גלובלי)
10. ✅ **הפריסה ל-GitHub Pages** - האפליקציה חיה ב-https://raniv123.github.io/RRX3/
11. ✅ **תיקון פריסה (2026-02-16 21:45)** - תוקן באג בכניסה לאפליקציה:
   - הותקן `gh-pages` package
   - נוספו `homepage`, `predeploy`, `deploy` ל-package.json
   - הפריסה בוצעה בהצלחה ל-gh-pages branch
   - האפליקציה עובדת מושלם ב-https://raniv123.github.io/RRX3/

---

## גיבוי וניהול גרסאות

### GitHub Repository
- 🔗 **קישור:** https://github.com/Raniv123/RRX3
- 🔒 **סטטוס:** Private repository
- ✅ **גיבוי אוטומטי:** כל שדרוג יעלה אוטומטית ל-GitHub

### פקודות Git נפוצות
```bash
# לעדכן שינויים ב-GitHub
git add .
git commit -m "תיאור השינוי"
git push

# למשוך עדכונים
git pull

# לראות היסטוריה
git log --oneline
```

---

📅 **עדכון אחרון:** 2026-02-25
💬 **סטטוס:** ✅ **v5.3 — UX Cinematic: Mission texts + Timer ring + Loading screen + BreathSync**
🔥 **גרסה:** 5.3.0

---

## שינויים Session הזה (v5.3):

### 1. intimacy-missions.ts — שכתוב שפה חווייתית-חושנית
- כל הוראות המשימות שוכתבו מסגנון "הנחיות טכניות" לסגנון חוויה חושנית
- "ידך על ידה. שנייה אחת שלמה — בלי מילים" (לא "הנח יד על ידה לאט")
- משפטים פתוחים ("ואז...", "כדי ש...")
- Tips — כמו לחישה מאוהב/ת מנוסה, לא ספר לימוד
- Choices descriptions — מפתות ולא תיאוריות

### 2. ProtocolScreen.tsx — Timer עם טבעת SVG circular progress
- **הוסר:** כפתור "התחל ספירה" — הטיימר מתחיל אוטומטית (1.5s delay)
- **נוסף:** SVG circular ring במקום מספר גדול
- הטבעת מתרוקנת ככל שהזמן עובר (stroke-dashoffset)
- שינוי צבע לאדום ב-25% אחרון
- "מתחיל..." placeholder במקום הכפתור

### 3. App.tsx — מסך טעינה סינמטי
- **הוחלף:** אנימציה פשוטה בתמונה עם particles ambient
- Pulsing orb עם ping animation
- טקסט "המסע שלכם" + כותרת אטמוספרית
- שלוש נקודות קטנות (ולא גדולות)

### 4. BreathSyncScreen.tsx — טקסטים אינטימיים יותר
- "הגעתם?" → "כאן, סוף סוף."
- "אני כאן ✨" → "כן. אני כאן."
- "מוכנים להתחיל" → "מוכנים לצלול"
- "עוברים לנשימה..." → "נשימה אחת ביחד לפני שמתחילים..."
- "שאפו יחד..." → "שאפו... יחד"
- "עצרו..." → "תחזיקו."
- "שחררו לאט..." → "שחררו הכל."
- "מוכנים למסע" → "המסע מתחיל."
- "נכנסים..." → "עכשיו." (הוסר bouncing dots)

---

## שינויים Session קודם (v5.2):

### 1. MissionCard — עיצוב מחדש מלא (luxury fullscreen card)
- **לפני:** inline card קטן בתוך הצ'אט
- **אחרי:** fullscreen overlay (`fixed inset-0 z-50`) עם:
  - רקע blur כבד (`backdrop-filter: blur(28px)`) + שחור 90%
  - תמונה ממחישה (Unsplash) בגובה 210px עם gradient overlay
  - Phase badge + כפתור ✕ על התמונה
  - כותרת missions overlaid על תחתית התמונה
  - הוראה ראשית בטיפוגרפיה עדינה (font-weight 300, line-height 1.85)
  - Tips מספריים עם עיגולים צבעוניים
  - Choices grid עם premium hover effects
  - טיימר גדול (38px monospace) עם glow effect
  - כפתור Done עם gradient + box-shadow
  - **צד מחכה (inactive):** slim floating bar (`fixed bottom-24`)

### 2. Photo URLs לכל משימה
- הוספת `photoUrl?: string` ל-`IntimacyMission` interface
- כל 9 משימות קיבלו URL של תמונה מ-Unsplash
- `onError` handler — fallback לגרדיאנט CSS אומנותי כשהתמונה לא נטענת
- הגרדיאנט: `radial-gradient` דינמי לפי phase color

### 3. Word chips — לשון ספציפית לפי מין
- גבר: "אני לא אמור להסתכל עלייך ככה אבל..."
- אשה: "יש משהו בך שמשאיר אותי לא שקטה..."
- אין יותר צורות כפולות כמו "שאתה/את"

### 4. ActionTip — מאמן AI חד וספציפי
- הוראות גוף-ספציפיות, לא גנריות
- שינוי לפי phase: FIRE = פעולות פיזיות מתקדמות

### 5. Phase advance sync
- לחיצת גבר על "קדם שלב" → BREATH_START message לשניהם
- האשה מקבלת עדכון tension אוטומטי

### 6. זהות מועשרת
- `desire` field חדש ("מה אני מחפש/ת הלילה הזה")
- backstory ארוך יותר (3-4 משפטים)
- meetContext (2-3 משפטים + תגובה רגשית)
- כרטיס זהות: hero avatar + backstory + desire + secrets + personality

---

## קבצים שהשתנו ב-session הזה:
- `src/data/intimacy-missions.ts` — photoUrl + interface field
- `src/components/ProtocolScreen.tsx` — MissionCard redesign מלא
- `src/data/prompts.ts` — gender-specific chips + actionTip coach
- `src/services/ai-engine.ts` — gender-aware fallbacks
- `src/types.ts` — desire field

---

## מה נשאר לעשות (פעם הבאה):

### עדיפות גבוהה — תיקון צורות כפולות (27 ממצאים):

**`ProtocolScreen.tsx`:**
- שורה `1189`: `title="הסוד שלו/שלה"` → `myGender === 'MAN' ? 'הסוד שלה' : 'הסוד שלו'`
- שורה `1554`: `בוא/י נתחיל ✨` → `myGender === 'MAN' ? 'בוא נתחיל' : 'בואי נתחיל'`
- שורה `1567`: `הסוד שלו/שלה` → כנ"ל
- שורה `1578`: `רק אתה/את רואה את זה` → לפי מין

**`prompts.ts`:**
- שורה `213`: `אני משחק/ת:` → `isMAN ? 'אני משחק:' : 'אני משחקת:'`
- שורה `233`: `מה שאני מסתיר/ה` → `isMAN ? 'מסתיר' : 'מסתירה'`
- שורה `246`: `שלו/שלה` → `isMAN ? 'שלה' : 'שלו'`
- שורה `251`: `הציע/י "בוא/י נשחק בקובייה"` → שתי צורות לתקן

**`ai-engine.ts` (scenarioTypes):**
- שורה `170`: `רופא ומטופל.ת` → `רופא ומטופלת`
- שורה `171`: `מורה פרטי.ת`, `הגיע/ה`, `מצא/ה` וכו' → לנקות

**`languages.ts` (17 שורות):**
- `את/ה משגע/ת אותי`, `נשק/י אותי`, `אל תעצור/י` וכו'
- כל ביטוי צריך שני variants לפי מין המשתמש

### עדיפות בינונית:
- [ ] לבדוק שהתמונות של Unsplash נטענות (ייתכן שה-IDs לא נכונים)
  - אם לא → לבחור IDs חדשים או לעבור ל-Pexels CDN
- [ ] לבדוק שה-MissionCard נראה נכון על מובייל אמיתי

---

🔗 **GitHub:** https://github.com/Raniv123/RRX3
🌐 **קישור חי:** https://raniv123.github.io/RRX3/ ✅ פעיל!
