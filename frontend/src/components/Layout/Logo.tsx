import React from 'react';

export const Logo: React.FC<{ size?: number }> = ({ size = 48 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="UDYOGRATH Original Logo Mark"
    >
      {/* Outer Square Framework with Corner Notches */}
      <rect x="4" y="4" width="56" height="56" rx="2" stroke="#17375E" strokeWidth="3" fill="#FFFFFF" />
      <rect x="8" y="8" width="48" height="48" stroke="#E8871E" strokeWidth="1.5" fill="#F4F6F9" />

      {/* Outer Wheel Rim */}
      <circle cx="32" cy="32" r="19" stroke="#17375E" strokeWidth="3" fill="#FFFFFF" />
      <circle cx="32" cy="32" r="14" stroke="#E8871E" strokeWidth="1.5" />

      {/* 8 Geometric Chariot Spokes */}
      <line x1="32" y1="13" x2="32" y2="51" stroke="#17375E" strokeWidth="2.5" />
      <line x1="13" y1="32" x2="51" y2="32" stroke="#17375E" strokeWidth="2.5" />
      <line x1="18.5" y1="18.5" x2="45.5" y2="45.5" stroke="#1F4E8C" strokeWidth="2" />
      <line x1="18.5" y1="45.5" x2="45.5" y2="18.5" stroke="#1F4E8C" strokeWidth="2" />

      {/* Central Chariot Hub (Rath Hub) */}
      <circle cx="32" cy="32" r="6" fill="#17375E" />
      <circle cx="32" cy="32" r="3" fill="#E8871E" />

      {/* Decorative Chariot Crown Accent */}
      <path d="M26 6 L32 2 L38 6 Z" fill="#E8871E" />
    </svg>
  );
};
