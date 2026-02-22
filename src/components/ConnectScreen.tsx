import React, { useState, useEffect, useRef } from 'react';
import { SyncService } from '../services/sync-service';

interface ConnectScreenProps {
  channelId: string;
  onPartnerConnected: () => void;
}

const BASE_URL = 'https://raniv123.github.io/RRX3/';

export const ConnectScreen: React.FC<ConnectScreenProps> = ({
  channelId,
  onPartnerConnected
}) => {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<'waiting' | 'connected'>('waiting');
  const [partnerName, setPartnerName] = useState('');
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [tab, setTab] = useState<'code' | 'link'>('link'); // ברירת מחדל: קישור מפתה
  const syncRef = useRef<SyncService | null>(null);

  const inviteLink = partnerName
    ? `${BASE_URL}?invite=${channelId}&name=${encodeURIComponent(partnerName)}`
    : `${BASE_URL}?invite=${channelId}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(channelId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {}
  };

  // האזנה להודעת JOIN מהשותף
  useEffect(() => {
    const sync = new SyncService(channelId, 'MAN');
    syncRef.current = sync;

    sync.connect(
      () => {},
      (sysMsg) => {
        if (sysMsg.type === 'JOIN') {
          setStatus('connected');
          setTimeout(() => { onPartnerConnected(); }, 800);
        }
      }
    );

    return () => { sync.disconnect(); };
  }, [channelId, onPartnerConnected]);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" dir="rtl">

      {/* רקע */}
      <div className="absolute inset-0 bg-gradient-to-br from-bordeaux via-dark to-electric-blue" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sexy-fuchsia/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-electric-blue/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-md w-full">

        {/* כותרת */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">{status === 'connected' ? '✅' : '🔗'}</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {status === 'connected' ? 'מחוברים!' : 'שלח הזמנה'}
          </h1>
          <p className="text-white/50">
            {status === 'connected' ? 'ממשיכים למסע...' : 'בחר איך לשלוח לפרטנרית שלך'}
          </p>
        </div>

        {status === 'waiting' && (
          <div className="bg-dark/50 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">

            {/* טאבים */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setTab('link')}
                className={`flex-1 py-4 text-sm font-medium transition-all ${
                  tab === 'link'
                    ? 'text-white bg-white/5 border-b-2 border-sexy-fuchsia'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                ✨ קישור מפתה
              </button>
              <button
                onClick={() => setTab('code')}
                className={`flex-1 py-4 text-sm font-medium transition-all ${
                  tab === 'code'
                    ? 'text-white bg-white/5 border-b-2 border-electric-blue'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                🔢 קוד חיבור
              </button>
            </div>

            <div className="p-6">

              {/* ===== TAB: קישור מפתה ===== */}
              {tab === 'link' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-white/50 text-xs uppercase tracking-widest mb-2">
                      השם שלה (לפרסונליזציה)
                    </label>
                    <input
                      type="text"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      placeholder="שם הפרטנרית..."
                      autoComplete="off"
                      className="w-full px-4 py-3 bg-white/8 backdrop-blur-sm rounded-xl text-white placeholder-white/30 border border-white/15 focus:border-sexy-fuchsia focus:outline-none text-right"
                    />
                  </div>

                  {/* Preview של הקישור */}
                  <div className="bg-black/30 rounded-xl p-4 border border-white/8">
                    <div className="text-white/25 text-[10px] uppercase tracking-widest mb-2">הקישור שישלח אליה</div>
                    <p className="text-white/50 text-xs font-mono break-all leading-relaxed">
                      {inviteLink}
                    </p>
                  </div>

                  {/* Preview של מה שתראה */}
                  <div
                    className="rounded-2xl p-4 border border-white/10 text-center"
                    style={{ background: 'linear-gradient(135deg, rgba(180,60,40,0.15), rgba(80,20,40,0.2))' }}
                  >
                    <div className="text-2xl mb-2">🕯️</div>
                    <p className="text-white/60 text-xs uppercase tracking-widest mb-1">היא תראה</p>
                    <p className="text-white text-sm font-light">
                      "{partnerName || 'את'} ❤ — הכנתי לך משהו"
                    </p>
                    <p className="text-white/30 text-xs mt-1">דף נחיתה מסתורי ואינטימי</p>
                  </div>

                  {/* כפתורי שיתוף */}
                  <button
                    onClick={handleCopyLink}
                    className="w-full py-4 rounded-xl text-white font-semibold text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: linkCopied
                        ? 'linear-gradient(135deg, #059669, #047857)'
                        : 'linear-gradient(135deg, rgba(180,60,40,0.8), rgba(120,20,60,0.9))',
                      boxShadow: '0 0 30px rgba(180,60,40,0.3)'
                    }}
                  >
                    {linkCopied ? '✅ הקישור הועתק! שלח לה ב-WhatsApp' : '📤 העתק קישור מפתה'}
                  </button>

                  {/* WhatsApp direct */}
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`הכנתי לך משהו מיוחד... ${inviteLink}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 rounded-xl text-white font-semibold text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)' }}
                  >
                    <span className="text-xl">💬</span>
                    שלח ישירות ב-WhatsApp
                  </a>
                </div>
              )}

              {/* ===== TAB: קוד ===== */}
              {tab === 'code' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-white/50 text-xs uppercase tracking-widest mb-2 text-center">
                      קוד החיבור
                    </label>
                    <div
                      className="rounded-xl p-5 text-center border"
                      style={{ background: 'linear-gradient(135deg, rgba(30,60,150,0.2), rgba(120,20,80,0.2))', borderColor: 'rgba(255,255,255,0.15)' }}
                    >
                      <code className="text-3xl font-mono text-white font-bold tracking-widest">
                        {channelId}
                      </code>
                    </div>
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className={`w-full py-4 rounded-xl text-white font-semibold text-base transition-all hover:scale-[1.02] ${
                      copied ? 'bg-green-600' : 'bg-gradient-to-r from-sexy-fuchsia to-bordeaux'
                    }`}
                  >
                    {copied ? '✅ הועתק!' : '📋 העתק קוד'}
                  </button>

                  <div className="space-y-2.5 text-sm text-white/50">
                    <div className="flex items-start gap-2">
                      <span className="text-sexy-fuchsia">1.</span>
                      <span>שלח את הקוד לפרטנרית</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-sexy-fuchsia">2.</span>
                      <span>היא פותחת את האפליקציה → "הצטרפי למסע"</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-sexy-fuchsia">3.</span>
                      <span>מדביקה את הקוד ומתחברת</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* מחכה לחיבור */}
            <div className="px-6 pb-6">
              <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/8">
                <div className="flex gap-1">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="w-2 h-2 bg-sexy-fuchsia rounded-full animate-bounce"
                      style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
                <span className="text-white/40 text-sm">מחכה לחיבור שלה...</span>
              </div>
            </div>
          </div>
        )}

        {status === 'connected' && (
          <div className="bg-dark/50 backdrop-blur-xl rounded-3xl border border-green-500/30 p-8 text-center">
            <div className="text-5xl mb-4">🔥</div>
            <div className="text-green-400 text-xl font-semibold mb-2">היא נכנסת!</div>
            <p className="text-white/50 text-sm">עוברים למסע שלכם...</p>
            <div className="flex justify-center gap-1.5 mt-4">
              {[0, 150, 300].map(d => (
                <div key={d} className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
