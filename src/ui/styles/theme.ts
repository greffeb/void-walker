// ---------------------------------------------------------------------------
// src/ui/styles/theme.ts — Design tokens for Cassette Futurism Ambre
// ---------------------------------------------------------------------------
// All visual tokens in one place. Components import from here.
// CSS custom properties are synced in globals.css.
// ---------------------------------------------------------------------------

export const THEME = {
  colors: {
    // Fond / Structure
    bgDeep: '#050505',
    bgPanel: '#0A0A0F',
    bgSurface: '#111116',
    bgInput: '#0D0D12',

    // Ambre (couleur principale — Nostromo)
    amberGlow: '#FFB000',
    amberMid: '#CC8800',
    amberDim: '#805500',
    amberBg: '#1A1200',

    // Statut
    success: '#00FF41',
    successDim: '#00802A',
    danger: '#FF2020',
    dangerDim: '#801010',
    warning: '#FF6600',
    critGold: '#FFD700',

    // Texte
    textPrimary: '#FFB000',
    textSecondary: '#998052',
    textNarrative: '#E0A030',
    textSystem: '#666666',
  },

  fonts: {
    title: "'Orbitron', sans-serif",
    mono: "'IBM Plex Mono', monospace",
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },

  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    typewriterSpeed: 15,
    dicePhase1Duration: 1000,
    dicePhase2Duration: 2000,
    dicePhase3Duration: 500,
  },

  borderRadius: '2px',
} as const;

/** Type helper */
export type Theme = typeof THEME;
