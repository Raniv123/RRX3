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

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const syncService = useRef<SyncService>(new SyncService(channelId, myGender));
  const aiEngine = useRef<AIEngine>(new AIEngine());
  const sessionStartTime = useRef<number>(Date.now());

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
      // לא צריכים הודעות מערכת כאן - רק הודעות צ'אט
    );

    return () => {
      syncService.current.disconnect();
    };
  }, []);

  // קריאת AI ראשונית בטעינת המסך - יוצר אפשרויות פתיחה
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

  // שליחת הודעה
  const handleSendMessage = async (text: string, intensity: number, timer?: number) => {
    const message: Message = {
      id: Date.now().toString(),
      senderGender: myGender,
      text,
      timestamp: Date.now(),
      deviceId: channelId,
      type: 'CHAT'
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

  // פורמט זמן (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-bordeaux via-dark to-electric-blue">
      {/* Header - מד מתח */}
      <div className="p-4 bg-dark/40 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{tensionState.phase === 'ICE' ? '❄️' : tensionState.phase === 'WARM' ? '🔥' : tensionState.phase === 'HOT' ? '🌶️' : '💥'}</span>
            <div>
              <h3 className="text-white font-semibold">{scenario.title}</h3>
              <p className="text-white/60 text-sm">{tensionState.goal}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-sexy-fuchsia">{tensionState.level}%</div>
            <div className="text-white/60 text-xs">{tensionState.phase}</div>
          </div>
        </div>

        {/* בר מתח */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              tensionState.phase === 'ICE' ? 'bg-electric-blue' :
              tensionState.phase === 'WARM' ? 'bg-orange-500' :
              tensionState.phase === 'HOT' ? 'bg-red-500' :
              'bg-sexy-fuchsia'
            }`}
            style={{ width: `${tensionState.level}%` }}
          />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderGender === myGender ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] p-4 rounded-2xl ${
              msg.senderGender === myGender
                ? 'bg-gradient-to-r from-sexy-fuchsia to-bordeaux text-white'
                : 'bg-white/10 backdrop-blur-sm text-white border border-white/20'
            }`}>
              <p className="text-sm">{msg.text}</p>
              {msg.translation && (
                <p className="text-xs mt-1 opacity-60">({msg.translation})</p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Surprise Modal */}
      {currentSurprise && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-sexy-fuchsia/20 to-electric-blue/20 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-white/20 animate-scale-in">
            <div className="text-center">
              <div className="text-6xl mb-4">🎁</div>
              <h2 className="text-3xl font-bold text-white mb-2">{currentSurprise.title}</h2>
              <p className="text-white/80 text-lg mb-6">{currentSurprise.description}</p>

              {currentSurprise.duration && (
                <div className="text-sexy-fuchsia text-2xl font-bold mb-4">
                  ⏱️ {currentSurprise.duration} שניות
                </div>
              )}

              <button
                onClick={() => setCurrentSurprise(null)}
                className="w-full py-4 px-6 bg-gradient-to-r from-sexy-fuchsia to-bordeaux rounded-xl text-white font-semibold text-lg hover:scale-105 transform transition-all"
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
          <div className="bg-dark/90 backdrop-blur-xl rounded-full p-8 border-4 border-sexy-fuchsia animate-pulse">
            <div className="text-7xl font-bold text-white text-center">
              {formatTime(timerRemaining)}
            </div>
          </div>
        </div>
      )}

      {/* AI Director Panel */}
      {aiResponse && !loading && (
        <div className="p-4 bg-dark/60 backdrop-blur-xl border-t border-white/10 max-h-[40%] overflow-y-auto">
          {/* ייעוץ אסטרטגי */}
          <div className="mb-4 p-3 bg-electric-blue/10 rounded-xl border border-electric-blue/20">
            <p className="text-white/80 text-sm">
              💡 {myGender === 'MAN' ? aiResponse.strategicAdvice.forMan : aiResponse.strategicAdvice.forWoman}
            </p>
          </div>

          {/* אפשרויות פעולה */}
          <div className="grid grid-cols-1 gap-2">
            {aiResponse.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(option.sendText, option.intensity, option.timer)}
                className={`p-4 rounded-xl text-right transition-all hover:scale-[1.02] ${
                  option.isDirty
                    ? 'bg-gradient-to-r from-bordeaux to-sexy-fuchsia text-white'
                    : option.type === 'SAY'
                    ? 'bg-white/10 backdrop-blur-sm text-white border border-white/20'
                    : option.type === 'DO'
                    ? 'bg-electric-blue/20 text-white border border-electric-blue/30'
                    : 'bg-sexy-fuchsia/20 text-white border border-sexy-fuchsia/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold mb-1">{option.label}</div>
                    <div className="text-xs opacity-60">{option.intent}</div>
                    {option.timer && (
                      <div className="text-xs mt-1 text-sexy-fuchsia">⏱️ {formatTime(option.timer)}</div>
                    )}
                  </div>
                  <div className="text-2xl">
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
        <div className="p-4 bg-dark/60 backdrop-blur-xl border-t border-white/10">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-sexy-fuchsia rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-sexy-fuchsia rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-sexy-fuchsia rounded-full animate-bounce delay-200" />
          </div>
        </div>
      )}
    </div>
  );
};
