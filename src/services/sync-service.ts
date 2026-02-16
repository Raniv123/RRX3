// סנכרון בזמן אמת בין שני משתמשים (ntfy.sh)

import { Message, UserGender } from '../types';

const NTFY_SERVER = 'https://ntfy.sh';

// שירות הסנכרון המרכזי
export class SyncService {
  private channelId: string;
  private myGender: UserGender;
  private onMessageCallback?: (message: Message) => void;
  private eventSource?: EventSource;

  constructor(channelId: string, myGender: UserGender) {
    this.channelId = channelId;
    this.myGender = myGender;
  }

  // התחבר לערוץ ותתחיל להאזין
  connect(onMessage: (message: Message) => void) {
    this.onMessageCallback = onMessage;

    // חיבור ל-ntfy.sh בSSE (Server-Sent Events)
    const url = `${NTFY_SERVER}/${this.channelId}/sse`;
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // אם זאת הודעה ממשית (לא heartbeat)
        if (data.message) {
          const message: Message = JSON.parse(data.message);

          // אל תקבל הודעות ממני עצמי
          if (message.senderGender !== this.myGender) {
            this.onMessageCallback?.(message);
          }
        }
      } catch (error) {
        console.error('Parse error:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE Connection error:', error);
      // ננסה להתחבר מחדש אוטומטית
      setTimeout(() => this.reconnect(), 3000);
    };
  }

  // שלח הודעה לצד השני
  async sendMessage(message: Message) {
    try {
      await fetch(`${NTFY_SERVER}/${this.channelId}`, {
        method: 'POST',
        body: JSON.stringify(message),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
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
      this.connect(this.onMessageCallback);
    }
  }

  // בדוק אם מחובר
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  // יצירת channel ID ייחודי (לשימוש בהתחברות)
  static generateChannelId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'rrx3-';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // וולידציה ל-channel ID
  static isValidChannelId(channelId: string): boolean {
    // חייב להתחיל ב-rrx3- ולהיות באורך 17 תווים
    return /^rrx3-[a-z0-9]{12}$/.test(channelId);
  }
}
