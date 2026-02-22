import React, { useState, useEffect } from 'react';

interface InvitationScreenProps {
  partnerName: string;
  channelCode: string;
  onAccept: (code: string) => void;
}

// תמונות רקע אפלות ואינטימיות
const BG_IMAGES = [
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1920&q=90&auto=format&fit=crop', // נרות
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920&q=90&auto=format&fit=crop', // ספא אפל
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1920&q=90&auto=format&fit=crop', // גן לילה
];

export const InvitationScreen: React.FC<InvitationScreenProps> = ({
  partnerName,
  channelCode,
  onAccept
}) => {
  const [phase, setPhase] = useState<'landing' | 'accepted'>('landing');
  const [bgIndex] = useState(() => Math.floor(Math.random() * BG_IMAGES.length));
  const [revealed, setRevealed] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [breathSeconds, setBreathSeconds] = useState(4);
  const [showBreath, setShowBreath] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; delay: number; duration: number }>>([]);

  // אפקט חלקיקים
  useEffect(() => {
    const p = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 3 + Math.random() * 4
    }));
    setParticles(p);
  }, []);

  // הצגה מדורגת
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 300);
    return () => clearTimeout(t);
  }, []);

  // נשימה מודרכת
  useEffect(() => {
    if (!showBreath) return;

    const cycle: Array<{ phase: 'in' | 'hold' | 'out'; duration: number }> = [
      { phase: 'in', duration: 4 },
      { phase: 'hold', duration: 4 },
      { phase: 'out', duration: 8 },
    ];
    let cycleIdx = 0;
    let remaining = cycle[0].duration;
    setBreathPhase(cycle[0].phase);
    setBreathSeconds(cycle[0].duration);

    const t = setInterval(() => {
      remaining--;
      setBreathSeconds(remaining);
      if (remaining <= 0) {
        cycleIdx = (cycleIdx + 1) % 3;
        remaining = cycle[cycleIdx].duration;
        setBreathPhase(cycle[cycleIdx].phase);
        setBreathSeconds(remaining);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [showBreath]);

  const handleAccept = () => {
    setPhase('accepted');
    setShowBreath(true);
    // אחרי 8 שניות — כניסה לאפליקציה
    setTimeout(() => {
      onAccept(channelCode);
    }, 8000);
  };

  const breathLabel = {
    in: 'שאפי לאט...',
    hold: 'עצרי...',
    out: 'שחררי לאט...'
  }[breathPhase];

  const breathScale = breathPhase === 'in' ? 1.4 : breathPhase === 'hold' ? 1.4 : 1;

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center" dir="rtl">

      {/* רקע */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_IMAGES[bgIndex]})` }}
      />
      {/* שכבות כהות ועמוקות */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90" />
      <div className="absolute inset-0 bg-black/30" />

      {/* חלקיקים זוהרים */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute w-1 h-1 rounded-full bg-amber-300/40 pointer-events-none"
          style={{
            left: `${p.x}%`,
            bottom: '-10px',
            animation: `float-up ${p.duration}s ${p.delay}s infinite ease-in-out`,
          }}
        />
      ))}

      {/* ===== LANDING ===== */}
      {phase === 'landing' && (
        <div
          className="relative z-10 max-w-sm w-full mx-4 text-center"
          style={{
            opacity: revealed ? 1 : 0,
            transform: revealed ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 1.2s ease, transform 1.2s ease'
          }}
        >
          {/* אייקון מרכזי */}
          <div className="mb-8">
            <div
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6"
              style={{
                background: 'radial-gradient(circle, rgba(180,60,40,0.3) 0%, transparent 70%)',
                boxShadow: '0 0 60px rgba(180,60,40,0.4), 0 0 120px rgba(180,60,40,0.2)',
                border: '1px solid rgba(180,60,40,0.3)'
              }}
            >
              <span className="text-4xl">🕯️</span>
            </div>
          </div>

          {/* הודעה ראשית */}
          <div className="mb-8">
            <p className="text-white/40 text-xs uppercase tracking-[0.4em] mb-4">
              הכנתי לך משהו
            </p>
            <h1
              className="text-4xl font-light text-white mb-3 leading-tight"
              style={{ textShadow: '0 0 40px rgba(180,60,40,0.5)' }}
            >
              {partnerName || 'את'} ❤
            </h1>
            <p className="text-white/55 text-base leading-relaxed mx-auto max-w-[260px]">
              לחצי כדי להיכנס לעולם שהכנתי לנו
            </p>
          </div>

          {/* קו עדין */}
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-8" />

          {/* פרטים קטנים */}
          <div className="flex items-center justify-center gap-6 mb-10">
            <div className="text-center">
              <div className="text-white/20 text-[10px] uppercase tracking-widest mb-1">פרטי לחלוטין</div>
              <div className="text-white/40 text-sm">🔐</div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="text-center">
              <div className="text-white/20 text-[10px] uppercase tracking-widest mb-1">רק שנינו</div>
              <div className="text-white/40 text-sm">💫</div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="text-center">
              <div className="text-white/20 text-[10px] uppercase tracking-widest mb-1">הלילה בלבד</div>
              <div className="text-white/40 text-sm">🌙</div>
            </div>
          </div>

          {/* כפתור כניסה */}
          <button
            onClick={handleAccept}
            className="w-full py-5 rounded-2xl text-white font-medium text-base tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(180,60,40,0.8), rgba(120,20,40,0.9))',
              boxShadow: '0 0 40px rgba(180,60,40,0.3), 0 4px 20px rgba(0,0,0,0.5)',
              border: '1px solid rgba(180,60,40,0.4)'
            }}
          >
            אני מוכנה לגלות ✨
          </button>

          <p className="text-white/15 text-[10px] mt-6 tracking-widest">
            את שולטת — יכולה לעצור בכל רגע
          </p>
        </div>
      )}

      {/* ===== BREATH SYNC ===== */}
      {phase === 'accepted' && (
        <div className="relative z-10 max-w-sm w-full mx-4 text-center"
          style={{ animation: 'fadeIn 0.8s ease forwards' }}>

          <p className="text-white/40 text-xs uppercase tracking-[0.4em] mb-8">
            לפני שנתחיל — רגע אחד ביחד
          </p>

          {/* עיגול נשימה */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative w-48 h-48">
              {/* עיגול חיצוני */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(180,60,40,0.15) 0%, transparent 70%)',
                  border: '1px solid rgba(180,60,40,0.2)',
                  transform: `scale(${breathScale})`,
                  transition: `transform ${breathPhase === 'in' ? 4 : breathPhase === 'hold' ? 0 : 8}s ease-in-out`,
                  boxShadow: `0 0 ${breathPhase === 'hold' ? 60 : 20}px rgba(180,60,40,0.3)`
                }}
              />
              {/* עיגול פנימי */}
              <div
                className="absolute inset-8 rounded-full flex items-center justify-center flex-col gap-1"
                style={{
                  background: 'radial-gradient(circle, rgba(180,60,40,0.25) 0%, transparent 80%)',
                  transform: `scale(${breathScale})`,
                  transition: `transform ${breathPhase === 'in' ? 4 : breathPhase === 'hold' ? 0 : 8}s ease-in-out`,
                }}
              >
                <span className="text-white/80 text-sm font-light">{breathLabel}</span>
                <span className="text-white/40 text-xl font-light font-mono">{breathSeconds}</span>
              </div>
            </div>
          </div>

          <p className="text-white/50 text-sm leading-relaxed mx-auto max-w-[220px] mb-4">
            קחי נשימה עמוקה יחד איתו...
          </p>
          <p className="text-white/25 text-xs">
            עוד רגע נכנסות למסע 🌹
          </p>
        </div>
      )}

      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
