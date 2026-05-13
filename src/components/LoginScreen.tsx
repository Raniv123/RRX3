import React, { useState, useEffect } from 'react';
import { SyncService } from '../services/sync-service';

interface LoginScreenProps {
  onLogin: (channelId: string, isHost: boolean) => void;
  onResume?: () => void;
  onInvite?: () => void;  // כפתור הפתעה לפרטנרית
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onResume, onInvite }) => {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [channelId, setChannelId] = useState('');
  const [error, setError] = useState('');
  const [hasLastSession, setHasLastSession] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('rrx3_last_session') || 'null');
      setHasLastSession(!!(saved?.channelId && saved?.myGender && saved?.scenario));
    } catch {
      setHasLastSession(false);
    }
  }, []);

  // יצירת ערוץ חדש
  const handleCreate = () => {
    const newChannelId = SyncService.generateChannelId();
    onLogin(newChannelId, true);
  };

  // הצטרפות לערוץ קיים
  const handleJoin = () => {
    if (!channelId.trim()) {
      setError('הכנס קוד חיבור');
      return;
    }

    if (!SyncService.isValidChannelId(channelId.trim())) {
      setError('קוד לא תקין - בדוק שהעתקת נכון');
      return;
    }

    onLogin(channelId.trim(), false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 70% 60% at 25% 30%, #2a0a18 0%, transparent 65%),' +
          'radial-gradient(ellipse 60% 50% at 75% 70%, #1a0a24 0%, transparent 70%),' +
          'linear-gradient(180deg, #050306 0%, #08050a 100%)',
      }}
    >
      {/* רקע — שני orb עדינים, לא pulse אגרסיבי */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full opacity-50"
          style={{
            background: 'radial-gradient(circle, rgba(190,40,90,0.18) 0%, transparent 65%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(80,40,150,0.15) 0%, transparent 65%)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-sm w-full">
        {/* Logo עדין — בלי emoji ענק */}
        <div className="text-center mb-10 animate-fade-in">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5"
            style={{
              background: 'radial-gradient(circle, rgba(190,40,90,0.25) 0%, transparent 70%)',
              border: '1px solid rgba(190,40,90,0.35)',
              boxShadow: '0 0 32px rgba(190,40,90,0.25)',
            }}
          >
            <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 6px rgba(255,100,100,0.4))' }}>
              🔥
            </span>
          </div>
          <h1
            className="text-white font-light mb-2 tracking-tight"
            style={{ fontSize: '40px', letterSpacing: '-1px' }}
          >
            RRX<span style={{ color: '#e879f9' }}>3</span>
          </h1>
          <p className="text-white/50 text-sm font-light">המסע המשותף שלכם מתחיל כאן</p>
        </div>

        {/* כרטיס ראשי — שקט יותר */}
        <div
          className="rounded-3xl p-7 backdrop-blur-2xl"
          style={{
            background: 'rgba(12,8,14,0.55)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {mode === 'select' && (
            <div className="space-y-3 animate-slide-up">
              {/* Resume — ירוק עדין, רק אם יש סשן */}
              {hasLastSession && onResume && (
                <button
                  onClick={onResume}
                  aria-label="חזור למסע שהתחלתם"
                  className="w-full py-3.5 px-5 rounded-2xl text-emerald-200/90 font-medium text-sm tracking-wide transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(16,118,80,0.35), rgba(8,80,55,0.45))',
                    border: '1px solid rgba(52,211,153,0.25)',
                  }}
                >
                  חזור למסע שהתחלתם
                </button>
              )}

              {/* Primary CTA */}
              <button
                onClick={() => setMode('create')}
                className="w-full py-4 px-5 rounded-2xl text-white font-medium text-base transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(225,29,72,0.85) 0%, rgba(150,30,90,0.95) 100%)',
                  boxShadow: '0 0 30px rgba(225,29,72,0.3), 0 4px 16px rgba(0,0,0,0.4)',
                  border: '1px solid rgba(225,29,72,0.4)',
                }}
              >
                התחל מסע חדש
              </button>

              {/* Secondary */}
              <button
                onClick={() => setMode('join')}
                className="w-full py-3.5 px-5 rounded-2xl text-white/85 font-medium text-sm transition-all hover:bg-white/10"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                הצטרף למסע קיים
              </button>

              {/* כפתור הפתעה — קו מפריד עדין */}
              {onInvite && (
                <>
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px bg-white/8" />
                    <span className="text-white/25 text-[10px] uppercase tracking-widest">או</span>
                    <div className="flex-1 h-px bg-white/8" />
                  </div>
                  <button
                    onClick={onInvite}
                    className="w-full py-3.5 px-5 rounded-2xl text-rose-200/90 font-medium text-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(190,30,60,0.18), rgba(140,20,80,0.22))',
                      border: '1px solid rgba(225,29,72,0.25)',
                    }}
                  >
                    💌 הפתע את הפרטנרית שלך
                  </button>
                </>
              )}

              <p className="text-center text-white/35 text-xs pt-3 leading-relaxed">
                שני המכשירים צריכים להיות מחוברים לאינטרנט
              </p>
            </div>
          )}

          {mode === 'create' && (
            <div className="space-y-5 animate-slide-up">
              <div className="text-center">
                <h2 className="text-xl font-light text-white mb-1.5">יצירת מסע חדש</h2>
                <p className="text-white/45 text-sm">קוד חיבור ייחודי לשניכם</p>
              </div>

              <button
                onClick={handleCreate}
                className="w-full py-4 px-5 rounded-2xl text-white font-medium text-base transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(60,80,200,0.85) 0%, rgba(180,40,160,0.95) 100%)',
                  boxShadow: '0 0 30px rgba(120,60,200,0.3)',
                  border: '1px solid rgba(180,80,220,0.4)',
                }}
              >
                צור קוד חיבור
              </button>

              <button
                onClick={() => setMode('select')}
                className="w-full py-2 text-white/45 hover:text-white/75 text-sm transition-colors"
              >
                → חזרה
              </button>
            </div>
          )}

          {mode === 'join' && (
            <div className="space-y-5 animate-slide-up">
              <div className="text-center">
                <h2 className="text-xl font-light text-white mb-1.5">הצטרפות למסע</h2>
                <p className="text-white/45 text-sm">הכניסו את הקוד מהמכשיר השני</p>
              </div>

              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={channelId}
                  onChange={(e) => {
                    setChannelId(e.target.value.replace(/\D/g, ''));
                    setError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  placeholder="1900"
                  aria-label="קוד החיבור — 4 ספרות"
                  className="w-full px-4 py-4 rounded-2xl text-white placeholder-white/25 text-center text-2xl font-mono tracking-[0.4em] outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: error
                      ? '1px solid rgba(248,113,113,0.5)'
                      : '1px solid rgba(255,255,255,0.12)',
                  }}
                />
                {error && (
                  <p className="text-red-400/80 text-xs mt-2 text-center" role="alert">
                    {error}
                  </p>
                )}
              </div>

              <button
                onClick={handleJoin}
                disabled={!channelId.trim()}
                className="w-full py-4 px-5 rounded-2xl text-white font-medium text-base transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(60,80,200,0.85) 0%, rgba(180,40,160,0.95) 100%)',
                  boxShadow: '0 0 30px rgba(120,60,200,0.25)',
                  border: '1px solid rgba(180,80,220,0.4)',
                }}
              >
                התחבר עכשיו
              </button>

              <button
                onClick={() => setMode('select')}
                className="w-full py-2 text-white/45 hover:text-white/75 text-sm transition-colors"
              >
                → חזרה
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-white/25 text-[10px] mt-6 tracking-wider uppercase">
          RRX3 · אפליקציית קרבה אינטימית
        </p>
      </div>
    </div>
  );
};
