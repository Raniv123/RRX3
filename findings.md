# RRX3 v4.0 Upgrade — Findings & Research
📅 2026-02-23

---

## 1. מיפוי זרימת משתמשים — מצב נוכחי

### א. גבר (Host) — זרימה נוכחית
```
LOGIN → "התחל מסע חדש" → CONNECT (מציג קוד/קישור)
  → [מחכה שהאשה תתחבר via JOIN signal]
  → GENDER_SELECTION → [בוחר MAN]
  → AI יוצר Scenario (gemini-2.0-flash)
  → BREATH_SYNC (48s, 3 סבבים)
  → PROTOCOL (המסך הראשי)
```

### ב. גבר (Host) עם הזמנה מיוחדת
```
LOGIN → "הפתע את הפרטנרית" → INVITE_COMPOSE (מכתב + שעה)
  → [מעתיק URL עם ?msg+time+invite] → CONNECT (מחכה לאשה)
  → GENDER_SELECTION → BREATH_SYNC → PROTOCOL
```

### ג. אשה — דרך קישור פשוט (?invite=CODE)
```
URL עם ?invite=CODE → INVITATION (דף נחיתה מפתה "הכנתי לך משהו")
  → "אני מוכנה לגלות" → handleLogin(code, false)
  → GENDER_SELECTION → [מחכה לScenario מHost]
  → BREATH_SYNC → PROTOCOL
```

### ד. אשה — דרך הזמנה מיוחדת (?msg=...&time=...&invite=...)
```
URL עם ?msg+time → INVITE_RECEIVED (מעטפה → מכתב → החלטה)
  → "אני בא/ה!" → WAITING (ספירה לאחור + טיפי הכנה + יומן)
  → [הגיע הזמן] → handleLogin(code, false)
  → GENDER_SELECTION → BREATH_SYNC → PROTOCOL
```

### ה. אשה — דרך מסך הכנה (?prepare=CODE&time=HH:MM)
```
URL עם ?prepare → PREP/WAITING (טיפי הכנה + ספירה)
  → [הגיע הזמן] → handleLogin(code, false)
  → GENDER_SELECTION → BREATH_SYNC → PROTOCOL
```

### בעיות מזוהות בזרימה

| # | בעיה | חומרה | פתרון |
|---|-------|--------|--------|
| 1 | GENDER_SELECTION מיותר — ברוב המקרים ברור מי גבר ומי אשה | בינונית | זיהוי אוטומטי מ-URL/host + אפשרות override |
| 2 | אין מסך הצגת תרחיש — הזוג לא רואה מה נבחר לפניהם | גבוהה | מסך ScenarioIntro חדש עם שמות + אווטרים |
| 3 | CONNECT מציג 2 טאבים — מורכב מדי | נמוכה | ברירת מחדל: קישור בלבד, קוד בנפרד |
| 4 | אין מסך סיום — כשמגיעים ל-FIRE 100% אין סגירה | בינונית | מסך EndScreen עם סיכום |
| 5 | שתי זרימות הזמנה — invite פשוט + invite מיוחדת | נמוכה | שתיהן לגיטימיות, אין צורך לאחד |
| 6 | Resume מוגבל — לא שומר הודעות | נמוכה | לא קריטי כרגע |

---

## 2. מצב אווטרים — ניתוח מעמיק

### מצב נוכחי
- **קובץ:** `src/services/ai-engine.ts` שורות 57-104
- **מודל:** `gemini-2.0-flash-exp` + `responseModalities: ['IMAGE', 'TEXT']`
- **Prompt:** "Cinematic CGI portrait, photorealistic, dark luxury..." + visualPrompt
- **בעיה ראשית:** המודל לא אמין ליצירת תמונות. הרבה failures
- **Fallback נוכחי:** `ProtocolScreen.tsx` שורות 182-214 — תמונות Unsplash סטטיות

### תמונות Unsplash הנוכחיות (fallback)
- `SCENARIO_ROLE_PHOTOS` — 5 IDs סטטיים (massage, boss, doctor, yoga, photographer)
- `DEFAULT_MEN` / `DEFAULT_WOMEN` — 6 תמונות כל אחד, נבחר בhash
- **בעיה:** AI-generated scenarios לא מקבלים תמונות מותאמות

### אפשרויות שדרוג

| אפשרות | זמן | עלות | איכות | UX |
|---------|------|------|--------|-----|
| **FAL.ai (Flux)** | 3-8 שניות | ~$0.05/תמונה | מעולה | גבוה |
| **Gemini Imagen 3** | 2-5 שניות | כלול בAPI | טובה | בינוני (לא אמין) |
| **Pre-gen 20 avatars** | 0ms | חד-פעמי | בינונית | נמוך (לא ייחודי) |
| **Hybrid: FAL + Unsplash fallback** | 0-8 שניות | ~$0.05 | מעולה | הכי גבוה |

### המלצה ברורה: **FAL.ai (Flux) + Unsplash fallback**

#### למה FAL.ai
- **FAL_KEY קיים** ב-`.env.master` — מוכן לשימוש
- **Flux models** (flux-pro, flux-schnell) — תמונות פוטוריאליסטיות מעולות
- **API פשוט** — HTTP POST עם prompt, מחזיר URL
- **מהיר** — flux-schnell ~2-4 שניות, flux-pro ~5-10 שניות
- **אפשר parallel** — שני אווטרים במקביל

#### איך זה עובד
```
Scenario נוצר → generateAvatars() נקרא
  → 2 קריאות FAL.ai במקביל (MAN + WOMAN)
  → כל אחת עם visualPrompt + "portrait, dark luxury, cinematic"
  → מחזיר URL של תמונה
  → אם נכשל → fallback ל-Unsplash
```

#### מה צריך
- `npm install @fal-ai/client`
- `VITE_FAL_KEY` ב-`.env`
- פונקציית `generateAvatarWithFAL()` חדשה
- fallback chain: FAL → Unsplash → SVG

---

## 3. מצב System Prompts — ניתוח מעמיק

### מה טוב (prompts.ts)
- SYSTEM_PROMPT מפורט עם שלב ניתוח לפני תשובה
- wordChips מגוונים (4 סוגים: רך, חושף, מסתורי, נועז)
- strategicAdvice כמו מנחה תיאטרון
- actionTips — 2 המלצות ספציפיות
- readingBetweenLines — ניתוח סאבטקסט
- כלל רגש — chips עוסקים ברגש, לא ברקע

### מה חסר

| # | חסר | השפעה | קובץ:שורה |
|---|------|--------|-----------|
| 1 | **secrets** לא מועברים ל-AI | האשה לא רואה "מה מטריף את הגבר" | `prompts.ts:176-222` |
| 2 | **accent** לא מנוצל | אין ביטויים בשפה זרה ב-chips | `prompts.ts:3-101` |
| 3 | **אין context summary** | AI לא יודע "עברנו 12 הודעות, הגענו ל-WARM" | `prompts.ts:110` |
| 4 | **FIRE stage** חלש | אין הנחיה מפורשת על dirty talk ועוצמה | `prompts.ts:162-169` |
| 5 | **אין dynamic temperature** | AI תמיד באותה "טמפרטורה" | `ai-engine.ts:26-29` |
| 6 | **אין twist/surprise** מ-AI | twists מהscenario לא מנוצלים | `prompts.ts:176-222` |

### שיפורים מתוכננים

1. **secrets integration** — הוספת secrets הדמות לprompt
   - "הסוד של הדמות שמולך: [secret]"
   - מועבר רק לצד הנכון (MAN רואה את secret של WOMAN ולהפך)

2. **accent/language integration** — ביקוש מAI לשלב ביטוי אחד בשפה זרה
   - "שלב ביטוי אחד ב-[accent] באחד מה-chips"

3. **context summary** — הוספת: "עד כה: X הודעות, Y דקות, שלב Z"

4. **FIRE enhancement** — הנחיות ספציפיות ומפורטות יותר

5. **twist integration** — בשלב WARM-HOT, AI יכול להכניס twist מהscenario

---

## 4. ניתוח עיצוב — 3 שינויים הכי משפיעים

### שינוי 1: מסך הצגת תרחיש (ScenarioIntroScreen)
- **מתי:** בין BREATH_SYNC ל-PROTOCOL
- **מה מוצג:** כותרת תרחיש, מיקום, אווירה, שמות הדמויות + אווטרים
- **למה:** הזוג צריך לדעת במי הם משחקים לפני שמתחילים
- **עיצוב:** dark cinematic, fade-in של כל אלמנט, אנימציה 8 שניות

### שינוי 2: Progress Ring/Bar ב-Protocol
- **מצב נוכחי:** רק טקסט "ICE" / "WARM" / "HOT" / "FIRE"
- **שדרוג:** arc/ring מעל המסך עם 4 segments צבעוניים
  - ICE = כחול קפוא, WARM = כתום, HOT = אדום, FIRE = אדום-זהב
  - אנימציה חלקה בין שלבים
  - טמפרטורה מספרית (0-100)

### שינוי 3: Avatar display משודרג בצ'אט
- **מצב נוכחי:** תמונות קטנות בעיגולים
- **שדרוג:** אווטרים גדולים יותר (64x64 → 80x80)
  - טבעת צבעונית לפי שלב (ICE=blue, WARM=orange, HOT=red, FIRE=gold)
  - glow effect שמתעצם עם tension
  - badge עם שם הדמות

---

## 5. API Keys זמינים

| שירות | Key Variable | מצב | מסונכרן ל-.env? |
|--------|-------------|------|------------------|
| Gemini | VITE_GEMINI_API_KEY | ✅ עובד | ✅ כן |
| FAL.ai | VITE_FAL_KEY | ✅ זמין ב-master | ❌ לא — צריך sync |
| Google | GOOGLE_API_KEY | ✅ זמין | לא נדרש |

---

## 6. תלויות חסרות

| חסר | צורך | פתרון |
|------|-------|--------|
| `@fal-ai/client` npm package | FAL.ai avatar gen | `npm install @fal-ai/client` |
| VITE_FAL_KEY ב-.env | FAL API access | sync מ-env.master |
| ScenarioIntroScreen component | הצגת תרחיש לפני protocol | ליצור קובץ חדש |

---

## 7. Risk Matrix

| Risk | P(1-5) | I(1-5) | Score | Mitigation |
|------|--------|--------|-------|------------|
| FAL.ai API failure | 2 | 3 | 6 | Fallback ל-Unsplash (כבר קיים) |
| Prompt too long (token limit) | 2 | 4 | 8 | Monitor token count, trim if needed |
| Avatar gen slow (>8s) | 3 | 2 | 6 | Show skeleton/placeholder, load async |
| Breaking existing flows | 2 | 5 | 10 | Test all 5 entry flows after changes |
| AI responses less diverse | 3 | 3 | 9 | A/B test old vs new prompts |
| Build/deploy failure | 1 | 3 | 3 | Test build locally first |

**Priority:** Breaking flows (10) > AI diversity (9) > Token limit (8) > rest

---

*Updated: 2026-02-23*
