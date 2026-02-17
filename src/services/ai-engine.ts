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
        model: 'gemini-2.0-flash',
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
      // Timeout של 10 שניות למקרה שה-API תקוע
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Scenario creation timeout')), 10000);
      });

      const scenarioPromise = this.generateScenarioWithAI();

      // רק אחד מהם יגמר ראשון
      return await Promise.race([scenarioPromise, timeoutPromise]);
    } catch (error) {
      console.error('Scenario Creation Error:', error);
      // fallback - תרחיש דיפולטיבי
      return this.getDefaultScenario();
    }
  }

  // הפונקציה הפנימית שיוצרת תרחיש
  private async generateScenarioWithAI(): Promise<Scenario> {
    const prompt = `
אתה יוצר תרחיש רולפליי אינטימי וחושני לזוג עם אלמנט של התנגדות ומתח מיני.

⚠️ חובה: כל הטקסטים בעברית! כותרת, מיקום, אווירה, שמות, ארכיטיפים, אישיות, סיבות — הכל בעברית.

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
- כותרת מרתקת בעברית שמרמזת על האסור
- מיקום מפורט בעברית שמוסיף מתח (מקום סגור, סכנת חשיפה)
- אווירה טעונה בעברית
- 2 תפקידים (MAN, WOMAN) עם:
  * שמות מציאותיים (יכולים להיות בכל שפה)
  * ארכיטיפים מעניינים בעברית
  * אישיות מנוגדת שמושכת בעברית
  * למה הם לא צריכים להיפגש (נשוי? אתיקה? כללים?) בעברית
- מבטא לכל תפקיד (french/spanish/italian)
- visual prompts לאווטרים באנגלית (סגנון קולנועי, אלגנטי)
- twists בעברית - מה עלול לקרות שיעלה את המתח
- scenarios בעברית - מצבים מסוכנים/מפתים

החזר JSON בלבד (בלי markdown, בלי backticks):
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
      "visualPrompt": "English visual description for avatar",
      "forbidden": "למה זה אסור לו בעברית"
    },
    "WOMAN": {
      "name": "שם",
      "archetype": "ארכיטיפ בעברית",
      "personality": "אישיות בעברית",
      "accent": "french|spanish|italian",
      "visualPrompt": "English visual description for avatar",
      "forbidden": "למה זה אסור לה בעברית"
    }
  },
  "twists": ["טוויסט בעברית", "טוויסט בעברית", "טוויסט בעברית"],
  "scenarios": ["מצב בעברית", "מצב בעברית", "מצב בעברית"]
}
      `;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      if (!response.text) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(response.text);

      // ולידציה בסיסית - בדוק שיש את השדות החשובים
      if (!parsed.title || !parsed.roles?.MAN || !parsed.roles?.WOMAN) {
        throw new Error('Invalid scenario structure from AI');
      }

      return parsed;
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

  // גישה ציבורית לתרחיש ברירת מחדל
  getDefaultScenarioPublic(): Scenario {
    return this.getDefaultScenario();
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
