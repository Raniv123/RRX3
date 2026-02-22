import { GoogleGenAI } from '@google/genai';
import { Message, AIResponse, Scenario, UserGender, AvatarImages } from '../types';
import { buildAIPrompt } from '../data/prompts';

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
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      if (!response.text) throw new Error('No response from AI');

      const data = JSON.parse(response.text);

      // ולידציה בסיסית
      if (!data.wordChips || !Array.isArray(data.wordChips)) {
        data.wordChips = this.getDefaultChips(phase, tension);
      }
      if (!data.strategicAdvice) {
        data.strategicAdvice = this.getDefaultAdvice(phase);
      }
      if (!data.actionTip) {
        data.actionTip = this.getDefaultActionTip(phase);
      }
      if (!data.actionTips || !Array.isArray(data.actionTips) || data.actionTips.length < 2) {
        data.actionTips = this.getDefaultActionTips(phase);
      }

      return data as AIResponse;

    } catch (error) {
      console.error('AI Engine Error:', error);
      return this.getFallbackResponse(tension, phase);
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
      console.error('Avatar generation failed:', error);
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
        model: 'gemini-2.0-flash-exp',
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
      console.error('Scenario Creation Error:', error);
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
      'רופא ומטופל.ת: גבול מקצועי שבניהם מתח שלא צריך להיות — אסור אבל קיים',
      'מורה פרטי.ת ומשפחה: הגיע/ה ללמד את הילד, אבל מצא/ה את עצמו/ה מתוודע/ת להורה',
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

🔐 secrets — הסוד הכי אינטימי של כל דמות (מה הכי מטריף אותם):
- MAN: משפט אחד ספציפי — מה הדמות הזו הכי אוהב/ת שעושים לו/לה (שרק בן/בת הזוג יראו)
- WOMAN: משפט אחד ספציפי — מה הדמות הזו הכי אוהב/ת שעושים לה (שרק בן/בת הזוג יראו)
  דוגמאות: "כשנוגעים לו בעדינות מאחור" / "כשלוחשים לה באוזן בזמן" / "כשמחזיקים אותה חזק" / "כשמביטים בו ישירות בעיניים"

החזר JSON בלבד:
{
  "id": "unique-id",
  "title": "כותרת בעברית",
  "location": "מיקום בעברית",
  "atmosphere": "אווירה בעברית",
  "roles": {
    "MAN": {
      "name": "שם",
      "archetype": "ארכיטיפ בעברית",
      "personality": "אישיות בעברית",
      "accent": "french|spanish|italian",
      "visualPrompt": "English visual description for CGI avatar",
      "forbidden": "למה זה אסור לו בעברית"
    },
    "WOMAN": {
      "name": "שם",
      "archetype": "ארכיטיפ בעברית",
      "personality": "אישיות בעברית",
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
      model: 'gemini-2.0-flash',
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

  private getDefaultChips(phase: string, _tension: number): string[] {
    const chipsMap: Record<string, string[]> = {
      ICE: [
        'יש משהו בך שמשאיר אותי לא שקט/ה...',
        'ידעתי שנפגש שוב, גם אם לא יכולתי לדעת מתי...',
        'אני לא אמור/ה להרגיש ככה אבל...',
        'מאז הפעם הראשונה שראיתי אותך חשבתי ש...'
      ],
      WARM: [
        'לא ציפיתי לרגש כזה כשראיתי אותך היום...',
        'יש לך עיניים שמספרות דברים שאתה/את לא אומר/ת בפה...',
        'אם אגיד לך בדיוק מה אני מרגיש/ה עכשיו, תבין/י?',
        'הייתי רוצה שהלילה לא ייגמר כי...'
      ],
      HOT: [
        'אני לא יכול/ה להפסיק לחשוב על מה אתה/את מרגיש/ה...',
        'כשאתה/את מדבר/ת ככה אני בכלל לא שומע/ת מה שאמרת...',
        'רוצה לגעת בך — רק כדי לדעת אם זה אמיתי...',
        'אני לא אמור/ה להגיד את זה אבל אני רוצה ש...'
      ],
      FIRE: [
        'אני רוצה אותך עכשיו — לא בעוד רגע...',
        'תן/תני לי להראות לך בדיוק כמה אני...',
        'הגוף שלך גורם לי ל...',
        'לא מסוגל/ת לחכות יותר לכך ש...'
      ]
    };
    return chipsMap[phase] || chipsMap.ICE;
  }

  private getDefaultAdvice(phase: string) {
    return {
      forMan: phase === 'ICE'
        ? '💫 קח נשימה — עכשיו הזמן להראות לה שאתה שם לב לפרטים...'
        : phase === 'WARM'
        ? '🔥 היא מרגישה אותך — תהיה אמיץ, מילה אחת נועזת שווה אלף'
        : '🌶️ אל תעצור — האוויר בינכם בוער, תן לזה לקרות',
      forWoman: phase === 'ICE'
        ? '✨ הוא רואה אותך — תני לו לראות שגם את מרגישה משהו...'
        : phase === 'WARM'
        ? '💋 היא/הוא מחכה — מבט אחד ישיר יגיד הכל'
        : '🔥 עכשיו את בשליטה — תני לתשוקה שלך לדבר'
    };
  }

  private getDefaultActionTip(phase: string): string {
    const tips: Record<string, string> = {
      ICE: '🤫 צור/י קשר עין ישיר ואל תמהר/י להסיט — תן/תני לו/לה להרגיש שאתה/את שם/ה',
      WARM: '🤫 קרב/י את עצמך כמה ס"מ בלי לומר מילה — גוף שמתקרב אומר יותר ממשפט',
      HOT: '🤫 שים/שימי יד בשקט ליד ידו/ידה — לא עליה, ליד. תחכה/תחכי לתגובה',
      FIRE: '🤫 הפסק/י לכתוב לרגע — עצור/י, קח/קחי נשימה, ואז שלח/י את הדבר האחד שהכי מפחיד אותך'
    };
    return tips[phase] || tips.ICE;
  }

  private getDefaultActionTips(phase: string): string[] {
    const tipsMap: Record<string, [string, string]> = {
      ICE: [
        '🤫 צור/י קשר עין ישיר ואל תסיט/י — שנייה של שקט מרגשת יותר מאלף מילים',
        '✨ נגע/י בכוס שלך לאט כשמדברים — ידיים שזזות אומרות הרבה'
      ],
      WARM: [
        '🤫 קרב/י את עצמך כמה ס"מ בלי לומר מילה — גוף שמתקרב מדבר',
        '✨ מגע עדין בכתף בתירוץ קטן — "הבטתי לא נכון" — ואז תשאר/י קרוב/ה'
      ],
      HOT: [
        '🤫 שים/שימי יד ליד ידו/ידה — לא עליה, ממש ליד. תחכה/תחכי לתגובה',
        '✨ אמור/י את שמו/שמה בשקט — פעם אחת, ותעצור/י. זה יוציא אותם מהאוטופיילוט'
      ],
      FIRE: [
        '🤫 הפסק/י לכתוב — נשמה עמוקה, ואז שלח/י בדיוק מה שמפחיד אותך הכי הרבה',
        '✨ תגיד/י מה אתה/את רוצה — ישיר, בלי רמזים. עכשיו זה הזמן'
      ]
    };
    return tipsMap[phase] || tipsMap.ICE;
  }

  private getFallbackResponse(tension: number, phase: string): AIResponse {
    return {
      strategicAdvice: this.getDefaultAdvice(phase),
      wordChips: this.getDefaultChips(phase, tension),
      actionTip: this.getDefaultActionTip(phase),
      actionTips: this.getDefaultActionTips(phase),
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
