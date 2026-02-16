import React, { useState } from 'react';
import { UserGender } from '../types';

interface GenderSelectionProps {
  onSelect: (gender: UserGender) => void;
}

export const GenderSelection: React.FC<GenderSelectionProps> = ({ onSelect }) => {
  const [selected, setSelected] = useState<UserGender | null>(null);

  const handleSelect = (gender: UserGender) => {
    setSelected(gender);
    // המתנה קטנה לאנימציה ואז ממשיכים
    setTimeout(() => onSelect(gender), 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bordeaux via-dark to-electric-blue flex items-center justify-center p-4">
      {/* אפקט זוהר ברקע */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sexy-fuchsia/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-electric-blue/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Container ראשי */}
      <div className="relative z-10 max-w-lg w-full">
        {/* כותרת */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="text-6xl mb-4">✨</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            מי אתה/את במסע הזה?
          </h1>
          <p className="text-white/60">בחר/י את התפקיד שלך</p>
        </div>

        {/* בחירת מין */}
        <div className="grid grid-cols-2 gap-4 animate-slide-up">
          {/* גבר */}
          <button
            onClick={() => handleSelect('MAN')}
            className={`group relative p-8 rounded-2xl transition-all transform ${
              selected === 'MAN'
                ? 'bg-gradient-to-br from-electric-blue to-sexy-fuchsia scale-105 shadow-2xl'
                : 'bg-dark/40 backdrop-blur-xl border border-white/10 hover:scale-105 hover:border-electric-blue/50'
            }`}
          >
            {/* אייקון */}
            <div className="text-6xl mb-4 text-center">
              {selected === 'MAN' ? '👨' : '👨‍🦱'}
            </div>

            {/* טקסט */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-1">גבר</h3>
              <p className={`text-sm ${
                selected === 'MAN' ? 'text-white/80' : 'text-white/40'
              }`}>
                אני הגבר בזוג
              </p>
            </div>

            {/* סימן V */}
            {selected === 'MAN' && (
              <div className="absolute top-4 right-4 text-white text-2xl animate-bounce">
                ✓
              </div>
            )}
          </button>

          {/* אישה */}
          <button
            onClick={() => handleSelect('WOMAN')}
            className={`group relative p-8 rounded-2xl transition-all transform ${
              selected === 'WOMAN'
                ? 'bg-gradient-to-br from-sexy-fuchsia to-bordeaux scale-105 shadow-2xl'
                : 'bg-dark/40 backdrop-blur-xl border border-white/10 hover:scale-105 hover:border-sexy-fuchsia/50'
            }`}
          >
            {/* אייקון */}
            <div className="text-6xl mb-4 text-center">
              {selected === 'WOMAN' ? '👩' : '👩‍🦰'}
            </div>

            {/* טקסט */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-1">אישה</h3>
              <p className={`text-sm ${
                selected === 'WOMAN' ? 'text-white/80' : 'text-white/40'
              }`}>
                אני האישה בזוג
              </p>
            </div>

            {/* סימן V */}
            {selected === 'WOMAN' && (
              <div className="absolute top-4 right-4 text-white text-2xl animate-bounce">
                ✓
              </div>
            )}
          </button>
        </div>

        {/* הערה */}
        <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <p className="text-white/60 text-sm text-center">
            ℹ️ הבחירה משפיעה על ההמלצות וההנחיות שתקבל/י מה-AI
          </p>
        </div>
      </div>
    </div>
  );
};
