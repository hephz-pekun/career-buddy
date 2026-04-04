import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native'
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants'

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading

  const containerStyle: ViewStyle[] = [
    styles.btnBase,
    size === 'sm' && styles.btnSm,
    size === 'lg' && styles.btnLg,
    variant === 'primary' && styles.btnPrimary,
    variant === 'secondary' && styles.btnSecondary,
    variant === 'ghost' && styles.btnGhost,
    isDisabled && styles.btnDisabled,
    style ?? {},
  ]

  const textStyle: TextStyle[] = [
    styles.btnText,
    size === 'sm' && styles.btnTextSm,
    variant === 'primary' && styles.btnTextPrimary,
    variant === 'secondary' && styles.btnTextSecondary,
    variant === 'ghost' && styles.btnTextGhost,
  ]

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={containerStyle}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.white : Colors.primary}
        />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </TouchableOpacity>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  padded?: boolean
}

export function Card({ children, style, padded = true }: CardProps) {
  return (
    <View style={[styles.card, padded && styles.cardPadded, style]}>
      {children}
    </View>
  )
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

interface ChipProps {
  label: string
  selected?: boolean
  onPress?: () => void
  style?: ViewStyle
}

export function Chip({ label, selected, onPress, style }: ChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.chip, selected && styles.chipSelected, style]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'live'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
}

const BADGE_COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  info:    { bg: Colors.infoLight,    text: Colors.info    },
  success: { bg: Colors.successLight, text: Colors.success },
  warning: { bg: Colors.warningLight, text: Colors.warning },
  danger:  { bg: Colors.dangerLight,  text: Colors.danger  },
  neutral: { bg: Colors.gray100,      text: Colors.gray600 },
  live:    { bg: Colors.successLight, text: Colors.success },
}

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const colors = BADGE_COLORS[variant]
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>{label}</Text>
    </View>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number // 0-100
  color?: string
  height?: number
}

export function ProgressBar({
  value,
  color = Colors.primary,
  height = 6,
}: ProgressBarProps) {
  return (
    <View style={[styles.progressTrack, { height }]}>
      <View
        style={[
          styles.progressFill,
          { width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color, height },
        ]}
      />
    </View>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: { label: string; onPress: () => void }
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {action && (
        <TouchableOpacity onPress={action.onPress}>
          <Text style={styles.sectionAction}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  emoji?: string
  message: string
  sub?: string
}

export function EmptyState({ emoji = '📭', message, sub }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {sub && <Text style={styles.emptySub}>{sub}</Text>}
    </View>
  )
}

// ─── Loading spinner ──────────────────────────────────────────────────────────

export function LoadingSpinner({ message }: { message?: string }) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      {message && <Text style={styles.loadingText}>{message}</Text>}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  btnBase: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  btnSm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  btnLg: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl },
  btnPrimary:   { backgroundColor: Colors.primary },
  btnSecondary: { backgroundColor: Colors.gray100, borderWidth: 1, borderColor: Colors.gray200 },
  btnGhost:     { backgroundColor: 'transparent' },
  btnDisabled:  { opacity: 0.4 },
  btnText:      { fontSize: Typography.base, fontWeight: Typography.semibold },
  btnTextSm:    { fontSize: Typography.sm },
  btnTextPrimary:   { color: Colors.white },
  btnTextSecondary: { color: Colors.gray700 },
  btnTextGhost:     { color: Colors.primary },

  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    ...Shadows.sm,
  },
  cardPadded: { padding: Spacing.lg },

  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  chipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  chipText:         { fontSize: Typography.sm, color: Colors.gray600 },
  chipTextSelected: { color: Colors.primary, fontWeight: Typography.semibold },

  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: { fontSize: Typography.xs, fontWeight: Typography.semibold },

  progressTrack: {
    flex: 1,
    backgroundColor: Colors.gray100,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: { borderRadius: Radius.full },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  sectionTitle:    { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.gray900 },
  sectionSubtitle: { fontSize: Typography.sm, color: Colors.gray500, marginTop: 2 },
  sectionAction:   { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.medium },

  emptyState:   { alignItems: 'center', paddingVertical: Spacing['4xl'] },
  emptyEmoji:   { fontSize: 36, marginBottom: Spacing.md },
  emptyMessage: { fontSize: Typography.base, color: Colors.gray700, fontWeight: Typography.medium, textAlign: 'center' },
  emptySub:     { fontSize: Typography.sm, color: Colors.gray500, marginTop: Spacing.sm, textAlign: 'center' },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['3xl'] },
  loadingText:      { fontSize: Typography.sm, color: Colors.gray500, marginTop: Spacing.md, textAlign: 'center' },
})
