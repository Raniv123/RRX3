// סנכרון בזמן אמת בין שני משתמשים (ntfy.sh)

import { Message, UserGender, Scenario } from '../types';

const NTFY_SERVER = 'https://ntfy.sh';

// סוגי הודעות מערכת (לא הודעות צ'אט)
export interface SystemMessage {
  type: 'JOIN' | 'SCENARIO' | 'GENDER' | 'READY' | 'PING';
  data?: any;
  sender?: string;
  timestamp: number;
}

// שירות הסנכרון המרכזי
export class SyncService {
  private channelId: string;
  private myGender: UserGender;
  private onMessageCallback?: (message: Message) => void;
  private onSystemCallback?: (msg: SystemMessage) => void;
  private eventSource?: EventSource;
  private deviceId: string;

  constructor(channelId: string, myGender: UserGender) {
    this.channelId = channelId;
    this.myGender = myGender;
    this.deviceId = Math.random().toString(36).substring(2, 10);
  }

  // התחבר לערוץ ותתחיל להאזין - הודעות צ'אט + הודעות מערכת
  connect(onMessage: (message: Message) => void, onSystem?: (msg: SystemMessage) => void) {
    this.onMessageCallback = onMessage;
    this.onSystemCallback = onSystem;

    // חיבור ל-ntfy.sh בSSE (Server-Sent Events)
    const url = `${NTFY_SERVER}/rrx3-${this.channelId}/sse`;
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // אם זאת הודעה ממשית (לא heartbeat)
        if (data.message) {
          const parsed = JSON.parse(data.message);

          // בדוק אם זו הודעת מערכת
          if (parsed._system) {
            const sysMsg: SystemMessage = parsed._system;
            // אל תקבל הודעות מערכת ממני עצמי
            if (sysMsg.sender !== this.deviceId) {
              this.onSystemCallback?.(sysMsg);
            }
            return;
          }

          // הודעת צ'אט רגילה
          const message: Message = parsed;
          // אל תקבל הודעות ממני עצמי
          if (message.deviceId !== this.deviceId) {
            this.onMessageCallback?.(message);
          }
        }
      } catch (error) {
        // התעלם משגיאות parse (יכול להיות heartbeat וכו')
      }
    };

    this.eventSource.onerror = () => {
      // ננסה להתחבר מחדש אוטומטית
      setTimeout(() => this.reconnect(), 3000);
    };
  }

  // שלח הודעת מערכת (JOIN, SCENARIO, וכו')
  async sendSystemMessage(type: SystemMessage['type'], data?: any) {
    try {
      const sysMsg: SystemMessage = {
        type,
        data,
        sender: this.deviceId,
        timestamp: Date.now()
      };

      await fetch(`${NTFY_SERVER}/rrx3-${this.channelId}`, {
        method: 'POST',
        body: JSON.stringify({ _system: sysMsg })
      });
    } catch (error) {
      console.error('Send system message error:', error);
    }
  }

  // שלח הודעה לצד השני
  async sendMessage(message: Message) {
    try {
      // הוסף את ה-deviceId שלי להודעה
      const msgWithDevice = { ...message, deviceId: this.deviceId };

      await fetch(`${NTFY_SERVER}/rrx3-${this.channelId}`, {
        method: 'POST',
        body: JSON.stringify(msgWithDevice)
      });
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  // שלח תרחיש לצד השני
  async sendScenario(scenario: Scenario) {
    await this.sendSystemMessage('SCENARIO', scenario);
  }

  // שלח אות הצטרפות
  async sendJoinSignal() {
    await this.sendSystemMessage('JOIN');
  }

  // נתק מהערוץ
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
  }

  // התחבר מחדש (אם נפלה חיבור)
  private reconnect() {
    this.disconnect();
    if (this.onMessageCallback) {
      this.connect(this.onMessageCallback, this.onSystemCallback);
    }
  }

  // בדוק אם מחובר
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  // קבל את ה-deviceId
  getDeviceId(): string {
    return this.deviceId;
  }

  // יצירת channel ID ייחודי (לשימוש בהתחברות)
  static generateChannelId(): string {
    // קוד פשוט בן 4 ספרות (1000-9999)
    const code = Math.floor(1000 + Math.random() * 9000);
    return code.toString();
  }

  // וולידציה ל-channel ID
  static isValidChannelId(channelId: string): boolean {
    // חייב להיות 4 ספרות בלבד
    return /^\d{4}$/.test(channelId);
  }
}
