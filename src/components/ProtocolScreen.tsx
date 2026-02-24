import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, UserGender, Scenario, AIResponse, AvatarImages } from '../types';
import { AIEngine } from '../services/ai-engine';
import { SyncService } from '../services/sync-service';
import { initTensionState, updateTension } from '../services/tension-engine';
import {
  initSurpriseTracking,
  shouldTriggerSurprise,
  selectSurprise,
  updateSurpriseTracking
} from '../services/surprise-engine';
import { IntimacyMission, IntimacyChoice, getNextMission, getMissionInstruction } from '../data/intimacy-missions';
import audioService from '../services/audio-service';

// ===== סצינות לפי שלב — מציבורי לאינטימי =====
const SCENES_BY_PHASE: Record<string, Array<{ url: string; name: string; overlay: string }>> = {
  // ❄️ ICE — מסעדה/בר מנקודת מבט יושב, ללא אנשים
  ICE: [
    {
      url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=1200&q=85&auto=format&fit=crop',
      name: '🍷 שולחן מסעדה לאור נרות',
      overlay: 'from-black/65 via-black/35 to-black/65'
    },
    {
      url: 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&h=1200&q=85&auto=format&fit=crop',
      name: '🥂 בר חשוך אינטימי',
      overlay: 'from-black/60 via-black/30 to-black/65'
    },
    {
      url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=1200&q=85&auto=format&fit=crop',
      name: '🎨 מסעדה אלגנטית',
      overlay: 'from-black/60 via-black/25 to-black/60'
    }
  ],
  // 🌡️ WARM — גן/מרפסת ממבט ראשון, ללא אנשים
  WARM: [
    {
      url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&h=1200&q=85&auto=format&fit=crop',
      name: '🌿 שביל גן מוסתר',
      overlay: 'from-black/65 via-black/30 to-black/65'
    },
    {
      url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&h=1200&q=85&auto=format&fit=crop',
      name: '🕯️ שקיעה ממרפסת',
      overlay: 'from-black/60 via-black/20 to-black/70'
    },
    {
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=1200&q=85&auto=format&fit=crop',
      name: '🎷 נוף לילי שקט',
      overlay: 'from-black/70 via-black/30 to-black/65'
    }
  ],
  // 🌶️ HOT — מלון/חדר POV, ללא אנשים
  HOT: [
    {
      url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=1200&q=85&auto=format&fit=crop',
      name: '🌊 חדר מלון יוקרתי',
      overlay: 'from-black/60 via-black/20 to-black/70'
    },
    {
      url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=1200&q=85&auto=format&fit=crop',
      name: '✨ בריכה פרטית במלון',
      overlay: 'from-black/65 via-black/25 to-black/65'
    },
    {
      url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=1200&q=85&auto=format&fit=crop',
      name: '🌙 סוויטה עם נוף',
      overlay: 'from-black/55 via-black/20 to-black/65'
    }
  ],
  // 🔥 FIRE — חדר אינטימי, נרות, ללא אנשים
  FIRE: [
    {
      url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=1200&q=85&auto=format&fit=crop',
      name: '🕯️ חדר שינה לאור נרות',
      overlay: 'from-black/70 via-black/30 to-black/75'
    },
    {
      url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&h=1200&q=85&auto=format&fit=crop',
      name: '💆 חדר אינטימי חשוך',
      overlay: 'from-black/65 via-black/25 to-black/70'
    },
    {
      url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&h=1200&q=85&auto=format&fit=crop',
      name: '🌹 מיטה רומנטית',
      overlay: 'from-black/70 via-black/30 to-black/70'
    }
  ]
};

// Flat array for fallback (when no scenario-specific scenes)
const MAGICAL_SCENES = [...Object.values(SCENES_BY_PHASE).flat()];

// ===== מיפוי נושאים → תמונות Unsplash ספציפיות (לא source.unsplash.com) =====
const THEME_PHOTO_MAP: Array<{ keywords: string[]; url: string; name: string }> = [
  // ספרייה / ארכיון / ספרים
  {
    keywords: ['library', 'book', 'archive', 'study', 'ספרייה'],
    url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=1200&q=85&auto=format&fit=crop',
    name: '📚 ספרייה'
  },
  // מסעדה / אוכל / ארוחה
  {
    keywords: ['restaurant', 'dining', 'dinner', 'cafe', 'מסעדה'],
    url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=1200&q=85&auto=format&fit=crop',
    name: '🍷 מסעדה'
  },
  // בר / יין / שתייה
  {
    keywords: ['bar', 'wine', 'cocktail', 'pub', 'בר'],
    url: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=1200&q=85&auto=format&fit=crop',
    name: '🥂 בר'
  },
  // משרד / עבודה / עסקי
  {
    keywords: ['office', 'work', 'business', 'corporate', 'meeting', 'משרד'],
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=1200&q=85&auto=format&fit=crop',
    name: '💼 משרד'
  },
  // לובי מלון / קבלה
  {
    keywords: ['lobby', 'hotel entrance', 'reception', 'לובי'],
    url: 'https://images.unsplash.com/photo-1549294413-26f195200c16?w=800&h=1200&q=85&auto=format&fit=crop',
    name: '🏨 לובי מלון'
  },
  // גלריה / אמנות / תערוכה
  {
    keywords: ['gallery', 'art', 'museum', 'exhibition', 'גלריה'],
    url: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=1200&q=85&auto=format&fit=crop',
    name: '🎨 גלריה'
  },
  // גן / טבע לילה / פארק
  {
    keywords: ['garden', 'park', 'nature', 'night garden', 'גן'],
    url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=1200&q=85&auto=format&fit=crop',
    name: '🌿 גן לילה'
  },
  // מרפסת / גג / נוף
  {
    keywords: ['balcony', 'rooftop', 'terrace', 'view', 'מרפסת'],
    url: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&h=1200&q=85&auto=format&fit=crop',
    name: '🌙 מרפסת'
  },
  // חדר מלון / סוויטה
  {
    keywords: ['hotel room', 'suite', 'hotel suite', 'luxury room', 'חדר מלון'],
    url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=1200&q=85&auto=format&fit=crop',
    name: '✨ סוויטה'
  },
  // וילה / בית פרטי
  {
    keywords: ['villa', 'house', 'private', 'home', 'וילה'],
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=1200&q=85&auto=format&fit=crop',
    name: '🌙 וילה'
  },
  // חדר שינה / נרות / אינטימי
  {
    keywords: ['bedroom', 'candle', 'intimate', 'dark', 'sensual', 'חדר שינה'],
    url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=1200&q=85&auto=format&fit=crop',
    name: '🕯️ חדר נרות'
  },
  // ספא / אמבטיה / מים
  {
    keywords: ['spa', 'bath', 'water', 'pool', 'ספא'],
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=1200&q=85&auto=format&fit=crop',
    name: '💆 ספא'
  },
  // חוף ים / ים / שמש
  {
    keywords: ['beach', 'sea', 'ocean', 'sunset', 'חוף'],
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=1200&q=85&auto=format&fit=crop',
    name: '🌊 חוף הים'
  },
  // רכבת / נסיעה / תחבורה
  {
    keywords: ['train', 'travel', 'journey', 'airport', 'רכבת'],
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=1200&q=85&auto=format&fit=crop',
    name: '🚂 רכבת'
  },
];

// ===== תמונות דמויות לפי תרחיש =====
// כל תרחיש → תמונת דמות ספציפית לגבר ולאשה (כולן ייחודיות, לא ברירת מחדל!)
const SCENARIO_ROLE_PHOTOS: Record<string, { MAN: string; WOMAN: string }> = {
  'massage-therapist': {
    MAN: 'photo-1500648767791-00dcc994a43e',    // גבר רגוע, מזמין — מעסה ספא
    WOMAN: 'photo-1494790108377-be9c29b29330', // אישה שקטה, רגועה — מטופלת ספא ✓
  },
  'boss-assistant': {
    MAN: 'photo-1560250097-0b93528c311a',       // גבר לסת חזקה, חליפה — מנכ"ל
    WOMAN: 'photo-1573496359142-b8d87734a5a2', // אישה מקצועית, משקפיים — עוזרת בכירה ✓
  },
  'doctor-patient': {
    MAN: 'photo-1612349317150-e413f6a5b16d',   // גבר בחלוק לבן — רופא ✓
    WOMAN: 'photo-1559839734-2b71ea197ec2',    // אישה בחלוק כחול, חיוך — רופאה ✓
  },
  'yoga-instructor': {
    MAN: 'photo-1507003211169-0a1dd7228f2d',   // גבר אתלטי, נינוח — מדריך יוגה ✓
    WOMAN: 'photo-1524863479829-916d8e77f114', // אישה אתלטית, שלוה — מדריכת יוגה ✓
  },
  'photographer-model': {
    MAN: 'photo-1472099645785-5658abf4ff4e',   // גבר ישיר בעיניים — צלם
    WOMAN: 'photo-1488426862026-3ee34a7d66df', // אישה יפה עם שיער — דוגמנית
  },
};

// ===== טבעת צבע לפי תרחיש — זיהוי ויזואלי מיידי =====
const SCENARIO_RING_COLORS: Record<string, string> = {
  'massage-therapist': 'border-teal-400/70 shadow-teal-500/40',      // ירוק טיל — ספא
  'boss-assistant':    'border-slate-300/60 shadow-slate-300/30',     // אפור כסוף — עסקי
  'doctor-patient':    'border-sky-400/70 shadow-sky-500/40',         // כחול שמים — רפואי
  'yoga-instructor':   'border-purple-400/70 shadow-purple-500/40',   // סגול — זן
  'photographer-model':'border-amber-400/70 shadow-amber-500/40',     // זהב — אמנותי
};

// ===== רקעים ספציפיים לתרחיש — לכל שלב =====
// כל תרחיש מתחיל במקום המאפיין אותו ומתפתח לאינטימי
const SCENARIO_SCENES: Record<string, Record<string, Array<{ url: string; name: string; overlay: string }>>> = {
  'massage-therapist': {
    ICE: [
      { url: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&h=1200&q=85&auto=format&fit=crop', name: '🧴 לובי הספא', overlay: 'from-black/55 via-black/20 to-black/60' },
    ],
    WARM: [
      { url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=1200&q=85&auto=format&fit=crop', name: '💆 מיטת טיפולים', overlay: 'from-black/60 via-black/25 to-black/65' },
    ],
    HOT: [
      { url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=1200&q=85&auto=format&fit=crop', name: '🕯️ ספא אינטימי', overlay: 'from-black/65 via-black/30 to-black/70' },
    ],
    FIRE: [
      { url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=1200&q=85&auto=format&fit=crop', name: '🌹 ספא פרטי לאור נרות', overlay: 'from-black/70 via-black/30 to-black/75' },
    ],
  },
  'boss-assistant': {
    ICE: [
      { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=1200&q=85&auto=format&fit=crop', name: '💼 משרד ריק', overlay: 'from-black/55 via-black/20 to-black/60' },
    ],
    WARM: [
      { url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&h=1200&q=85&auto=format&fit=crop', name: '🌆 משרד בלילה', overlay: 'from-black/60 via-black/25 to-black/65' },
    ],
    HOT: [
      { url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=1200&q=85&auto=format&fit=crop', name: '✨ נוף מקומה גבוהה', overlay: 'from-black/65 via-black/25 to-black/70' },
    ],
    FIRE: [
      { url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&h=1200&q=85&auto=format&fit=crop', name: '🔐 חדר פרטי', overlay: 'from-black/70 via-black/30 to-black/75' },
    ],
  },
  'doctor-patient': {
    ICE: [
      { url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=1200&q=85&auto=format&fit=crop', name: '🏥 חדר המתנה', overlay: 'from-black/50 via-black/20 to-black/55' },
    ],
    WARM: [
      { url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&h=1200&q=85&auto=format&fit=crop', name: '🩺 חדר בדיקה', overlay: 'from-black/55 via-black/25 to-black/60' },
    ],
    HOT: [
      { url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=1200&q=85&auto=format&fit=crop', name: '💉 חדר פרטי חשוך', overlay: 'from-black/60 via-black/25 to-black/65' },
    ],
    FIRE: [
      { url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=1200&q=85&auto=format&fit=crop', name: '🌹 חדר אינטימי', overlay: 'from-black/70 via-black/30 to-black/75' },
    ],
  },
  'yoga-instructor': {
    ICE: [
      { url: 'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800&h=1200&q=85&auto=format&fit=crop', name: '🧘 אולפן יוגה ריק', overlay: 'from-black/50 via-black/15 to-black/55' },
    ],
    WARM: [
      { url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&h=1200&q=85&auto=format&fit=crop', name: '🌿 טבע שקט', overlay: 'from-black/55 via-black/20 to-black/60' },
    ],
    HOT: [
      { url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&h=1200&q=85&auto=format&fit=crop', name: '✨ פינה חשוכה', overlay: 'from-black/60 via-black/25 to-black/65' },
    ],
    FIRE: [
      { url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=1200&q=85&auto=format&fit=crop', name: '🕯️ חדר נרות', overlay: 'from-black/70 via-black/30 to-black/75' },
    ],
  },
  'photographer-model': {
    ICE: [
      { url: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=1200&q=85&auto=format&fit=crop', name: '📸 אולפן צילום ריק', overlay: 'from-black/55 via-black/20 to-black/60' },
    ],
    WARM: [
      { url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&h=1200&q=85&auto=format&fit=crop', name: '💡 סט תאורה דרמטית', overlay: 'from-black/60 via-black/25 to-black/65' },
    ],
    HOT: [
      { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=1200&q=85&auto=format&fit=crop', name: '🎨 בריכה פרטית', overlay: 'from-black/65 via-black/25 to-black/70' },
    ],
    FIRE: [
      { url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=1200&q=85&auto=format&fit=crop', name: '🌹 חדר שינה אינטימי', overlay: 'from-black/70 via-black/30 to-black/75' },
    ],
  },
};

// מצא תמונה לפי מילות מפתח
function findScenePhoto(keyword: string): { url: string; name: string } | null {
  if (!keyword) return null;
  const lower = keyword.toLowerCase();
  for (const theme of THEME_PHOTO_MAP) {
    if (theme.keywords.some(k => lower.includes(k) || k.includes(lower.split(' ')[0]))) {
      return { url: theme.url, name: theme.name };
    }
  }
  return null;
}


// ===== Hash פשוט לבחירת אווטר עקבית =====
function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

// ===== רשימות אווטרים מגוונות — לתרחישים שנוצרו ע"י AI =====
const DEFAULT_MEN = [
  'photo-1568602471122-7832951cc4c5',
  'photo-1519085360753-af0119f7cbe7',
  'photo-1480455624313-e29b44bbfde1',
  'photo-1539571696357-5a69c17a67c6',
  'photo-1566492031773-4f4e44671857',
  'photo-1506794778202-cad84cf45f1d',
];

const DEFAULT_WOMEN = [
  'photo-1531746020798-e6953c6e8e04',
  'photo-1521146764736-56c929d59c83',
  'photo-1438761681033-6461ffad8d80',
  'photo-1544725176-7c40e5a71c5e',
  'photo-1534528741775-53994a69daeb',
  'photo-1517841905240-472988babdf9',
];

// ===== אווטר CGI =====
const CGIAvatar: React.FC<{
  gender: UserGender;
  avatarUrl: string | null;
  size?: 'sm' | 'md';
  scenarioId?: string;  // תרחיש — לבחירת תמונה + טבעת צבע ספציפיים לתרחיש
}> = ({ gender, avatarUrl, size = 'sm', scenarioId }) => {
  const dim = size === 'sm' ? 'w-9 h-9' : 'w-11 h-11';
  const isMan = gender === 'MAN';

  // טבעת: לפי תרחיש אם יש, אחרת לפי מין
  const ringClass = scenarioId && SCENARIO_RING_COLORS[scenarioId]
    ? `border-2 shadow-lg ${SCENARIO_RING_COLORS[scenarioId]}`
    : isMan
      ? 'border-2 border-blue-400/50 shadow-lg shadow-blue-500/30'
      : 'border-2 border-fuchsia-400/50 shadow-lg shadow-fuchsia-500/30';

  if (avatarUrl) {
    return (
      <div className={`${dim} rounded-full overflow-hidden flex-shrink-0 ${ringClass}`}>
        <img src={avatarUrl} alt={gender} className="w-full h-full object-cover" />
      </div>
    );
  }

  // בחירת תמונה לפי תרחיש + תפקיד — תמונה ספציפית לדמות
  let photoId: string;
  if (scenarioId && SCENARIO_ROLE_PHOTOS[scenarioId]) {
    photoId = isMan
      ? SCENARIO_ROLE_PHOTOS[scenarioId].MAN
      : SCENARIO_ROLE_PHOTOS[scenarioId].WOMAN;
  } else {
    // תרחישי AI — בחירה מגוונת לפי hash של שם התרחיש
    const pool = isMan ? DEFAULT_MEN : DEFAULT_WOMEN;
    photoId = pool[simpleHash(scenarioId || 'default') % pool.length];
  }
  const photoUrl = `https://images.unsplash.com/${photoId}?w=200&h=200&fit=crop&crop=face&q=85`;

  return (
    <div className={`${dim} rounded-full flex-shrink-0 overflow-hidden ${ringClass}`}>
      <img
        src={photoUrl}
        alt={gender}
        className="w-full h-full object-cover"
        onError={(e) => {
          // אם תמונה נכשלת — gradient פשוט
          const el = e.currentTarget.parentElement;
          if (el) el.style.background = isMan
            ? 'linear-gradient(135deg, #1e40af, #1e3a8a)'
            : 'linear-gradient(135deg, #86198f, #701a75)';
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};

// ===== בועת צ'אט =====
const ChatBubble: React.FC<{
  msg: Message;
  isMine: boolean;
  phase: string;
  avatarUrl: string | null;
  scenarioId?: string;
  roleName?: string;        // שם הדמות (ליד האווטר)
  onAvatarClick?: () => void; // לחיצה על האווטר
}> = ({ msg, isMine, phase, avatarUrl, scenarioId, roleName, onAvatarClick }) => {
  const isAction = msg.type === 'ACTION';

  const phaseGlow = {
    ICE: '',
    WARM: '',
    HOT: isMine ? 'shadow-md shadow-red-500/20' : '',
    FIRE: isMine ? 'shadow-lg shadow-orange-500/30' : ''
  }[phase] || '';

  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* אווטר + שם */}
      <div className={`flex flex-col items-center gap-0.5 flex-shrink-0 ${isMine ? 'items-end' : 'items-start'}`}>
        <button
          onClick={onAvatarClick}
          className={`block rounded-full transition-transform active:scale-90 ${onAvatarClick ? 'cursor-pointer' : 'cursor-default'}`}
          style={{ padding: 0, background: 'none', border: 'none' }}
        >
          <CGIAvatar gender={msg.senderGender} avatarUrl={avatarUrl} size="sm" scenarioId={scenarioId} />
        </button>
        {roleName && (
          <span className="text-[9px] text-white/35 max-w-[44px] truncate text-center leading-tight">
            {roleName}
          </span>
        )}
      </div>

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

// (GameCardOverlay removed — game cards feature not active)

// ===== Mission Card — Luxury Fullscreen =====
const MissionCard: React.FC<{
  mission: IntimacyMission;
  phase: string;
  myGender: 'MAN' | 'WOMAN';
  onChoice?: (choice: IntimacyChoice) => void;
  onDone: () => void;
  onSkip: () => void;
}> = ({ mission, phase, myGender, onChoice, onDone, onSkip }) => {
  const [selected, setSelected] = useState<IntimacyChoice | null>(null);
  const [timerStarted, setTimerStarted] = useState(false);
  const [seconds, setSeconds] = useState(mission.duration || 0);
  const [imgFailed, setImgFailed] = useState(false);

  const isActive = mission.forWho === 'BOTH' || mission.forWho === myGender;
  const timerDuration = mission.duration
    ? (myGender === 'WOMAN' ? Math.round(mission.duration * 1.3) : mission.duration)
    : 0;

  useEffect(() => { setSeconds(timerDuration); }, [timerDuration]);

  useEffect(() => {
    if (!timerDuration) return;
    if (timerStarted && seconds > 0) {
      const t = setInterval(() => setSeconds(p => p > 0 ? p - 1 : 0), 1000);
      return () => clearInterval(t);
    }
  }, [timerStarted, timerDuration, seconds]);

  // Auto-start timer for inactive side immediately
  useEffect(() => {
    if (!isActive && timerDuration > 0) setTimerStarted(true);
  }, [isActive, timerDuration]);

  // Auto-start timer for active side after 1.5s delay
  useEffect(() => {
    if (isActive && timerDuration > 0 && !mission.choices) {
      const t = setTimeout(() => setTimerStarted(true), 1500);
      return () => clearTimeout(t);
    }
  }, [isActive, timerDuration, mission.choices]);

  const pc = {
    ICE:  { color: '#60a5fa', name: 'ICE',  glow: 'rgba(96,165,250,0.15)',  bg: 'linear-gradient(135deg, #0c1a2e 0%, #0a1520 100%)' },
    WARM: { color: '#f472b6', name: 'WARM', glow: 'rgba(244,114,182,0.15)', bg: 'linear-gradient(135deg, #1a0a14 0%, #120810 100%)' },
    HOT:  { color: '#f97316', name: 'HOT',  glow: 'rgba(249,115,22,0.15)',  bg: 'linear-gradient(135deg, #1a0d04 0%, #120a04 100%)' },
    FIRE: { color: '#ef4444', name: 'FIRE', glow: 'rgba(239,68,68,0.15)',   bg: 'linear-gradient(135deg, #1a0404 0%, #100404 100%)' },
  }[phase] ?? { color: '#f472b6', name: 'WARM', glow: 'rgba(244,114,182,0.15)', bg: 'linear-gradient(135deg, #1a0a14 0%, #120810 100%)' };

  const instruction = getMissionInstruction(mission, myGender);
  const photoUrl = mission.photoUrl && !imgFailed
    ? `${mission.photoUrl}?auto=format&fit=crop&w=700&q=85`
    : null;

  // ===== INACTIVE SIDE — slim floating bar =====
  if (!isActive) {
    return (
      <div className="fixed bottom-24 left-3 right-3 z-40">
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(6,6,6,0.92)', backdropFilter: 'blur(24px)', border: `1px solid ${pc.color}25` }}>
          <div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${pc.color}60, transparent)` }} />
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: `${pc.color}15`, border: `1px solid ${pc.color}35` }}>
              <span className="text-base">{myGender === 'MAN' ? '🌹' : '🎭'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] uppercase tracking-[2px] mb-0.5" style={{ color: `${pc.color}70` }}>
                {myGender === 'MAN' ? 'היא מכינה לך הפתעה...' : 'הוא מכין לך הפתעה...'}
              </div>
              <div className="text-white/80 text-sm font-medium truncate">{mission.title}</div>
            </div>
            {timerDuration > 0 && (
              <div className="text-xl font-bold font-mono flex-shrink-0 tabular-nums"
                style={{ color: seconds > 15 ? pc.color : '#ef4444' }}>
                {String(Math.floor(seconds / 60)).padStart(2,'0')}:{String(seconds % 60).padStart(2,'0')}
              </div>
            )}
            {(seconds === 0 || timerDuration === 0) && (
              <button onClick={onDone}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white ml-1"
                style={{ background: `${pc.color}cc` }}>
                ✅
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== ACTIVE SIDE — fullscreen luxury card =====
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backdropFilter: 'blur(28px)', background: 'rgba(0,0,0,0.90)', paddingBottom: '16px', paddingLeft: '12px', paddingRight: '12px' }}>

      <div className="w-full max-w-sm rounded-3xl overflow-hidden flex flex-col"
        style={{
          maxHeight: '92vh',
          background: pc.bg,
          border: `1px solid ${pc.color}20`,
          boxShadow: `0 0 80px ${pc.glow}, 0 40px 80px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.06)`
        }}>

        {/* ── PHOTO SECTION ── */}
        <div className="relative flex-shrink-0" style={{ height: '210px' }}>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setImgFailed(true)}
            />
          ) : (
            /* Artistic gradient fallback */
            <div className="w-full h-full" style={{
              background: `radial-gradient(ellipse 80% 80% at 25% 35%, ${pc.color}22 0%, transparent 65%),
                           radial-gradient(ellipse 60% 70% at 75% 65%, ${pc.color}15 0%, transparent 70%),
                           linear-gradient(160deg, #0d0d0d 0%, #070707 100%)`
            }}>
              <div className="w-full h-full flex items-center justify-center opacity-10">
                <div style={{ fontSize: '100px', filter: 'blur(2px)' }}>
                  {phase === 'FIRE' ? '🔥' : phase === 'HOT' ? '🌶️' : '🌹'}
                </div>
              </div>
            </div>
          )}

          {/* Bottom photo fade */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.25) 50%, rgba(7,7,7,1) 100%)'
          }} />

          {/* Top bar: phase badge + skip */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4">
            <span className="text-[9px] font-bold uppercase tracking-[3px] px-2.5 py-1 rounded-full"
              style={{ color: pc.color, background: `${pc.color}18`, border: `1px solid ${pc.color}35` }}>
              {pc.name}
            </span>
            <button onClick={onSkip}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
              style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.45)' }}>
              <span style={{ fontSize: '11px' }}>✕</span>
            </button>
          </div>

          {/* Title over photo bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 pt-8">
            <div className="text-[9px] uppercase tracking-[2px] mb-1.5" style={{ color: `${pc.color}75` }}>
              {mission.forWho === 'BOTH' ? 'שניכם יחד' : myGender === 'MAN' ? 'הוראה לגבר' : 'הוראה לאשה'}
            </div>
            <h2 className="text-white font-bold leading-tight" style={{ fontSize: '22px', letterSpacing: '-0.3px' }}>
              {mission.title}
            </h2>
          </div>
        </div>

        {/* ── CONTENT (scrollable) ── */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

          {/* Main instruction */}
          <div className="px-5 pt-5 pb-4">
            <p className="text-white/88 leading-[1.85]" style={{ fontSize: '15px', fontWeight: 300, letterSpacing: '0.1px' }}>
              {instruction}
            </p>
          </div>

          {/* Tips */}
          {mission.tips && mission.tips.length > 0 && (
            <div className="px-5 pb-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: `${pc.color}18` }} />
                <span className="text-[9px] uppercase tracking-[2.5px]" style={{ color: `${pc.color}55` }}>
                  איך לעשות נכון
                </span>
                <div className="flex-1 h-px" style={{ background: `${pc.color}18` }} />
              </div>
              <div className="space-y-3">
                {mission.tips.map((tip, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                      style={{ background: `${pc.color}18`, color: pc.color, border: `1px solid ${pc.color}30` }}>
                      {i + 1}
                    </span>
                    <span className="text-white/60 text-[13px] leading-[1.7]">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Choices */}
          {mission.choices && (
            <div className="px-4 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px" style={{ background: `${pc.color}18` }} />
                <span className="text-[9px] uppercase tracking-[2.5px]" style={{ color: `${pc.color}55` }}>
                  בחרו סגנון
                </span>
                <div className="flex-1 h-px" style={{ background: `${pc.color}18` }} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {mission.choices.map(choice => {
                  const isSel = selected?.id === choice.id;
                  return (
                    <button
                      key={choice.id}
                      onClick={() => {
                        setSelected(choice);
                        onChoice?.(choice);
                        setSeconds(timerDuration || 60);
                        setTimerStarted(false);
                      }}
                      className="p-3 rounded-2xl text-right transition-all duration-200"
                      style={{
                        background: isSel ? `${pc.color}20` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isSel ? `${pc.color}55` : 'rgba(255,255,255,0.07)'}`,
                        transform: isSel ? 'scale(0.97)' : 'scale(1)',
                        boxShadow: isSel ? `0 0 16px ${pc.color}18` : 'none'
                      }}
                    >
                      <div className="text-xl mb-1.5">{choice.emoji}</div>
                      <div className="text-white text-xs font-semibold mb-0.5 leading-snug">{choice.label}</div>
                      <div className="text-[10px] leading-snug" style={{ color: 'rgba(255,255,255,0.38)' }}>{choice.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER: timer + done ── */}
        <div className="flex-shrink-0 px-5 pt-3 pb-5"
          style={{ borderTop: `1px solid rgba(255,255,255,0.05)` }}>

          {/* Timer — circular progress ring */}
          {(selected || !mission.choices) && timerDuration > 0 && (
            <div className="flex justify-center mb-3">
              {!timerStarted ? (
                <div className="text-white/30 text-sm animate-pulse">מתחיל...</div>
              ) : (
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20" style={{ transform: 'rotate(-90deg)' }} viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
                    <circle cx="40" cy="40" r="34" fill="none"
                      stroke={pc.color} strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - seconds / timerDuration)}`}
                      style={{ transition: 'stroke-dashoffset 1s linear', opacity: 0.8 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="font-bold font-mono tabular-nums text-lg leading-none"
                      style={{
                        color: seconds > timerDuration * 0.25 ? pc.color : '#ef4444',
                        textShadow: `0 0 12px ${seconds > timerDuration * 0.25 ? pc.color : '#ef4444'}50`
                      }}>
                      {String(Math.floor(seconds / 60)).padStart(2,'0')}:{String(seconds % 60).padStart(2,'0')}
                    </div>
                    {seconds === 0 && (
                      <div className="text-[9px] animate-pulse mt-1" style={{ color: `${pc.color}90` }}>הזמן!</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Done button */}
          <button
            onClick={onDone}
            disabled={!!mission.choices && !selected}
            className="w-full py-3.5 rounded-2xl font-semibold tracking-wide transition-all duration-200"
            style={!mission.choices || selected ? {
              background: `linear-gradient(135deg, ${pc.color}e0 0%, ${pc.color}90 100%)`,
              boxShadow: `0 8px 28px ${pc.color}30`,
              color: 'white',
              fontSize: '14px'
            } : {
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.22)',
              cursor: 'not-allowed',
              fontSize: '14px'
            }}>
            {selected ? '✅ נהנינו!' : !mission.choices ? '✅ סיימנו' : 'בחרו קודם'}
          </button>
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
  // ===== Session Persistence — שמור/שחזר מ-localStorage =====
  const SESSION_KEY = `rrx3_session_${channelId}`;
  const savedSession = (() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  })();

  const [messages, setMessages] = useState<Message[]>(savedSession?.messages || []);
  const [tensionState, setTensionState] = useState(savedSession?.tensionState || initTensionState());
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [avatars, setAvatars] = useState<AvatarImages>({ MAN: null, WOMAN: null });
  const [sceneIndex, setSceneIndex] = useState(savedSession?.sceneIndex || 0);
  const [sceneOpacity, setSceneOpacity] = useState(1);
  const [lastPhase, setLastPhase] = useState<string>(savedSession?.tensionState?.phase || 'ICE');

  // (game cards removed)

  // Surprise
  const [surpriseTracking, setSurpriseTracking] = useState(initSurpriseTracking());
  const [currentSurprise, setCurrentSurprise] = useState<any>(null);

  // Intimacy Missions
  const [activeMission, setActiveMission] = useState<IntimacyMission | null>(null);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);

  // Woman readiness — "מוכנה?" system
  const [womanReadinessShown, setWomanReadinessShown] = useState(false);
  const [womanReady, setWomanReady] = useState<null | 'SLOW' | 'READY'>(null);
  const [partnerReadySignal, setPartnerReadySignal] = useState<null | 'SLOW' | 'READY'>(null);
  const [showSecretCard, setShowSecretCard] = useState(false);

  const [audioEnabled, setAudioEnabled] = useState(false);

  // Typing indicator
  const [partnerTyping, setPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  // Identity card
  const [showIdentityCard, setShowIdentityCard] = useState(false);

  // Position dice
  const [showPositionDice, setShowPositionDice] = useState(false);
  const [rolledPosition, setRolledPosition] = useState<null | { name: string; instruction: string; emoji: string }>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const syncService = useRef(new SyncService(channelId, myGender));
  const aiEngine = useRef(new AIEngine());
  const sessionStartTime = useRef(Date.now());

  // ===== שמירה אוטומטית ל-localStorage =====
  useEffect(() => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        messages,
        tensionState,
        sceneIndex,
        savedAt: Date.now()
      }));
    } catch { /* ignore storage errors */ }
  }, [messages, tensionState, sceneIndex, SESSION_KEY]);

  // ===== סצינה נוכחית — לפי תרחיש ספציפי קודם, אחר כך שלב גנרי =====
  const phaseScenes = SCENES_BY_PHASE[tensionState.phase] || SCENES_BY_PHASE.ICE;
  // עדיפות 1: תמונות ייחודיות לתרחיש × שלב (ספציפיות ביותר)
  const scenarioSpecificScenes = SCENARIO_SCENES[scenario.id]?.[tensionState.phase];
  // עדיפות 2: מילות מפתח מה-AI (לתרחישים שנוצרו דינמית)
  const scenarioKeyword = !scenarioSpecificScenes
    ? scenario.sceneKeywords?.[tensionState.phase as keyof typeof scenario.sceneKeywords]
    : null;
  const themePhoto = scenarioKeyword ? findScenePhoto(scenarioKeyword) : null;

  const currentScene = scenarioSpecificScenes
    ? scenarioSpecificScenes[sceneIndex % scenarioSpecificScenes.length]   // תרחיש ספציפי ✓
    : themePhoto
    ? { url: themePhoto.url, name: `${themePhoto.name} · ${scenario.location}`, overlay: phaseScenes[0].overlay }
    : phaseScenes[sceneIndex % phaseScenes.length];                         // fallback גנרי

  // ===== כשהשלב משתנה — עבור לסצינה מתאימה + מעבר מוזיקה =====
  useEffect(() => {
    if (tensionState.phase !== lastPhase) {
      setLastPhase(tensionState.phase);
      setSceneOpacity(0);
      setTimeout(() => {
        setSceneIndex(0);
        setSceneOpacity(1);
      }, 1500);
      // מעבר חלק למוזיקה של השלב החדש
      if (audioEnabled) {
        audioService.transition(scenario.id, tensionState.phase);
      }
    }
  }, [tensionState.phase, lastPhase, audioEnabled, scenario.id]);

  // ===== סצינות מתחלפות בתוך שלב — כל 4 דקות =====
  useEffect(() => {
    const rotateScene = () => {
      setSceneOpacity(0);
      setTimeout(() => {
        setSceneIndex(prev => prev + 1);
        setSceneOpacity(1);
      }, 1500);
    };

    const interval = setInterval(rotateScene, 4 * 60 * 1000); // כל 4 דקות בתוך אותו שלב
    return () => clearInterval(interval);
  }, []);

  // ===== יצירת אווטרי CGI — אם קיימים בScenario, השתמש בהם (זהים לשותף/ה) =====
  useEffect(() => {
    if (scenario.avatars?.MAN || scenario.avatars?.WOMAN) {
      setAvatars({ MAN: scenario.avatars.MAN || null, WOMAN: scenario.avatars.WOMAN || null });
      return;
    }
    // fallback: generate locally
    aiEngine.current.generateAvatars(scenario).then(setAvatars);
  }, [scenario]);

  // ===== ניקוי מוזיקה ביציאה =====
  useEffect(() => {
    return () => { audioService.destroy(); };
  }, []);

  // ===== חיבור לסנכרון =====
  useEffect(() => {
    syncService.current.connect((message) => {
      // זיהוי סיגנל מוכנות מהצד השני
      if (message.type === 'ACTION' && message.senderGender !== myGender) {
        if (message.text === '💫 READY') {
          setPartnerReadySignal('READY');
          return; // לא מוסיפים לצ'אט — סיגנל שקט
        }
        if (message.text === '💆 SLOW') {
          setPartnerReadySignal('SLOW');
          return; // לא מוסיפים לצ'אט — סיגנל שקט
        }
      }
      // כשמגיעה הודעה מהשותף — הוא כבר לא מקליד
      if (message.senderGender !== myGender) {
        setPartnerTyping(false);
      }
      setMessages(prev => [...prev, message]);
    }, (sysMsg) => {
      // טיפול בהודעות מערכת — כולל Typing Indicator
      if (sysMsg.type === 'TYPING') {
        setPartnerTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setPartnerTyping(false), 2500);
      }
      // מיסיה שהגבר שלח — האשה מקבלת ומציגה
      if (sysMsg.type === 'MISSION' && sysMsg.data && myGender === 'WOMAN') {
        setTimeout(() => setActiveMission(sysMsg.data), 500);
      }
      // סנכרון שלב — הגבר לחץ התקדם, האשה מקבלת עדכון מתח
      if (sysMsg.type === 'BREATH_START' && sysMsg.data?.tensionLevel && myGender === 'WOMAN') {
        const { tensionLevel, phase } = sysMsg.data;
        setTensionState(prev => ({
          ...prev,
          level: Math.max(prev.level, tensionLevel),
          phase: phase || prev.phase
        }));
      }
    });
    return () => { syncService.current.disconnect(); };
  }, [myGender]);

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

    // בדיקת מיסיה אינטימית — הגבר שולח לשניהם
    if (!activeMission && myGender === 'MAN') {
      const mission = getNextMission(newTension.level, completedMissions);
      if (mission) {
        setTimeout(async () => {
          setActiveMission(mission);
          // שלח מיסיה לאשה
          await syncService.current.sendSystemMessage('MISSION', mission);
          if (audioEnabled) {
            audioService.setMissionMood(newTension.level >= 75 ? 'intense' : 'soft');
          }
        }, 800);
      }
    }

    // בדיקת הפתעה
    if (shouldTriggerSurprise(newTension.level, messages.length + 1, surpriseTracking)) {
      const surprise = selectSurprise(newTension.level, messages.length + 1, surpriseTracking);
      if (surprise) {
        setCurrentSurprise(surprise);
        setSurpriseTracking(prev => updateSurpriseTracking(prev, surprise.id));
      }
    }
  };

  // ===== לחצן התקדמות שקט — לגבר בלבד, מסונכרן לשני הצדדים =====
  const handleAdvancePhase = async () => {
    const jump = tensionState.phase === 'ICE' ? 26
      : tensionState.phase === 'WARM' ? 20
      : tensionState.phase === 'HOT' ? 15
      : 0;
    if (jump === 0) return;
    const timeSinceStart = Date.now() - sessionStartTime.current;
    const boosted = updateTension(tensionState, jump, messages.length, timeSinceStart);
    setTensionState(boosted);
    // שלח לצד השני שהשלב עלה
    try {
      await syncService.current?.sendSystemMessage('BREATH_START', {
        tensionLevel: boosted.level,
        phase: boosted.phase
      });
    } catch { /* silent */ }
  };

  // ===== קוביית תנוחה — נתונים ופונקציה =====
  const POSITIONS = [
    { name: 'קאוגירל', emoji: '🤠', instruction: 'האשה מלמעלה, פנים אליו — קצב שלה, שליטה מלאה' },
    { name: 'כלב', emoji: '🐾', instruction: 'הוא מאחורי, ידיו על מותניה — עומק ושליטה מלאה' },
    { name: 'מיסיונרי קלאסי', emoji: '💫', instruction: 'פנים אל פנים, כרית מתחת לה — קשר עין מלא' },
    { name: 'ספון צמוד', emoji: '🥄', instruction: 'הוא מאחוריה, איטי ואינטימי — נשיקות על הצוואר תוך כדי' },
    { name: 'כסא חשוק', emoji: '🪑', instruction: 'הוא יושב, היא עליו פנים אליו — תנועה שלה, עיניים בעיניים' },
    { name: 'שריון', emoji: '🛡️', instruction: 'היא על ידיה וברכיה — הוא שולט בקצב ובעומק' },
  ];
  const rollPosition = () => {
    const pick = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
    setRolledPosition(pick);
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

  // currentScene already computed from phaseScenes above

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">

      {/* ===== MAGICAL BACKGROUND ===== */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${currentScene.url})`,
          opacity: sceneOpacity,
          transition: 'opacity 1.5s ease-in-out'
        }}
      />
      {/* Overlay gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${currentScene.overlay}`} />

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
        📍 {currentScene.name}
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
          <div className="flex items-center gap-2">
            {/* כפתור זהות — מי אני */}
            <button
              onClick={() => setShowIdentityCard(true)}
              title="הזהות שלי"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/15 bg-white/8 hover:bg-white/15 transition-all"
              style={{ backdropFilter: 'blur(8px)' }}
            >
              <CGIAvatar gender={myGender} avatarUrl={avatars[myGender]} size="sm" scenarioId={scenario.id} />
              <span className="text-white/70 text-xs font-medium truncate max-w-[60px]">
                {scenario.roles[myGender]?.name}
              </span>
            </button>

            {/* כפתור מוזיקה דיסקרטי */}
            <button
              onClick={() => {
                audioService.init();
                const enabled = audioService.toggle();
                setAudioEnabled(enabled);
                if (enabled) {
                  audioService.play(scenario.id, tensionState.phase);
                }
              }}
              title={audioEnabled ? 'כבה מוזיקה' : 'הפעל מוזיקת רקע'}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                audioEnabled
                  ? 'text-fuchsia-300/70 bg-fuchsia-500/15'
                  : 'text-white/20 hover:text-white/40'
              }`}
            >
              {audioEnabled ? '🎵' : '🔇'}
            </button>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{tensionState.level}%</div>
              <div className="text-white/40 text-[10px]">מתח</div>
            </div>
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

        {messages.map((msg) => {
          const isMine = msg.senderGender === myGender;
          const myRole = scenario.roles[myGender];
          return (
            <ChatBubble
              key={msg.id}
              msg={msg}
              isMine={isMine}
              phase={tensionState.phase}
              avatarUrl={avatars[msg.senderGender]}
              scenarioId={scenario.id}
              roleName={isMine ? myRole?.name : '???'}
              onAvatarClick={isMine ? () => setShowIdentityCard(true) : undefined}
            />
          );
        })}
        {/* Typing indicator */}
        {partnerTyping && (
          <div className="flex items-center gap-2 px-4 py-2" dir="rtl">
            <div className="flex gap-1 items-center">
              <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-white/30 text-xs">מקליד/ה...</span>
          </div>
        )}
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
          <div className="px-3 pb-2">
            {/* Character badge — who am I playing */}
            {(() => {
              const myRole = scenario.roles[myGender];
              return myRole ? (
                <div className="flex items-center gap-1.5 mb-1.5 px-1">
                  <CGIAvatar gender={myGender} avatarUrl={avatars[myGender]} size="sm" scenarioId={scenario.id} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-white/50">{myRole.archetype} · </span>
                    {myRole.forbidden && (
                      <span className="text-[10px] text-red-400/60">{myRole.forbidden}</span>
                    )}
                  </div>
                  {/* כפתור סוד קטן — HOT+ בלבד */}
                  {tensionState.level >= 50 && scenario.secrets && (
                    <button
                      onClick={() => setShowSecretCard(true)}
                      className="px-2 py-0.5 rounded-full text-[10px] border border-amber-500/30 bg-amber-500/10 text-amber-300/70 hover:bg-amber-500/20 hover:text-amber-300 transition-all flex-shrink-0"
                      title={myGender === 'MAN' ? 'הסוד שלה' : 'הסוד שלו'}
                    >
                      🔐 סוד
                    </button>
                  )}
                </div>
              ) : null;
            })()}

            {/* סיגנל מוכנות — לגבר בלבד, כשהאשה שלחה סיגנל */}
            {myGender === 'MAN' && partnerReadySignal && (
              <div className={`mb-2 flex items-center gap-2 px-3 py-2 rounded-xl border animate-pulse ${
                partnerReadySignal === 'READY'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-pink-500/10 border-pink-500/30'
              }`}>
                <span className="text-lg">{partnerReadySignal === 'READY' ? '✨' : '💆'}</span>
                <div className="flex-1">
                  <div className={`text-xs font-medium ${
                    partnerReadySignal === 'READY' ? 'text-emerald-300' : 'text-pink-300'
                  }`}>
                    {partnerReadySignal === 'READY' ? 'היא מוכנה 🔥' : 'היא רוצה חימום לאט'}
                  </div>
                  <div className="text-[10px] text-white/40 mt-0.5">
                    {partnerReadySignal === 'READY'
                      ? 'קחו את זה לשלב הבא — קדימה!'
                      : 'התחל בעדינות: נשיקות על הצוואר, חיבוק מאחור, מגע לאט'}
                  </div>
                </div>
                <button
                  onClick={() => setPartnerReadySignal(null)}
                  className="text-white/20 hover:text-white/50 text-xs"
                >✕</button>
              </div>
            )}

            {/* "מוכנה?" — לאשה בלבד, כשמגיעים ל-HOT */}
            {myGender === 'WOMAN' && tensionState.level >= 50 && !womanReadinessShown && !womanReady && (
              <div className="mb-2 bg-fuchsia-500/10 border border-fuchsia-500/25 rounded-xl px-3 py-2.5">
                <div className="text-xs text-white/70 mb-2">איך את רוצה להמשיך?</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setWomanReady('SLOW');
                      setWomanReadinessShown(true);
                      const msg: Message = {
                        id: Date.now().toString(),
                        senderGender: 'WOMAN',
                        text: '💆 SLOW',
                        timestamp: Date.now(),
                        deviceId: channelId,
                        type: 'ACTION'
                      };
                      syncService.current.sendMessage(msg);
                    }}
                    className="flex-1 py-2 rounded-lg text-[11px] text-pink-300 border border-pink-500/30 bg-pink-500/10 hover:bg-pink-500/20 transition-all"
                  >
                    💆 חימום לאט
                  </button>
                  <button
                    onClick={() => {
                      setWomanReady('READY');
                      setWomanReadinessShown(true);
                      const msg: Message = {
                        id: Date.now().toString(),
                        senderGender: 'WOMAN',
                        text: '💫 READY',
                        timestamp: Date.now(),
                        deviceId: channelId,
                        type: 'ACTION'
                      };
                      syncService.current.sendMessage(msg);
                    }}
                    className="flex-1 py-2 rounded-lg text-[11px] text-emerald-300 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
                  >
                    ✨ מוכנה!
                  </button>
                </div>
              </div>
            )}

            {/* Loading dots */}
            {loading && (
              <div className="flex items-center gap-1.5 py-2 px-1">
                {[0, 100, 200].map(delay => (
                  <div key={delay} className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }} />
                ))}
                <span className="text-white/25 text-[10px] mr-1">מכנס לתוך הדמות...</span>
              </div>
            )}

            {aiResponse && !loading && (
              <div className="flex gap-2">
                {/* LEFT: Word chips + advice */}
                <div className="flex-1 min-w-0">
                  {/* Reading between the lines — subtext analysis (חדש!) */}
                  {aiResponse.readingBetweenLines && (
                    <div className="mb-2 px-2.5 py-1.5 rounded-xl text-xs leading-relaxed text-amber-200/70 border border-amber-500/20 bg-amber-500/8 flex items-start gap-1.5">
                      <span className="flex-shrink-0 mt-0.5">🔍</span>
                      <span>{aiResponse.readingBetweenLines}</span>
                    </div>
                  )}

                  {/* Strategic advice — in-character coaching */}
                  <div className="text-[10px] text-white/30 mb-1 uppercase tracking-widest">💬 מה לומר</div>
                  <div className={`mb-2 px-2.5 py-1.5 rounded-xl text-xs leading-relaxed text-white/70 border ${
                    tensionState.phase === 'ICE' ? 'bg-blue-500/10 border-blue-500/15' :
                    tensionState.phase === 'WARM' ? 'bg-pink-500/10 border-pink-500/15' :
                    tensionState.phase === 'HOT' ? 'bg-red-500/10 border-red-500/15' :
                    'bg-orange-500/10 border-orange-500/15'
                  }`}>
                    {myGender === 'MAN'
                      ? aiResponse.strategicAdvice.forMan
                      : aiResponse.strategicAdvice.forWoman}
                  </div>

                  {/* Word chips — tap to add to input (max 2) */}
                  <div className="flex flex-col gap-1.5">
                    {aiResponse.wordChips.slice(0, 2).map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleChipTap(chip)}
                        className="w-full text-right px-3 py-2 rounded-xl text-xs text-white/75 border border-white/12 bg-white/5 hover:bg-white/10 hover:border-white/25 hover:text-white active:scale-[0.98] transition-all leading-relaxed"
                      >
                        {chip}
                      </button>
                    ))}

                  </div>
                </div>

                {/* RIGHT: single action tip */}
                <div className="w-[105px] flex-shrink-0 flex flex-col gap-1.5">
                  <div className="text-[10px] text-white/30 uppercase tracking-widest">🤫 מה לעשות</div>
                  {aiResponse.actionTip && (
                    <div
                      className={`rounded-xl p-2.5 text-[11px] leading-snug border ${
                        tensionState.phase === 'ICE' ? 'bg-blue-500/10 border-blue-400/20 text-blue-100/70' :
                        tensionState.phase === 'WARM' ? 'bg-pink-500/10 border-pink-400/20 text-pink-100/70' :
                        tensionState.phase === 'HOT' ? 'bg-red-500/10 border-red-400/25 text-red-100/75' :
                        'bg-orange-500/12 border-orange-400/30 text-orange-100/80'
                      }`}
                    >
                      {aiResponse.actionTip}
                    </div>
                  )}
                </div>
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
            {/* לחצן התקדמות שקט — לגבר בלבד */}
            {myGender === 'MAN' && tensionState.phase !== 'FIRE' && (
              <button
                onClick={handleAdvancePhase}
                title="התקדם שלב"
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white/15 hover:text-white/35 hover:bg-white/5 transition-all"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <polygon points="0,10 5,0 10,10" />
                </svg>
              </button>
            )}

            {/* קוביית תנוחה — מופיעה רק במתח גבוה */}
            {tensionState.level >= 90 && (
              <button
                onClick={() => { rollPosition(); setShowPositionDice(true); }}
                title="קוביית תנוחה"
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-orange-400/60 hover:text-orange-400 hover:bg-orange-500/10 transition-all text-base"
              >
                🎲
              </button>
            )}

            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                // שלח typing signal (throttle — פעם בשנייה)
                const now = Date.now();
                if (now - lastTypingSentRef.current > 1000) {
                  lastTypingSentRef.current = now;
                  syncService.current.sendSystemMessage('TYPING');
                }
              }}
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

      {/* ===== IDENTITY CARD OVERLAY ===== */}
      {showIdentityCard && (() => {
        const role = scenario.roles[myGender];
        if (!role) return null;
        const phaseGrad = {
          ICE: 'from-blue-900/60 to-indigo-900/80',
          WARM: 'from-rose-900/60 to-fuchsia-900/80',
          HOT: 'from-orange-900/60 to-red-900/80',
          FIRE: 'from-red-950/70 to-pink-950/80'
        }[tensionState.phase] || 'from-fuchsia-900/60 to-purple-900/80';

        const mySecret = scenario.secrets?.[myGender];
        return (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end justify-center z-50"
            onClick={() => setShowIdentityCard(false)}
          >
            <div
              className={`w-full max-w-md bg-gradient-to-b ${phaseGrad} rounded-t-3xl overflow-y-auto`}
              style={{ border: '1px solid rgba(255,255,255,0.15)', borderBottom: 'none', maxHeight: '88vh' }}
              onClick={e => e.stopPropagation()}
            >
              {/* drag handle */}
              <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-gradient-to-b from-black/30 to-transparent">
                <div className="w-10 h-1 rounded-full bg-white/25" />
              </div>

              {/* hero — avatar large + name */}
              <div className="px-6 pb-4 flex flex-col items-center text-center border-b border-white/10">
                <div className="w-24 h-24 rounded-3xl overflow-hidden mb-3 ring-2 ring-white/20 shadow-2xl">
                  {avatars[myGender]
                    ? <img src={avatars[myGender]!} alt={role.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl bg-white/10">
                        {myGender === 'MAN' ? '🕺' : '💃'}
                      </div>
                  }
                </div>
                <div className="text-white/40 text-[10px] tracking-[0.2em] uppercase mb-1">הזהות הסודית שלך</div>
                <h2 className="text-white text-2xl font-bold tracking-wide mb-0.5">{role.name}</h2>
                <div className="text-white/50 text-sm">{role.archetype}</div>
                {role.forbidden && (
                  <div className="mt-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-400/20">
                    <span className="text-red-300/70 text-[10px]">⚠ {role.forbidden}</span>
                  </div>
                )}
              </div>

              {/* backstory — מי אני */}
              {role.backstory && (
                <div className="px-6 py-4 border-b border-white/8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">👤</span>
                    <div className="text-white/40 text-[10px] tracking-widest uppercase">מי אני</div>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">{role.backstory}</p>
                </div>
              )}

              {/* meetContext — הפגישה */}
              {role.meetContext && (
                <div className="px-6 py-4 border-b border-white/8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">✨</span>
                    <div className="text-white/40 text-[10px] tracking-widest uppercase">
                      {myGender === 'MAN' ? 'הרגע שראיתי אותה' : 'הרגע שראיתי אותו'}
                    </div>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed italic">"{role.meetContext}"</p>
                </div>
              )}

              {/* desire — מה אני מחפש */}
              {(role as any).desire && (
                <div className="px-6 py-4 border-b border-white/8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">🔥</span>
                    <div className="text-white/40 text-[10px] tracking-widest uppercase">מה אני מחפש הלילה</div>
                  </div>
                  <p className="text-white/90 text-sm leading-relaxed font-medium">{(role as any).desire}</p>
                </div>
              )}

              {/* secret — הסוד שלי */}
              {mySecret && (
                <div className="px-6 py-4 border-b border-white/8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">🤫</span>
                    <div className="text-white/40 text-[10px] tracking-widest uppercase">הסוד שלי — רק {myGender === 'MAN' ? 'אתה יודע' : 'את יודעת'}</div>
                  </div>
                  <p className="text-pink-200/80 text-sm leading-relaxed italic">{mySecret}</p>
                </div>
              )}

              {/* personality chip */}
              <div className="px-6 py-4 pb-8">
                <div className="text-white/30 text-[10px] tracking-widest uppercase mb-2">אופי</div>
                <p className="text-white/55 text-xs leading-relaxed">{role.personality}</p>
                <div className="mt-4 flex items-center gap-2 opacity-40">
                  <span className="text-sm">{phaseIcon}</span>
                  <span className="text-white/50 text-xs">{scenario.title} · {scenario.location}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===== POSITION DICE OVERLAY ===== */}
      {showPositionDice && rolledPosition && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-5"
          onClick={() => setShowPositionDice(false)}
        >
          <div
            className="max-w-xs w-full rounded-3xl overflow-hidden"
            style={{ background: 'rgba(20,5,10,0.97)', border: '1px solid rgba(255,80,80,0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4 text-center" style={{ background: 'linear-gradient(135deg, rgba(255,60,60,0.15), rgba(255,120,0,0.10))' }}>
              <div className="text-5xl mb-2 animate-bounce">🎲</div>
              <div className="text-red-300/50 text-[10px] uppercase tracking-widest mb-1">קוביית תנוחה</div>
              <div className="text-4xl mb-1">{rolledPosition.emoji}</div>
              <h2 className="text-white font-bold text-xl">{rolledPosition.name}</h2>
            </div>
            <div className="px-6 py-5 text-center">
              <p className="text-white/70 text-sm leading-relaxed">{rolledPosition.instruction}</p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={rollPosition}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/70 border border-white/15 hover:border-white/30 hover:text-white transition-all"
              >
                🎲 עוד אחת
              </button>
              <button
                onClick={() => setShowPositionDice(false)}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #ef444499, #f9730099)' }}
              >
                {myGender === 'MAN' ? 'בוא נתחיל' : 'בואי נתחיל'} ✨
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SECRET CARD OVERLAY ===== */}
      {showSecretCard && scenario.secrets && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-5">
          <div className="max-w-sm w-full bg-white/5 backdrop-blur-xl rounded-3xl border border-amber-500/25 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 px-6 pt-5 pb-3 border-b border-amber-500/15 text-center">
              <div className="text-3xl mb-1">🔐</div>
              <div className="text-amber-300/60 text-[10px] uppercase tracking-widest">{myGender === 'MAN' ? 'הסוד שלה' : 'הסוד שלו'}</div>
              <h2 className="text-white font-semibold text-base mt-1">
                מה הכי מטריף את {myGender === 'MAN'
                  ? scenario.roles.WOMAN.name
                  : scenario.roles.MAN.name}
              </h2>
            </div>
            <div className="px-6 py-5 text-center">
              <p className="text-white/85 text-base leading-relaxed italic">
                "{ myGender === 'MAN' ? scenario.secrets.WOMAN : scenario.secrets.MAN }"
              </p>
              <p className="text-white/30 text-xs mt-3">{myGender === 'MAN' ? 'רק אתה רואה את זה' : 'רק את רואה את זה'}</p>
            </div>
            <div className="px-5 pb-5">
              <button
                onClick={() => setShowSecretCard(false)}
                className="w-full py-3 rounded-2xl text-white font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                style={{ background: 'linear-gradient(135deg, #d97706cc, #92400ecc)' }}
              >
                קיבלתי 🔥
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== INTIMACY MISSION OVERLAY ===== */}
      {activeMission && (
        <MissionCard
          mission={activeMission}
          phase={tensionState.phase}
          myGender={myGender}
          onChoice={(choice) => {
            // שלח הודעה מיוחדת לצד השני
            const msg: Message = {
              id: Date.now().toString(),
              senderGender: myGender,
              text: `🔥 בחרתי: ${choice.label}`,
              timestamp: Date.now(),
              deviceId: channelId,
              type: 'ACTION'
            };
            syncService.current.sendMessage(msg);
          }}
          onDone={() => {
            if (activeMission) {
              setCompletedMissions(prev => [...prev, activeMission.id]);
            }
            setActiveMission(null);
          }}
          onSkip={() => setActiveMission(null)}
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
