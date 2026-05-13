import { GoogleGenAI } from '@google/genai';
import { Message, AIResponse, Scenario, UserGender, AvatarImages } from '../types';
import { buildAIPrompt } from '../data/prompts';
import { log } from '../utils/logger';

const API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || (window as any).ENV?.VITE_GEMINI_API_KEY) as string;

export class AIEngine {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  // המלצת AI — מחזיר word chips + game card
  async getRecommendation(
    messages: Message[],
    tension: number,
    phase: string,
    gender: UserGender,
    scenario: Scenario
  ): Promise<AIResponse> {
    try {
      const prompt = buildAIPrompt(messages, tension, phase, gender, scenario);

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      if (!response.text) throw new Error('No response from AI');

      const data = JSON.parse(response.text);

      // ולידציה בסיסית
      if (!data.wordChips || !Array.isArray(data.wordChips)) {
        data.wordChips = this.getDefaultChips(phase, tension, gender);
      }
      if (!data.strategicAdvice) {
        data.strategicAdvice = this.getDefaultAdvice(phase, gender);
      }
      if (!data.actionTip) {
        data.actionTip = this.getDefaultActionTip(phase, tension, gender);
      }

      return data as AIResponse;

    } catch (error) {
      log.error('AI Engine Error', error);
      return this.getFallbackResponse(tension, phase, gender);
    }
  }

  // יצירת אווטרים CGI לשני הדמויות
  async generateAvatars(scenario: Scenario): Promise<AvatarImages> {
    const results: AvatarImages = { MAN: null, WOMAN: null };

    try {
      const [manAvatar, womanAvatar] = await Promise.allSettled([
        this.generateAvatar(scenario.roles.MAN.visualPrompt, true),
        this.generateAvatar(scenario.roles.WOMAN.visualPrompt, false)
      ]);

      if (manAvatar.status === 'fulfilled' && manAvatar.value) {
        results.MAN = manAvatar.value;
      }
      if (womanAvatar.status === 'fulfilled' && womanAvatar.value) {
        results.WOMAN = womanAvatar.value;
      }
    } catch (error) {
      log.error('Avatar generation failed', error);
    }

    return results;
  }

  // נסה FAL.ai קודם, fallback ל-Gemini
  async generateAvatar(visualPrompt: string, isMan: boolean): Promise<string | null> {
    // Try FAL.ai first
    const falUrl = await this.generateAvatarFAL(visualPrompt, isMan);
    if (falUrl) return falUrl;

    // Fallback to Gemini
    return this.generateSingleAvatarGemini(visualPrompt, isMan ? 'male' : 'female');
  }

  // FAL.ai Flux-schnell avatar generation
  async generateAvatarFAL(visualPrompt: string, isMan: boolean): Promise<string | null> {
    try {
      const falKey = import.meta.env.VITE_FAL_KEY;
      if (!falKey) return null;

      const genderDesc = isMan
        ? 'handsome man, masculine, confident'
        : 'beautiful woman, elegant, feminine';

      const prompt = `${visualPrompt}, ${genderDesc}, portrait photo, professional headshot, soft lighting, shallow depth of field, photorealistic, cinematic, 8k`;

      const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${falKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          image_size: 'square_hd',
          num_inference_steps: 4,
          num_images: 1,
        }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data?.images?.[0]?.url ?? null;
    } catch {
      return null;
    }
  }

  private async generateSingleAvatarGemini(visualPrompt: string, gender: 'male' | 'female'): Promise<string | null> {
    try {
      const prompt = `Cinematic CGI portrait, photorealistic, dark luxury atmosphere, ${visualPrompt}. ${
        gender === 'male'
          ? 'Handsome man, strong jawline, mysterious expression, blue-tinted dramatic lighting'
          : 'Beautiful woman, elegant, sensual expression, warm pink-tinted dramatic lighting'
      }. Ultra detailed, 8K, film photography style, shallow depth of field. NO text, NO watermark.`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: prompt,
        config: {
          responseModalities: ['IMAGE', 'TEXT'],
        } as any
      });

      const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      if (part?.inlineData?.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
      return null;
    } catch {
      return null;
    }
  }

  // יצירת תרחיש עם AI
  async createScenario(): Promise<Scenario> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );
      return await Promise.race([this.generateScenarioWithAI(), timeoutPromise]);
    } catch (error) {
      log.error('Scenario Creation Error', error);
      return this.getDefaultScenario();
    }
  }

  private async generateScenarioWithAI(): Promise<Scenario> {
    // בחר סוג תרחיש אקראי מתוך רשימה מגוונת
    const scenarioTypes = [
      'זרים שנפגשו במקרה: שני אנשים שמסתבר יש ביניהם כימיה בלתי צפויה — במלון, כנס עסקי, טיסה, אירוע חברתי',
      'אהבה ישנה שחוזרת: שני אנשים שהיו קשורים בעבר, נפרדו ונפגשו שוב — עם כל מה שנשאר ביניהם',
      'קולגות אסורים: שניים שעובדים יחד ומשהו מתפתח שהם אמורים לעצור — מנהל ועובד, שותפים עסקיים',
      'סוף שבוע רחוק: שני אנשים שנסעו לנופש ומצאו את עצמם לבד בסיטואציה אינטימית — וילה, בית מלון, צימר',
      'שכנים שגילו אחד את השני: חיים קרוב, תמיד נראו, אבל פתאום הכל שונה',
      'אמן ומוזה: צלם/מאייר/סופר ומישהו שמשמש השראה — ובניהם גבול שנמס',
      'בחור ישיבה וסמינריסטית: שניים שגדלו בעולמות שונים, נפגשים, וביניהם משיכה שלא אמורה להיות',
      'רופא ומטופלת: גבול מקצועי שביניהם מתח שלא צריך להיות — אסור אבל קיים',
      'מורה פרטית ומשפחה: הגיעה ללמד את הילד, אבל מצאה את עצמה מתוודעת להורה',
      'גיבור הצלה: מישהו שהציל את השני — פיזית או רגשית — ועכשיו הם לבד עם מה שנוצר'
    ];
    const chosenType = scenarioTypes[Math.floor(Math.random() * scenarioTypes.length)];

    const prompt = `
אתה יוצר תרחיש רולפליי אינטימי וחושני לזוג ישראלי עם אלמנט של מתח מיני.

⚠️ חובה: כל הטקסטים בעברית ישראלית! הכל — כותרת, מיקום, אווירה, שמות, ארכיטיפים.
⚠️ sceneKeywords חייבים להיות באנגלית בלבד (לחיפוש תמונות).

🎭 סוג התרחיש שנבחר: ${chosenType}

🔥 עקרונות:
1. שניהם מתחילים ממקומות שלא מובילים בדרך כלל לרגע כזה
2. יש אלמנט של "אסור" או "לא צריך לקרות" שמוסיף מתח
3. התנגדות שמתמוססת לתשוקה — אבל בצורה אמינה ואנושית
4. מפתיע, חושני, מציאותי

חשוב: ללא דת, ללא רקע דתי, ללא הקשר דתי כלשהו. רק אנשים, רגשות, ומתח אנושי.
לא אלימות. רק תשוקה, פיתוי, והתנגדות שנשברת לאט.

🖼️ sceneKeywords — תמונות רקע לכל שלב (באנגלית, מתאים לסיטואציה הספציפית):
- ICE: מקום ציבורי/חצי-פרטי שהפגישה מתחילה בו (מסעדה, בר, לובי מלון, גלריה, משרד...)
- WARM: המקום מתקרב, חצי-פרטי (גן בלילה, פינת ישיבה, מרפסת, בר קטן...)
- HOT: מקום אינטימי (חדר מלון עם נוף, וילה, מרפסת אחורית...)
- FIRE: מקום פרטי לחלוטין, חושני, לוהט (חדר שינה עם נרות, ספא פרטי, חדר עם אמבטיה...)

📖 זהות עמוקה לכל דמות — פרטית, אישית, מרגשת:

MAN.backstory: 3-4 משפטים — מי הוא באמת, מה הוא עושה בחיים, מה ההתמודדות האישית שלו, מה הוביל אותו לערב הזה
MAN.meetContext: 2-3 משפטים בגוף ראשון — הרגע הספציפי שהוא שם לב אליה, מה ספציפית משך אותו, מה הוא הרגיש ברגע הזה
MAN.desire: משפט אחד — מה הוא מחפש ממנה בלילה הזה (לא רק פיזי — גם רגשי). גוף ראשון. "אני מחפש..."

WOMAN.backstory: 3-4 משפטים — מי היא באמת, מה היא עושה בחיים, מה ההתמודדות האישית שלה, מה הוביל אותה לערב הזה
WOMAN.meetContext: 2-3 משפטים בגוף ראשון — הרגע הספציפי שהיא שמה לב אליו, מה ספציפית משך אותה, מה היא הרגישה ברגע הזה
WOMAN.desire: משפט אחד — מה היא מחפשת ממנו בלילה הזה. גוף ראשון. "אני מחפשת..."

דוגמה איכותית לbackstory: "ארכיטקט, 34. עזבתי את תל אביב לפני שנה אחרי גירושין שלא ציפיתי להם — עברתי לחיפה כדי להתחיל מאפס. בחודשים האחרונים שקעתי בעבודה: פרויקטים, לילות ארוכים, ואנשים שלא שאלתי אותם מה שמם. ועכשיו כאן, ערב שלא תכננתי שיקרה."

🔐 secrets — הסוד הכי אינטימי:
- MAN: משפט ספציפי — מה הדמות הכי אוהבת שעושים לו (פיזית ורגשית)
- WOMAN: משפט ספציפי — מה הדמות הכי אוהבת שעושים לה
  דוגמאות: "כשנוגעים לו בעדינות מאחור ולוחשים לו" / "כשהוא מחזיק אותה חזק ומסתכל לה לעיניים" / "כשלוחשים לה בדיוק מה שיעשו לה"

החזר JSON בלבד:
{
  "id": "unique-id",
  "title": "כותרת בעברית",
  "location": "מיקום בעברית",
  "atmosphere": "אווירה בעברית",
  "roles": {
    "MAN": {
      "name": "שם פרטי",
      "archetype": "ארכיטיפ בעברית",
      "personality": "תכונות אישיות קצרות בעברית",
      "backstory": "מי הוא — 3-4 משפטים אישיים ועמוקים על הדמות: מה הוא עושה, ההתמודדות שלו, מה הוביל אותו לכאן",
      "meetContext": "2-3 משפטים בגוף ראשון — הרגע שהוא שם לב אליה, מה ספציפית משך אותו, מה הוא הרגיש",
      "desire": "אני מחפש... — מה הוא מחפש ממנה בלילה הזה (רגשי + פיזי)",
      "accent": "french|spanish|italian",
      "visualPrompt": "English visual description for CGI avatar",
      "forbidden": "למה זה אסור לו בעברית"
    },
    "WOMAN": {
      "name": "שם פרטי",
      "archetype": "ארכיטיפ בעברית",
      "personality": "תכונות אישיות קצרות בעברית",
      "backstory": "מי היא — 3-4 משפטים אישיים ועמוקים על הדמות: מה היא עושה, ההתמודדות שלה, מה הוביל אותה לכאן",
      "meetContext": "2-3 משפטים בגוף ראשון — הרגע שהיא שמה לב אליו, מה ספציפית משך אותה, מה היא הרגישה",
      "desire": "אני מחפשת... — מה היא מחפשת ממנו בלילה הזה (רגשי + פיזי)",
      "accent": "french|spanish|italian",
      "visualPrompt": "English visual description for CGI avatar",
      "forbidden": "למה זה אסור לה בעברית"
    }
  },
  "twists": ["טוויסט בעברית", "טוויסט בעברית"],
  "scenarios": ["מצב בעברית", "מצב בעברית"],
  "sceneKeywords": {
    "ICE": "elegant restaurant evening candlelight",
    "WARM": "private garden night romantic",
    "HOT": "luxury hotel suite balcony view",
    "FIRE": "intimate bedroom candles dark sensual"
  },
  "secrets": {
    "MAN": "מה הכי מטריף אותו — ספציפי ואישי",
    "WOMAN": "מה הכי מטריפה אותה — ספציפי ואישי"
  }
}
    `;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    if (!response.text) throw new Error('No response');
    const parsed = JSON.parse(response.text);
    if (!parsed.title || !parsed.roles?.MAN || !parsed.roles?.WOMAN) {
      throw new Error('Invalid structure');
    }
    return parsed;
  }

  private getDefaultChips(phase: string, _tension: number, gender: UserGender = 'MAN'): string[] {
    const isMAN = gender === 'MAN';
    const chipsMap: Record<string, string[]> = {
      ICE: isMAN ? [
        'יש משהו בך שמשאיר אותי לא שקט...',
        'אני לא אמור להסתכל עלייך ככה אבל...',
      ] : [
        'יש משהו בך שמשאיר אותי לא שקטה...',
        'אני לא אמורה להרגיש ככה אבל...',
      ],
      WARM: isMAN ? [
        'לא ציפיתי לרגש כזה כשראיתי אותך היום...',
        'יש לך עיניים שמספרות דברים שאת לא אומרת בפה...',
      ] : [
        'לא ציפיתי לרגש כזה כשראיתי אותך היום...',
        'יש לך עיניים שמספרות דברים שאתה לא אומר בפה...',
      ],
      HOT: isMAN ? [
        'אני לא יכול להפסיק לחשוב על מה שאת מרגישה...',
        'כשאת מדברת ככה אני בכלל לא שומע מה שאמרת...',
      ] : [
        'אני לא יכולה להפסיק לחשוב על מה שאתה מרגיש...',
        'כשאתה מדבר ככה אני בכלל לא שומעת מה שאמרת...',
      ],
      FIRE: isMAN ? [
        'אני רוצה אותך עכשיו — לא בעוד רגע...',
        'הגוף שלך גורם לי לרצות...',
      ] : [
        'אני רוצה אותך עכשיו — לא בעוד רגע...',
        'הגוף שלך גורם לי לרצות...',
      ]
    };
    return chipsMap[phase] || chipsMap.ICE;
  }

  private getDefaultAdvice(phase: string, _gender: UserGender = 'MAN') {
    return {
      forMan: phase === 'ICE'
        ? '💫 קח נשימה עמוקה — תסתכל לה ישר לעיניים ותחייך בשקט. אתה לא צריך לדבר הרבה'
        : phase === 'WARM'
        ? '🔥 היא מרגישה אותך — תתקרב כמה סנטימטרים, בלי מילים. הגוף אומר הכל'
        : phase === 'HOT'
        ? '🌶️ תוריד את הקצב — ככל שאתה ממשיך לאט יותר, היא רוצה יותר מהר'
        : '🔥 אל תחכה לאישור — קח את מה שאתה רוצה, בעדינות אבל בביטחון',
      forWoman: phase === 'ICE'
        ? '✨ תני לו לראות שאת מרגישה משהו — מבט ישיר, חיוך אחד, ואז הסתכלי הצידה'
        : phase === 'WARM'
        ? '💋 ליחשי לו משהו — ממש לאוזן. זה יוציא אותו מהאוטופיילוט לגמרי'
        : phase === 'HOT'
        ? '🔥 את בשליטה עכשיו — שימי יד על ידו לאט. ותשמרי על קשר עין'
        : '💋 תגידי לו בדיוק מה את רוצה — מילה אחת, ישר. הוא מחכה לזה'
    };
  }

  getDefaultActionTip(phase: string, tension: number = 0, gender: UserGender = 'MAN'): string {
    const isMAN = gender === 'MAN';
    if (phase === 'FIRE') {
      if (tension >= 93) return '🤫 קוביית תנוחה — לחצו על ה-🎲 למטה לתנוחה הבאה';
      if (tension >= 87) return isMAN
        ? '🤫 בקש ממנה שתיקח אותך לפה — ותגיד לה בדיוק מה אתה רוצה שהיא תעשה'
        : '🤫 קחי אותו לפה לאט — שפתיים לחוצות, עיגולים, ואז עומק. דקה שלמה';
      if (tension >= 81) return isMAN
        ? '🤫 לקק אותה לאט — מלמעלה למטה, עיגולים, בלי למהר. תשמע מה היא אומרת'
        : '🤫 לקקי מסביב לזין שלו, עיגולים — דקה שלמה בלי לגעת ישירות. הוא ישתגע';
      if (tension >= 76) return isMAN
        ? '🤫 פתח לה את החולצה לאט — כפתור כפתור, תסתכל לה לעיניים בכל כפתור'
        : '🤫 הורידי פריט לבוש אחד לאט — עם הגב אליו. שיראה אבל לא יגע עדיין';
      return isMAN
        ? '🤫 שב כל כך קרוב שתרגיש את חומה — אל תגע עדיין. תן לה לרצות קודם'
        : '🤫 שבי כל כך קרוב שתרגישי את חומו — אל תגעי עדיין. תני לו לרצות קודם';
    }
    if (isMAN) {
      const tips: Record<string, string> = {
        ICE: '🤫 תסתכל לה ישר לעיניים ואל תסיט מבט — שנייה אחת של שקט שווה יותר מעשר משפטים',
        WARM: '🤫 לחש לה ישר לאוזן — קרוב כל כך שתרגיש את הנשימה שלך. ותעצור שם שנייה',
        HOT: '🤫 שים יד על ירכה — לאט, בכוונה. ותחכה שנייה שלמה לפני שזזת'
      };
      return tips[phase] || tips.ICE;
    } else {
      const tips: Record<string, string> = {
        ICE: '🤫 תסתכלי לו ישר לעיניים ואל תסיטי מבט — שנייה אחת של שקט שווה יותר מעשר משפטים',
        WARM: '🤫 לחשי לו ישר לאוזן — קרוב כל כך שיירגיש את הנשימה שלך. ותעצרי שם שנייה',
        HOT: '🤫 שימי יד על ירכו — לאט, בכוונה. ותחכי שנייה שלמה לפני שזזת'
      };
      return tips[phase] || tips.ICE;
    }
  }

  private getFallbackResponse(tension: number, phase: string, gender: UserGender = 'MAN'): AIResponse {
    return {
      strategicAdvice: this.getDefaultAdvice(phase, gender),
      wordChips: this.getDefaultChips(phase, tension, gender),
      actionTip: this.getDefaultActionTip(phase, tension, gender),
      gameCard: undefined,
      tension,
      phase: phase as any,
      currentGoal: 'המשך המסע ביחד'
    };
  }

  getDefaultScenarioPublic(): Scenario {
    return this.getDefaultScenario();
  }

  private getDefaultScenario(): Scenario {
    return {
      id: 'default-forbidden',
      title: 'הפסיכולוג והמטופלת הנשואה',
      location: 'משרד פרטי מאוחר בערב',
      atmosphere: 'אינטימי, מתוח, אסור',
      roles: {
        MAN: {
          name: 'ד"ר אלכס',
          archetype: 'פסיכולוג מוערך',
          personality: 'אמפטי, מקצועי, נאבק עם הרגשות',
          accent: 'french',
          visualPrompt: 'Elegant psychologist in dimly lit office, conflicted expression, dark suit',
          forbidden: 'הפרת אתיקה מקצועית - הוא המטפל שלה'
        },
        WOMAN: {
          name: 'סופיה',
          archetype: 'אישה נשואה בקשיים',
          personality: 'פגיעה, מושכת, מחפשת נחמה',
          accent: 'italian',
          visualPrompt: 'Married woman in elegant red dress, vulnerable yet seductive, soft lighting',
          forbidden: 'נשואה - בוגדת בבעלה עם המטפל'
        }
      },
      twists: ['הבעל מתקשר', 'מישהו דופק בדלת', 'היא מגלה שגם הוא נשוי'],
      scenarios: ['פגישה שנמשכת מעבר לזמן', 'נגיעה בטעות שמתארכת', 'הודאה בתשוקה'],
      secrets: {
        MAN: 'כשהיא לוחשת לו באוזן ומכניסה ידיים מתחת לחולצה מאחור',
        WOMAN: 'כשהוא מביט בה ישירות בעיניים ומחזיק את ידיה בחוזקה'
      }
    };
  }
}
