import { useState, useEffect, useRef } from 'react';
import { Screen, UserGender, Scenario } from './types';
import { LoginScreen } from './components/LoginScreen';
import { ConnectScreen } from './components/ConnectScreen';
import { GenderSelection } from './components/GenderSelection';
import { ProtocolScreen } from './components/ProtocolScreen';
import { AIEngine } from './services/ai-engine';
import { SyncService, SystemMessage } from './services/sync-service';

const LAST_SESSION_KEY = 'rrx3_last_session';

function App() {
  const [screen, setScreen] = useState<Screen>('LOGIN');
  const [channelId, setChannelId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [myGender, setMyGender] = useState<UserGender | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loadingScenario, setLoadingScenario] = useState(false);

  const aiEngine = useRef(new AIEngine());
  const syncRef = useRef<SyncService | null>(null);

  // שמירת סשן אחרון בכל כניסה למסך PROTOCOL
  useEffect(() => {
    if (screen === 'PROTOCOL' && myGender && scenario && channelId) {
      localStorage.setItem(LAST_SESSION_KEY, JSON.stringify({ channelId, myGender, scenario }));
    }
  }, [screen, myGender, scenario, channelId]);

  // חזרה למסע שהופסק
  const handleResume = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(LAST_SESSION_KEY) || 'null');
      if (saved?.channelId && saved?.myGender && saved?.scenario) {
        setChannelId(saved.channelId);
        setMyGender(saved.myGender);
        setScenario(saved.scenario);
        setIsHost(false); // לא רלוונטי בחזרה
        setScreen('PROTOCOL');
      }
    } catch { /* ignore parse errors */ }
  };

  // התחברות
  const handleLogin = (id: string, host: boolean) => {
    setChannelId(id);
    setIsHost(host);

    if (host) {
      // אם יוצר חדש - הצג את קוד החיבור
      setScreen('CONNECT');
    } else {
      // אם מצטרף - קודם להאזין, ואז לשלוח JOIN (מניעת race condition)
      const tempSync = new SyncService(id, 'MAN');

      // חיבור מיידי לפני JOIN כדי לא לפספס הודעות
      tempSync.connect(
        () => {},
        (sysMsg: SystemMessage) => {
          if (sysMsg.type === 'SCENARIO' && sysMsg.data) {
            setScenario(sysMsg.data);
          }
        }
      );

      // שלח JOIN אחרי שמאזינים
      tempSync.sendJoinSignal();
      syncRef.current = tempSync;
      setScreen('GENDER_SELECTION');
    }
  };

  // חיבור שותף - host עובר לבחירת מין
  const handlePartnerConnected = () => {
    setScreen('GENDER_SELECTION');
  };

  // בחירת מין
  const handleGenderSelect = async (gender: UserGender) => {
    setMyGender(gender);

    if (isHost) {
      // Host - צור תרחיש דינמי ושלח לשותף
      setLoadingScenario(true);
      try {
        const newScenario = await aiEngine.current.createScenario();
        setScenario(newScenario);

        // שלח את התרחיש לשותף
        const sync = new SyncService(channelId, gender);
        await sync.sendScenario(newScenario);
        sync.disconnect();
      } catch (error) {
        console.error('Scenario creation error:', error);
        // fallback
        const fallback = aiEngine.current.getDefaultScenarioPublic();
        setScenario(fallback);

        const sync = new SyncService(channelId, gender);
        await sync.sendScenario(fallback);
        sync.disconnect();
      }
      setLoadingScenario(false);
      setScreen('PROTOCOL');
    } else {
      // Joiner - אם כבר יש תרחיש מה-host, עבור ישר
      if (scenario) {
        setScreen('PROTOCOL');
      } else {
        // חכה לתרחיש מה-host
        // useEffect יזהה כשיגיע התרחיש ויעבור ל-PROTOCOL
        setLoadingScenario(true);

        // fallback אחרי 30 שניות אם ה-host לא שלח תרחיש
        setTimeout(() => {
          setScenario(prev => {
            if (!prev) return aiEngine.current.getDefaultScenarioPublic();
            return prev;
          });
          setLoadingScenario(false);
        }, 30000);
      }
    }
  };

  // כשהתרחיש מגיע לjoiner - עבור למסך הפרוטוקול
  useEffect(() => {
    if (!isHost && scenario && loadingScenario) {
      setLoadingScenario(false);
      setScreen('PROTOCOL');
    }
  }, [scenario, isHost, loadingScenario]);

  // ניקוי SyncService
  useEffect(() => {
    return () => {
      syncRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen">
      {screen === 'LOGIN' && (
        <LoginScreen onLogin={handleLogin} onResume={handleResume} />
      )}

      {screen === 'CONNECT' && (
        <ConnectScreen
          channelId={channelId}
          onPartnerConnected={handlePartnerConnected}
        />
      )}

      {screen === 'GENDER_SELECTION' && !loadingScenario && (
        <GenderSelection onSelect={handleGenderSelect} />
      )}

      {loadingScenario && (
        <div className="min-h-screen bg-gradient-to-br from-bordeaux via-dark to-electric-blue flex items-center justify-center p-4">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sexy-fuchsia/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-electric-blue/20 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>
          <div className="relative z-10 text-center">
            <div className="text-6xl mb-6 animate-bounce">🎭</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isHost ? 'יוצר תרחיש מפתיע...' : 'מקבל תרחיש מהשותף/ה...'}
            </h2>
            <p className="text-white/60 mb-8">
              {isHost ? 'ה-AI בוחר משהו מיוחד עבורכם' : 'רגע, התרחיש בדרך...'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-4 h-4 bg-sexy-fuchsia rounded-full animate-bounce" />
              <div className="w-4 h-4 bg-sexy-fuchsia rounded-full animate-bounce delay-100" />
              <div className="w-4 h-4 bg-sexy-fuchsia rounded-full animate-bounce delay-200" />
            </div>
          </div>
        </div>
      )}

      {screen === 'PROTOCOL' && myGender && scenario && (
        <ProtocolScreen
          channelId={channelId}
          myGender={myGender}
          scenario={scenario}
        />
      )}
    </div>
  );
}

export default App;
