// themes/index.ts
// INCO CODE — Theme System

export const Colors = {
  // === BACKGROUNDS ===
  bg: {
    primary:   '#0D1117',   // fond principal (noir GitHub)
    secondary: '#161B22',   // sidebar / panels
    tertiary:  '#21262D',   // cards, inputs
    elevated:  '#30363D',   // modals, dropdowns
    overlay:   'rgba(0,0,0,0.7)',
  },

  // === ACCENTS ===
  accent: {
    primary:   '#58A6FF',   // bleu électrique — action principale
    secondary: '#3FB950',   // vert validation
    warning:   '#D29922',   // ambre warnings
    danger:    '#F85149',   // rouge erreurs
    purple:    '#BC8CFF',   // violet accents déco
    cyan:      '#39D0D8',   // cyan live preview
    orange:    '#FF7B54',   // orange highlights
  },

  // === SYNTAX HIGHLIGHTING ===
  syntax: {
    keyword:    '#FF7B54',   // orange — const, let, function
    string:     '#3FB950',   // vert — "strings"
    number:     '#BC8CFF',   // violet — numbers
    comment:    '#6E7681',   // gris — // commentaires
    tag:        '#F85149',   // rouge — <tags>
    attribute:  '#58A6FF',   // bleu — attributes
    property:   '#79C0FF',   // bleu clair — .property
    variable:   '#FFA657',   // jaune-orange — variables
    operator:   '#FF7B54',   // opérateurs
    punctuation:'#8B949E',   // ponctuation
    function:   '#D2A8FF',   // violet clair — functions
    type:       '#79C0FF',   // types TypeScript
    constant:   '#FF9E64',   // constantes
  },

  // === TEXT ===
  text: {
    primary:   '#E6EDF3',   // texte principal
    secondary: '#8B949E',   // texte secondaire
    muted:     '#6E7681',   // texte désactivé
    inverse:   '#0D1117',   // texte sur fond clair
    link:      '#58A6FF',   // liens
  },

  // === UI ELEMENTS ===
  ui: {
    border:      '#30363D',
    borderFocus: '#58A6FF',
    divider:     '#21262D',
    selection:   'rgba(88, 166, 255, 0.2)',
    lineHighlight:'rgba(88, 166, 255, 0.08)',
    cursorLine:  'rgba(255,255,255,0.04)',
    gutter:      '#161B22',
    tabActive:   '#0D1117',
    tabInactive: '#161B22',
    scrollbar:   '#30363D',
    badge:       '#238636',
  },

  // === STATUS ===
  status: {
    success: '#3FB950',
    error:   '#F85149',
    warning: '#D29922',
    info:    '#58A6FF',
    running: '#39D0D8',
  },

  // === GRADIENTS (for LinearGradient) ===
  gradients: {
    primary:  ['#58A6FF', '#BC8CFF'],
    success:  ['#3FB950', '#39D0D8'],
    danger:   ['#F85149', '#FF7B54'],
    dark:     ['#0D1117', '#161B22'],
    card:     ['#161B22', '#21262D'],
    splash:   ['#0D1117', '#161B22', '#0D1117'],
  },
} as const;

export const Typography = {
  fonts: {
    mono:    'Courier New',  // éditeur code
    sans:    'System',       // UI générale
    display: 'System',       // titres
  },
  sizes: {
    xs:   10,
    sm:   12,
    base: 14,
    md:   16,
    lg:   18,
    xl:   22,
    xxl:  28,
    hero: 36,
  },
  weights: {
    light:    '300' as const,
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
    black:    '900' as const,
  },
  lineHeights: {
    tight:  1.2,
    normal: 1.5,
    relaxed:1.8,
    code:   1.6,
  },
} as const;

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  xxl:  32,
  xxxl: 48,
} as const;

export const BorderRadius = {
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  full: 999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#58A6FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#58A6FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  glow: {
    shadowColor: '#58A6FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
} as const;

export const Animations = {
  duration: {
    fast:   150,
    normal: 250,
    slow:   400,
    splash: 800,
  },
  easing: {
    ease:        'ease',
    easeIn:      'ease-in',
    easeOut:     'ease-out',
    easeInOut:   'ease-in-out',
  },
} as const;

const theme = { Colors, Typography, Spacing, BorderRadius, Shadows, Animations };
export default theme;
