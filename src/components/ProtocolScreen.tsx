import React, { useState, useEffect, useRef } from 'react';
import { Message, UserGender, Scenario, AIResponse, Surprise } from '../types';
import { AIEngine } from '../services/ai-engine';
import { SyncService } from '../services/sync-service';
import { initTensionState, updateTension } from '../services/tension-engine';
import {
  initSurpriseTracking,
  shouldTriggerSurprise,
  selectSurprise,
  updateSurpriseTracking
} from '../services/surprise-engine';

interface ProtocolScreenProps {
  channelId: string;
  myGender: UserGender;
  scenario: Scenario;
}

// === חלקיקי אנימציה לפי שלב ===
const PhaseParticles: React.FC<{ phase: string; tension: number }> = ({ phase, tension }) => {
  const particles = Array.from({ length: 20 }, (_, i) => i);

  if (phase === 'ICE') {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {particles.map(i => (
          <div
            key={i}
            className="absolute text-blue-200/30 animate-float-down"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 6}s`,
              fontSize: `${8 + Math.random() * 14}px`
            }}
          >
            {['❄', '✧', '·', '❅'][Math.floor(Math.random() * 4)]}
          </div>
        ))}
      </div>
    );
  }

  if (phase === 'WARM') {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {particles.slice(0, 12).map(i => (
          <div
            key={i}
            className="absolute rounded-full animate-float-up"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `-5%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
              background: `radial-gradient(circle, rgba(244,114,182,${0.2 + Math.random() * 0.2}), transparent)`
            }}
          />
        ))}
      </div>
    );
  }

  if (phase === 'HOT') {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {particles.slice(0, 16).map(i => (
          <div
            key={i}
            className="absolute animate-flame-rise"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `-10%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
              fontSize: `${10 + Math.random() * 16}px`,
              opacity: 0.3 + Math.random() * 0.3
            }}
          >
            {['🔥', '✦', '♨'][Math.floor(Math.random() * 3)]}
          </div>
        ))}
      </div>
    );
  }

  // FIRE
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(i => (
        <div
          key={i}
          className="absolute animate-fire-burst"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: `-10%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
            fontSize: `${12 + Math.random() * 20}px`,
            opacity: 0.4 + Math.random() * 0.4
          }}
        >
          {['🔥', '💥', '⚡', '✨', '🌋'][Math.floor(Math.random() * 5)]}
        </div>
      ))}
    </div>
  );
};

// === אווטר ===
const Avatar: React.FC<{ gender: UserGender; size?: 'sm' | 'md' }> = ({ gender, size = 'sm' }) => {
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-lg' : 'w-10 h-10 text-xl';
  const isMan = gender === 'MAN';

  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 ${
      isMan
        ? 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30'
        : 'bg-gradient-to-br from-fuchsia-500 to-pink-600 shadow-lg shadow-fuchsia-500/30'
    }`}>
      {isMan ? '🕺' : '💃'}
    </div>
  );
};

// === הודעת צ'אט בודדת ===
const ChatBubble: React.FC<{
  msg: Message;
  isMine: boolean;
  phase: string;
}> = ({ msg, isMine, phase }) => {
  // צבעי border לפי שלב
  const phaseBorder = {
    ICE: 'border-blue-400/30',
    WARM: 'border-pink-400/30',
    HOT: 'border-red-400/40',
    FIRE: 'border-orange-400/50'
  }[phase] || 'border-white/20';

  const phaseGlow = {
    ICE: '',
    WARM: '',
    HOT: 'shadow-md shadow-red-500/10',
    FIRE: 'shadow-lg shadow-orange-500/20 animate-pulse-subtle'
  }[phase] || '';

  return (
    <div className={`flex items-end gap-2 animate-slide-up ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar gender={msg.senderGender} />
      <div className={`max-w-[70%] p-3 rounded-2xl border ${phaseBorder} ${phaseGlow} ${
        isMine
          ? msg.senderGender === 'MAN'
            ? 'bg-gradient-to-r from-blue-600/80 to-blue-800/80 text-white rounded-br-sm'
            : 'bg-gradient-to-r from-fuchsia-600/80 to-pink-700/80 text-white rounded-br-sm'
          : 'bg-white/10 backdrop-blur-sm text-white rounded-bl-sm'
      }`}>
        {msg.type === 'ACTION' && (
          <div className="text-xs opacity-60 mb-1">
            {msg.type === 'ACTION' ? '✋ פעולה' : ''}
          </div>
        )}
        <p className="text-sm leading-relaxed">{msg.text}</p>
        {msg.translation && (
          <p className="text-xs mt-1 opacity-50 italic">({msg.translation})</p>
        )}
      </div>
    </div>
  );
};

export const ProtocolScreen: React.FC<ProtocolScreenProps> = ({
  channelId,
  myGender,
  scenario
}) => {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [tensionState, setTensionState] = useState(initTensionState());
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [currentSurprise, setCurrentSurprise] = useState<Surprise | null>(null);
  const [surpriseTracking, setSurpriseTracking] = useState(initSurpriseTracking());
  const [loading, setLoading] = useState(false);
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number>(0);
  const [inputText, setInputText] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(true);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const syncService = useRef<SyncService>(new SyncService(channelId, myGender));
  const aiEngine = useRef<AIEngine>(new AIEngine());
  const sessionStartTime = useRef<number>(Date.now());

  // רקע דינמי לפי שלב
  const phaseBackground = {
    ICE: 'from-[#0a1628] via-[#0d1f3c] to-[#1a1a3e]',
    WARM: 'from-[#1a0a1a] via-[#2d1028] to-[#3a1030]',
    HOT: 'from-[#2a0a0a] via-[#3d1020] to-[#4a0a1a]',
    FIRE: 'from-[#3a0a00] via-[#4d1500] to-[#5a1000]'
  }[tensionState.phase] || 'from-[#0a1628] via-[#0d1f3c] to-[#1a1a3e]';

  // צבע בר מתח לפי שלב
  const tensionBarColor = {
    ICE: 'bg-gradient-to-r from-blue-400 to-cyan-400',
    WARM: 'bg-gradient-to-r from-pink-400 to-rose-500',
    HOT: 'bg-gradient-to-r from-red-500 to-orange-500',
    FIRE: 'bg-gradient-to-r from-orange-500 to-yellow-400'
  }[tensionState.phase] || 'bg-blue-400';

  // אייקון שלב
  const phaseIcon = {
    ICE: '❄️',
    WARM: '🌡️',
    HOT: '🌶️',
    FIRE: '🔥'
  }[tensionState.phase] || '❄️';

  // שם שלב בעברית
  const phaseName = {
    ICE: 'קרח',
    WARM: 'חימום',
    HOT: 'לוהט',
    FIRE: 'אש'
  }[tensionState.phase] || 'קרח';

  // גלילה אוטומטית להודעה אחרונה
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // חיבור לסנכרון
  useEffect(() => {
    syncService.current.connect(
      (message) => {
        setMessages(prev => [...prev, message]);
      }
    );

    return () => {
      syncService.current.disconnect();
    };
  }, []);

  // קריאת AI ראשונית בטעינת המסך
  useEffect(() => {
    fetchAIRecommendation();
  }, []);

  // קבלת המלצות AI אחרי כל הודעה חדשה
  useEffect(() => {
    if (messages.length > 0) {
      fetchAIRecommendation();
    }
  }, [messages]);

  // בדיקת הפתעות
  useEffect(() => {
    if (messages.length > 0) {
      checkForSurprise();
    }
  }, [messages, tensionState]);

  // קבלת המלצות מה-AI
  const fetchAIRecommendation = async () => {
    setLoading(true);
    try {
      const response = await aiEngine.current.getRecommendation(
        messages,
        tensionState.level,
        tensionState.phase,
        myGender,
        scenario
      );
      setAiResponse(response);
    } catch (error) {
      console.error('AI Recommendation Error:', error);
      setAiResponse({
        contextAnalysis: {
          summary: 'התחלת מסע חדש',
          mood: 'curious',
          readyForNext: false,
          recommendation: 'התחל בהיכרות',
          messageCount: 0,
          timeSinceStart: 0
        },
        strategicAdvice: {
          forMan: '💫 עכשיו זה הזמן — שלח לה משהו שיגרום לה לחייך. תתחיל עדין, תן לה להרגיש בטוחה.',
          forWoman: '✨ הוא מחכה למשהו ממך — תכנסי לתפקיד, תני למבט שלך לדבר.'
        },
        options: [
          {
            label: '💬 היכרות ראשונה',
            sendText: 'שלום... אני לא בטוח/ה שאנחנו צריכים להיות כאן ביחד',
            type: 'SAY',
            intent: 'פתיחת שיחה עם מתח',
            intensity: 2
          },
          {
            label: '🔥 כניסה לתפקיד',
            sendText: 'אני מרגיש/ה משהו מוזר... משיכה שלא צריכה להיות',
            type: 'SAY',
            intent: 'יצירת מתח ראשוני',
            intensity: 3
          },
          {
            label: '👀 מבט ראשון',
            sendText: '[מביט/ה בך לרגע ארוך מדי, ומיד מסיט/ה מבט]',
            type: 'DO',
            intent: 'שפת גוף מרמזת',
            intensity: 2
          }
        ],
        pacing: {
          currentPhase: 'ICE' as any,
          shouldProgress: false,
          reason: 'התחלה',
          recommendedMessages: '5-10',
          pacing: 'slow'
        },
        tension: 0,
        phase: 'ICE' as any,
        currentGoal: 'לבנות אמון ונוחות, מגע עדין ראשוני'
      });
    } finally {
      setLoading(false);
    }
  };

  // בדיקה אם צריך להציג הפתעה
  const checkForSurprise = () => {
    if (shouldTriggerSurprise(tensionState.level, messages.length, surpriseTracking)) {
      const surprise = selectSurprise(tensionState.level, messages.length, surpriseTracking);
      if (surprise) {
        setCurrentSurprise(surprise);
        setSurpriseTracking(prev => updateSurpriseTracking(prev, surprise.id));
      }
    }
  };

  // שליחת הודעה (מ-AI option או מ-input חופשי)
  const handleSendMessage = async (text: string, intensity: number, timer?: number, type?: string) => {
    if (!text.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      senderGender: myGender,
      text: text.trim(),
      timestamp: Date.now(),
      deviceId: channelId,
      type: (type === 'DO' ? 'ACTION' : 'CHAT') as any
    };

    // שלח לצד השני
    await syncService.current.sendMessage(message);

    // הוסף למסך שלי
    setMessages(prev => [...prev, message]);

    // עדכן מתח
    const timeSinceStart = Date.now() - sessionStartTime.current;
    const newTension = updateTension(tensionState, intensity, messages.length + 1, timeSinceStart);
    setTensionState(newTension);

    // הפעל טיימר אם יש
    if (timer) {
      startTimer(timer);
    }

    // נקה input
    setInputText('');
  };

  // שליחת הודעה חופשית
  const handleFreeTextSend = () => {
    if (!inputText.trim()) return;
    handleSendMessage(inputText, 2);
  };

  // שליחה עם Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFreeTextSend();
    }
  };

  // הפעלת טיימר
  const startTimer = (seconds: number) => {
    setActiveTimer(seconds);
    setTimerRemaining(seconds);

    const interval = setInterval(() => {
      setTimerRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setActiveTimer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // פורמט זמן
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`h-screen flex flex-col bg-gradient-to-br ${phaseBackground} transition-colors duration-[3000ms] relative`}>
      {/* חלקיקי אנימציה */}
      <PhaseParticles phase={tensionState.phase} tension={tensionState.level} />

      {/* Header - מד מתח */}
      <div className="relative z-10 p-3 bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{phaseIcon}</span>
            <div>
              <h3 className="text-white font-semibold text-sm">{scenario.title}</h3>
              <p className="text-white/50 text-xs">{tensionState.goal}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sexy-fuchsia to-orange-400">
              {tensionState.level}%
            </div>
            <div className="text-white/50 text-[10px] uppercase tracking-wider">{phaseName}</div>
          </div>
        </div>

        {/* בר מתח מונפש */}
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 rounded-full ${tensionBarColor}`}
            style={{ width: `${tensionState.level}%` }}
          />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white/30">
              <div className="text-5xl mb-3">{phaseIcon}</div>
              <p className="text-sm">בחרו אפשרות למטה או כתבו הודעה חופשית</p>
              <p className="text-xs mt-1 opacity-60">המסע מתחיל עכשיו...</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            msg={msg}
            isMine={msg.senderGender === myGender}
            phase={tensionState.phase}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Surprise Modal */}
      {currentSurprise && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-sexy-fuchsia/20 to-electric-blue/20 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-white/20 animate-scale-in">
            <div className="text-center">
              <div className="text-6xl mb-4">🎁</div>
              <h2 className="text-2xl font-bold text-white mb-2">{currentSurprise.title}</h2>
              <p className="text-white/80 text-base mb-6">{currentSurprise.description}</p>

              {currentSurprise.duration && (
                <div className="text-sexy-fuchsia text-2xl font-bold mb-4">
                  ⏱️ {currentSurprise.duration} שניות
                </div>
              )}

              <button
                onClick={() => setCurrentSurprise(null)}
                className="w-full py-3 px-6 bg-gradient-to-r from-sexy-fuchsia to-bordeaux rounded-xl text-white font-semibold text-lg hover:scale-105 transform transition-all"
              >
                בואו נעשה את זה! 🔥
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timer Display */}
      {activeTimer && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
          <div className="bg-black/80 backdrop-blur-xl rounded-full p-8 border-4 border-sexy-fuchsia animate-pulse-glow">
            <div className="text-6xl font-bold text-white text-center">
              {formatTime(timerRemaining)}
            </div>
          </div>
        </div>
      )}

      {/* === AI Director Panel === */}
      <div className="relative z-10 bg-black/40 backdrop-blur-xl border-t border-white/10">
        {/* Toggle AI Panel */}
        <button
          onClick={() => setShowAIPanel(!showAIPanel)}
          className="w-full py-1 flex items-center justify-center gap-1 text-white/40 hover:text-white/60 transition-colors"
        >
          <span className="text-xs">{showAIPanel ? '▼ הסתר הנחיות' : '▲ הצג הנחיות AI'}</span>
        </button>

        {showAIPanel && aiResponse && !loading && (
          <div className="px-4 pb-2 max-h-[35vh] overflow-y-auto">
            {/* ייעוץ אסטרטגי */}
            <div className={`mb-3 p-2.5 rounded-xl border ${
              tensionState.phase === 'ICE' ? 'bg-blue-500/10 border-blue-500/20' :
              tensionState.phase === 'WARM' ? 'bg-pink-500/10 border-pink-500/20' :
              tensionState.phase === 'HOT' ? 'bg-red-500/10 border-red-500/20' :
              'bg-orange-500/10 border-orange-500/20'
            }`}>
              <p className="text-white/80 text-xs leading-relaxed">
                {myGender === 'MAN' ? aiResponse.strategicAdvice.forMan : aiResponse.strategicAdvice.forWoman}
              </p>
            </div>

            {/* אפשרויות פעולה */}
            <div className="grid grid-cols-1 gap-2 mb-2">
              {aiResponse.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(option.sendText, option.intensity, option.timer, option.type)}
                  className={`p-3 rounded-xl text-right transition-all hover:scale-[1.02] active:scale-95 ${
                    option.isDirty
                      ? 'bg-gradient-to-r from-bordeaux/80 to-sexy-fuchsia/80 text-white border border-sexy-fuchsia/30'
                      : option.type === 'SAY'
                      ? 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                      : option.type === 'DO'
                      ? 'bg-blue-500/10 text-white border border-blue-500/20 hover:bg-blue-500/15'
                      : 'bg-fuchsia-500/10 text-white border border-fuchsia-500/20 hover:bg-fuchsia-500/15'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm mb-0.5">{option.label}</div>
                      <div className="text-[10px] opacity-50 truncate">{option.intent}</div>
                      {option.timer && (
                        <div className="text-[10px] mt-0.5 text-sexy-fuchsia">⏱️ {formatTime(option.timer)}</div>
                      )}
                    </div>
                    <div className="text-xl flex-shrink-0">
                      {option.type === 'SAY' ? '💬' : option.type === 'DO' ? '✋' : '📣'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="px-4 pb-2">
            <div className="flex items-center justify-center gap-2 py-3">
              <div className="w-2 h-2 bg-sexy-fuchsia rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-sexy-fuchsia rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
              <div className="w-2 h-2 bg-sexy-fuchsia rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
              <span className="text-white/30 text-xs mr-2">חושב על המהלך הבא...</span>
            </div>
          </div>
        )}

        {/* === Input Bar — שליחת הודעה חופשית === */}
        <div className="px-3 pb-3 pt-1">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-1.5 focus-within:border-sexy-fuchsia/50 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="כתוב הודעה חופשית..."
              className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none py-1.5"
              dir="rtl"
            />
            <button
              onClick={handleFreeTextSend}
              disabled={!inputText.trim()}
              className={`p-2 rounded-xl transition-all ${
                inputText.trim()
                  ? 'bg-gradient-to-r from-sexy-fuchsia to-bordeaux text-white hover:scale-105 active:scale-95'
                  : 'bg-white/5 text-white/20'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-180">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
