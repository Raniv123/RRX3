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
    const prompt = `
אתה יוצר תרחיש רולפליי אינטימי וחושני לזוג עם אלמנט של התנגדות ומתח מיני.

⚠️ חובה: כל הטקסטים בעברית! כותרת, מיקום, אווירה, שמות, ארכיטיפים, אישיות, סיבות — הכל בעברית.

🔥 עקרונות:
1. תפקידים שבחיים לא היו נפגשים באופן רומנטי
2. יש אלמנט של "אסור" - בגידה, הפרת כללים, חציית גבולות
3. מצב של התנגדות שמתמוססת לתשוקה
4. מפתיע, מפתה, מסוכן רגשית

חשוב: לא הרבצות, כאב, או סדו-מזו קשה. רק תשוקה, פיתוי, והתנגדות שנשברת.

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
  "scenarios": ["מצב בעברית", "מצב בעברית"]
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

  private getDefaultChips(phase: string, tension: number): string[] {
    const chipsMap: Record<string, string[]> = {
      ICE: ['אני שם לב ש...', 'מה זה היה?', 'המבט שלך...', 'אולי...'],
      WARM: ['אני לא יכול להפסיק...', 'ספר/י לי...', 'כשאתה/את...', 'רגע —'],
      HOT: ['רוצה לגעת ב...', 'תגיד/י לי...', 'לא מצליח/ה להפסיק...', 'עכשיו...'],
      FIRE: ['אני רוצה...', 'תן/תני לי...', 'עכשיו. כאן.', 'לא מסוגל/ת...']
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

  private getFallbackResponse(tension: number, phase: string): AIResponse {
    return {
      strategicAdvice: this.getDefaultAdvice(phase),
      wordChips: this.getDefaultChips(phase, tension),
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
