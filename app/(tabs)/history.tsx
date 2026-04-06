import { useEffect, useRef } from 'react'
import { View, Text, ScrollView, StyleSheet, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { format, subDays } from 'date-fns'
import { useAppStore, selectCheckinStreak } from '../../src/store'
import { Colors, Typography, Spacing, Radius } from '../../src/constants'
import type { MoodType } from '../../src/types'

const MOOD_CONFIG: Record<MoodType, { emoji: string; label: string; color: string; light: string }> = {
  motivated:  { emoji: '✅', label: 'motivated',  color: '#22C55E', light: '#DCFCE7' },
  okay:       { emoji: '🙂', label: 'okay',        color: '#3B82F6', light: '#DBEAFE' },
  overwhelmed:{ emoji: '😕', label: 'overwhelmed', color: '#F97316', light: '#FFEDD5' },
  tired:      { emoji: '😴', label: 'tired',       color: '#94A3B8', light: '#F1F5F9' },
  stressed:   { emoji: '😣', label: 'stressed',    color: '#EF4444', light: '#FEE2E2' },
  hopeful:    { emoji: '🌱', label: 'hopeful',     color: '#86EFAC', light: '#F0FDF4' },
}

const MOOD_ORDER: MoodType[] = ['motivated', 'hopeful', 'okay', 'tired', 'stressed', 'overwhelmed']

function StatCard({ value, label, accent }: { value: number; label: string; accent: string }) {
  return (
    <View style={[styles.statCard, { borderTopColor: accent, borderTopWidth: 3 }]}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function MoodDayBar({ label, mood, isToday }: { label: string; mood: MoodType | null; isToday: boolean }) {
  const cfg = mood ? MOOD_CONFIG[mood] : null
  return (
    <View style={styles.dayBarWrapper}>
      <View style={[styles.dayBar, cfg ? { backgroundColor: cfg.light, borderColor: cfg.color } : styles.dayBarEmpty]}>
        {cfg ? (
          <View style={styles.dayBarContent}>
            <Text style={styles.dayBarEmoji}>{cfg.emoji}</Text>
          </View>
        ) : (
          <View style={styles.dayBarContent}>
            <Text style={styles.dayBarDash}>-</Text>
          </View>
        )}
      </View>
      <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{label}</Text>
    </View>
  )
}

export default function HistoryScreen() {
  const profile = useAppStore((s) => s.profile)
  const moodHistory = useAppStore((s) => s.moodHistory)
  const jobApplications = useAppStore((s) => s.jobApplications)
  const scholApplications = useAppStore((s) => s.scholApplications)
  const streak = useAppStore(selectCheckinStreak)

  const today = format(new Date(), 'yyyy-MM-dd')

  // Last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    const key = format(d, 'yyyy-MM-dd')
    const entry = moodHistory.find((m) => m.date === key)
    return {
      label: format(d, 'EEE'),
      date: key,
      mood: (entry?.mood ?? null) as MoodType | null,
      isToday: key === today,
    }
  })

  // Mood counts last 30 days
  const last30 = moodHistory.slice(0, 30)
  const moodCounts = MOOD_ORDER.reduce((acc, m) => {
    acc[m] = last30.filter((e) => e.mood === m).length
    return acc
  }, {} as Record<MoodType, number>)
  const maxCount = Math.max(...Object.values(moodCounts), 1)

  const totalCheckins = moodHistory.length
  const mostCommonMood = MOOD_ORDER.reduce((a, b) => moodCounts[a] >= moodCounts[b] ? a : b)
  const hasData = totalCheckins > 0

  // Streak dots
  const streakDots = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    const key = format(d, 'yyyy-MM-dd')
    return { key, hit: !!moodHistory.find((m) => m.date === key) }
  })

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.heading}>your journey</Text>
        <Text style={styles.sub}>every check-in is a win. here's yours.</Text>

        {/* Streak hero */}
        <View style={styles.streakHero}>
          <View style={styles.streakLeft}>
            <Text style={styles.streakNumber}>{streak}</Text>
            <Text style={styles.streakUnit}>day{streak !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.streakRight}>
            <Text style={styles.streakTitle}>
              {streak === 0 ? 'start your streak' : streak < 3 ? 'great start!' : streak < 7 ? 'building momentum' : 'on a roll!'}
            </Text>
            <Text style={styles.streakSub}>
              {streak === 0 ? 'check in today to begin.' : `${streak} day${streak !== 1 ? 's' : ''} in a row — keep going!`}
            </Text>
            <View style={styles.streakDots}>
              {streakDots.map((d, i) => (
                <View key={i} style={[styles.streakDot, d.hit && styles.streakDotFilled]} />
              ))}
            </View>
          </View>
        </View>

        {/* 7-day mood grid */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>this week</Text>
          <View style={styles.weekRow}>
            {last7.map((d) => (
              <MoodDayBar key={d.date} label={d.label} mood={d.mood} isToday={d.isToday} />
            ))}
          </View>
          {!hasData && (
            <Text style={styles.emptyNote}>no check-ins yet — complete your first one on the check-in tab!</Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>application progress</Text>
          <View style={styles.statsGrid}>
            <StatCard value={jobApplications.length} label="applications" accent={Colors.primary} />
            <StatCard value={jobApplications.filter((j) => j.status === 'interview').length} label="interviews" accent={Colors.warning} />
            <StatCard value={jobApplications.filter((j) => j.status === 'offer').length} label="offers" accent={Colors.success} />
            <StatCard value={scholApplications.length} label="scholarships" accent={Colors.info} />
          </View>
        </View>

        {/* Mood breakdown */}
        {hasData && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>mood breakdown</Text>
            <Text style={styles.sectionSub}>last {Math.min(totalCheckins, 30)} check-ins</Text>
            {MOOD_ORDER.filter((m) => moodCounts[m] > 0).map((m) => {
              const cfg = MOOD_CONFIG[m]
              const pct = (moodCounts[m] / maxCount) * 100
              return (
                <View key={m} style={styles.moodRow}>
                  <Text style={styles.moodRowEmoji}>{cfg.emoji}</Text>
                  <Text style={styles.moodRowLabel}>{cfg.label}</Text>
                  <View style={styles.moodBarTrack}>
                    <View style={[styles.moodBarFill, { width: `${pct}%`, backgroundColor: cfg.color + 'CC' }]} />
                  </View>
                  <Text style={styles.moodRowCount}>{moodCounts[m]}x</Text>
                </View>
              )
            })}
            {mostCommonMood && moodCounts[mostCommonMood] > 0 && (
              <View style={[styles.insightBox, { backgroundColor: MOOD_CONFIG[mostCommonMood].light }]}>
                <Text style={[styles.insightText, { color: MOOD_CONFIG[mostCommonMood].color }]}>
                  your most common mood: {MOOD_CONFIG[mostCommonMood].emoji} {MOOD_CONFIG[mostCommonMood].label}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Total check-ins */}
        {hasData && (
          <View style={styles.totalBox}>
            <Text style={styles.totalNumber}>{totalCheckins}</Text>
            <Text style={styles.totalLabel}>total check-ins — every one counts. 💛</Text>
          </View>
        )}

        {/* Assumptions */}
        <View style={styles.assumptionBox}>
          <Text style={styles.assumptionTitle}>app assumptions</Text>
          <Text style={styles.assumptionText}>
            this app assumes you have a device with internet, a resume, and an email. AI is used only for suggestions — all final decisions are yours.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.gray50 },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing['4xl'] },
  heading: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.gray900 },
  sub:     { fontSize: Typography.sm, color: Colors.gray500, marginBottom: Spacing.xl },

  streakHero: {
    backgroundColor: Colors.primary, borderRadius: Radius.xl, padding: Spacing.xl,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginBottom: Spacing.lg,
  },
  streakLeft:   { alignItems: 'center' },
  streakNumber: { fontSize: 52, fontWeight: Typography.bold, color: Colors.white, lineHeight: 56 },
  streakUnit:   { fontSize: Typography.xs, color: Colors.white + 'BB', fontWeight: Typography.medium },
  streakRight:  { flex: 1 },
  streakTitle:  { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.white, marginBottom: 2 },
  streakSub:    { fontSize: Typography.xs, color: Colors.white + 'CC', marginBottom: Spacing.sm },
  streakDots:   { flexDirection: 'row', gap: 5 },
  streakDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.white + '44' },
  streakDotFilled: { backgroundColor: Colors.white },

  sectionCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.gray900, marginBottom: 4 },
  sectionSub:   { fontSize: Typography.xs, color: Colors.gray500, marginBottom: Spacing.md },

  weekRow: { flexDirection: 'row', gap: 6, justifyContent: 'space-between', marginTop: Spacing.md },
  dayBarWrapper: { flex: 1, alignItems: 'center', gap: 4 },
  dayBar: { width: '100%', aspectRatio: 1, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.gray200, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gray50 },
  dayBarEmpty: { borderColor: Colors.gray100, backgroundColor: Colors.gray50 },
  dayBarContent: { alignItems: 'center', justifyContent: 'center' },
  dayBarEmoji:   { fontSize: 18 },
  dayBarDash:    { fontSize: 16, color: Colors.gray300 },
  dayLabel:      { fontSize: 10, color: Colors.gray400, fontWeight: Typography.medium },
  dayLabelToday: { color: Colors.primary, fontWeight: Typography.bold },

  emptyNote: { fontSize: Typography.xs, color: Colors.gray400, textAlign: 'center', marginTop: Spacing.md, fontStyle: 'italic' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  statCard: { flex: 1, minWidth: '44%', backgroundColor: Colors.gray50, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: Typography.bold },
  statLabel: { fontSize: Typography.xs, color: Colors.gray500, marginTop: 2, textAlign: 'center' },

  moodRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  moodRowEmoji: { fontSize: 16, width: 22 },
  moodRowLabel: { fontSize: Typography.xs, color: Colors.gray600, width: 80 },
  moodBarTrack: { flex: 1, height: 14, backgroundColor: Colors.gray100, borderRadius: Radius.full, overflow: 'hidden' },
  moodBarFill:  { height: '100%', borderRadius: Radius.full },
  moodRowCount: { fontSize: Typography.xs, color: Colors.gray500, width: 28, textAlign: 'right' },

  insightBox: { borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.md },
  insightText: { fontSize: Typography.sm, fontWeight: Typography.medium, textAlign: 'center' },

  totalBox: { backgroundColor: Colors.primaryLight, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.primary + '33' },
  totalNumber: { fontSize: 48, fontWeight: Typography.bold, color: Colors.primary },
  totalLabel:  { fontSize: Typography.sm, color: Colors.gray700, textAlign: 'center', marginTop: 4 },

  assumptionBox: { backgroundColor: Colors.gray100, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg },
  assumptionTitle: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.gray700, marginBottom: 4 },
  assumptionText:  { fontSize: Typography.xs, color: Colors.gray500, lineHeight: 18 },
})
