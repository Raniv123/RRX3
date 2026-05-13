import React, { useState, useEffect } from 'react';

interface WaitingScreenProps {
  meetingTime: string;     // "20:00"
  channelCode: string;     // קוד החיבור
  isPrepMode?: boolean;    // האם זה מסך ההכנה (30 דקות לפני)
  isHost?: boolean;        // האם זה הגבר (host)
  onEnter: () => void;     // כניסה למסע
}

// חישוב זמן עד שעת הפגישה
function getTimeUntil(timeStr: string): { h: number; m: number; s: number; totalSec: number } {
  const now = new Date();
  const [hh, mm] = timeStr.split(':').map(Number);
  const target = new Date(now);
  target.setHours(hh, mm, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const diff = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  return {
    h: Math.floor(diff / 3600),
    m: Math.floor((diff % 3600) / 60),
    s: diff % 60,
    totalSec: diff,
  };
}

// יצירת ICS (ליומן)
function generateICS(meetingTime: string, channelCode: string): string {
  const now = new Date();
  const [hh, mm] = meetingTime.split(':').map(Number);

  // תאריך הפגישה
  const meetingDate = new Date(now);
  if (
    now.getHours() > hh ||
    (now.getHours() === hh && now.getMinutes() >= mm)
  ) {
    meetingDate.setDate(meetingDate.getDate() + 1);
  }
  meetingDate.setHours(hh, mm, 0, 0);

  const prepDate = new Date(meetingDate.getTime() - 30 * 60 * 1000); // 30 דקות לפני

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0];

  const baseUrl = window.location.origin + window.location.pathname;
  const prepUrl = `${baseUrl}?prepare=${channelCode}&time=${meetingTime}`;
  const enterUrl = `${baseUrl}?invite=${channelCode}`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RRX3//RRX3//HE',
    // אירוע הכנה
    'BEGIN:VEVENT',
    `DTSTART:${fmt(prepDate)}`,
    `DTEND:${fmt(meetingDate)}`,
    'SUMMARY:✨ הכנה לערב המיוחד',
    `DESCRIPTION:30 דקות לפני הערב! כנסי לכאן: ${prepUrl}`,
    `URL:${prepUrl}`,
    'END:VEVENT',
    // אירוע הכניסה למשחק
    'BEGIN:VEVENT',
    `DTSTART:${fmt(meetingDate)}`,
    `DTEND:${fmt(new Date(meetingDate.getTime() + 90 * 60 * 1000))}`,
    'SUMMARY:🔥 RRX3 — הערב המיוחד שלנו',
    `DESCRIPTION:הגיע הזמן! כנסי למסע: ${enterUrl}`,
    `URL:${enterUrl}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

// קישור Google Calendar לאירוע
function googleCalLink(meetingTime: string, channelCode: string, isPrepEvent: boolean) {
  const now = new Date();
  const [hh, mm] = meetingTime.split(':').map(Number);
  const meetingDate = new Date(now);
  if (now.getHours() > hh || (now.getHours() === hh && now.getMinutes() >= mm)) {
    meetingDate.setDate(meetingDate.getDate() + 1);
  }
  meetingDate.setHours(hh, mm, 0, 0);

  const baseUrl = window.location.origin + window.location.pathname;

  if (isPrepEvent) {
    const prepDate = new Date(meetingDate.getTime() - 30 * 60 * 1000);
    const endDate = new Date(meetingDate.getTime());
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const url = `${baseUrl}?prepare=${channelCode}&time=${meetingTime}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('✨ הכנה לערב המיוחד')}&dates=${fmt(prepDate)}/${fmt(endDate)}&details=${encodeURIComponent(`30 דקות לפני! פתחי: ${url}`)}`;
  } else {
    const endDate = new Date(meetingDate.getTime() + 90 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const url = `${baseUrl}?invite=${channelCode}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('🔥 RRX3 — הערב המיוחד שלנו')}&dates=${fmt(meetingDate)}/${fmt(endDate)}&details=${encodeURIComponent(`הגיע הזמן! כנסי: ${url}`)}`;
  }
}

const PREP_TIPS_WOMAN = [
  { icon: '👗', title: 'להתלבש יפה', text: 'בשביל עצמך — בחרי משהו שאת מרגישה בו מדהימה' },
  { icon: '🕯️', title: 'נרות ותאורה', text: 'כבי את האורות הגדולים, הדליקי נר אחד לפחות' },
  { icon: '🌸', title: 'בושם', text: 'ריח שאת אוהבת — על הצוואר ועל הפרק' },
  { icon: '📵', title: 'בלי הסחות', text: 'השתקי התראות ושמרי את הטלפון לערב הזה בלבד' },
];

const PREP_TIPS_MAN = [
  { icon: '🌹', title: 'מגע קטן', text: 'פרח, מתנה קטנה — משהו שיאמר "חשבתי עלייך"' },
  { icon: '🕯️', title: 'אווירה', text: 'נרות, תאורה עדינה — הכן את הסביבה לפני שהיא מגיעה' },
  { icon: '📱', title: 'טלפון מוכן', text: 'ודא שהטלפון טעון ומחובר לרשת — לא ניצור קשר בלעדיו' },
  { icon: '✨', title: 'להיות נוכח', text: 'הכי חשוב — להיות כאן, ברגע הזה, בשבילה' },
];

export const WaitingScreen: React.FC<WaitingScreenProps> = ({
  meetingTime,
  channelCode,
  isPrepMode = false,
  isHost = false,
  onEnter,
}) => {
  const PREP_TIPS = isHost ? PREP_TIPS_MAN : PREP_TIPS_WOMAN;
  const [timeLeft, setTimeLeft] = useState(() => getTimeUntil(meetingTime));
  const [revealed, setRevealed] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [entered, setEntered] = useState(false);

  const isTimeUp = timeLeft.totalSec <= 0;
  const isNearTime = timeLeft.totalSec <= 30 * 60; // 30 דקות או פחות

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntil(meetingTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [meetingTime]);

  const handleDownloadICS = () => {
    const ics = generateICS(meetingTime, channelCode);
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'evening-rrx3.ics';
    a.click();
    URL.revokeObjectURL(url);
    setCalendarOpen(false);
  };

  const handleEnter = () => {
    setEntered(true);
    setTimeout(onEnter, 800);
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center"
      dir="rtl"
      style={{
        opacity: entered ? 0 : 1,
        transition: 'opacity 0.8s ease',
        background: isPrepMode
          ? 'linear-gradient(135deg, #1a0a20, #200d10, #150820)'
          : 'linear-gradient(135deg, #0a0a14, #0d0820, #120a1a)',
      }}
    >
      {/* ── Ambient glows ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(180,40,60,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(120,20,80,0.10) 0%, transparent 70%)' }}
        />
      </div>

      {/* ── Content ── */}
      <div
        className="relative z-10 max-w-sm w-full mx-4"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 1s ease, transform 1s ease',
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4 animate-bounce" style={{ animationDuration: '2s' }}>
            {isPrepMode ? '✨' : '🌙'}
          </div>
          <p className="text-white/50 text-xs font-medium tracking-wider mb-3">
            {isPrepMode ? 'מתכוננים לערב' : 'הערב מגיע'}
          </p>
          <h1
            className="text-3xl font-light text-white leading-snug"
            style={{ textShadow: '0 0 40px rgba(200,60,80,0.4)' }}
          >
            {isPrepMode ? '30 דקות לפני...' : `הערב בשעה ${meetingTime}`}
          </h1>
          {!isPrepMode && (
            <p className="text-white/55 text-sm mt-3 leading-relaxed">
              {isHost
                ? `שמור את הקישור הזה — כאן תיכנס בשעה ${meetingTime}`
                : `שמרי את הקישור הזה — כאן תיכנסי בשעה ${meetingTime}`
              }
            </p>
          )}
        </div>

        {/* Countdown */}
        <div
          className="rounded-2xl mb-6 text-center py-6"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${isTimeUp ? 'rgba(200,60,80,0.6)' : 'rgba(200,60,80,0.18)'}`,
            boxShadow: isTimeUp ? '0 0 40px rgba(200,60,80,0.3)' : 'none',
          }}
        >
          {isTimeUp ? (
            <div>
              <p className="text-rose-400 text-sm uppercase tracking-widest mb-2">הגיע הזמן!</p>
              <p className="text-5xl">🔥</p>
            </div>
          ) : (
            <div>
              <p className="text-white/50 text-xs font-medium tracking-widest mb-3">
                עוד
              </p>
              <div className="flex items-center justify-center gap-3">
                {timeLeft.h > 0 && (
                  <>
                    <div className="text-center">
                      <div className="text-4xl font-light text-white font-mono">{pad(timeLeft.h)}</div>
                      <div className="text-white/50 text-xs mt-1">שעות</div>
                    </div>
                    <div className="text-white/20 text-3xl font-light">:</div>
                  </>
                )}
                <div className="text-center">
                  <div className="text-4xl font-light text-white font-mono">{pad(timeLeft.m)}</div>
                  <div className="text-white/50 text-xs mt-1">דקות</div>
                </div>
                <div className="text-white/35 text-3xl font-light">:</div>
                <div className="text-center">
                  <div className="text-4xl font-light text-white font-mono">{pad(timeLeft.s)}</div>
                  <div className="text-white/50 text-xs mt-1">שניות</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Prep tips — מוצגים בכל מצב אבל בעדיפות ב-prepMode */}
        {(isPrepMode || isNearTime) && (
          <div className="mb-6">
            <p className="text-white/50 text-xs font-medium tracking-wider text-center mb-4">
              איך להתכונן
            </p>
            <div className="grid grid-cols-2 gap-3">
              {PREP_TIPS.map((tip, i) => (
                <div
                  key={i}
                  className="rounded-xl p-3 text-center"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    animation: `fadeSlideIn 0.6s ease ${i * 0.12}s both`,
                  }}
                >
                  <div className="text-2xl mb-1">{tip.icon}</div>
                  <div className="text-white/80 text-xs font-medium mb-1">{tip.title}</div>
                  <div className="text-white/55 text-xs leading-relaxed">{tip.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calendar button — רק במסך ההמתנה הרגיל */}
        {!isPrepMode && !isTimeUp && (
          <div className="mb-4">
            <button
              onClick={() => setCalendarOpen(!calendarOpen)}
              className="w-full py-4 rounded-2xl text-white font-medium text-sm tracking-wide transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <span>📅</span>
                <span>{isHost ? 'שמור ביומן' : 'שמרי ביומן'} — {meetingTime} ותזכורת הכנה</span>
              </span>
            </button>

            {/* Dropdown calendar options */}
            {calendarOpen && (
              <div
                className="mt-2 rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(20,10,25,0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(200,60,80,0.2)',
                  animation: 'fadeSlideIn 0.3s ease',
                }}
              >
                {/* Google Calendar */}
                <a
                  href={googleCalLink(meetingTime, channelCode, true)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-5 py-4 text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm"
                >
                  <span className="text-xl">🗓️</span>
                  <div>
                    <div className="font-medium">Google Calendar</div>
                    <div className="text-white/50 text-xs">תזכורת הכנה ב-{
                      (() => {
                        const [h, m] = meetingTime.split(':').map(Number);
                        const prepH = h;
                        const prepM = m - 30;
                        return `${String(prepM < 0 ? prepH - 1 : prepH).padStart(2,'0')}:${String(prepM < 0 ? prepM + 60 : prepM).padStart(2,'0')}`;
                      })()
                    }</div>
                  </div>
                </a>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

                {/* ICS Download */}
                <button
                  onClick={handleDownloadICS}
                  className="w-full flex items-center gap-3 px-5 py-4 text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm"
                >
                  <span className="text-xl">🍎</span>
                  <div className="text-right">
                    <div className="font-medium">Apple / Outlook / אחר</div>
                    <div className="text-white/50 text-xs">הורדת קובץ .ics</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Enter button — מופיע כשהגיע הזמן */}
        {isTimeUp && (
          <button
            onClick={handleEnter}
            className="w-full py-5 rounded-2xl text-white font-medium text-base tracking-wide transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, rgba(200,40,60,0.85), rgba(150,15,50,0.95))',
              boxShadow: '0 0 40px rgba(200,40,60,0.4), 0 4px 20px rgba(0,0,0,0.5)',
              border: '1px solid rgba(200,40,60,0.4)',
              animation: 'pulse 1.5s ease infinite',
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <span>🔥</span>
              <span>{isHost ? 'כנסו למסע' : 'כנסי למסע'}</span>
              <span>🔥</span>
            </span>
          </button>
        )}

        {/* If prep mode — also show enter button */}
        {isPrepMode && isTimeUp && (
          <p className="text-white/25 text-[10px] text-center mt-4">
            הגיע הזמן — כל מה שהכנת עכשיו ישתלם
          </p>
        )}

        {!isTimeUp && (
          <p className="text-white/35 text-xs text-center mt-5 leading-relaxed">
            הדף הזה ישמר עם הקישור ביומן שלך
          </p>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 40px rgba(200,40,60,0.4); }
          50% { box-shadow: 0 0 60px rgba(200,40,60,0.6); }
        }
      `}</style>
    </div>
  );
};
