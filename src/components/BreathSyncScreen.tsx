import React, { useState, useEffect, useRef } from 'react';
import { SyncService } from '../services/sync-service';
import { UserGender } from '../types';

interface BreathSyncScreenProps {
  onComplete: () => void;
  channelId?: string;
  myGender?: UserGender;
  isHost?: boolean;
}

type BreathPhase = 'in' | 'hold' | 'out';

interface BreathCycle {
  phase: BreathPhase;
  duration: number;
  label: string;
  sublabel: string;
}

const BREATH_CYCLES: BreathCycle[] = [
  { phase: 'in',   duration: 4, label: 'שאפו יחד...',    sublabel: '4 שניות' },
  { phase: 'hold', duration: 4, label: 'עצרו...',         sublabel: 'החזיקו' },
  { phase: 'out',  duration: 8, label: 'שחררו לאט...',   sublabel: '8 שניות' },
];

const TOTAL_ROUNDS = 3;
const TOTAL_SECONDS = BREATH_CYCLES.reduce((s, c) => s + c.duration, 0) * TOTAL_ROUNDS; // 48s
const COUNTDOWN_FROM = 5; // שניות להמתנה לפני התחלה

export const BreathSyncScreen: React.FC<BreathSyncScreenProps> = ({
  onComplete,
  channelId,
  myGender,
  isHost,
}) => {
  // ── countdown before start ──
  const [countdown, setCountdown] = useState(COUNTDOWN_FROM);
  const [started, setStarted] = useState(false);

  // ── breathing state ──
  const [round, setRound] = useState(1);
  const [cycleIdx, setCycleIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(BREATH_CYCLES[0].duration);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  const syncRef = useRef<SyncService | null>(null);

  // total progress 0..1
  const progress = Math.min(elapsed / TOTAL_SECONDS, 1);

  // ── Auto-countdown on mount ──
  // Host sends BREATH_START when countdown ends
  // Joiner listens for BREATH_START; fallback after COUNTDOWN_FROM + 10s
  useEffect(() => {
    // If we have a channelId, set up ntfy sync
    if (channelId && myGender) {
      const sync = new SyncService(channelId, myGender);

      if (!isHost) {
        // Joiner: connect and listen for BREATH_START
        sync.connect(
          () => {}, // no chat messages here
          (sysMsg) => {
            if (sysMsg.type === 'BREATH_START') {
              setStarted(true);
            }
          }
        );
        syncRef.current = sync;
      } else {
        syncRef.current = sync;
      }
    }

    // Countdown timer — shared by both
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Host sends BREATH_START
          if (isHost && syncRef.current) {
            syncRef.current.sendSystemMessage('BREATH_START');
          }
          setStarted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      syncRef.current?.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Breathing timer ──
  useEffect(() => {
    if (!started || done) return;

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev > 1) {
          setElapsed(e => e + 1);
          return prev - 1;
        }

        // Move to next phase
        const nextIdx = cycleIdx + 1;
        setElapsed(e => e + 1);

        if (nextIdx < BREATH_CYCLES.length) {
          setCycleIdx(nextIdx);
          return BREATH_CYCLES[nextIdx].duration;
        } else {
          // End of cycle — next round?
          const nextRound = round + 1;
          if (nextRound <= TOTAL_ROUNDS) {
            setRound(nextRound);
            setCycleIdx(0);
            return BREATH_CYCLES[0].duration;
          } else {
            clearInterval(interval);
            setDone(true);
            return 0;
          }
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [started, done, cycleIdx, round]);

  // Auto-continue after "done" state shown
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 1200);
    }, 2500);
    return () => clearTimeout(t);
  }, [done, onComplete]);

  const currentCycle = BREATH_CYCLES[cycleIdx];

  // Breathing circle scale
  const breathScale = !started ? 1
    : currentCycle.phase === 'in' ? 1.45
    : currentCycle.phase === 'hold' ? 1.45
    : 1;

  const breathTransition = !started ? 'transform 0.5s ease'
    : currentCycle.phase === 'in'   ? 'transform 4s ease-in-out'
    : currentCycle.phase === 'hold' ? 'transform 0.1s ease'
    : 'transform 8s ease-in-out';

  const glowIntensity = currentCycle.phase === 'hold' ? 80 : 30;

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center"
      dir="rtl"
      style={{
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 1.2s ease',
      }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a14] via-[#0d0820] to-[#120a1a]" />

      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(180,60,40,0.12) 0%, transparent 70%)',
            transform: `translate(-50%, -50%) scale(${breathScale})`,
            transition: breathTransition,
          }}
        />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-900/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-sm w-full mx-4 text-center">

        {/* ══ COUNTDOWN — before start ══ */}
        {!started && !done && (
          <div style={{ animation: 'fadeSlideIn 0.8s ease forwards' }}>
            {/* Icon */}
            <div className="mb-8">
              <div
                className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle, rgba(180,60,40,0.2) 0%, transparent 70%)',
                  border: '1px solid rgba(180,60,40,0.25)',
                  boxShadow: '0 0 50px rgba(180,60,40,0.3)',
                }}
              >
                <span className="text-5xl">🌬️</span>
              </div>
            </div>

            {/* Title */}
            <p className="text-white/30 text-xs uppercase tracking-[0.4em] mb-4">
              לפני שמתחילים
            </p>
            <h2 className="text-3xl font-light text-white mb-3" style={{ textShadow: '0 0 30px rgba(180,60,40,0.4)' }}>
              רגע ביחד
            </h2>
            <p className="text-white/50 text-sm leading-relaxed mx-auto max-w-[260px] mb-2">
              {TOTAL_ROUNDS} סבבי נשימה מסונכרנת
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 mb-10">
              <div className="text-center">
                <div className="text-white/20 text-[10px] uppercase tracking-widest mb-1">שאיפה</div>
                <div className="text-white/50 text-sm">4 שניות</div>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="text-center">
                <div className="text-white/20 text-[10px] uppercase tracking-widest mb-1">עצירה</div>
                <div className="text-white/50 text-sm">4 שניות</div>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="text-center">
                <div className="text-white/20 text-[10px] uppercase tracking-widest mb-1">נשיפה</div>
                <div className="text-white/50 text-sm">8 שניות</div>
              </div>
            </div>

            {/* Countdown ring */}
            <div className="flex flex-col items-center gap-4 mb-6">
              <p className="text-white/40 text-sm">מתחילים ביחד בעוד</p>
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl font-bold text-white"
                style={{
                  background: 'radial-gradient(circle, rgba(180,60,40,0.3) 0%, transparent 70%)',
                  border: '2px solid rgba(180,60,40,0.5)',
                  boxShadow: '0 0 30px rgba(180,60,40,0.4)',
                  animation: 'countdownPulse 1s ease infinite',
                }}
              >
                {countdown}
              </div>
              <p className="text-white/25 text-xs">שניות</p>
            </div>

            <button
              onClick={onComplete}
              className="w-full py-3 mt-2 text-white/20 hover:text-white/40 transition-colors text-sm"
            >
              דלג (לא מומלץ)
            </button>
          </div>
        )}

        {/* ══ BREATHING ══ */}
        {started && !done && (
          <div style={{ animation: 'fadeSlideIn 0.6s ease forwards' }}>

            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/25 text-[10px] uppercase tracking-widest">סבב {round}/{TOTAL_ROUNDS}</span>
                <span className="text-white/25 text-[10px]">{Math.round(progress * 100)}%</span>
              </div>
              <div className="h-px bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress * 100}%`,
                    background: 'linear-gradient(90deg, rgba(180,60,40,0.6), rgba(180,60,40,0.9))',
                    transition: 'width 1s linear',
                  }}
                />
              </div>
            </div>

            {/* Breathing Circle */}
            <div className="flex items-center justify-center mb-10">
              <div className="relative w-52 h-52">

                {/* Outer glow ring */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: '1px solid rgba(180,60,40,0.2)',
                    boxShadow: `0 0 ${glowIntensity}px rgba(180,60,40,0.25)`,
                    transform: `scale(${breathScale})`,
                    transition: breathTransition,
                  }}
                />

                {/* Mid ring */}
                <div
                  className="absolute inset-4 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(180,60,40,0.08) 0%, transparent 70%)',
                    border: '1px solid rgba(180,60,40,0.15)',
                    transform: `scale(${breathScale * 0.92})`,
                    transition: breathTransition,
                  }}
                />

                {/* Inner circle with text */}
                <div
                  className="absolute inset-10 rounded-full flex items-center justify-center flex-col gap-1"
                  style={{
                    background: 'radial-gradient(circle, rgba(180,60,40,0.18) 0%, rgba(180,60,40,0.05) 60%, transparent 100%)',
                    transform: `scale(${breathScale * 0.85})`,
                    transition: breathTransition,
                  }}
                >
                  <span
                    className="text-white/80 text-sm font-light text-center leading-tight"
                    key={currentCycle.phase + round}
                    style={{ animation: 'fadeSlideIn 0.4s ease forwards' }}
                  >
                    {currentCycle.label}
                  </span>
                  <span className="text-white/40 text-2xl font-light font-mono">
                    {secondsLeft}
                  </span>
                </div>

              </div>
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center gap-2 mb-6">
              {BREATH_CYCLES.map((_c, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    background: i === cycleIdx
                      ? 'rgba(180,60,40,0.8)'
                      : i < cycleIdx
                        ? 'rgba(180,60,40,0.3)'
                        : 'rgba(255,255,255,0.1)',
                  }}
                />
              ))}
            </div>

            <p className="text-white/25 text-xs">
              נשמו יחד. אתם מסונכרנים.
            </p>
          </div>
        )}

        {/* ══ DONE ══ */}
        {done && (
          <div style={{ animation: 'fadeSlideIn 0.8s ease forwards' }}>
            <div className="mb-8">
              <div
                className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle, rgba(180,60,40,0.25) 0%, transparent 70%)',
                  boxShadow: '0 0 60px rgba(180,60,40,0.4)',
                  border: '1px solid rgba(180,60,40,0.3)',
                  animation: 'pulseGlow 2s ease infinite',
                }}
              >
                <span className="text-5xl">🔥</span>
              </div>
            </div>

            <p className="text-white/40 text-xs uppercase tracking-[0.4em] mb-4">
              מסונכרנים
            </p>
            <h2 className="text-3xl font-light text-white mb-3">
              מוכנים למסע
            </h2>
            <p className="text-white/40 text-sm">
              נכנסים...
            </p>

            <div className="flex justify-center gap-1.5 mt-6">
              {[0, 150, 300].map(d => (
                <div
                  key={d}
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: 'rgba(180,60,40,0.7)', animationDelay: `${d}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 60px rgba(180,60,40,0.4); }
          50%       { box-shadow: 0 0 90px rgba(180,60,40,0.6); }
        }
        @keyframes countdownPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.08); opacity: 0.9; }
        }
      `}</style>
    </div>
  );
};
