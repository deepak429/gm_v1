import React from 'react';
import { HeroCharacter } from '../types';

interface HeroPortraitProps {
  hero: HeroCharacter;
  size?: number;
  locked?: boolean;
  showBow?: boolean;
  pose?: 'idle' | 'aim';
}

const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');
const lighten = (n: number, f: number) => {
  const r = Math.min(255, ((n >> 16) & 0xff) + (255 - ((n >> 16) & 0xff)) * f);
  const g = Math.min(255, ((n >> 8) & 0xff) + (255 - ((n >> 8) & 0xff)) * f);
  const b = Math.min(255, (n & 0xff) + (255 - (n & 0xff)) * f);
  return hex(((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff));
};
const darken = (n: number, f: number) => {
  const r = Math.max(0, ((n >> 16) & 0xff) * f);
  const g = Math.max(0, ((n >> 8) & 0xff) * f);
  const b = Math.max(0, (n & 0xff) * f);
  return hex(((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff));
};

export const HeroPortrait: React.FC<HeroPortraitProps> = ({
  hero,
  size = 220,
  locked = false,
  showBow = true,
  pose = 'idle',
}) => {
  const cowl = hex(hero.cowlColor);
  const cowlDark = darken(hero.cowlColor, 0.6);
  const armor = hex(hero.armorColor);
  const armorLight = lighten(hero.armorColor, 0.25);
  const trim = hex(hero.trimColor);
  const hair = hex(hero.hairColor);
  const hairHi = lighten(hero.hairColor, 0.25);
  const eye = hex(hero.eyeColor);
  const cape = hex(hero.capeColor);
  const capeHi = lighten(hero.capeColor, 0.3);
  const skin = '#f5caa2';
  const skinShade = '#db9f76';

  const id = hero.id;

  return (
    <svg
      viewBox="0 0 220 300"
      width={size}
      height={(size * 300) / 220}
      style={{ filter: locked ? 'grayscale(0.9) brightness(0.6)' : 'none' }}
    >
      <defs>
        <radialGradient id={`${id}-bg`} cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor={lighten(hero.eyeColor, 0.3)} stopOpacity="0.35" />
          <stop offset="60%" stopColor="#0a141c" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#040a10" stopOpacity="1" />
        </radialGradient>
        <linearGradient id={`${id}-cape`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={capeHi} />
          <stop offset="100%" stopColor={cape} />
        </linearGradient>
        <linearGradient id={`${id}-armor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={armorLight} />
          <stop offset="100%" stopColor={armor} />
        </linearGradient>
        <radialGradient id={`${id}-eyeglow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={eye} stopOpacity="1" />
          <stop offset="100%" stopColor={eye} stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
        </filter>
      </defs>

      {/* Background vignette with hero's eye-color accent */}
      <rect x="0" y="0" width="220" height="300" fill={`url(#${id}-bg)`} />

      {/* Decorative sigil ring behind character */}
      <circle cx="110" cy="135" r="78" fill="none" stroke={trim} strokeOpacity="0.18" strokeWidth="1.5" />
      <circle cx="110" cy="135" r="92" fill="none" stroke={trim} strokeOpacity="0.1" strokeWidth="1" strokeDasharray="2 4" />

      {/* Rune glyphs — subtle brand per hero */}
      <text x="18" y="30" fill={trim} opacity="0.45" fontSize="12" fontFamily="monospace" letterSpacing="4">
        {hero.id.slice(0, 3).toUpperCase()}
      </text>
      <text x="200" y="290" fill={trim} opacity="0.45" fontSize="12" fontFamily="monospace" textAnchor="end" letterSpacing="4">
        ★{hero.cost}
      </text>

      {/* Cape — behind body */}
      <path
        d={
          pose === 'aim'
            ? 'M 92 95 L 128 95 L 160 155 L 170 230 L 148 258 L 90 258 L 58 230 L 70 155 Z'
            : 'M 90 95 L 130 95 L 162 160 L 174 240 L 140 265 L 80 265 L 48 240 L 62 160 Z'
        }
        fill={`url(#${id}-cape)`}
        opacity="0.95"
      />
      {/* Cape fold crease */}
      <path
        d="M 110 100 L 118 170 L 128 240"
        stroke={cowlDark}
        strokeOpacity="0.5"
        fill="none"
        strokeWidth="2"
      />
      <path
        d="M 110 100 L 100 170 L 90 240"
        stroke={cowlDark}
        strokeOpacity="0.5"
        fill="none"
        strokeWidth="2"
      />

      {/* Shoulders / pauldrons */}
      <path
        d="M 72 118 Q 82 95 100 100 L 100 125 Z"
        fill={`url(#${id}-armor)`}
      />
      <path
        d="M 148 118 Q 138 95 120 100 L 120 125 Z"
        fill={`url(#${id}-armor)`}
      />
      <circle cx="80" cy="112" r="3" fill={trim} />
      <circle cx="140" cy="112" r="3" fill={trim} />

      {/* Torso cuirass */}
      <path
        d="M 86 118 L 134 118 L 138 190 L 110 205 L 82 190 Z"
        fill={`url(#${id}-armor)`}
      />
      <path
        d="M 86 118 L 134 118 L 138 190 L 110 205 L 82 190 Z"
        fill="none"
        stroke={trim}
        strokeOpacity="0.85"
        strokeWidth="1.5"
      />

      {/* Baldric strap diagonal */}
      <path d="M 82 120 L 134 185" stroke="#4a321e" strokeWidth="4" strokeLinecap="round" />
      <path d="M 82 120 L 134 185" stroke={trim} strokeOpacity="0.5" strokeWidth="1" />
      {/* Buckle */}
      <rect x="100" y="150" width="12" height="12" fill={trim} rx="2" />
      <rect x="104" y="153" width="4" height="6" fill="#2b1a0f" />

      {/* Abdominal plate ridges */}
      <path d="M 92 165 L 128 165" stroke={cowlDark} strokeOpacity="0.7" strokeWidth="1.2" />
      <path d="M 94 180 L 126 180" stroke={cowlDark} strokeOpacity="0.7" strokeWidth="1.2" />

      {/* Neck */}
      <rect x="100" y="88" width="20" height="12" fill={skinShade} />
      {/* Gorget */}
      <rect x="98" y="95" width="24" height="7" fill={cowl} rx="2" />

      {/* Head */}
      <ellipse cx="110" cy="76" rx="22" ry="23" fill={skin} />
      {/* Jaw shadow */}
      <path d="M 92 80 Q 110 100 128 80" fill={skinShade} opacity="0.4" />

      {/* Hair strands */}
      <path d="M 92 60 Q 94 70 100 76 L 95 85 L 86 72 Z" fill={hair} />
      <path d="M 128 60 Q 126 70 120 76 L 125 85 L 134 72 Z" fill={hair} />
      <path d="M 100 55 Q 110 48 120 55 L 118 65 Q 110 60 102 65 Z" fill={hairHi} opacity="0.9" />

      {/* Cowl / hood overhead */}
      <path
        d="M 72 72 Q 110 32 148 72 L 142 92 Q 130 80 110 80 Q 90 80 78 92 Z"
        fill={cowl}
      />
      <path
        d="M 72 72 Q 110 32 148 72"
        stroke={trim}
        strokeOpacity="0.6"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Circlet / hero crest */}
      <rect x="98" y="60" width="24" height="4" fill={trim} rx="1" />
      <circle cx="110" cy="62" r="3" fill={eye} />

      {/* Eye glow — behind iris */}
      <ellipse cx="118" cy="78" rx="7" ry="4" fill={`url(#${id}-eyeglow)`} opacity="0.9" />
      {/* Sclera */}
      <ellipse cx="118" cy="78" rx="3.5" ry="2.3" fill="#f7f9fb" />
      {/* Iris */}
      <circle cx="119" cy="78" r="1.7" fill={eye} />
      {/* Pupil */}
      <circle cx="119.3" cy="78" r="0.9" fill="#060b12" />
      {/* Specular */}
      <circle cx="119.9" cy="77.4" r="0.5" fill="#fff" />

      {/* Eyebrow — determined */}
      <path d="M 112 72 L 125 70" stroke={hair} strokeWidth="2" strokeLinecap="round" />

      {/* Lips */}
      <path d="M 115 86 L 122 86" stroke={skinShade} strokeWidth="1.4" strokeLinecap="round" />

      {/* Bow arm & bow */}
      {showBow && (
        <>
          <line x1="72" y1="135" x2="38" y2="150" stroke={cowlDark} strokeWidth="7" strokeLinecap="round" />
          <line x1="72" y1="135" x2="38" y2="150" stroke="#472e1c" strokeWidth="4" strokeLinecap="round" />
          {/* Bow stave */}
          <path
            d="M 32 100 Q 20 150 32 200"
            fill="none"
            stroke={hex(hero.hairColor)}
            strokeOpacity="0.95"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M 32 100 Q 20 150 32 200"
            fill="none"
            stroke={trim}
            strokeOpacity="0.5"
            strokeWidth="1.5"
          />
          {/* String */}
          <line x1="32" y1="100" x2="32" y2="200" stroke="#f0ead6" strokeWidth="1" />
          {/* Nock tips */}
          <circle cx="32" cy="100" r="2.5" fill={trim} />
          <circle cx="32" cy="200" r="2.5" fill={trim} />
        </>
      )}

      {/* Draw arm (opposite side) */}
      <line x1="148" y1="135" x2="170" y2="145" stroke={cowlDark} strokeWidth="7" strokeLinecap="round" />

      {/* Base plinth — character stands on faint platform */}
      <ellipse cx="110" cy="268" rx="55" ry="7" fill="#000" opacity="0.5" />
      <ellipse cx="110" cy="268" rx="40" ry="4" fill={trim} opacity="0.08" />

      {/* Hero icon in top-left corner */}
      <text x="110" y="26" textAnchor="middle" fontSize="18" opacity="0.95">
        {hero.icon}
      </text>
    </svg>
  );
};
