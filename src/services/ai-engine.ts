import { GoogleGenAI } from '@google/genai';
import { Message, AIResponse, Scenario, UserGender } from '../types';
import { buildAIPrompt } from '../data/prompts';

const API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || (window as any).ENV?.VITE_GEMINI_API_KEY) as string;

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

  // יצירת תרחיש וCasting - דינמי ומפתיע!
  async createScenario(): Promise<Scenario> {
    try {
      const prompt = `
אתה יוצר תרחיש רולפליי אינטימי וחושני לזוג עם אלמנט של התנגדות ומתח מיני.

🔥 עקרונות יצירת התרחיש:
1. תפקידים שבחיים לא היו נפגשים באופן רומנטי
2. יש אלמנט של "אסור" - בגידה, הפרת כללים, חציית גבולות
3. מצב של התנגדות שמתמוססת לתשוקה
4. מפתיע, מפתה, מסוכן רגשית

דוגמאות לתפקידים (אל תשתמש בהם - המצא חדשים!):
- בוס נשוי + עובדת צעירה (אסור במקום עבודה, הפרת אמונים)
- כומר + אישה נשואה שבאה להתוודות (אסור דתי, בגידה)
- שוטר + עבריינית בחקירה (ניגוד אינטרסים, משחק כוח)
- מורה פרטי + אם התלמיד (חוצה גבולות מקצועיים)
- רופא + מטופלת נשואה (הפרת אתיקה, בגידה)
- שכן נשוי + שכנה לבדה (בגידה, סכנת חשיפה)

חשוב: לא הרבצות, כאב, או סדו-מזו קשה. רק תשוקה, פיתוי, והתנגדות שנשברת.

צור תרחיש עם:
- כותרת מרתקת שמרמזת על האסור
- מיקום מפורט שמוסיף מתח (מקום סגור, סכנת חשיפה)
- אווירה טעונה
- 2 תפקידים (MAN, WOMAN) עם:
  * שמות מציאותיים
  * ארכיטיפים מעניינים
  * אישיות מנוגדת שמושכת
  * למה הם לא צריכים להיפגש (נשוי? אתיקה? כללים?)
- מבטא לכל תפקיד (french/spanish/italian)
- visual prompts לאווטרים (סגנון קולנועי, אלגנטי)
- twists - מה עלול לקרות שיעלה את המתח
- scenarios - מצבים מסוכנים/מפתים

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
      "visualPrompt": "...",
      "forbidden": "למה זה אסור לו"
    },
    "WOMAN": {
      "name": "...",
      "archetype": "...",
      "personality": "...",
      "accent": "french|spanish|italian",
      "visualPrompt": "...",
      "forbidden": "למה זה אסור לה"
    }
  },
  "twists": ["...", "...", "..."],
  "scenarios": ["...", "...", "..."]
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

  // תרחיש דיפולטיבי (fallback בלבד)
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
          visualPrompt: 'Elegant psychologist in dimly lit office, conflicted expression',
          forbidden: 'הפרת אתיקה מקצועית - הוא המטפל שלה'
        },
        WOMAN: {
          name: 'סופיה',
          archetype: 'אישה נשואה בקשיים',
          personality: 'פגיעה, מושכת, מחפשת נחמה',
          accent: 'italian',
          visualPrompt: 'Married woman in elegant dress, vulnerable yet seductive',
          forbidden: 'נשואה - בוגדת בבעלה עם המטפל'
        }
      },
      twists: [
        'הבעל מתקשר באמצע הפגישה',
        'מישהו דופק בדלת',
        'היא מגלה שגם הוא נשוי'
      ],
      scenarios: [
        'פגישה שנמשכת מעבר לזמן',
        'נגיעה "בטעות" שמתארכת',
        'הודאה בתשוקה שלא צריכה להיות'
      ]
    };
  }
}
