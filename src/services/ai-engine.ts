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
        this.generateSingleAvatar(scenario.roles.MAN.visualPrompt, 'male'),
        this.generateSingleAvatar(scenario.roles.WOMAN.visualPrompt, 'female')
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

  private async generateSingleAvatar(visualPrompt: string, gender: 'male' | 'female'): Promise<string | null> {
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

  private getFallbackResponse(tension: number, phase: string): AIResponse {
    return {
      strategicAdvice: this.getDefaultAdvice(phase),
      wordChips: this.getDefaultChips(phase, tension),
      actionTip: this.getDefaultActionTip(phase),
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
      scenarios: ['פגישה שנמשכת מעבר לזמן', 'נגיעה בטעות שמתארכת', 'הודאה בתשוקה']
    };
  }
}
