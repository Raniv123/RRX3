import { GoogleGenAI } from '@google/genai';
import { Message, AIResponse, Scenario, UserGender } from '../types';
import { buildAIPrompt } from '../data/prompts';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

// AI המנוע המרכזי של ה
export class AIEngine {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  // חכמה AIפונקציה מרכזית - קבלת המלצת
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

      if (!response.text) {
        throw new Error('No response from AI');
      }

      const data = JSON.parse(response.text);
      return data;

    } catch (error) {
      console.error('AI Engine Error:', error);

      // fallback - תשובה בסיסית אם יש שגיאה
      return this.getFallbackResponse(tension, phase, gender);
    }
  }

  // יצירת תרחיש וCasting
  async createScenario(): Promise<Scenario> {
    try {
      const prompt = `
אתה יוצר תרחיש רולפליי אינטימי וחושני לזוג.

חשוב: לא להציע הרבצות, כאב, או סדו-מזו קשה. רק תשוקה ופיתוי.

צור תרחיש עם:
- כותרת מרתקת
- מיקום מפורט
- אווירה
- 2 תפקידים (MAN, WOMAN) עם שמות, ארכיטיפים, אישיות
- מבטא לכל תפקיד (french/spanish/italian)
- visual prompts לאווטרים
- twists - עלילות פתע אפשריות
- scenarios - מצבים שיכולים לקרות

החזר JSON:
{
  "id": "unique-id",
  "title": "...",
  "location": "...",
  "atmosphere": "...",
  "roles": {
    "MAN": {
      "name": "...",
      "archetype": "...",
      "personality": "...",
      "accent": "french|spanish|italian",
      "visualPrompt": "..."
    },
    "WOMAN": { ... }
  },
  "twists": ["...", "..."],
  "scenarios": ["...", "..."]
}
      `;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      if (!response.text) {
        throw new Error('No response from AI');
      }

      return JSON.parse(response.text);

    } catch (error) {
      console.error('Scenario Creation Error:', error);
      // fallback - תרחיש דיפולטיבי
      return this.getDefaultScenario();
    }
  }

  // יצירת אווטר CGI
  async generateAvatar(visualPrompt: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{
            text: `High-fashion cinematic portrait in a dark luxury setting, ${visualPrompt}. Moody shadows, dramatic lighting, 4k.`
          }]
        }
      });

      const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      if (part?.inlineData?.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }

      return '';
    } catch (error) {
      console.error('Avatar Generation Error:', error);
      return '';
    }
  }

  // fallback response
  private getFallbackResponse(tension: number, phase: string, _gender: UserGender): AIResponse {
    return {
      contextAnalysis: {
        summary: 'המערכת פועלת במצב fallback',
        mood: 'neutral',
        readyForNext: false,
        recommendation: 'המשך כרגיל',
        messageCount: 0,
        timeSinceStart: 0
      },
      strategicAdvice: {
        forMan: 'המשך בקצב שלך',
        forWoman: 'המשיכי בקצב שלך'
      },
      options: [
        {
          label: 'המשך השיחה',
          sendText: 'אני נהנה מזה',
          type: 'SAY',
          intent: 'המשך',
          intensity: 5
        }
      ],
      pacing: {
        currentPhase: phase as any,
        shouldProgress: false,
        reason: 'fallback mode',
        recommendedMessages: '5-10',
        pacing: 'normal'
      },
      tension: tension,
      phase: phase as any,
      currentGoal: 'המשך המסע'
    };
  }

  // תרחיש דיפולטיבי
  private getDefaultScenario(): Scenario {
    return {
      id: 'default',
      title: 'המעסה והמטופלת',
      location: 'חדר טיפולים פרטי',
      atmosphere: 'רגוע ואינטימי',
      roles: {
        MAN: {
          name: 'דניאל',
          archetype: 'מעסה מקצועי',
          personality: 'שקט, ממוקד, בטוח',
          accent: 'french',
          visualPrompt: 'Professional massage therapist, calm presence'
        },
        WOMAN: {
          name: 'מיה',
          archetype: 'מטופלת',
          personality: 'סקרנית, קצת עצבנית',
          visualPrompt: 'Woman on massage table, relaxed'
        }
      },
      twists: ['המעסה מוצא נקודת מתח מיוחדת'],
      scenarios: ['עיסוי שמתחמם']
    };
  }
}
