// סנכרון בזמן אמת בין שני משתמשים (ntfy.sh)

import { Message, UserGender, Scenario } from '../types';
import { log } from '../utils/logger';

const NTFY_SERVER = 'https://ntfy.sh';

// סוגי הודעות מערכת (לא הודעות צ'אט)
export interface SystemMessage {
  type: 'JOIN' | 'SCENARIO' | 'GENDER' | 'READY' | 'PING' | 'BREATH_START' | 'TYPING' | 'MISSION';
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
  private closed = false;
  private reconnectTimer?: ReturnType<typeof setTimeout>;

  constructor(channelId: string, myGender: UserGender) {
    this.channelId = channelId;
    this.myGender = myGender;
    this.deviceId = Math.random().toString(36).substring(2, 10);
  }

  // התחבר לערוץ ותתחיל להאזין - הודעות צ'אט + הודעות מערכת
  connect(onMessage: (message: Message) => void, onSystem?: (msg: SystemMessage) => void) {
    if (this.closed) return;
    this.onMessageCallback = onMessage;
    this.onSystemCallback = onSystem;

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }

    const url = `${NTFY_SERVER}/rrx3-${this.channelId}/sse`;
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.message) {
          const parsed = JSON.parse(data.message);

          if (parsed._system) {
            const sysMsg: SystemMessage = parsed._system;
            if (sysMsg.sender !== this.deviceId) {
              this.onSystemCallback?.(sysMsg);
            }
            return;
          }

          const message: Message = parsed;
          if (message.deviceId !== this.deviceId) {
            this.onMessageCallback?.(message);
          }
        }
      } catch {
        // התעלם משגיאות parse (heartbeat וכו')
      }
    };

    this.eventSource.onerror = () => {
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (this.closed) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      if (!this.closed) this.reconnect();
    }, 3000);
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
      log.error('Send system message error', error);
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
      log.error('Send message error', error);
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
    this.closed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
  }

  // התחבר מחדש (אם נפלה חיבור)
  private reconnect() {
    if (this.closed) return;
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
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
