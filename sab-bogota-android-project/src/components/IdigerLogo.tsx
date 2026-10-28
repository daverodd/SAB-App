import React from 'react';

interface IdigerLogoProps {
  className?: string;
  size?: number;
}

/**
 * Minimalist Google Material Design IDIGER Logo Emblem
 * Follows Material 3 geometric guidelines, squircle elevation, and IDIGER's official protection crest facets.
 */
export const IdigerLogo: React.FC<IdigerLogoProps> = ({ className = 'w-9 h-9', size }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Logo IDIGER Bogotá"
    >
      <defs>
        {/* Material 3 Surface Dark Elevation Gradient */}
        <linearGradient id="idigerBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="50%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#090d16" />
        </linearGradient>

        {/* Bogotá Gold / Solar Risk Prevention */}
        <linearGradient id="idigerGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>

        {/* Bogotá Crimson / Alert & Emergency Management */}
        <linearGradient id="idigerRed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>

        {/* Climate / Atmospheric Sky Blue */}
        <linearGradient id="idigerSky" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Hydrology & Water Monitoring Blue */}
        <linearGradient id="idigerBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        <filter id="m3Elevation" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="3" floodColor="#000000" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Material Design Rounded Squircle Container */}
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="24"
        fill="url(#idigerBg)"
        stroke="#38bdf8"
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />

      {/* Subtle Inner Glow Border */}
      <rect
        x="6"
        y="6"
        width="88"
        height="88"
        rx="22"
        fill="none"
        stroke="white"
        strokeWidth="0.8"
        strokeOpacity="0.12"
      />

      {/* IDIGER Protection Crest & Climate Risk Management Mark */}
      <g filter="url(#m3Elevation)">
        {/* Top Climate & Atmosphere Facet */}
        <path
          d="M 50 18 L 74 34 L 50 46 L 26 34 Z"
          fill="url(#idigerSky)"
        />

        {/* Left Prevention & Solar Resilience Facet (Bogotá Gold) */}
        <path
          d="M 23 37 L 47 49 L 47 78 L 23 64 Z"
          fill="url(#idigerGold)"
        />

        {/* Right Emergency & Alert Response Facet (Bogotá Red) */}
        <path
          d="M 77 37 L 77 64 L 53 78 L 53 49 Z"
          fill="url(#idigerRed)"
        />

        {/* Center-Bottom Hydrology Anchor Point (Pure Water Blue) */}
        <path
          d="M 50 51 L 71 63 L 50 84 L 29 63 Z"
          fill="url(#idigerBlue)"
          opacity="0.95"
        />

        {/* Minimalist Central Sensor Core (Clean white diamond) */}
        <polygon
          points="50,46 54,51 50,56 46,51"
          fill="#ffffff"
          opacity="0.9"
        />
      </g>
    </svg>
  );
};
