import React from 'react';

// Curated palette of premium gradient background stops
const GRADIENTS = [
  { from: '#4F46E5', to: '#06B6D4' }, // Indigo to Cyan
  { from: '#EC4899', to: '#F43F5E' }, // Pink to Rose
  { from: '#10B981', to: '#059669' }, // Emerald
  { from: '#F59E0B', to: '#D97706' }, // Amber
  { from: '#8B5CF6', to: '#EC4899' }, // Violet to Pink
  { from: '#3B82F6', to: '#1D4ED8' }, // Blue
  { from: '#EF4444', to: '#B91C1C' }, // Red
  { from: '#84CC16', to: '#10B981' }, // Lime to Emerald
  { from: '#06B6D4', to: '#3B82F6' }, // Cyan to Blue
  { from: '#F97316', to: '#EF4444' }, // Orange to Red
];

// Skin tones
const SKINS = ['#FDBA74', '#FCD34D', '#F87171', '#FCA5A5', '#FFedd5', '#fed7aa', '#fbcfe8'];

// Hair colors
const HAIR_COLORS = ['#1E293B', '#475569', '#78350F', '#B45309', '#CA8A04', '#0F172A'];

interface AvatarComponentProps {
  id: string;
  className?: string;
}

export const getAvatarSvg = (id: string, className: string = "w-full h-full"): React.ReactElement => {
  // Parse avatar ID: e.g., "m1", "f3", "o2"
  const type = id.charAt(0); // 'm' (male), 'f' (female), 'o' (other)
  const num = parseInt(id.substring(1)) || 1;
  
  // Deterministic styling based on type and number
  const gradIdx = (num * 3) % GRADIENTS.length;
  const grad = GRADIENTS[gradIdx];
  const skin = SKINS[(num * 2) % SKINS.length];
  const hairColor = HAIR_COLORS[(num * 7) % HAIR_COLORS.length];
  const gradId = `avatar-grad-${id}`;

  const isMale = type === 'm';
  const isFemale = type === 'f';

  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={grad.from} />
          <stop offset="100%" stopColor={grad.to} />
        </linearGradient>
        <clipPath id={`avatar-clip-${id}`}>
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      </defs>

      {/* Circle Background */}
      <circle cx="50" cy="50" r="48" fill={`url(#${gradId})`} stroke="rgba(255,255,255,0.15)" strokeWidth="2" />

      {/* Body & Face wrapped in clip-path to prevent spilling out */}
      <g clipPath={`url(#avatar-clip-${id})`}>
        {/* Shoulders / Shirt */}
        <path 
          d="M 22,88 C 22,76 34,70 50,70 C 66,70 78,76 78,88 Z" 
          fill="rgba(255,255,255,0.85)" 
        />
        {/* Shirt inner collar */}
        <path 
          d="M 40,70 C 40,78 60,78 60,70" 
          fill={skin} 
        />

        {/* Neck */}
        <rect x="44" y="52" width="12" height="15" rx="2" fill={skin} opacity="0.95" />

        {/* Face */}
        <circle cx="50" cy="42" r="18" fill={skin} />

        {/* Eyes */}
        <circle cx="43" cy="39" r="2" fill="#1E293B" />
        <circle cx="57" cy="39" r="2" fill="#1E293B" />

        {/* Smile */}
        <path 
          d="M 46,47 Q 50,51 54,47" 
          stroke="#1E293B" 
          strokeWidth="2" 
          strokeLinecap="round" 
          fill="none" 
        />

        {/* Eyebrows */}
        <path d="M 40,35 Q 43,33 46,35" stroke={hairColor} strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M 54,35 Q 57,33 60,35" stroke={hairColor} strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Blush */}
        <circle cx="37" cy="43" r="2" fill="#F43F5E" opacity="0.3" />
        <circle cx="63" cy="43" r="2" fill="#F43F5E" opacity="0.3" />

        {/* Male Hair Styles */}
        {isMale && (
          <>
            {num % 3 === 0 && (
              // Spiky Short Hair
              <path 
                d="M 32,38 C 32,24 40,20 50,20 C 60,20 68,24 68,38 C 68,38 72,32 64,26 C 56,20 44,20 36,26 C 28,32 32,38 32,38 Z" 
                fill={hairColor} 
              />
            )}
            {num % 3 === 1 && (
              // Side Part Hair
              <path 
                d="M 31,38 C 30,22 42,18 52,22 C 62,18 69,25 69,38 C 69,38 66,28 58,26 C 50,24 38,28 31,38 Z" 
                fill={hairColor} 
              />
            )}
            {num % 3 === 2 && (
              // Curly / Afro / Round Top Hair
              <path 
                d="M 30,38 C 28,26 38,18 50,18 C 62,18 72,26 70,38 C 64,34 56,34 50,36 C 44,34 36,34 30,38 Z" 
                fill={hairColor} 
              />
            )}
            {/* Beard details for some male avatars */}
            {num % 2 === 0 && (
              <path 
                d="M 32,42 C 32,56 40,64 50,64 C 60,64 68,56 68,42 C 68,46 62,56 50,56 C 38,56 32,46 32,42 Z" 
                fill={hairColor} 
                opacity="0.85"
              />
            )}
          </>
        )}

        {/* Female Hair Styles */}
        {isFemale && (
          <>
            {num % 3 === 0 && (
              // Long hair draping shoulders
              <>
                <path 
                  d="M 30,35 C 24,50 24,75 28,80 C 32,85 36,80 36,65 L 36,35 Z" 
                  fill={hairColor} 
                />
                <path 
                  d="M 70,35 C 76,50 76,75 72,80 C 68,85 64,80 64,65 L 64,35 Z" 
                  fill={hairColor} 
                />
                <path 
                  d="M 30,36 C 30,22 40,16 50,16 C 60,16 70,22 70,36 C 66,28 58,24 50,24 C 42,24 34,28 30,36 Z" 
                  fill={hairColor} 
                />
              </>
            )}
            {num % 3 === 1 && (
              // Bob Cut Hair
              <path 
                d="M 30,38 C 28,24 38,18 50,18 C 62,18 72,24 70,38 C 70,48 68,52 68,52 C 64,44 56,40 50,40 C 44,40 36,44 32,52 C 32,52 30,48 30,38 Z" 
                fill={hairColor} 
              />
            )}
            {num % 3 === 2 && (
              // High bun hair style
              <>
                <circle cx="50" cy="16" r="10" fill={hairColor} />
                <path 
                  d="M 31,38 C 30,24 38,20 50,20 C 62,20 70,24 69,38 C 66,32 58,28 50,28 C 42,28 34,32 31,38 Z" 
                  fill={hairColor} 
                />
              </>
            )}
          </>
        )}

        {/* Other / Emoji Styles */}
        {type === 'o' && (
          // Playful Cap / Accessory
          <path 
            d="M 28,30 C 35,16 65,16 72,30 L 78,34 L 22,34 Z" 
            fill={hairColor} 
          />
        )}
      </g>
    </svg>
  );
};

export const getRandomAvatarId = (gender: 'male' | 'female' | 'other' | string, existingAvatars: string[] = []): string => {
  const prefix = gender === 'male' ? 'm' : gender === 'female' ? 'f' : 'o';
  
  // We want to generate an ID from 1 to 10
  // To avoid duplication, try to pick one not in existingAvatars
  const pool = Array.from({ length: 10 }, (_, i) => `${prefix}${i + 1}`);
  const available = pool.filter(id => !existingAvatars.includes(id));
  
  if (available.length > 0) {
    const randIdx = Math.floor(Math.random() * available.length);
    return available[randIdx];
  }
  
  // Fallback if all are used
  const randNum = Math.floor(Math.random() * 10) + 1;
  return `${prefix}${randNum}`;
};
