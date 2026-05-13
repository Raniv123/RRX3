// Logger אחיד — מכבה בפרודקשן כדי לא לחשוף פרטי שגיאה
// השימוש: log.error('label', error) במקום console.error

const isDev = import.meta.env.DEV;

export const log = {
  error: (label: string, error?: unknown) => {
    if (isDev) {
      console.error(`[${label}]`, error);
    }
    // בפרוד — שותק (אפשר להוסיף Sentry/PostHog בעתיד)
  },
  warn: (label: string, data?: unknown) => {
    if (isDev) console.warn(`[${label}]`, data);
  },
  info: (label: string, data?: unknown) => {
    if (isDev) console.info(`[${label}]`, data);
  },
};
