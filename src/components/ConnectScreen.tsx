import React, { useState } from 'react';

interface ConnectScreenProps {
  channelId: string;
  onPartnerConnected: () => void;
}

export const ConnectScreen: React.FC<ConnectScreenProps> = ({
  channelId,
  onPartnerConnected
}) => {
  const [copied, setCopied] = useState(false);

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

  // סימולציה - בפועל יהיה בדיקה אמיתית של חיבור השני
  // כרגע פשוט ממשיכים אחרי 3 שניות (לבדיקות)
  React.useEffect(() => {
    // const timer = setTimeout(() => {
    //   onPartnerConnected();
    // }, 3000);
    // return () => clearTimeout(timer);
  }, []);

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
          <div className="text-6xl mb-4 animate-bounce">🔗</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            מחכה לשותף/ה שלך...
          </h1>
          <p className="text-white/60">שתפ/י את הקוד הזה כדי להתחבר</p>
        </div>

        {/* כרטיס קוד */}
        <div className="bg-dark/40 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl animate-slide-up">
          {/* קוד החיבור */}
          <div className="mb-6">
            <label className="block text-white/60 text-sm mb-2 text-center">
              קוד החיבור שלכם
            </label>
            <div className="relative">
              <div className="bg-gradient-to-r from-electric-blue/20 to-sexy-fuchsia/20 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
                <code className="text-2xl font-mono text-white font-bold tracking-wider">
                  {channelId}
                </code>
              </div>
            </div>
          </div>

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
        </div>

        {/* טיפ */}
        <div className="mt-6 bg-electric-blue/10 backdrop-blur-sm rounded-xl p-4 border border-electric-blue/20">
          <p className="text-white/60 text-sm text-center">
            💡 <span className="font-semibold">טיפ:</span> ודאו ששני המכשירים מחוברים לאינטרנט
          </p>
        </div>

        {/* כפתור דיבאג - להמשיך בלי חיבור (רק לפיתוח) */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={onPartnerConnected}
            className="w-full mt-4 py-2 text-white/30 hover:text-white/60 text-sm transition-colors"
          >
            [DEV] המשך בלי חיבור
          </button>
        )}
      </div>
    </div>
  );
};
