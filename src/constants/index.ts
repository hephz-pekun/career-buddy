import { Dimensions } from 'react-native'

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// ─── Colors ───────────────────────────────────────────────────────────────────

export const Colors = {
  // Brand
  primary: '#6366F1',       // indigo — calm, modern
  primaryLight: '#EEF2FF',
  primaryDark: '#4338CA',

  // Semantic
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Neutrals
  gray900: '#0F172A',
  gray800: '#1E293B',
  gray700: '#334155',
  gray600: '#475569',
  gray500: '#64748B',
  gray400: '#94A3B8',
  gray300: '#CBD5E1',
  gray200: '#E2E8F0',
  gray100: '#F1F5F9',
  gray50:  '#F8FAFC',
  white:   '#FFFFFF',
  infoLight:    '#DBEAFE',
  successLight: '#DCFCE7',
  warningLight: '#FEF3C7',
  dangerLight:  '#FEE2E2',
  primaryLight: '#EEF2FF',


  // Mood colors
  mood: {
    motivated: '#22C55E',
    okay:       '#3B82F6',
    overwhelmed:'#F97316',
    tired:      '#94A3B8',
    stressed:   '#EF4444',
    hopeful:    '#86EFAC',
  },
} as const

// ─── Typography ───────────────────────────────────────────────────────────────

export const Typography = {
  // Font sizes
  xs:   11,
  sm:   13,
  base: 15,
  md:   16,
  lg:   18,
  xl:   22,
  '2xl':28,
  '3xl':34,

  // Line heights
  tight:   1.2,
  normal:  1.5,
  relaxed: 1.7,

  // Weights (as strings for RN)
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
} as const

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  '2xl':24,
  '3xl':32,
  '4xl':40,
  '5xl':48,
} as const

// ─── Border radius ────────────────────────────────────────────────────────────

export const Radius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  full: 9999,
} as const

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
} as const

// ─── Mood config ──────────────────────────────────────────────────────────────

export const MOOD_CONFIG = {
  motivated:  { emoji: '✅', label: 'motivated',  color: Colors.mood.motivated  },
  okay:       { emoji: '🙂', label: 'okay',        color: Colors.mood.okay       },
  overwhelmed:{ emoji: '😕', label: 'overwhelmed', color: Colors.mood.overwhelmed},
  tired:      { emoji: '😴', label: 'tired',       color: Colors.mood.tired      },
  stressed:   { emoji: '😣', label: 'stressed',    color: Colors.mood.stressed   },
  hopeful:    { emoji: '🌱', label: 'hopeful',     color: Colors.mood.hopeful    },
} as const

// ─── Career fields ────────────────────────────────────────────────────────────

export const CAREER_FIELDS = [
  'software engineering',
  'product management',
  'data science',
  'marketing',
  'finance',
  'design / UX',
  'consulting',
  'nonprofit / social impact',
  'research',
  'healthcare',
  'education',
  'law / pre-law',
] as const

export const JOB_TYPES = [
  'internship',
  'full-time',
  'part-time',
  'remote',
  'hybrid',
  'on-site',
] as const

export const SCHOLARSHIP_PREFERENCES = [
  'yes, definitely',
  'maybe, show me options',
  'just jobs for now',
] as const

