import { useState } from 'react';
import { Screen, UserGender, Scenario } from './types';
import { LoginScreen } from './components/LoginScreen';
import { ConnectScreen } from './components/ConnectScreen';
import { GenderSelection } from './components/GenderSelection';
import { ProtocolScreen } from './components/ProtocolScreen';
import { AIEngine } from './services/ai-engine';
import { SCENARIOS } from './data/scenarios';

function App() {
  const [screen, setScreen] = useState<Screen>('LOGIN');
  const [channelId, setChannelId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [myGender, setMyGender] = useState<UserGender | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);

  const aiEngine = new AIEngine();

  // התחברות
  const handleLogin = (id: string, host: boolean) => {
    setChannelId(id);
    setIsHost(host);

    if (host) {
      // אם יוצר חדש - הצג את קוד החיבור
      setScreen('CONNECT');
    } else {
      // אם מצטרף - ישר לבחירת מין
      setScreen('GENDER_SELECTION');
    }
  };

  // חיבור שותף
  const handlePartnerConnected = () => {
    setScreen('GENDER_SELECTION');
  };

  // בחירת מין
  const handleGenderSelect = async (gender: UserGender) => {
    setMyGender(gender);

    // אם אני היוצר - צור תרחיש חדש
    if (isHost) {
      try {
        const newScenario = await aiEngine.createScenario();
        setScenario(newScenario);
      } catch (error) {
        console.error('Scenario creation error:', error);
        // fallback - תרחיש מהרשימה
        setScenario(SCENARIOS[0]);
      }
    } else {
      // אם מצטרף - קבל תרחיש מהצד השני
      // בינתיים fallback
      setScenario(SCENARIOS[0]);
    }

    setScreen('PROTOCOL');
  };

  return (
    <div className="min-h-screen">
      {screen === 'LOGIN' && (
        <LoginScreen onLogin={handleLogin} />
      )}

      {screen === 'CONNECT' && (
        <ConnectScreen
          channelId={channelId}
          onPartnerConnected={handlePartnerConnected}
        />
      )}

      {screen === 'GENDER_SELECTION' && (
        <GenderSelection onSelect={handleGenderSelect} />
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
