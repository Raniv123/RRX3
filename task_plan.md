# Task Plan: RRX3 v4.0 Upgrade
📅 2026-02-23

## Goal
שדרוג מסודר של 4 תחומים: זרימה, אווטרים AI, שיחת AI, עיצוב

## Priority Order
1. 🔴 זרימה — הגדרת כל שלב מדויק לגבר ולאשה
2. 🟠 אווטרים AI — FAL.ai Flux במקום Gemini/Unsplash
3. 🟡 שיחת AI — prompts עשירים + secrets + accent
4. 🟢 עיצוב — ScenarioIntro + progress ring + avatars

---

## Current Phase
**Waiting for user approval**

---

## Phase 1: זרימה מחודשת (FLOW)
- **Risk:** Medium-High (שינוי App.tsx, הזרימה המרכזית)
- **Validation:** Level 1 (tsc) + Level 3 (test all 5 entry flows) + Level 4 (manual)
- **Files:** `src/App.tsx`, `src/types.ts`
- **Status:** pending

### מה משתנה

#### זרימת גבר (Host) — חדשה
```
LOGIN → "התחל מסע חדש"
  → CONNECT (קישור מפתה בלבד, ברירת מחדל)
  → [מחכה ל-JOIN signal]
  → [auto: myGender = MAN] ← חדש! לא עובר GENDER_SELECTION
  → AI יוצר Scenario
  → SCENARIO_INTRO ← חדש! הצגת התרחיש + דמויות
  → BREATH_SYNC (48s)
  → PROTOCOL
```

#### זרימת אשה (invite פשוט) — חדשה
```
URL ?invite=CODE → INVITATION (דף מפתה)
  → "אני מוכנה" → handleLogin(code, false)
  → [auto: myGender = WOMAN] ← חדש!
  → [מחכה לScenario מHost]
  → SCENARIO_INTRO
  → BREATH_SYNC
  → PROTOCOL
```

#### זרימת אשה (הזמנה מיוחדת) — חדשה
```
URL ?msg+time+invite → INVITE_RECEIVED (מעטפה)
  → "אני בא/ה!" → WAITING (ספירה + הכנה)
  → [הגיע הזמן] → handleLogin(code, false)
  → [auto: myGender = WOMAN]
  → [מחכה לScenario]
  → SCENARIO_INTRO
  → BREATH_SYNC
  → PROTOCOL
```

### Steps (bite-sized)

**Step 1:** הוספת SCENARIO_INTRO ל-AppScreen type
- `src/types.ts` — הוספת 'SCENARIO_INTRO' ל-Screen type
- `src/App.tsx` — הוספת 'SCENARIO_INTRO' ל-AppScreen

**Step 2:** auto-gender — הגבר תמיד MAN, האשה תמיד WOMAN
- ב-`handleLogin` — אם host, set myGender='MAN' אוטומטית
- ב-`handleLogin` — אם joiner (invite/regular), set myGender='WOMAN'
- הסרת GENDER_SELECTION מהזרימה

**Step 3:** הוספת מעבר ל-SCENARIO_INTRO
- אחרי scenario נוצר/התקבל → setScreen('SCENARIO_INTRO')
- במקום ישירות ל-BREATH_SYNC

**Step 4:** יצירת ScenarioIntroScreen component (שלד)
- `src/components/ScenarioIntroScreen.tsx` — שלד בסיסי
- Props: scenario, myGender, onContinue
- מציג: כותרת, מיקום, שמות דמויות, "מוכנים?"
- onContinue → BREATH_SYNC

**Step 5:** Type check + manual test
```bash
npx tsc --noEmit
```

**Step 6 (optional):** שמירת GenderSelection כ-fallback
- אם מישהו נכנס דרך LOGIN רגיל (לא invite) כ-joiner → GENDER_SELECTION
- רק למקרי קצה

---

## Phase 2: אווטרים AI עם FAL.ai (AVATARS)
- **Risk:** Medium (שירות חיצוני, אבל יש fallback)
- **Validation:** Level 1 (tsc) + Level 2 (unit test) + Level 4 (visual check)
- **Files:** `src/services/ai-engine.ts`, `.env`, `package.json`
- **Status:** pending

### Context References
- `src/services/ai-engine.ts:57-104` — generateAvatars() + generateSingleAvatar()
- `src/services/ai-engine.ts:80-103` — Gemini image gen (להחליף)
- `src/components/ProtocolScreen.tsx:182-214` — SCENARIO_ROLE_PHOTOS (fallback)

### Steps

**Step 1:** Sync FAL_KEY
```bash
# הוספת VITE_FAL_KEY ל-.env מ-env.master
```

**Step 2:** Install FAL.ai client
```bash
npm install @fal-ai/client
```

**Step 3:** יצירת generateAvatarWithFAL() ב-ai-engine.ts
```typescript
private async generateAvatarWithFAL(visualPrompt: string, gender: 'male' | 'female'): Promise<string | null> {
  try {
    const fal = await import('@fal-ai/client');
    fal.config({ credentials: import.meta.env.VITE_FAL_KEY });

    const prompt = `Cinematic portrait, photorealistic, dark luxury atmosphere, ${visualPrompt}. ${
      gender === 'male'
        ? 'Handsome man, strong jawline, mysterious expression, blue-tinted dramatic lighting'
        : 'Beautiful woman, elegant, sensual expression, warm pink-tinted dramatic lighting'
    }. Ultra detailed, film photography style, shallow depth of field. NO text, NO watermark.`;

    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: { prompt, image_size: 'square_hd', num_images: 1 }
    });

    return result.data?.images?.[0]?.url || null;
  } catch {
    return null;
  }
}
```

**Step 4:** עדכון generateAvatars() — FAL first, then Gemini fallback, then Unsplash
```typescript
async generateAvatars(scenario: Scenario): Promise<AvatarImages> {
  const results: AvatarImages = { MAN: null, WOMAN: null };

  // Try FAL.ai first (best quality)
  const [manFAL, womanFAL] = await Promise.allSettled([
    this.generateAvatarWithFAL(scenario.roles.MAN.visualPrompt, 'male'),
    this.generateAvatarWithFAL(scenario.roles.WOMAN.visualPrompt, 'female')
  ]);

  if (manFAL.status === 'fulfilled' && manFAL.value) results.MAN = manFAL.value;
  if (womanFAL.status === 'fulfilled' && womanFAL.value) results.WOMAN = womanFAL.value;

  // Fallback to Gemini for missing avatars
  if (!results.MAN || !results.WOMAN) {
    // ... existing Gemini logic for missing ones
  }

  return results;
}
```

**Step 5:** Type check + test
```bash
npx tsc --noEmit
npm run dev  # → Visual check: avatars load
```

---

## Phase 3: שיפור שיחת AI (PROMPTS)
- **Risk:** Medium (שינוי prompts משפיע על כל השיחה)
- **Validation:** Level 1 (tsc) + Level 2 (test prompt output) + Level 4 (manual)
- **Files:** `src/data/prompts.ts`, `src/services/ai-engine.ts`
- **Status:** pending

### Context References
- `src/data/prompts.ts:3-101` — SYSTEM_PROMPT
- `src/data/prompts.ts:103-224` — buildAIPrompt()
- `src/services/ai-engine.ts:15-55` — getRecommendation()

### Steps

**Step 1:** הוספת secrets ל-buildAIPrompt
- אחרי "הדמות שמולי" → הוספה:
```
## הסוד של הדמות שמולי (רק אתה/את רואה!):
${scenario.secrets?.[otherGender] || 'לא הוגדר'}
```
- זה אומר: הגבר רואה את הסוד של האשה (מה מטריף אותה) ולהפך

**Step 2:** הוספת accent integration לSYSTEM_PROMPT
- בסעיף wordChips:
```
- אם לדמות יש accent (french/spanish/italian), שלב ביטוי קצר אחד בשפה הזו
  באחד מה-chips (chip 3 או 4). דוגמה: "...ואם תבוא קרוב, אגיד לך... vieni qui"
```

**Step 3:** הוספת context summary ל-buildAIPrompt
- לפני ה-history:
```
## סטטיסטיקה:
- ${messages.length} הודעות עד כה
- שלב: ${phase} (${tension}%)
- המגמה: ${tension > 50 ? 'עולה' : 'בתחילת הדרך'}
```

**Step 4:** שיפור FIRE phase instructions
- ב-phaseInstructions.FIRE:
```
שלב אש 🔥 — מקום פרטי לחלוטין, ביחד, כבר אין גבולות.
משפטים: ללא עכבות, תשוקתיים, גופניים — ישירים ומגיבים לרגע
- אין יותר רמזים — הכל ישיר, גופני, תשוקתי
- chips מכילים תיאור פיזי (נגיעה, גוף, חום, ריח)
- actionTips: הנחיות פיזיות מאוד ספציפיות
- כל chip הוא כזה שגורם ללב לדפוק — לא generic
```

**Step 5:** הוספת twist integration
- בשלבים WARM-HOT, הוספה ל-prompt:
```
## טוויסטים אפשריים (השתמש רק אם מתאים לרגע):
${scenario.twists?.join(', ') || 'אין'}
```

**Step 6:** Type check
```bash
npx tsc --noEmit
```

---

## Phase 4: עיצוב משודרג (UI)
- **Risk:** Low-Medium (UI only)
- **Validation:** Level 1 (tsc) + Level 4 (visual check)
- **Files:** ScenarioIntroScreen (חדש), ProtocolScreen (עדכון)
- **Status:** pending

### Steps

**Step 1:** עיצוב ScenarioIntroScreen מלא
- רקע dark cinematic
- כותרת תרחיש (fade-in)
- מיקום + אווירה
- שמות הדמויות עם אווטרים (ימין/שמאל)
- אנימציות staggered (כל אלמנט בנפרד)
- כפתור "מוכנים" → BREATH_SYNC
- זמן מוצג: ~8-10 שניות (auto-continue optional)

**Step 2:** Progress Ring ב-ProtocolScreen
- הוספת visual progress indicator מעל המסך
- 4 segments: ICE (כחול) → WARM (כתום) → HOT (אדום) → FIRE (זהב)
- arc SVG עם transition חלקה
- טמפרטורה מספרית במרכז

**Step 3:** שדרוג Avatar display בצ'אט
- הגדלת אווטרים (64→80px)
- טבעת צבעונית לפי phase
- glow effect שמתעצם
- badge עם שם דמות

**Step 4:** Build + Deploy
```bash
npm run build
npm run deploy
```

---

## Phase 5: Build & Deploy
- **Risk:** Low
- **Validation:** Level 1 (build) + Level 4 (manual on live URL)
- **Status:** pending

### Steps
**Step 1:** Build
```bash
npm run build
```

**Step 2:** Deploy
```bash
npm run deploy
```

**Step 3:** Verify all 5 entry flows on live URL

---

## Decisions

| Decision | Rationale |
|----------|-----------|
| Auto-gender (host=MAN, joiner=WOMAN) | מייתר את GENDER_SELECTION ברוב המקרים, זרימה חלקה יותר |
| FAL.ai Flux over Gemini for avatars | FAL מהימן יותר, תמונות טובות יותר, FAL_KEY כבר קיים |
| flux-schnell model (not pro) | מהיר יותר (~2-4s vs 5-10s), מספיק טוב לאווטרים |
| Secrets visible to OTHER partner | הסוד שלך = מה שמטריף אותך = מוצג לבן/בת הזוג |
| ScenarioIntro before BreathSync | הזוג צריך לדעת במי הם משחקים לפני שמתחילים |
| Progress ring, not bar | Ring מתאים לUX מעגלי, תופס פחות מקום |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| (none yet) | | |

---

*Updated: 2026-02-23*
