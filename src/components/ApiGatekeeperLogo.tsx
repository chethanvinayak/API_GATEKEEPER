import React from 'react';

interface ApiGatekeeperLogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
  showText?: boolean;
}

export const ApiGatekeeperLogo: React.FC<ApiGatekeeperLogoProps> = ({
  className = 'h-10 w-10',
  size = 40,
  showText = false,
}) => {
  return (
    <div className="inline-flex items-center gap-3.5 group cursor-pointer select-none">
      {/* Emblem Container */}
      <div
        className={`relative flex items-center justify-center shrink-0 rounded-xl bg-slate-900 border border-slate-200 shadow-sm transition-all duration-300 group-hover:border-indigo-500/80 ${className}`}
        style={{ width: size, height: size }}
      >
        {/* Vector SVG Emblem Matching Enterprise Theme */}
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1"
        >
          <defs>
            {/* Outer Armor Rim Blue Gradient */}
            <linearGradient id="shieldRim" x1="10" y1="5" x2="90" y2="95" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="35%" stopColor="#3b82f6" />
              <stop offset="70%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1e40af" />
            </linearGradient>

            {/* Pillar Enterprise Metallic Gradient */}
            <linearGradient id="pillarGrad" x1="50" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="30%" stopColor="#3b82f6" />
              <stop offset="80%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>

            {/* Inner Left Dark Obsidian */}
            <linearGradient id="obsidianLeft" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Inner Right Pitch Black */}
            <linearGradient id="obsidianRight" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
          </defs>

          {/* Outer Heavy Beveled Armor Shield Frame */}
          <path
            d="M50 4L88 18V28L92 32V42L88 46V54C88 74 70 90 50 96C30 90 12 74 12 54V46L8 42V32L12 28V18L50 4Z"
            fill="url(#shieldRim)"
          />

          {/* Inner Inset Rim Border */}
          <path
            d="M50 8L84 20.5V52C84 70 68 85 50 90.5C32 85 16 70 16 52V20.5L50 8Z"
            fill="#090d16"
          />

          {/* Split Obsidian Shield Face - Left Side */}
          <path
            d="M50 10L18 22V52C18 68.5 33 82.5 50 88V10Z"
            fill="url(#obsidianLeft)"
          />

          {/* Split Obsidian Shield Face - Right Side */}
          <path
            d="M50 10L82 22V52C82 68.5 67 82.5 50 88V10Z"
            fill="url(#obsidianRight)"
          />

          {/* Circuit Trace Branch Lines (Left Side) */}
          <path
            d="M37 38H27L22 38"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M37 50H26L20 50"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M37 62H27L22 62"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Circuit Trace Branch Lines (Right Side) */}
          <path
            d="M63 38H73L78 38"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M63 50H74L80 50"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M63 62H73L78 62"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* 3 Left Circular Circuit Nodes */}
          <circle cx="22" cy="38" r="4.5" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1.5" />
          <circle cx="22" cy="38" r="2" fill="#ffffff" />

          <circle cx="20" cy="50" r="4.5" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1.5" />
          <circle cx="20" cy="50" r="2" fill="#ffffff" />

          <circle cx="22" cy="62" r="4.5" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1.5" />
          <circle cx="22" cy="62" r="2" fill="#ffffff" />

          {/* 3 Right Circular Circuit Nodes */}
          <circle cx="78" cy="38" r="4.5" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1.5" />
          <circle cx="78" cy="38" r="2" fill="#ffffff" />

          <circle cx="80" cy="50" r="4.5" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1.5" />
          <circle cx="80" cy="50" r="2" fill="#ffffff" />

          <circle cx="78" cy="62" r="4.5" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1.5" />
          <circle cx="78" cy="62" r="2" fill="#ffffff" />

          {/* Center 3 Vertical Angled Pillars */}
          {/* Left Pillar */}
          <path
            d="M37 34L43 30V68L37 64Z"
            fill="url(#pillarGrad)"
            stroke="#60a5fa"
            strokeWidth="0.8"
          />

          {/* Middle Pillar (Tallest Pointed Center) */}
          <path
            d="M47 28L50 23L53 28V72L50 75L47 72Z"
            fill="url(#pillarGrad)"
            stroke="#93c5fd"
            strokeWidth="1"
          />

          {/* Right Pillar */}
          <path
            d="M57 30L63 34V64L57 68Z"
            fill="url(#pillarGrad)"
            stroke="#60a5fa"
            strokeWidth="0.8"
          />
        </svg>
      </div>

      {/* Integrated Typography */}
      {showText && (
        <div className="flex flex-col text-left">
          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 uppercase font-sans">
            API Gatekeeper
          </span>
        </div>
      )}
    </div>
  );
};
