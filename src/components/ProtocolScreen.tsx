import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, UserGender, Scenario, AIResponse, GameCard, AvatarImages } from '../types';
import { AIEngine } from '../services/ai-engine';
import { SyncService } from '../services/sync-service';
import { initTensionState, updateTension } from '../services/tension-engine';
import {
  initSurpriseTracking,
  shouldTriggerSurprise,
  selectSurprise,
  updateSurpriseTracking
} from '../services/surprise-engine';

// ===== סצינות קסומות =====
const MAGICAL_SCENES = [
  {
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&q=85&auto=format&fit=crop',
    name: 'פריז בלילה',
    overlay: 'from-black/60 via-black/30 to-black/60'
  },
  {
    url: 'https://images.unsplash.com/photo-1540202404-1b927e27fa8b?w=1920&q=85&auto=format&fit=crop',
    name: 'ונציה הקסומה',
    overlay: 'from-black/60 via-black/20 to-black/70'
  },
  {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85&auto=format&fit=crop',
    name: 'הרים כחולים',
    overlay: 'from-black/70 via-black/30 to-black/60'
  },
  {
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=85&auto=format&fit=crop',
    name: 'חוף פרטי',
    overlay: 'from-black/50 via-black/20 to-black/60'
  },
  {
    url: 'https://images.unsplash.com/photo-1518209916812-65c4e1a5e8d0?w=1920&q=85&auto=format&fit=crop',
    name: 'בקתה קסומה',
    overlay: 'from-black/60 via-black/30 to-black/70'
  },
  {
    url: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1920&q=85&auto=format&fit=crop',
    name: 'מלדיביים',
    overlay: 'from-black/40 via-black/20 to-black/60'
  },
  {
    url: 'https://images.unsplash.com/photo-1445308394107-257d9bf5b9b5?w=1920&q=85&auto=format&fit=crop',
    name: 'יער נגוהות',
    overlay: 'from-black/60 via-black/30 to-black/60'
  },
  {
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=85&auto=format&fit=crop',
    name: 'הרים בלילה',
    overlay: 'from-black/60 via-black/20 to-black/70'
  }
];

// ===== אווטר CGI =====
const CGIAvatar: React.FC<{
  gender: UserGender;
  avatarUrl: string | null;
  size?: 'sm' | 'md';
}> = ({ gender, avatarUrl, size = 'sm' }) => {
  const dim = size === 'sm' ? 'w-9 h-9' : 'w-11 h-11';
  const isMan = gender === 'MAN';

  if (avatarUrl) {
    return (
      <div className={`${dim} rounded-full overflow-hidden flex-shrink-0 border-2 ${
        isMan ? 'border-blue-400/50 shadow-lg shadow-blue-500/30' : 'border-fuchsia-400/50 shadow-lg shadow-fuchsia-500/30'
      }`}>
        <img src={avatarUrl} alt={gender} className="w-full h-full object-cover" />
      </div>
    );
  }

  // fallback — SVG silhouette יפה
  return (
    <div className={`${dim} rounded-full flex-shrink-0 overflow-hidden border-2 ${
      isMan
        ? 'border-blue-400/50 shadow-lg shadow-blue-500/30'
        : 'border-fuchsia-400/50 shadow-lg shadow-fuchsia-500/30'
    }`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id={`grad-${gender}`} x1="0%" y1="0%" x2="100%" y2="100%">
            {isMan ? (
              <>
                <stop offset="0%" stopColor="#1e40af" />
                <stop offset="100%" stopColor="#3b82f6" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#86198f" />
                <stop offset="100%" stopColor="#d946ef" />
              </>
            )}
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#grad-${gender})`} />
        {/* Head */}
        <ellipse cx="50" cy="30" rx="18" ry="20" fill="rgba(255,255,255,0.25)" />
        {/* Body */}
        <path
          d={isMan
            ? "M22 100 C22 70 35 60 50 60 C65 60 78 70 78 100 Z"
            : "M20 100 C20 68 32 56 50 60 C68 56 80 68 80 100 Z"
          }
          fill="rgba(255,255,255,0.20)"
        />
        {/* Subtle glow */}
        <ellipse cx="50" cy="50" rx="48" ry="48" fill="none"
          stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
      </svg>
    </div>
  );
};

// ===== בועת צ'אט =====
const ChatBubble: React.FC<{
  msg: Message;
  isMine: boolean;
  phase: string;
  avatarUrl: string | null;
}> = ({ msg, isMine, phase, avatarUrl }) => {
  const isAction = msg.type === 'ACTION';

  const phaseGlow = {
    ICE: '',
    WARM: '',
    HOT: isMine ? 'shadow-md shadow-red-500/20' : '',
    FIRE: isMine ? 'shadow-lg shadow-orange-500/30' : ''
  }[phase] || '';

  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      <CGIAvatar gender={msg.senderGender} avatarUrl={avatarUrl} size="sm" />

      <div className={`max-w-[72%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        {isAction && (
          <span className="text-[10px] text-white/40 mx-2">
            {isMine ? '✋ פעולה' : '✋ פעולה'}
          </span>
        )}
        <div className={`px-4 py-2.5 rounded-2xl ${phaseGlow} ${
          isAction
            ? `border border-white/20 bg-white/5 italic text-white/70 ${isMine ? 'rounded-br-sm' : 'rounded-bl-sm'}`
            : isMine
            ? msg.senderGender === 'MAN'
              ? 'bg-gradient-to-br from-blue-600/90 to-blue-800/90 text-white rounded-br-sm backdrop-blur-sm'
              : 'bg-gradient-to-br from-fuchsia-600/90 to-pink-800/90 text-white rounded-br-sm backdrop-blur-sm'
            : 'bg-white/10 backdrop-blur-sm text-white rounded-bl-sm border border-white/10'
        }`}>
          <p className="text-sm leading-relaxed">{msg.text}</p>
        </div>
        <span className="text-[9px] text-white/25 mx-2">
          {new Date(msg.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

// ===== טיימר עגול =====
const CircularTimer: React.FC<{
  total: number;
  remaining: number;
  phase: string;
}> = ({ total, remaining, phase }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = remaining / total;
  const dashOffset = circumference * (1 - progress);

  const color = {
    ICE: '#60a5fa',
    WARM: '#f472b6',
    HOT: '#f97316',
    FIRE: '#ef4444'
  }[phase] || '#f472b6';

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
        {/* Track */}
        <circle cx="64" cy="64" r={radius}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        {/* Progress */}
        <circle cx="64" cy="64" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="text-3xl font-bold text-white font-mono">
          {mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}`}
        </div>
        <div className="text-white/40 text-[10px]">שניות</div>
      </div>
    </div>
  );
};

// ===== Game Card Overlay =====
const GameCardOverlay: React.FC<{
  game: GameCard;
  totalTime: number;
  remaining: number;
  phase: string;
  onDone: () => void;
  onSkip: () => void;
}> = ({ game, totalTime, remaining, phase, onDone, onSkip }) => {
  const typeIcon = { TRUTH: '💭', DARE: '🔥', SEXY_CARD: '🃏' }[game.type] || '🎲';
  const typeLabel = { TRUTH: 'אמת', DARE: 'חובה', SEXY_CARD: 'קלף סקסי' }[game.type] || 'משחק';

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-5">
      <div className="max-w-sm w-full bg-white/5 backdrop-blur-xl rounded-3xl border border-white/15 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-fuchsia-600/30 to-purple-600/30 px-6 pt-6 pb-4 text-center border-b border-white/10">
          <div className="text-4xl mb-2">{typeIcon}</div>
          <div className="text-white/50 text-xs uppercase tracking-widest">{typeLabel}</div>
          <h2 className="text-xl font-bold text-white mt-1">{game.title}</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-5 text-center">
          <p className="text-white/90 text-base leading-relaxed mb-6">{game.content}</p>

          {/* Timer */}
          {game.duration && remaining > 0 && (
            <div className="flex justify-center mb-4">
              <CircularTimer total={totalTime} remaining={remaining} phase={phase} />
            </div>
          )}

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button
              onClick={onSkip}
              className="py-3 rounded-xl text-white/50 border border-white/10 hover:bg-white/5 transition-all text-sm"
            >
              דלג ↩
            </button>
            <button
              onClick={onDone}
              className="py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white font-semibold hover:scale-105 transition-all text-sm shadow-lg shadow-fuchsia-500/20"
            >
              סיימנו! ✅
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== MAIN COMPONENT =====
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [tensionState, setTensionState] = useState(initTensionState());
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [avatars, setAvatars] = useState<AvatarImages>({ MAN: null, WOMAN: null });
  const [currentScene, setCurrentScene] = useState(0);
  const [sceneOpacity, setSceneOpacity] = useState(1);

  // Game state
  const [activeGame, setActiveGame] = useState<GameCard | null>(null);
  const [gameTimerTotal, setGameTimerTotal] = useState(0);
  const [gameTimerRemaining, setGameTimerRemaining] = useState(0);

  // Surprise
  const [surpriseTracking, setSurpriseTracking] = useState(initSurpriseTracking());
  const [currentSurprise, setCurrentSurprise] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const syncService = useRef(new SyncService(channelId, myGender));
  const aiEngine = useRef(new AIEngine());
  const sessionStartTime = useRef(Date.now());
  const gameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ===== סצינות קסומות — מחליפות כל 3 דקות =====
  useEffect(() => {
    const rotateScene = () => {
      // fade out
      setSceneOpacity(0);
      setTimeout(() => {
        setCurrentScene(prev => (prev + 1) % MAGICAL_SCENES.length);
        setSceneOpacity(1);
      }, 1500);
    };

    const interval = setInterval(rotateScene, 3 * 60 * 1000); // כל 3 דקות
    return () => clearInterval(interval);
  }, []);

  // ===== יצירת אווטרי CGI =====
  useEffect(() => {
    aiEngine.current.generateAvatars(scenario).then(setAvatars);
  }, [scenario]);

  // ===== חיבור לסנכרון =====
  useEffect(() => {
    syncService.current.connect((message) => {
      setMessages(prev => [...prev, message]);
    });
    return () => { syncService.current.disconnect(); };
  }, []);

  // ===== גלילה אוטומטית =====
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ===== קריאת AI ראשונית + אחרי כל הודעה =====
  const fetchAI = useCallback(async () => {
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

      // אם AI הציע game card — הצג אותו
      if (response.gameCard) {
        triggerGame(response.gameCard);
      }
    } catch (error) {
      console.error('AI Error:', error);
    } finally {
      setLoading(false);
    }
  }, [messages, tensionState, myGender, scenario]);

  useEffect(() => { fetchAI(); }, [messages.length]);

  useEffect(() => {
    if (messages.length === 0) fetchAI();
  }, []);

  // ===== הפעלת Game =====
  const triggerGame = (game: GameCard) => {
    setActiveGame(game);
    if (game.duration) {
      setGameTimerTotal(game.duration);
      setGameTimerRemaining(game.duration);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      gameTimerRef.current = setInterval(() => {
        setGameTimerRemaining(prev => {
          if (prev <= 1) {
            if (gameTimerRef.current) clearInterval(gameTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const closeGame = () => {
    setActiveGame(null);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    setGameTimerRemaining(0);
  };

  // ===== שליחת הודעה =====
  const handleSend = async (text?: string) => {
    const txt = (text || inputText).trim();
    if (!txt) return;

    const message: Message = {
      id: Date.now().toString(),
      senderGender: myGender,
      text: txt,
      timestamp: Date.now(),
      deviceId: channelId,
      type: 'CHAT'
    };

    await syncService.current.sendMessage(message);
    setMessages(prev => [...prev, message]);

    const timeSinceStart = Date.now() - sessionStartTime.current;
    const newTension = updateTension(tensionState, 3, messages.length + 1, timeSinceStart);
    setTensionState(newTension);

    setInputText('');
    inputRef.current?.focus();

    // בדיקת הפתעה
    if (shouldTriggerSurprise(newTension.level, messages.length + 1, surpriseTracking)) {
      const surprise = selectSurprise(newTension.level, messages.length + 1, surpriseTracking);
      if (surprise) {
        setCurrentSurprise(surprise);
        setSurpriseTracking(prev => updateSurpriseTracking(prev, surprise.id));
      }
    }
  };

  // ===== tap על chip — מוסיף לinput =====
  const handleChipTap = (chip: string) => {
    setInputText(prev => {
      const base = prev.trim();
      if (!base) return chip + ' ';
      return base + ' ' + chip + ' ';
    });
    inputRef.current?.focus();
  };

  // ===== Enter =====
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Phase colors
  const phaseColor = {
    ICE: '#60a5fa',
    WARM: '#f472b6',
    HOT: '#f97316',
    FIRE: '#ef4444'
  }[tensionState.phase] || '#f472b6';

  const tensionBarColor = {
    ICE: 'from-blue-400 to-cyan-400',
    WARM: 'from-pink-400 to-rose-500',
    HOT: 'from-red-500 to-orange-500',
    FIRE: 'from-orange-500 to-yellow-400'
  }[tensionState.phase] || 'from-pink-400 to-rose-500';

  const phaseIcon = { ICE: '❄️', WARM: '🌡️', HOT: '🌶️', FIRE: '🔥' }[tensionState.phase] || '❄️';

  const scene = MAGICAL_SCENES[currentScene];

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">

      {/* ===== MAGICAL BACKGROUND ===== */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${scene.url})`,
          opacity: sceneOpacity,
          transition: 'opacity 1.5s ease-in-out'
        }}
      />
      {/* Overlay gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${scene.overlay}`} />

      {/* Phase tint overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 100%, ${phaseColor}15 0%, transparent 70%)`,
          transition: 'background 3s ease'
        }}
      />

      {/* Scene name badge */}
      <div
        className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full text-[10px] text-white/30 border border-white/10 backdrop-blur-sm pointer-events-none"
        style={{ opacity: sceneOpacity, transition: 'opacity 1.5s ease-in-out' }}
      >
        📍 {scene.name}
      </div>

      {/* ===== HEADER ===== */}
      <div className="relative z-10 px-4 pt-3 pb-2 bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{phaseIcon}</span>
            <div>
              <h3 className="text-white font-semibold text-sm leading-tight">{scenario.title}</h3>
              <p className="text-white/40 text-[10px]">{scenario.location}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{tensionState.level}%</div>
            <div className="text-white/40 text-[10px]">מתח</div>
          </div>
        </div>
        {/* Tension bar */}
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${tensionBarColor} transition-all duration-1000`}
            style={{ width: `${tensionState.level}%`, boxShadow: `0 0 8px ${phaseColor}60` }}
          />
        </div>
      </div>

      {/* ===== MESSAGES ===== */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 relative z-10">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 pt-8">
            <div className="text-5xl">{phaseIcon}</div>
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/10">
              <p className="text-white/70 text-sm font-medium">{scenario.atmosphere}</p>
              <p className="text-white/30 text-xs mt-1">כתוב להם הודעה ראשונה...</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            msg={msg}
            isMine={msg.senderGender === myGender}
            phase={tensionState.phase}
            avatarUrl={avatars[msg.senderGender]}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ===== AI PANEL ===== */}
      <div className="relative z-10 bg-black/50 backdrop-blur-xl border-t border-white/10">

        {/* Toggle */}
        <button
          onClick={() => setShowAIPanel(!showAIPanel)}
          className="w-full py-1.5 flex items-center justify-center gap-1 text-white/30 hover:text-white/50 transition-colors"
        >
          <span className="text-[10px] uppercase tracking-widest">
            {showAIPanel ? '▼ הסתר לחישה' : '▲ הצג השראה'}
          </span>
        </button>

        {showAIPanel && (
          <div className="px-4 pb-2">
            {/* Strategic advice */}
            {aiResponse && !loading && (
              <div className={`mb-2.5 px-3 py-2 rounded-xl text-xs leading-relaxed text-white/75 border ${
                tensionState.phase === 'ICE' ? 'bg-blue-500/10 border-blue-500/15' :
                tensionState.phase === 'WARM' ? 'bg-pink-500/10 border-pink-500/15' :
                tensionState.phase === 'HOT' ? 'bg-red-500/10 border-red-500/15' :
                'bg-orange-500/10 border-orange-500/15'
              }`}>
                {myGender === 'MAN'
                  ? aiResponse.strategicAdvice.forMan
                  : aiResponse.strategicAdvice.forWoman}
              </div>
            )}

            {/* Loading dots */}
            {loading && (
              <div className="flex items-center gap-1.5 py-2 px-2">
                {[0, 100, 200].map(delay => (
                  <div
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
                <span className="text-white/25 text-[10px] mr-1">מחפש השראה...</span>
              </div>
            )}

            {/* Word chips — tap to add to input */}
            {aiResponse && aiResponse.wordChips.length > 0 && !loading && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {aiResponse.wordChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChipTap(chip)}
                    className="px-3 py-1.5 rounded-full text-xs text-white/80 border border-white/15 bg-white/5 hover:bg-white/12 hover:border-white/30 hover:text-white active:scale-95 transition-all"
                    style={{ boxShadow: `0 0 0 0 ${phaseColor}` }}
                  >
                    {chip}
                  </button>
                ))}

                {/* Game card button — if AI suggested one */}
                {aiResponse.gameCard && (
                  <button
                    onClick={() => triggerGame(aiResponse.gameCard!)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium text-white border border-fuchsia-500/40 bg-fuchsia-500/15 hover:bg-fuchsia-500/25 active:scale-95 transition-all"
                  >
                    🎲 {aiResponse.gameCard.title}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== INPUT BAR ===== */}
        <div className="px-3 pb-4 pt-1">
          <div className={`flex items-center gap-2 bg-white/8 border rounded-2xl px-3 py-2 transition-all ${
            inputText ? `border-white/30` : 'border-white/10'
          } focus-within:border-white/30`}
            style={inputText ? { boxShadow: `0 0 0 1px ${phaseColor}30` } : {}}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="כתוב/י בעצמך... הלחישות למעלה הן השראה"
              className="flex-1 bg-transparent text-white text-sm placeholder-white/25 outline-none py-1"
              dir="rtl"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim()}
              className={`p-2 rounded-xl transition-all flex-shrink-0 ${
                inputText.trim()
                  ? 'text-white hover:scale-105 active:scale-95'
                  : 'text-white/20 cursor-not-allowed'
              }`}
              style={inputText.trim() ? {
                background: `linear-gradient(135deg, ${phaseColor}99, ${phaseColor}66)`,
                boxShadow: `0 0 12px ${phaseColor}40`
              } : {}}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="rotate-180">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ===== GAME CARD OVERLAY ===== */}
      {activeGame && (
        <GameCardOverlay
          game={activeGame}
          totalTime={gameTimerTotal}
          remaining={gameTimerRemaining}
          phase={tensionState.phase}
          onDone={closeGame}
          onSkip={closeGame}
        />
      )}

      {/* ===== SURPRISE MODAL ===== */}
      {currentSurprise && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full border border-white/15 text-center">
            <div className="text-5xl mb-4">🎁</div>
            <h2 className="text-xl font-bold text-white mb-2">{currentSurprise.title}</h2>
            <p className="text-white/75 text-sm mb-6">{currentSurprise.description}</p>
            <button
              onClick={() => setCurrentSurprise(null)}
              className="w-full py-3 px-6 rounded-xl text-white font-semibold text-base hover:scale-105 transition-all"
              style={{ background: `linear-gradient(135deg, ${phaseColor}, ${phaseColor}88)` }}
            >
              בואו נעשה את זה! 🔥
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
