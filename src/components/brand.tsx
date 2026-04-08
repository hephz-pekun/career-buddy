import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors, Typography, Spacing, Radius, Shadows } from '../constants'

// ─── Career Buddy Logo Mark ───────────────────────────────────────────────────

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <View style={[
      styles.logoMark,
      {
        width: size,
        height: size,
        borderRadius: size * 0.28,
      }
    ]}>
      <Text style={[styles.logoText, { fontSize: size * 0.38 }]}>CB</Text>
    </View>
  )
}

// ─── Brand Header — shown at top of every screen ─────────────────────────────

export function BrandHeader({
  title,
  showLogo = true,
  showProfile = true,
  rightContent,
}: {
  title?: string
  showLogo?: boolean
  showProfile?: boolean
  rightContent?: React.ReactNode
}) {
  const router = useRouter()

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {showLogo && <LogoMark size={32} />}
        <Text style={styles.headerTitle}>{title ?? 'Career Buddy'}</Text>
      </View>
      <View style={styles.headerRight}>
        {rightContent}
        {showProfile && (
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <Text style={styles.profileBtnText}>⚙</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// ─── Onboarding Header ────────────────────────────────────────────────────────

export function OnboardingHeader() {
  return (
    <View style={styles.onboardHeader}>
      <LogoMark size={40} />
      <View>
        <Text style={styles.onboardBrand}>Career Buddy</Text>
        <Text style={styles.onboardTagline}>Your AI career companion</Text>
      </View>
    </View>
  )
}

// ─── Step Dots ────────────────────────────────────────────────────────────────

export function StepDots({ current, total = 3 }: { current: number; total?: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < current && styles.dotDone,
            i === current && styles.dotActive,
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  logoMark: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: Typography.bold,
    letterSpacing: -0.5,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBtnText: { fontSize: 16, color: Colors.textSecondary },

  onboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  onboardBrand: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  onboardTagline: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  dots: { flexDirection: 'row', gap: 6, marginBottom: Spacing['2xl'] },
  dot:  { flex: 1, height: 4, borderRadius: Radius.full, backgroundColor: Colors.border },
  dotDone:   { backgroundColor: Colors.primaryBorder },
  dotActive: { backgroundColor: Colors.primary },
})
