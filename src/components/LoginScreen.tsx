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
    <div className="min-h-screen bg-gradient-to-br from-bordeaux via-dark to-electric-blue flex items-center justify-center p-4">
      {/* אפקט זוהר ברקע */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sexy-fuchsia/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-electric-blue/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Container ראשי */}
      <div className="relative z-10 max-w-md w-full">
        {/* Logo + כותרת */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="text-6xl mb-4">🔥</div>
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
            RRX<span className="text-sexy-fuchsia">3</span>
          </h1>
          <p className="text-white/60 text-lg">המסע המשותף שלכם מתחיל כאן</p>
        </div>

        {/* כרטיס ראשי */}
        <div className="bg-dark/40 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          {mode === 'select' && (
            <div className="space-y-4 animate-slide-up">
              {/* כפתור חזרה למסע — מופיע רק אם יש סשן שמור */}
              {hasLastSession && onResume && (
                <button
                  onClick={onResume}
                  className="w-full py-4 px-6 bg-gradient-to-r from-emerald-700/60 to-emerald-600/60 border border-emerald-400/40 rounded-xl text-emerald-200 font-semibold text-lg hover:scale-105 transform transition-all shadow-lg hover:shadow-emerald-500/30 backdrop-blur-sm"
                >
                  🔄 חזור למסע שהתחלתם
                </button>
              )}

              <button
                onClick={() => setMode('create')}
                className="w-full py-4 px-6 bg-gradient-to-r from-sexy-fuchsia to-bordeaux rounded-xl text-white font-semibold text-lg hover:scale-105 transform transition-all shadow-lg hover:shadow-sexy-fuchsia/50"
              >
                ✨ התחל מסע חדש
              </button>

              <button
                onClick={() => setMode('join')}
                className="w-full py-4 px-6 bg-white/10 backdrop-blur-sm rounded-xl text-white font-semibold text-lg hover:bg-white/20 transform transition-all border border-white/20"
              >
                🔗 הצטרף למסע
              </button>

              {/* כפתור הפתעה — מפריד */}
              {onInvite && (
                <>
                  <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-white/25 text-xs">או</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                  <button
                    onClick={onInvite}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-rose-900/60 to-pink-900/60 border border-rose-500/30 rounded-xl text-rose-200/90 font-medium text-base hover:scale-[1.02] transform transition-all hover:border-rose-400/50 hover:from-rose-800/60"
                  >
                    💌 הפתע את הפרטנרית שלך
                  </button>
                </>
              )}

              <p className="text-center text-white/40 text-sm mt-6">
                שני המכשירים צריכים להיות מחוברים לאינטרנט
              </p>
            </div>
          )}

          {mode === 'create' && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">יצירת מסע חדש</h2>
                <p className="text-white/60">לחץ ליצירת קוד חיבור ייחודי</p>
              </div>

              <button
                onClick={handleCreate}
                className="w-full py-4 px-6 bg-gradient-to-r from-electric-blue to-sexy-fuchsia rounded-xl text-white font-semibold text-lg hover:scale-105 transform transition-all shadow-lg"
              >
                🎯 צור קוד חיבור
              </button>

              <button
                onClick={() => setMode('select')}
                className="w-full py-3 text-white/60 hover:text-white transition-colors"
              >
                ← חזרה
              </button>
            </div>
          )}

          {mode === 'join' && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">הצטרפות למסע</h2>
                <p className="text-white/60">הכנס את הקוד מהמכשיר השני</p>
              </div>

              <div>
                <input
                  type="text"
                  value={channelId}
                  onChange={(e) => {
                    setChannelId(e.target.value);
                    setError('');
                  }}
                  placeholder="1900"
                  className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm rounded-xl text-white placeholder-white/40 border border-white/20 focus:border-sexy-fuchsia focus:outline-none text-center text-lg font-mono"
                />
                {error && (
                  <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
                )}
              </div>

              <button
                onClick={handleJoin}
                className="w-full py-4 px-6 bg-gradient-to-r from-electric-blue to-sexy-fuchsia rounded-xl text-white font-semibold text-lg hover:scale-105 transform transition-all shadow-lg"
              >
                🚀 התחבר עכשיו
              </button>

              <button
                onClick={() => setMode('select')}
                className="w-full py-3 text-white/60 hover:text-white transition-colors"
              >
                ← חזרה
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-xs mt-6">
          RRX3 v2.0 · אפליקציית קרבה אינטימית לזוגות
        </p>
      </div>
    </div>
  );
};
