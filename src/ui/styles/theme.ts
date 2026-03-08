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
    bgPanel: '#111111',
    bgPanelLight: '#1a1a1a',
    bgSurface: '#1a1a1a',
    bgInput: '#0D0D12',

    // Ambre (couleur principale — Nostromo)
    amberGlow: '#FFB000',
    amberMid: '#CC8800',
    amberDim: '#8A6100',
    amberBg: '#1A1200',

    // CRT accent colors (mockup palette)
    crtCyan: '#60A3B5',
    crtGreen: '#52C155',
    crtBeige: '#D4B483',
    crtOrange: '#E65A22',

    // Statut
    success: '#52C155',
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
    title: "'VT323', monospace",
    mono: "'VT323', monospace",
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
    typewriterSpeed: 20,
    dicePhase1Duration: 1000,
    dicePhase2Duration: 2000,
    dicePhase3Duration: 500,
  },

  borderRadius: '0px',
} as const;

/** Type helper */
export type Theme = typeof THEME;
