import { Dimensions } from 'react-native'

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// ─── Light Mode Color System ──────────────────────────────────────────────────
// Warm lavender-white base — soft, readable, modern

export const Colors = {
  // Brand
  primary:       '#5B4FD9',   // rich indigo
  primaryLight:  '#7B72E8',   // lighter indigo
  primaryDark:   '#3D33B8',   // deep indigo
  primaryBg:     '#EEF0FF',   // very light indigo tint
  primaryBorder: '#C7C3F7',   // indigo border

  // Semantic
  success:       '#059669',
  successBg:     '#D1FAE5',
  successBorder: '#A7F3D0',
  warning:       '#B45309',
  warningBg:     '#FEF3C7',
  warningBorder: '#FDE68A',
  danger:        '#DC2626',
  dangerBg:      '#FEE2E2',
  dangerBorder:  '#FECACA',
  info:          '#1D4ED8',
  infoBg:        '#DBEAFE',
  infoBorder:    '#BFDBFE',

  // Backgrounds
  bg:       '#F8F7FF',   // page — soft lavender white
  surface:  '#FFFFFF',   // cards
  surface2: '#F3F2FC',   // subtle surface
  surface3: '#EEEDFA',   // inputs / hover
  border:   '#E2E0F5',   // default border
  borderDark: '#C7C3F7', // stronger border

  // Text
  textPrimary:   '#1A1630',   // near-black with blue-purple tint
  textSecondary: '#6B6589',   // medium gray-purple
  textMuted:     '#9E9BBD',   // muted
  textInverse:   '#FFFFFF',

  // Mood colors — light mode friendly
  moodMotivated:   '#059669',
  moodMotivatedBg: '#D1FAE5',
  moodOkay:        '#1D4ED8',
  moodOkayBg:      '#DBEAFE',
  moodOverwhelmed: '#D97706',
  moodOverwhelmedBg: '#FEF3C7',
  moodTired:       '#6B6589',
  moodTiredBg:     '#F3F2FC',
  moodStressed:    '#DC2626',
  moodStressedBg:  '#FEE2E2',
  moodHopeful:     '#059669',
  moodHopefulBg:   '#D1FAE5',

  // Aliases for compatibility
  white: '#FFFFFF',
  gray50:  '#F8F7FF',
  gray100: '#F3F2FC',
  gray200: '#E2E0F5',
  gray300: '#C7C3F7',
  gray400: '#9E9BBD',
  gray500: '#6B6589',
  gray600: '#4A4768',
  gray700: '#332F52',
  gray800: '#231E3F',
  gray900: '#1A1630',

  successLight: '#D1FAE5',
  warningLight: '#FEF3C7',
  dangerLight:  '#FEE2E2',
  infoLight:    '#DBEAFE',
  primaryLight: '#EEF0FF',
} as const

// ─── Typography — DM Sans ─────────────────────────────────────────────────────

export const Typography = {
  xs:    11,
  sm:    13,
  base:  15,
  md:    16,
  lg:    18,
  xl:    24,
  '2xl': 30,
  '3xl': 38,

  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,

  // Font families
  sans:    'DMSans-Regular',
  sansMd:  'DMSans-Medium',
  sansSb:  'DMSans-SemiBold',
  sansBold:'DMSans-Bold',
} as const

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const Spacing = {
  xs:    4,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    20,
  '2xl': 28,
  '3xl': 36,
  '4xl': 48,
  '5xl': 64,
} as const

// ─── Radius ───────────────────────────────────────────────────────────────────

export const Radius = {
  sm:   6,
  md:   10,
  lg:   16,
  xl:   24,
  full: 9999,
} as const

// ─── Shadows ─────────────────────────────────────────────────────────────────

export const Shadows = {
  sm: {
    shadowColor: '#5B4FD9',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#5B4FD9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#5B4FD9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const

// ─── Mood Config ──────────────────────────────────────────────────────────────

export const MOOD_CONFIG = {
  motivated:  { emoji: '✅', label: 'Motivated',   color: '#059669', bg: '#D1FAE5', border: '#A7F3D0' },
  okay:       { emoji: '🙂', label: 'Okay',         color: '#1D4ED8', bg: '#DBEAFE', border: '#BFDBFE' },
  overwhelmed:{ emoji: '😕', label: 'Overwhelmed',  color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
  tired:      { emoji: '😴', label: 'Tired',        color: '#6B6589', bg: '#F3F2FC', border: '#E2E0F5' },
  stressed:   { emoji: '😣', label: 'Stressed',     color: '#DC2626', bg: '#FEE2E2', border: '#FECACA' },
  hopeful:    { emoji: '🌱', label: 'Hopeful',      color: '#059669', bg: '#D1FAE5', border: '#A7F3D0' },
} as const

// ─── Career Fields ────────────────────────────────────────────────────────────

export const CAREER_FIELDS = [
  'Software Engineering',
  'Product Management',
  'Data Science',
  'Marketing',
  'Finance',
  'Design / UX',
  'Consulting',
  'Nonprofit / Social Impact',
  'Research',
  'Healthcare',
  'Education',
  'Law / Pre-Law',
] as const

export const JOB_TYPES = [
  'Internship',
  'Full-Time',
  'Part-Time',
  'Remote',
  'Hybrid',
  'On-Site',
] as const

// ─── Skill Suggestions ────────────────────────────────────────────────────────

export const SKILL_SUGGESTIONS = [
  'Python', 'JavaScript', 'React', 'SQL', 'Excel', 'Figma', 'HTML/CSS',
  'Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Critical Thinking',
  'Time Management', 'Project Management', 'Research', 'Writing', 'Public Speaking',
  'Data Analysis', 'Marketing', 'Social Media', 'Customer Service', 'Sales',
  'Finance', 'Budgeting', 'Teaching', 'Healthcare', 'Legal Research',
  'Graphic Design', 'Video Editing', 'Photography', 'Content Creation', 'Canva',
] as const

// ─── Brand Logo (SVG string for use in WebView or as component) ───────────────
// Used as the Career Buddy logo mark — a stylized "CB" monogram

export const BRAND = {
  name: 'Career Buddy',
  tagline: 'Your AI career companion',
  primaryColor: '#5B4FD9',
  logoInitials: 'CB',
} as const
