import React, { useState, useEffect, useRef } from 'react';
import { SyncService } from '../services/sync-service';

interface ConnectScreenProps {
  channelId: string;
  onPartnerConnected: () => void;
}

export const ConnectScreen: React.FC<ConnectScreenProps> = ({
  channelId,
  onPartnerConnected
}) => {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<'waiting' | 'connected'>('waiting');
  const syncRef = useRef<SyncService | null>(null);

  // העתקה ללוח
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(channelId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  // האזנה להודעת JOIN מהשותף
  useEffect(() => {
    const sync = new SyncService(channelId, 'MAN');
    syncRef.current = sync;

    sync.connect(
      () => {}, // לא צריכים הודעות צ'אט כאן
      (sysMsg) => {
        // כשהשותף שולח JOIN - נודיע שהתחבר
        if (sysMsg.type === 'JOIN') {
          setStatus('connected');
          // המתן חצי שניה כדי שהמשתמש יראה את ההודעה
          setTimeout(() => {
            onPartnerConnected();
          }, 800);
        }
      }
    );

    return () => {
      sync.disconnect();
    };
  }, [channelId, onPartnerConnected]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bordeaux via-dark to-electric-blue flex items-center justify-center p-4">
      {/* אפקט זוהר ברקע */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sexy-fuchsia/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-electric-blue/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Container ראשי */}
      <div className="relative z-10 max-w-md w-full">
        {/* כותרת */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="text-6xl mb-4 animate-bounce">
            {status === 'connected' ? '✅' : '🔗'}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {status === 'connected' ? 'השותף/ה התחבר/ה!' : 'מחכה לשותף/ה שלך...'}
          </h1>
          <p className="text-white/60">
            {status === 'connected' ? 'ממשיכים למסע...' : 'שתפ/י את הקוד הזה כדי להתחבר'}
          </p>
        </div>

        {/* כרטיס קוד */}
        <div className="bg-dark/40 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl animate-slide-up">
          {/* קוד החיבור */}
          <div className="mb-6">
            <label className="block text-white/60 text-sm mb-2 text-center">
              קוד החיבור שלכם
            </label>
            <div className="relative">
              <div className={`bg-gradient-to-r ${status === 'connected' ? 'from-green-500/20 to-green-600/20' : 'from-electric-blue/20 to-sexy-fuchsia/20'} backdrop-blur-sm rounded-xl p-4 border ${status === 'connected' ? 'border-green-500/40' : 'border-white/20'} text-center`}>
                <code className="text-2xl font-mono text-white font-bold tracking-wider">
                  {channelId}
                </code>
              </div>
            </div>
          </div>

          {status === 'waiting' && (
            <>
              {/* כפתור העתקה */}
              <button
                onClick={handleCopy}
                className={`w-full py-4 px-6 rounded-xl text-white font-semibold text-lg transform transition-all shadow-lg ${
                  copied
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-gradient-to-r from-sexy-fuchsia to-bordeaux hover:scale-105'
                }`}
              >
                {copied ? '✅ הועתק!' : '📋 העתק קוד'}
              </button>

              {/* הוראות */}
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-sexy-fuchsia text-xl flex-shrink-0">1.</span>
                  <p className="text-white/60 text-sm">
                    העתק את הקוד (לחץ על הכפתור למעלה)
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-sexy-fuchsia text-xl flex-shrink-0">2.</span>
                  <p className="text-white/60 text-sm">
                    שלח את הקוד לשותף/ה שלך (WhatsApp, SMS, וכו')
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-sexy-fuchsia text-xl flex-shrink-0">3.</span>
                  <p className="text-white/60 text-sm">
                    הוא/היא צריכ/ה ללחוץ "הצטרף למסע" ולהדביק את הקוד
                  </p>
                </div>
              </div>

              {/* אנימציה של חיבור */}
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-sexy-fuchsia rounded-full animate-pulse" />
                  <div className="w-3 h-3 bg-sexy-fuchsia rounded-full animate-pulse delay-200" />
                  <div className="w-3 h-3 bg-sexy-fuchsia rounded-full animate-pulse delay-400" />
                </div>
              </div>
            </>
          )}

          {status === 'connected' && (
            <div className="text-center">
              <div className="text-green-400 text-lg font-semibold mb-2">
                ✅ מחובר בהצלחה!
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white/60">עוברים לשלב הבא...</span>
              </div>
            </div>
          )}
        </div>

        {/* טיפ */}
        <div className="mt-6 bg-electric-blue/10 backdrop-blur-sm rounded-xl p-4 border border-electric-blue/20">
          <p className="text-white/60 text-sm text-center">
            💡 <span className="font-semibold">טיפ:</span> ודאו ששני המכשירים מחוברים לאינטרנט
          </p>
        </div>
      </div>
    </div>
  );
};
