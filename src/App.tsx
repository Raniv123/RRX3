import { useState, useEffect, useRef } from 'react';
import { Screen, UserGender, Scenario } from './types';
import { LoginScreen } from './components/LoginScreen';
import { ConnectScreen } from './components/ConnectScreen';
import { BreathSyncScreen } from './components/BreathSyncScreen';
import { ProtocolScreen } from './components/ProtocolScreen';
import { InvitationScreen } from './components/InvitationScreen';
import { InvitationComposerScreen, InvitationReceiverScreen, Invitation } from './components/InvitationComposerScreen';
import { WaitingScreen } from './components/WaitingScreen';
import { AIEngine } from './services/ai-engine';
import { SyncService, SystemMessage } from './services/sync-service';

const LAST_SESSION_KEY = 'rrx3_last_session';

// זיהוי URL params — הזמנה מהגבר
function parseInviteParams(): { code: string; name: string } | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('invite');
    const name = params.get('name') || '';
    if (code && code.length >= 3) return { code, name: decodeURIComponent(name) };
  } catch {}
  return null;
}

// זיהוי URL params — הזמנה מיוחדת (מכתב + שעה)
function parseSpecialInvite(): Invitation | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('msg');
    const time = params.get('time');
    if (msg && time) return { message: decodeURIComponent(msg), time };
  } catch {}
  return null;
}

// זיהוי URL params — מסך הכנה (30 דקות לפני)
function parsePrepParams(): { code: string; time: string } | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('prepare');
    const time = params.get('time');
    if (code && time) return { code, time };
  } catch {}
  return null;
}

type AppScreen = Screen | 'INVITATION' | 'BREATH_SYNC' | 'INVITE_COMPOSE' | 'INVITE_RECEIVED' | 'WAITING' | 'PREP';

function App() {
  const inviteParams = parseInviteParams();
  const specialInvite = parseSpecialInvite();
  const prepParams = parsePrepParams();
  const [screen, setScreen] = useState<AppScreen>(
    prepParams ? 'PREP' : specialInvite ? 'INVITE_RECEIVED' : inviteParams ? 'INVITATION' : 'LOGIN'
  );
  const [channelId, setChannelId] = useState(prepParams?.code || inviteParams?.code || '');
  const [isHost, setIsHost] = useState(false);
  const [myGender, setMyGender] = useState<UserGender | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loadingScenario, setLoadingScenario] = useState(false);
  const [pendingInvitation, setPendingInvitation] = useState<Invitation | null>(specialInvite);
  const [meetingTime, setMeetingTime] = useState(prepParams?.time || '');

  const aiEngine = useRef(new AIEngine());
  const syncRef = useRef<SyncService | null>(null);
  const scenarioCreationRef = useRef(false); // guard ל-handlePartnerConnected
  const joinerFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // הצגת Toast קצר
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // שמירת סשן אחרון בכל כניסה למסך PROTOCOL (מוגן מ-quota/private mode)
  useEffect(() => {
    if (screen === 'PROTOCOL' && myGender && scenario && channelId) {
      try {
        localStorage.setItem(LAST_SESSION_KEY, JSON.stringify({ channelId, myGender, scenario }));
      } catch {
        // Safari private mode / quota exceeded — מתעלמים בשקט
      }
    }
  }, [screen, myGender, scenario, channelId]);

  // חזרה למסע שהופסק
  const handleResume = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(LAST_SESSION_KEY) || 'null');
      if (saved?.channelId && saved?.myGender && saved?.scenario?.roles?.MAN && saved?.scenario?.roles?.WOMAN) {
        setChannelId(saved.channelId);
        setMyGender(saved.myGender);
        setScenario(saved.scenario);
        setIsHost(false);
        setScreen('PROTOCOL');
      }
    } catch {
      // parse error — לא להמשיך
    }
  };

  // התחברות
  const handleLogin = (id: string, host: boolean) => {
    setChannelId(id);
    setIsHost(host);
    setMyGender(host ? 'MAN' : 'WOMAN');

    if (host) {
      setScreen('CONNECT');
    } else {
      // מצטרפת — מאזינה קודם, אז שולחת JOIN (מניעת race)
      if (syncRef.current) {
        syncRef.current.disconnect();
        syncRef.current = null;
      }
      const tempSync = new SyncService(id, 'WOMAN');
      tempSync.connect(
        () => {},
        (sysMsg: SystemMessage) => {
          if (sysMsg.type === 'SCENARIO' && sysMsg.data) {
            setScenario(sysMsg.data);
          }
        }
      );
      tempSync.sendJoinSignal();
      syncRef.current = tempSync;

      setLoadingScenario(true);

      // fallback של 30 שניות עם cleanup
      if (joinerFallbackRef.current) clearTimeout(joinerFallbackRef.current);
      joinerFallbackRef.current = setTimeout(() => {
        joinerFallbackRef.current = null;
        setScenario(prev => prev ?? aiEngine.current.getDefaultScenarioPublic());
        setLoadingScenario(false);
      }, 30000);
    }
  };

  // חיבור שותף — host יוצר תרחיש ושולח (idempotent)
  const handlePartnerConnected = async () => {
    if (scenarioCreationRef.current) return; // מונע double-creation
    scenarioCreationRef.current = true;
    setLoadingScenario(true);

    const sync = new SyncService(channelId, 'MAN');
    try {
      const newScenario = await aiEngine.current.createScenario();
      const avatarImages = await aiEngine.current.generateAvatars(newScenario);
      if (avatarImages.MAN || avatarImages.WOMAN) {
        newScenario.avatars = avatarImages;
      }
      setScenario(newScenario);
      await sync.sendScenario(newScenario);
    } catch {
      const fallback = aiEngine.current.getDefaultScenarioPublic();
      setScenario(fallback);
      await sync.sendScenario(fallback);
    } finally {
      sync.disconnect();
      setLoadingScenario(false);
      setScreen('BREATH_SYNC');
    }
  };

  // כשהתרחיש מגיע ל-joiner — עבור למסך נשימה + נקה fallback
  useEffect(() => {
    if (!isHost && scenario && loadingScenario) {
      if (joinerFallbackRef.current) {
        clearTimeout(joinerFallbackRef.current);
        joinerFallbackRef.current = null;
      }
      setLoadingScenario(false);
      setScreen('BREATH_SYNC');
    }
  }, [scenario, isHost, loadingScenario]);

  // ניקוי SyncService + timers ב-unmount
  useEffect(() => {
    return () => {
      syncRef.current?.disconnect();
      syncRef.current = null;
      if (joinerFallbackRef.current) {
        clearTimeout(joinerFallbackRef.current);
        joinerFallbackRef.current = null;
      }
    };
  }, []);

  // ניתוק tempSync של joiner ברגע שיש תרחיש (כדי לא להחזיק חיבור כפול)
  useEffect(() => {
    if (!isHost && scenario && syncRef.current) {
      syncRef.current.disconnect();
      syncRef.current = null;
    }
  }, [scenario, isHost]);

  return (
    <div className="min-h-screen">
      {screen === 'INVITATION' && inviteParams && (
        <InvitationScreen
          partnerName={inviteParams.name}
          channelCode={inviteParams.code}
          onAccept={(code) => {
            setChannelId(code);
            setIsHost(false);
            // ניקוי URL params
            window.history.replaceState({}, '', window.location.pathname);
            handleLogin(code, false);
          }}
        />
      )}

      {screen === 'LOGIN' && (
        <LoginScreen
          onLogin={handleLogin}
          onResume={handleResume}
          onInvite={() => setScreen('INVITE_COMPOSE')}
        />
      )}

      {screen === 'INVITE_COMPOSE' && (
        <InvitationComposerScreen
          onBack={() => setScreen('LOGIN')}
          onSend={async (invitation) => {
            const code = SyncService.generateChannelId();
            const baseUrl = window.location.origin + window.location.pathname;
            const url = `${baseUrl}?msg=${encodeURIComponent(invitation.message)}&time=${invitation.time}&invite=${code}`;
            try {
              await navigator.clipboard.writeText(url);
              showToast('💌 הקישור הועתק — שלח/י לפרטנרית');
            } catch {
              showToast('⚠️ לא הצלחתי להעתיק — העתק/י ידנית מהיומן');
            }
            setChannelId(code);
            setMeetingTime(invitation.time);
            setIsHost(true);
            setScreen('WAITING');
          }}
        />
      )}

      {screen === 'INVITE_RECEIVED' && pendingInvitation && (
        <InvitationReceiverScreen
          invitation={pendingInvitation}
          onAccept={(time) => {
            const code = inviteParams?.code || '';
            setMeetingTime(time);
            setChannelId(code);
            setPendingInvitation(null);
            window.history.replaceState({}, '', window.location.pathname);
            // הציג מסך המתנה — לא נכנסים למשחק מיד
            setScreen('WAITING');
          }}
          onDecline={() => {
            setPendingInvitation(null);
            window.history.replaceState({}, '', window.location.pathname);
            setScreen('LOGIN');
          }}
        />
      )}

      {screen === 'WAITING' && meetingTime && channelId && (
        <WaitingScreen
          meetingTime={meetingTime}
          channelCode={channelId}
          isHost={isHost}
          onEnter={isHost
            ? () => setScreen('CONNECT')       // גבר → CONNECT (ממתין לה)
            : () => handleLogin(channelId, false) // אשה → join + BREATH_SYNC
          }
        />
      )}

      {screen === 'PREP' && prepParams && (
        <WaitingScreen
          meetingTime={prepParams.time}
          channelCode={prepParams.code}
          isPrepMode={true}
          onEnter={() => handleLogin(prepParams.code, false)}
        />
      )}

      {screen === 'CONNECT' && (
        <ConnectScreen
          channelId={channelId}
          onPartnerConnected={handlePartnerConnected}
        />
      )}

      {loadingScenario && (
        <div className="min-h-screen flex items-center justify-center" style={{
          background: 'radial-gradient(ellipse at 30% 40%, #1a0520 0%, #050508 50%, #0a0a12 100%)'
        }}>
          {/* Ambient particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="absolute rounded-full"
                style={{
                  width: `${80 + i * 40}px`, height: `${80 + i * 40}px`,
                  left: `${10 + i * 15}%`, top: `${20 + (i % 3) * 25}%`,
                  background: i % 2 === 0 ? 'rgba(180,40,80,0.04)' : 'rgba(100,40,180,0.04)',
                  filter: 'blur(40px)',
                  animation: `pulse ${3 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.4}s`
                }} />
            ))}
          </div>
          <div className="relative z-10 text-center px-8">
            {/* Elegant pulsing orb */}
            <div className="relative mx-auto mb-10 w-20 h-20">
              <div className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ background: 'radial-gradient(circle, rgba(180,40,80,0.6), transparent)' }} />
              <div className="absolute inset-2 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(180,40,80,0.25), transparent)',
                         border: '1px solid rgba(180,40,80,0.3)',
                         boxShadow: '0 0 40px rgba(180,40,80,0.2)' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div style={{ fontSize: '28px', filter: 'drop-shadow(0 0 8px rgba(255,100,100,0.4))' }}>🔥</div>
              </div>
            </div>
            <p className="text-white/25 text-[10px] uppercase tracking-[5px] mb-4">המסע שלכם</p>
            <h2 className="text-white/90 text-2xl font-light mb-3" style={{ letterSpacing: '-0.3px' }}>
              {isHost ? 'בונה את העולם שלכם...' : 'מחכה לך...'}
            </h2>
            <p className="text-white/30 text-sm leading-relaxed mb-8">
              {isHost ? 'כל מסע הוא שונה' : 'הוא בוחר משהו מיוחד עבורך'}
            </p>
            <div className="flex justify-center gap-2">
              {[0, 300, 600].map(d => (
                <div key={d} className="w-1.5 h-1.5 rounded-full"
                  style={{ background: 'rgba(180,40,80,0.6)', animation: 'bounce 1.2s ease-in-out infinite', animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {screen === 'BREATH_SYNC' && myGender && scenario && (
        <BreathSyncScreen
          onComplete={() => setScreen('PROTOCOL')}
          channelId={channelId}
          myGender={myGender}
          isHost={isHost}
        />
      )}

      {screen === 'PROTOCOL' && myGender && scenario && (
        <ProtocolScreen
          channelId={channelId}
          myGender={myGender}
          scenario={scenario}
        />
      )}

      {/* Toast — קצר ועדין */}
      {toast && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl text-white text-sm backdrop-blur-xl shadow-2xl animate-slide-up"
          role="status"
          aria-live="polite"
          style={{
            background: 'rgba(15,15,20,0.92)',
            border: '1px solid rgba(255,255,255,0.12)',
            maxWidth: 'calc(100vw - 32px)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
