import React, { useState, useEffect, useRef } from 'react';

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface Invitation {
  message: string;
  time: string;
  senderName?: string;
}

interface InvitationComposerProps {
  onSend: (invitation: Invitation) => void;
  onBack: () => void;
}

interface InvitationReceiverProps {
  invitation: Invitation;
  onAccept: (time: string) => void;
  onDecline: () => void;
}

// ─── Default message ───────────────────────────────────────────────────────────

const DEFAULT_MESSAGE = `הערב אני רוצה שנהיה ביחד.

יש לי תוכנית שתגרום לך לרצות עוד ועוד...

לא מבטיח שתצאי אותה אישה.`;

// ─── Time slots ────────────────────────────────────────────────────────────────

const TIME_SLOTS = ['22:00', '21:00', '20:00', '19:00'];

// ─── Background image ──────────────────────────────────────────────────────────

const BG_IMAGE =
  'https://images.unsplash.com/photo-1510746001195-0db09655b6db?w=1920&q=85&auto=format&fit=crop';

// ─── Floating particle ────────────────────────────────────────────────────────

interface Particle {
  id: number;
  x: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

function createParticles(n: number): Particle[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: 1 + Math.random() * 2,
    delay: Math.random() * 6,
    duration: 4 + Math.random() * 5,
    opacity: 0.3 + Math.random() * 0.4,
  }));
}

// ─── Countdown helper ─────────────────────────────────────────────────────────

function hoursUntil(timeStr: string): { h: number; m: number } {
  const now = new Date();
  const [hh, mm] = timeStr.split(':').map(Number);
  const target = new Date(now);
  target.setHours(hh, mm, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const diff = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  return { h: Math.floor(diff / 3600), m: Math.floor((diff % 3600) / 60) };
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSER
// ══════════════════════════════════════════════════════════════════════════════

export const InvitationComposerScreen: React.FC<InvitationComposerProps> = ({
  onSend,
  onBack,
}) => {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [selectedTime, setSelectedTime] = useState('20:00');
  const [revealed, setRevealed] = useState(false);
  const [sending, setSending] = useState(false);
  const [particles] = useState(() => createParticles(14));
  const [heartbeat, setHeartbeat] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Staggered reveal
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 200);
    return () => clearTimeout(t);
  }, []);

  // Heart pulse every 1.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setHeartbeat(true);
      setTimeout(() => setHeartbeat(false), 400);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleSend = () => {
    if (!message.trim()) return;
    setSending(true);
    setTimeout(() => {
      onSend({ message: message.trim(), time: selectedTime });
    }, 900);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center" dir="rtl">

      {/* ── Background ── */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_IMAGE})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      <div className="absolute inset-0 bg-black/20" />

      {/* ── Floating particles ── */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            bottom: '-8px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `rgba(251,191,36,${p.opacity})`,
            animation: `composerFloatUp ${p.duration}s ${p.delay}s infinite ease-in-out`,
          }}
        />
      ))}

      {/* ── Ambient glow orbs ── */}
      <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(225,29,72,0.12) 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/3 left-1/3 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)' }} />

      {/* ── Main card ── */}
      <div
        className="relative z-10 max-w-sm w-full mx-4"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 1s ease, transform 1s ease',
        }}
      >
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/30 text-xs mb-6 hover:text-white/60 transition-colors cursor-pointer"
        >
          <span>→</span>
          <span>חזרה</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          {/* Envelope icon with heart */}
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle, rgba(225,29,72,0.2) 0%, transparent 70%)',
                border: '1px solid rgba(225,29,72,0.25)',
                boxShadow: '0 0 40px rgba(225,29,72,0.2)',
              }}
            >
              <span
                className="text-2xl"
                style={{
                  transform: heartbeat ? 'scale(1.25)' : 'scale(1)',
                  transition: 'transform 0.2s ease',
                  display: 'inline-block',
                }}
              >
                💌
              </span>
            </div>
          </div>

          <p className="text-rose-300/65 text-xs tracking-widest mb-3 uppercase">
            הזמנה מיוחדת
          </p>
          <h1
            className="text-3xl font-light text-white leading-snug"
            style={{ textShadow: '0 0 30px rgba(225,29,72,0.4)' }}
          >
            שלח לפרטנרית שלך
          </h1>
          <p className="text-white/65 text-sm mt-3 leading-relaxed">
            הזמנה שלא תוכל לעמוד בה
          </p>
        </div>

        {/* Letter textarea */}
        <div
          className="mb-6 rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(20,8,15,0.65)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(225,29,72,0.28)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          }}
        >
          {/* Paper header bar */}
          <div
            className="flex items-center gap-2 px-5 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400/80" />
            <span className="text-white/55 text-xs tracking-wider">המכתב שלי אליה</span>
          </div>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={6}
            className="w-full bg-transparent px-5 py-4 text-white/95 leading-[1.75] resize-none outline-none placeholder-white/40"
            style={{ fontFamily: "'Heebo', sans-serif", direction: 'rtl', fontSize: '15px', fontWeight: 300 }}
            placeholder="כתוב את ההזמנה שלך..."
          />

          {/* Char count hint */}
          <div
            className="flex justify-between items-center px-5 py-2.5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="text-white/45 text-xs">ניתן לערוך</span>
            <span className="text-white/45 text-xs">{message.length} תווים</span>
          </div>
        </div>

        {/* Time picker */}
        <div className="mb-6">
          <p className="text-white/55 text-xs tracking-wider mb-3 text-center">
            מה שעת הפגישה?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {TIME_SLOTS.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTime(t)}
                className="relative py-3 rounded-xl text-sm font-light text-center transition-all duration-200 cursor-pointer overflow-hidden"
                style={
                  selectedTime === t
                    ? {
                        background: 'rgba(225,29,72,0.5)',
                        border: '1px solid rgba(225,29,72,0.7)',
                        color: 'white',
                        boxShadow: '0 0 20px rgba(225,29,72,0.35)',
                      }
                    : {
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.45)',
                      }
                }
              >
                {t}
                {t === '20:00' && selectedTime !== '20:00' && (
                  <span className="absolute top-1 right-1.5 text-[8px] text-amber-400/60">⭐</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending || !message.trim()}
          className="w-full py-4 rounded-2xl text-white font-medium text-base tracking-wide transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: sending
              ? 'rgba(255,255,255,0.05)'
              : 'linear-gradient(135deg, rgba(225,29,72,0.85), rgba(190,18,60,0.95))',
            boxShadow: sending
              ? 'none'
              : '0 0 35px rgba(225,29,72,0.35), 0 4px 20px rgba(0,0,0,0.4)',
            border: '1px solid rgba(225,29,72,0.3)',
          }}
        >
          {sending ? (
            <span className="flex items-center justify-center gap-3">
              <span
                className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                style={{ animation: 'spinLoader 0.8s linear infinite' }}
              />
              שולח...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>💌</span>
              <span>שלח הזמנה</span>
            </span>
          )}
        </button>

        <p className="text-white/45 text-xs text-center mt-5 leading-relaxed">
          ההזמנה תישלח דרך קישור אישי
        </p>
      </div>

      {/* ── CSS animations ── */}
      <style>{`
        @keyframes composerFloatUp {
          0%   { transform: translateY(0) scale(1); opacity: 0.4; }
          50%  { opacity: 0.7; }
          100% { transform: translateY(-100vh) scale(0.4); opacity: 0; }
        }
        @keyframes spinLoader {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// RECEIVER
// ══════════════════════════════════════════════════════════════════════════════

export const InvitationReceiverScreen: React.FC<InvitationReceiverProps> = ({
  invitation,
  onAccept,
  onDecline,
}) => {
  const [phase, setPhase] = useState<'envelope' | 'letter' | 'decision'>('envelope');
  const [revealed, setRevealed] = useState(false);
  const [letterVisible, setLetterVisible] = useState(false);
  const [countdown, setCountdown] = useState({ h: 0, m: 0 });
  const [particles] = useState(() => createParticles(16));
  const [declined, setDeclined] = useState(false);

  // Tick countdown
  useEffect(() => {
    const update = () => setCountdown(hoursUntil(invitation.time));
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, [invitation.time]);

  // Initial reveal
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 200);
    return () => clearTimeout(t);
  }, []);

  // Envelope open sequence
  const handleOpenEnvelope = () => {
    setPhase('letter');
    setTimeout(() => setLetterVisible(true), 100);
    setTimeout(() => setPhase('decision'), 1200);
  };

  const handleAccept = () => {
    onAccept(invitation.time);
  };

  const handleDecline = () => {
    setDeclined(true);
    setTimeout(() => onDecline(), 1200);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center" dir="rtl">

      {/* ── Background ── */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_IMAGE})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/85" />
      <div className="absolute inset-0 bg-black/15" />

      {/* ── Particles ── */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            bottom: '-8px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `rgba(251,191,36,${p.opacity})`,
            animation: `receiverFloatUp ${p.duration}s ${p.delay}s infinite ease-in-out`,
          }}
        />
      ))}

      {/* ── Glow orbs ── */}
      <div className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(225,29,72,0.1) 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.07) 0%, transparent 70%)' }} />

      {/* ── Envelope Phase ── */}
      {(phase === 'envelope') && (
        <div
          className="relative z-10 max-w-sm w-full mx-4 text-center"
          style={{
            opacity: revealed ? 1 : 0,
            transform: revealed ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 1s ease, transform 1s ease',
          }}
        >
          <p className="text-rose-300/70 text-xs uppercase tracking-widest mb-10">
            {invitation.senderName ? `מכתב מ${invitation.senderName}` : 'מכתב מיוחד מחכה לך'}
          </p>

          {/* Envelope SVG */}
          <div className="relative mx-auto mb-10 flex items-center justify-center" style={{ width: 160, height: 120 }}>
            {/* Envelope body */}
            <div
              className="absolute inset-0 rounded-xl overflow-hidden"
              style={{
                background: 'linear-gradient(160deg, rgba(45,10,15,0.9), rgba(70,15,25,0.95))',
                border: '1px solid rgba(225,29,72,0.35)',
                boxShadow: '0 0 50px rgba(225,29,72,0.25), 0 8px 32px rgba(0,0,0,0.5)',
              }}
            />
            {/* Envelope flap lines (V shape at top) */}
            <svg
              className="absolute inset-0"
              viewBox="0 0 160 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Diagonal lines from corners to center */}
              <line x1="0" y1="0" x2="80" y2="55" stroke="rgba(225,29,72,0.25)" strokeWidth="1" />
              <line x1="160" y1="0" x2="80" y2="55" stroke="rgba(225,29,72,0.25)" strokeWidth="1" />
              {/* Bottom V */}
              <line x1="0" y1="120" x2="80" y2="65" stroke="rgba(225,29,72,0.15)" strokeWidth="1" />
              <line x1="160" y1="120" x2="80" y2="65" stroke="rgba(225,29,72,0.15)" strokeWidth="1" />
            </svg>
            {/* Wax seal */}
            <div
              className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle, rgba(225,29,72,0.7) 0%, rgba(190,18,60,0.9) 60%)',
                boxShadow: '0 0 20px rgba(225,29,72,0.5), 0 2px 8px rgba(0,0,0,0.5)',
                border: '2px solid rgba(225,29,72,0.6)',
                animation: 'sealPulse 2s ease-in-out infinite',
              }}
            >
              <span className="text-lg" style={{ filter: 'drop-shadow(0 0 4px rgba(255,200,200,0.5))' }}>
                ❤
              </span>
            </div>
          </div>

          <h2
            className="text-2xl font-light text-white mb-3"
            style={{ textShadow: '0 0 30px rgba(225,29,72,0.4)' }}
          >
            יש לך מכתב
          </h2>
          <p className="text-white/40 text-sm mb-10 leading-relaxed max-w-[220px] mx-auto">
            לחצי כדי לפתוח ולגלות מה כתב לך
          </p>

          {/* Open button */}
          <button
            onClick={handleOpenEnvelope}
            className="w-full py-4 rounded-2xl text-white font-light text-base tracking-wide transition-all duration-300 cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(225,29,72,0.3)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <span>📜</span>
              <span>פתחי את המכתב</span>
            </span>
          </button>
        </div>
      )}

      {/* ── Letter Phase ── */}
      {(phase === 'letter' || phase === 'decision') && (
        <div
          className="relative z-10 max-w-sm w-full mx-4"
          style={{
            opacity: letterVisible ? 1 : 0,
            transform: letterVisible ? 'translateY(0) scaleY(1)' : 'translateY(12px) scaleY(0.96)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
            transformOrigin: 'top center',
          }}
        >
          <p className="text-rose-300/70 text-xs uppercase tracking-widest mb-6 text-center">
            מכתב אישי
          </p>

          {/* Letter scroll */}
          <div
            className="relative mb-6 rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, rgba(40,10,15,0.85) 0%, rgba(25,5,10,0.92) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(225,29,72,0.18)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 60px rgba(225,29,72,0.08)',
              animation: letterVisible ? 'letterUnfurl 0.9s ease forwards' : 'none',
            }}
          >
            {/* Decorative top border */}
            <div
              className="h-0.5 w-full"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(225,29,72,0.5), rgba(251,191,36,0.3), rgba(225,29,72,0.5), transparent)',
              }}
            />

            {/* Rose ornament */}
            <div className="text-center pt-5 pb-2">
              <span className="text-rose-500/50 text-lg" style={{ letterSpacing: '0.5em' }}>✦ ✦ ✦</span>
            </div>

            {/* Message */}
            <div className="px-6 pb-6">
              <p
                className="text-white/92 leading-[1.85] whitespace-pre-line text-center"
                style={{
                  fontFamily: "'Heebo', sans-serif",
                  fontWeight: 300,
                  fontSize: '16px',
                  textShadow: '0 0 20px rgba(225,29,72,0.15)',
                }}
              >
                {invitation.message}
              </p>
            </div>

            {/* Divider */}
            <div
              className="mx-6 h-px mb-5"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
              }}
            />

            {/* Time block */}
            <div className="text-center px-6 pb-6">
              <p className="text-rose-300/60 text-xs uppercase tracking-widest mb-2">
                שעת הפגישה
              </p>
              <p
                className="text-3xl font-light text-white mb-1"
                style={{ textShadow: '0 0 25px rgba(225,29,72,0.5)' }}
              >
                {invitation.time}
              </p>
              <p className="text-white/30 text-xs">
                עוד{' '}
                <span className="text-rose-400/70">
                  {countdown.h > 0 ? `${countdown.h}:${String(countdown.m).padStart(2, '0')}` : `${countdown.m} דקות`}
                </span>{' '}
                {countdown.h > 0 ? 'שעות' : ''}
              </p>
            </div>

            {/* Decorative bottom border */}
            <div
              className="h-0.5 w-full"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(225,29,72,0.5), rgba(251,191,36,0.3), rgba(225,29,72,0.5), transparent)',
              }}
            />
          </div>

          {/* Decision buttons — appear after letter is revealed */}
          <div
            className="space-y-3"
            style={{
              opacity: phase === 'decision' ? 1 : 0,
              transform: phase === 'decision' ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s',
            }}
          >
            {/* Accept */}
            <button
              onClick={handleAccept}
              disabled={declined}
              className="w-full py-4 rounded-2xl text-white font-medium text-base tracking-wide transition-all duration-300 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, rgba(225,29,72,0.8), rgba(190,18,60,0.95))',
                boxShadow: '0 0 35px rgba(225,29,72,0.35), 0 4px 20px rgba(0,0,0,0.4)',
                border: '1px solid rgba(225,29,72,0.4)',
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <span>✨</span>
                <span>אני באה!</span>
              </span>
            </button>

            {/* Decline */}
            <button
              onClick={handleDecline}
              disabled={declined}
              className="w-full py-3 rounded-2xl text-white/35 font-light text-sm tracking-wide transition-all duration-200 cursor-pointer hover:text-white/55"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.06)',
                opacity: declined ? 0.3 : 1,
              }}
            >
              {declined ? 'אולי בפעם אחרת...' : '💆 אולי מאוחר יותר'}
            </button>
          </div>

          <p className="text-white/55 text-xs text-center mt-6">
            את שולטת — יכולה לעצור בכל רגע
          </p>
        </div>
      )}

      {/* ── CSS keyframes ── */}
      <style>{`
        @keyframes receiverFloatUp {
          0%   { transform: translateY(0) scale(1); opacity: 0.4; }
          50%  { opacity: 0.65; }
          100% { transform: translateY(-100vh) scale(0.4); opacity: 0; }
        }
        @keyframes sealPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(225,29,72,0.5), 0 2px 8px rgba(0,0,0,0.5); }
          50%       { box-shadow: 0 0 35px rgba(225,29,72,0.7), 0 2px 8px rgba(0,0,0,0.5); }
        }
        @keyframes letterUnfurl {
          0%   { clip-path: inset(0 0 100% 0); opacity: 0; }
          100% { clip-path: inset(0 0 0% 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
