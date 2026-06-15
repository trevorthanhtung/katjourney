import React from "react";

// Shared cloud path used in multiple weather icons
const CLOUD_PATH = "M20 44a8 8 0 0 1 0-16 12 12 0 0 1 22-4 10 10 0 0 1 12 10 8 8 0 0 1-6 10H20z";

// 1. Sun / Clear Icon
export function SunIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sun-grad-sun" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF59D" />
          <stop offset="50%" stopColor="#FBC02D" />
          <stop offset="100%" stopColor="#F57F17" />
        </linearGradient>
        <filter id="sun-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <circle cx="32" cy="32" r="16" fill="#FBC02D" opacity="0.15" filter="url(#sun-glow)" />
      <circle cx="32" cy="32" r="12" fill="url(#sun-grad-sun)" />
      <g stroke="url(#sun-grad-sun)" strokeWidth="3.5" strokeLinecap="round">
        <line x1="32" y1="9" x2="32" y2="14" />
        <line x1="32" y1="50" x2="32" y2="55" />
        <line x1="9" y1="32" x2="14" y2="32" />
        <line x1="50" y1="32" x2="55" y2="32" />
        <line x1="15.7" y1="15.7" x2="19.3" y2="19.3" />
        <line x1="44.7" y1="44.7" x2="48.3" y2="48.3" />
        <line x1="15.7" y1="48.3" x2="19.3" y2="44.7" />
        <line x1="44.7" y1="19.3" x2="48.3" y2="15.7" />
      </g>
    </svg>
  );
}

// 2. Partly Cloudy Icon
export function PartlyCloudyIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sun-grad-part" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF59D" />
          <stop offset="100%" stopColor="#F57F17" />
        </linearGradient>
        <linearGradient id="cloud-grad-part" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#CFD8DC" />
        </linearGradient>
        <filter id="cloud-shadow-part" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#37474F" floodOpacity="0.12" />
        </filter>
      </defs>
      {/* Sun peeking from top-left */}
      <g>
        <circle cx="24" cy="20" r="10" fill="url(#sun-grad-part)" />
        <g stroke="url(#sun-grad-part)" strokeWidth="2.5" strokeLinecap="round">
          <line x1="13" y1="9" x2="16" y2="12" />
          <line x1="24" y1="4" x2="24" y2="8" />
          <line x1="8" y1="20" x2="12" y2="20" />
          <line x1="35" y1="9" x2="32" y2="12" />
        </g>
      </g>
      {/* Foreground Cloud */}
      <path
        d={CLOUD_PATH}
        fill="url(#cloud-grad-part)"
        filter="url(#cloud-shadow-part)"
      />
    </svg>
  );
}

// 3. Cloudy Icon
export function CloudyIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cloud-grad-front" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#ECEFF1" />
        </linearGradient>
        <linearGradient id="cloud-grad-back" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#CFD8DC" />
          <stop offset="100%" stopColor="#90A4AE" />
        </linearGradient>
        <filter id="cloud-shadow-cloudy" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#37474F" floodOpacity="0.1" />
        </filter>
      </defs>
      {/* Background Cloud */}
      <path
        d={CLOUD_PATH}
        fill="url(#cloud-grad-back)"
        transform="translate(-5, -5) scale(0.95)"
        style={{ transformOrigin: "32px 32px" }}
        opacity="0.85"
      />
      {/* Foreground Cloud */}
      <path
        d={CLOUD_PATH}
        fill="url(#cloud-grad-front)"
        filter="url(#cloud-shadow-cloudy)"
      />
    </svg>
  );
}

// 4. Fog Icon
export function FogIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cloud-grad-fog" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ECEFF1" />
          <stop offset="100%" stopColor="#B0BEC5" />
        </linearGradient>
        <linearGradient id="fog-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ECEFF1" />
          <stop offset="50%" stopColor="#CFD8DC" />
          <stop offset="100%" stopColor="#ECEFF1" />
        </linearGradient>
      </defs>
      {/* Ghostly cloud background */}
      <path d={CLOUD_PATH} fill="url(#cloud-grad-fog)" opacity="0.6" />
      {/* Fog lines overlay */}
      <g stroke="url(#fog-line-grad)" strokeWidth="3" strokeLinecap="round">
        <line x1="16" y1="36" x2="48" y2="36" />
        <line x1="12" y1="42" x2="52" y2="42" />
        <line x1="20" y1="48" x2="44" y2="48" />
      </g>
    </svg>
  );
}

// 5. Rain Icon
export function RainIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cloud-grad-rain" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#CFD8DC" />
          <stop offset="100%" stopColor="#546E7A" />
        </linearGradient>
        <linearGradient id="rain-drop-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4FC3F7" />
          <stop offset="100%" stopColor="#0288D1" />
        </linearGradient>
      </defs>
      <path d={CLOUD_PATH} fill="url(#cloud-grad-rain)" />
      {/* Rain drops */}
      <g stroke="url(#rain-drop-grad)" strokeWidth="3" strokeLinecap="round">
        <line x1="24" y1="48" x2="21" y2="56" />
        <line x1="32" y1="51" x2="29" y2="59" />
        <line x1="40" y1="48" x2="37" y2="56" />
        <line x1="48" y1="51" x2="45" y2="59" />
      </g>
    </svg>
  );
}

// 6. Drizzle Icon
export function DrizzleIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cloud-grad-drizzle" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ECEFF1" />
          <stop offset="100%" stopColor="#78909C" />
        </linearGradient>
        <linearGradient id="drizzle-drop-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#B3E5FC" />
          <stop offset="100%" stopColor="#29B6F6" />
        </linearGradient>
      </defs>
      <path d={CLOUD_PATH} fill="url(#cloud-grad-drizzle)" />
      {/* Staggered light drops */}
      <g stroke="url(#drizzle-drop-grad)" strokeWidth="2.5" strokeLinecap="round">
        <line x1="26" y1="48" x2="24" y2="54" />
        <line x1="38" y1="48" x2="36" y2="54" />
      </g>
    </svg>
  );
}

// 7. Thunderstorm Icon
export function ThunderstormIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cloud-grad-storm" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#455A64" />
          <stop offset="100%" stopColor="#263238" />
        </linearGradient>
        <linearGradient id="lightning-grad-storm" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFD85" />
          <stop offset="50%" stopColor="#FFEB3B" />
          <stop offset="100%" stopColor="#F57F17" />
        </linearGradient>
        <filter id="lightning-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <path d={CLOUD_PATH} fill="url(#cloud-grad-storm)" />
      {/* Lightning bolt */}
      <polygon
        points="32,38 26,49 33,49 29,58 40,46 33,46"
        fill="url(#lightning-grad-storm)"
        filter="url(#lightning-glow)"
      />
    </svg>
  );
}

// 8. Snow Icon
export function SnowIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cloud-grad-snow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ECEFF1" />
          <stop offset="100%" stopColor="#90A4AE" />
        </linearGradient>
        <linearGradient id="snow-flake-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E0F7FA" />
        </linearGradient>
      </defs>
      <path d={CLOUD_PATH} fill="url(#cloud-grad-snow)" />
      {/* Snow dots */}
      <g fill="url(#snow-flake-grad)">
        <circle cx="24" cy="49" r="2.5" />
        <circle cx="32" cy="53" r="2" />
        <circle cx="40" cy="49" r="2.5" />
        <circle cx="48" cy="53" r="2" />
      </g>
    </svg>
  );
}

// 9. Thermometer Icon
export function ThermometerIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="therm-grad-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ECEFF1" />
          <stop offset="100%" stopColor="#CFD8DC" />
        </linearGradient>
        <linearGradient id="therm-grad-fluid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF5252" />
          <stop offset="100%" stopColor="#D50000" />
        </linearGradient>
      </defs>
      <path
        d="M36 44.3V20a4 4 0 0 0-8 0v24.3a8 8 0 1 0 8 0z"
        fill="url(#therm-grad-body)"
        stroke="#90A4AE"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="48" r="5" fill="url(#therm-grad-fluid)" />
      <rect x="30" y="22" width="4" height="23" rx="2" fill="url(#therm-grad-fluid)" />
    </svg>
  );
}

// 10. Humidity Icon
export function HumidityIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="humidity-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4FC3F7" />
          <stop offset="50%" stopColor="#29B6F6" />
          <stop offset="100%" stopColor="#0288D1" />
        </linearGradient>
      </defs>
      <path
        d="M32 12 C24 22 18 28.5 18 36 A14 14 0 0 0 46 36 C46 28.5 40 22 32 12 Z"
        fill="url(#humidity-grad)"
        stroke="#0277BD"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 11. Wind Icon
export function WindIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wind-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#CFD8DC" />
          <stop offset="100%" stopColor="#78909C" />
        </linearGradient>
      </defs>
      <g stroke="url(#wind-grad)" strokeWidth="4.5" strokeLinecap="round" fill="none">
        <path d="M14 22h28a5 5 0 1 0-5-5" />
        <path d="M10 32h38a5 5 0 1 1-5 5" />
        <path d="M18 42h20a5 5 0 1 0-5-5" />
      </g>
    </svg>
  );
}
