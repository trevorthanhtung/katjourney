import React from "react";

// Shared cloud path used in multiple weather icons
const CLOUD_PATH = "M20 44a8 8 0 0 1 0-16 12 12 0 0 1 22-4 10 10 0 0 1 12 10 8 8 0 0 1-6 10H20z";

// 1. Sun / Clear Icon
export function SunIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="glass-sun-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF59D" />
          <stop offset="50%" stopColor="#FBC02D" />
          <stop offset="100%" stopColor="#F57F17" />
        </linearGradient>
        <filter id="sun-glow-filter" x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Outer soft glowing ring */}
      <circle cx="32" cy="32" r="19" fill="#FBC02D" opacity="0.15" filter="url(#sun-glow-filter)" />
      {/* Rotating ray lines */}
      <g stroke="url(#glass-sun-grad)" strokeWidth="3.5" strokeLinecap="round" opacity="0.95">
        <line x1="32" y1="8" x2="32" y2="13" />
        <line x1="32" y1="51" x2="32" y2="56" />
        <line x1="8" y1="32" x2="13" y2="32" />
        <line x1="51" y1="32" x2="56" y2="32" />
        <line x1="15" y1="15" x2="18.5" y2="18.5" />
        <line x1="45.5" y1="45.5" x2="49" y2="49" />
        <line x1="15" y1="49" x2="18.5" y2="45.5" />
        <line x1="45.5" y1="18.5" x2="49" y2="15" />
      </g>
      {/* Core Sun Body */}
      <circle cx="32" cy="32" r="13" fill="url(#glass-sun-grad)" filter="url(#sun-glow-filter)" />
    </svg>
  );
}

// 2. Partly Cloudy Icon
export function PartlyCloudyIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="glass-sun-part" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE082" />
          <stop offset="100%" stopColor="#F57F17" />
        </linearGradient>
        <linearGradient id="glass-cloud-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#E2E8F0" stopOpacity="0.45" />
        </linearGradient>
        <filter id="glass-cloud-shadow" x="-20%" y="-20%" width="145%" height="145%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#0F172A" floodOpacity="0.18" />
        </filter>
        <filter id="sun-peeking-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Sun peeking */}
      <g filter="url(#sun-peeking-glow)">
        <circle cx="25" cy="22" r="10" fill="url(#glass-sun-part)" />
        <g stroke="url(#glass-sun-part)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8">
          <line x1="14.5" y1="11.5" x2="17.5" y2="14.5" />
          <line x1="25" y1="6" x2="25" y2="10" />
          <line x1="9" y1="22" x2="13" y2="22" />
          <line x1="35.5" y1="11.5" x2="32.5" y2="14.5" />
        </g>
      </g>
      {/* Glass Cloud */}
      <path
        d={CLOUD_PATH}
        fill="url(#glass-cloud-grad)"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="1.5"
        filter="url(#glass-cloud-shadow)"
      />
    </svg>
  );
}

// 3. Cloudy Icon
export function CloudyIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="glass-cloud-front" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#E2E8F0" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="glass-cloud-back" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#CFD8DC" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#90A4AE" stopOpacity="0.25" />
        </linearGradient>
        <filter id="glass-cloudy-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#0F172A" floodOpacity="0.15" />
        </filter>
      </defs>
      {/* Background Cloud */}
      <path
        d={CLOUD_PATH}
        fill="url(#glass-cloud-back)"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="1.5"
        transform="translate(-6, -5) scale(0.95)"
        style={{ transformOrigin: "32px 32px" }}
      />
      {/* Foreground Cloud */}
      <path
        d={CLOUD_PATH}
        fill="url(#glass-cloud-front)"
        stroke="currentColor"
        strokeOpacity="0.6"
        strokeWidth="1.5"
        filter="url(#glass-cloudy-shadow)"
      />
    </svg>
  );
}

// 4. Fog Icon
export function FogIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="glass-cloud-fog" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#B0BEC5" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="glass-fog-line" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.2)" />
          <stop offset="50%" stopColor="rgba(255, 255, 255, 0.95)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0.2)" />
        </linearGradient>
        <filter id="glass-fog-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#1E293B" floodOpacity="0.15" />
        </filter>
      </defs>
      {/* Cloud */}
      <path
        d={CLOUD_PATH}
        fill="url(#glass-cloud-fog)"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="1.5"
        filter="url(#glass-fog-shadow)"
        opacity="0.85"
      />
      {/* Fog lines overlay */}
      <g stroke="currentColor" strokeOpacity="0.75" strokeWidth="3" strokeLinecap="round" filter="url(#glass-fog-shadow)">
        <line x1="16" y1="36" x2="48" y2="36" />
        <line x1="10" y1="42" x2="54" y2="42" />
        <line x1="18" y1="48" x2="46" y2="48" />
      </g>
    </svg>
  );
}

// 5. Rain Icon
export function RainIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="glass-cloud-rain" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ECEFF1" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#455A64" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="glass-rain-drop" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#00B0FF" />
        </linearGradient>
        <filter id="glass-rain-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#0F172A" floodOpacity="0.18" />
        </filter>
      </defs>
      {/* Cloud */}
      <path
        d={CLOUD_PATH}
        fill="url(#glass-cloud-rain)"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="1.5"
        filter="url(#glass-rain-shadow)"
      />
      {/* Glowing rain drops */}
      <g stroke="url(#glass-rain-drop)" strokeWidth="3" strokeLinecap="round" opacity="0.9" filter="url(#glass-rain-shadow)">
        <line x1="24" y1="46" x2="21" y2="54" />
        <line x1="32" y1="49" x2="29" y2="57" />
        <line x1="40" y1="46" x2="37" y2="54" />
        <line x1="48" y1="49" x2="45" y2="57" />
      </g>
    </svg>
  );
}

// 6. Drizzle Icon
export function DrizzleIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="glass-cloud-drizzle" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#90A4AE" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="glass-drizzle-drop" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#80DEEA" />
          <stop offset="100%" stopColor="#00ACC1" />
        </linearGradient>
        <filter id="glass-drizzle-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#0F172A" floodOpacity="0.15" />
        </filter>
      </defs>
      {/* Cloud */}
      <path
        d={CLOUD_PATH}
        fill="url(#glass-cloud-drizzle)"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="1.5"
        filter="url(#glass-drizzle-shadow)"
      />
      {/* Drops */}
      <g stroke="url(#glass-drizzle-drop)" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" filter="url(#glass-drizzle-shadow)">
        <line x1="26" y1="46" x2="24" y2="52" />
        <line x1="38" y1="46" x2="36" y2="52" />
      </g>
    </svg>
  );
}

// 7. Thunderstorm Icon
export function ThunderstormIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="glass-cloud-storm" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#37474F" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#1C2833" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="glass-lightning-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF59D" />
          <stop offset="50%" stopColor="#FFD54F" />
          <stop offset="100%" stopColor="#FF8F00" />
        </linearGradient>
        <filter id="lightning-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="glass-storm-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#090D16" floodOpacity="0.22" />
        </filter>
      </defs>
      {/* Cloud */}
      <path
        d={CLOUD_PATH}
        fill="url(#glass-cloud-storm)"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1.5"
        filter="url(#glass-storm-shadow)"
      />
      {/* Lightning bolt with glow */}
      <polygon
        points="32,36 25,48 32,48 27,58 40,44 33,44"
        fill="url(#glass-lightning-grad)"
        filter="url(#lightning-glow-filter)"
      />
    </svg>
  );
}

// 8. Snow Icon
export function SnowIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="glass-cloud-snow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#B0F2FE" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="glass-snow-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E0F7FA" />
        </linearGradient>
        <filter id="glass-snow-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#0F172A" floodOpacity="0.12" />
        </filter>
      </defs>
      {/* Cloud */}
      <path
        d={CLOUD_PATH}
        fill="url(#glass-cloud-snow)"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="1.5"
        filter="url(#glass-snow-shadow)"
      />
      {/* Snowflake dots */}
      <g fill="url(#glass-snow-grad)" filter="url(#glass-snow-shadow)" opacity="0.9">
        <circle cx="23" cy="47" r="2.5" />
        <circle cx="32" cy="52" r="2" />
        <circle cx="41" cy="47" r="2.5" />
        <circle cx="49" cy="51" r="2" />
      </g>
    </svg>
  );
}

// 9. Thermometer Icon
export function ThermometerIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="glass-therm-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#E2E8F0" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="glass-therm-fluid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF5252" />
          <stop offset="100%" stopColor="#D50000" />
        </linearGradient>
        <filter id="glass-therm-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.16" />
        </filter>
      </defs>
      {/* Outer Tube */}
      <path
        d="M36 43.5V20a4 4 0 0 0-8 0v23.5a8 8 0 1 0 8 0z"
        fill="url(#glass-therm-body)"
        stroke="currentColor"
        strokeOpacity="0.75"
        strokeWidth="2.5"
        strokeLinejoin="round"
        filter="url(#glass-therm-shadow)"
      />
      {/* Red fluid bulb & line */}
      <circle cx="32" cy="47" r="4.5" fill="url(#glass-therm-fluid)" />
      <rect x="30.5" y="22" width="3" height="21" rx="1.5" fill="url(#glass-therm-fluid)" />
    </svg>
  );
}

// 10. Humidity Icon
export function HumidityIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="glass-humidity" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4FC3F7" />
          <stop offset="50%" stopColor="#00B0FF" />
          <stop offset="100%" stopColor="#0091EA" />
        </linearGradient>
        <filter id="glass-humidity-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#006064" floodOpacity="0.18" />
        </filter>
      </defs>
      <path
        d="M32 14 C24 23.5 18 29.5 18 37 A14 14 0 0 0 46 37 C46 29.5 40 23.5 32 14 Z"
        fill="url(#glass-humidity)"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="1.5"
        strokeLinejoin="round"
        filter="url(#glass-humidity-shadow)"
      />
      {/* Glass Highlight glare */}
      <path
        d="M23.5 35 C23 32 25.5 28.5 28 25.5"
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 11. Wind Icon
export function WindIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="glass-wind-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.3)" />
          <stop offset="50%" stopColor="rgba(255, 255, 255, 0.9)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0.3)" />
        </linearGradient>
        <filter id="glass-wind-shadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0F172A" floodOpacity="0.15" />
        </filter>
      </defs>
      <g stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" fill="none" filter="url(#glass-wind-shadow)">
        <path d="M12 22h30a5 5 0 1 0-5-5" />
        <path d="M8 32h40a5 5 0 1 1-5 5" />
        <path d="M16 42h22a5 5 0 1 0-5-5" />
      </g>
    </svg>
  );
}




