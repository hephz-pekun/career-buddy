import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { format, subDays } from 'date-fns'
import { useAppStore, selectCheckinStreak } from '../../src/store'
import { Colors, Typography, Spacing, Radius, Shadows } from '../../src/constants'
import { BrandHeader } from '../../src/components/brand'
import type { MoodType } from '../../src/types'

const MOOD_CFG: Record<MoodType, { emoji: string; label: string; color: string; bg: string; border: string }> = {
  motivated:  { emoji: '✅', label: 'Motivated',   color: '#059669', bg: '#D1FAE5', border: '#A7F3D0' },
  okay:       { emoji: '🙂', label: 'Okay',         color: '#1D4ED8', bg: '#DBEAFE', border: '#BFDBFE' },
  overwhelmed:{ emoji: '😕', label: 'Overwhelmed',  color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
  tired:      { emoji: '😴', label: 'Tired',        color: '#6B6589', bg: '#F3F2FC', border: '#E2E0F5' },
  stressed:   { emoji: '😣', label: 'Stressed',     color: '#DC2626', bg: '#FEE2E2', border: '#FECACA' },
  hopeful:    { emoji: '🌱', label: 'Hopeful',      color: '#059669', bg: '#D1FAE5', border: '#A7F3D0' },
}

const MOOD_ORDER: MoodType[] = ['motivated', 'hopeful', 'okay', 'tired', 'stressed', 'overwhelmed']

export default function HistoryScreen() {
  const moodHistory     = useAppStore(s => s.moodHistory)
  const jobApplications = useAppStore(s => s.jobApplications)
  const scholApplications = useAppStore(s => s.scholApplications)
  const streak          = useAppStore(selectCheckinStreak)

  const today = format(new Date(), 'yyyy-MM-dd')

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    const key = format(d, 'yyyy-MM-dd')
    const entry = moodHistory.find(m => m.date === key)
    return { label: format(d, 'EEE'), key, mood: (entry?.mood ?? null) as MoodType | null, isToday: key === today }
  })

  const last30 = moodHistory.slice(0, 30)
  const moodCounts = MOOD_ORDER.reduce((acc, m) => {
    acc[m] = last30.filter(e => e.mood === m).length; return acc
  }, {} as Record<MoodType, number>)
  const maxCount = Math.max(...Object.values(moodCounts), 1)
  const hasData  = moodHistory.length > 0

  const streakDots = Array.from({ length: 7 }, (_, i) => ({
    hit: !!moodHistory.find(m => m.date === format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'))
  }))

  const stats = [
    { label: 'Applications', value: jobApplications.length, color: Colors.primary },
    { label: 'Interviews',   value: jobApplications.filter(j => j.status === 'interview').length, color: Colors.warning },
    { label: 'Offers',       value: jobApplications.filter(j => j.status === 'offer').length, color: Colors.success },
    { label: 'Scholarships', value: scholApplications.length, color: Colors.info },
  ]

  return (
    <SafeAreaView style={styles.safe}>
      <BrandHeader title="Your Journey" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Streak hero */}
        <View style={styles.streakCard}>
          <View style={styles.streakLeft}>
            <Text style={styles.streakNum}>{streak}</Text>
            <Text style={styles.streakUnit}>day{streak !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.streakRight}>
            <Text style={styles.streakTitle}>
              {streak === 0 ? 'Start your streak today' : streak < 3 ? 'Great start!' : streak < 7 ? 'Building momentum' : 'On a roll!'}
            </Text>
            <Text style={styles.streakSub}>
              {streak === 0 ? 'Check in to begin.' : `${streak} day${streak !== 1 ? 's' : ''} in a row — keep going!`}
            </Text>
            <View style={styles.dotRow}>
              {streakDots.map((d, i) => <View key={i} style={[styles.dot, d.hit && styles.dotFilled]} />)}
            </View>
          </View>
        </View>

        {/* 7-day mood */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This week</Text>
          <View style={styles.weekRow}>
            {last7.map(d => {
              const cfg = d.mood ? MOOD_CFG[d.mood] : null
              return (
                <View key={d.key} style={styles.dayCol}>
                  <View style={[styles.dayBox, cfg ? { backgroundColor: cfg.bg, borderColor: cfg.border } : styles.dayBoxEmpty]}>
                    {cfg ? <Text style={styles.dayEmoji}>{cfg.emoji}</Text> : <Text style={styles.dayDash}>·</Text>}
                  </View>
                  <Text style={[styles.dayLabel, d.isToday && styles.dayLabelToday]}>{d.label}</Text>
                </View>
              )
            })}
          </View>
          {!hasData && <Text style={styles.emptyNote}>Complete your first check-in to start tracking!</Text>}
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application progress</Text>
          <View style={styles.statsGrid}>
            {stats.map(s => (
              <View key={s.label} style={[styles.statCard, { borderTopColor: s.color, borderTopWidth: 3 }]}>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Mood breakdown */}
        {hasData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mood breakdown</Text>
            <Text style={styles.sectionSub}>Last {Math.min(moodHistory.length, 30)} check-ins</Text>
            {MOOD_ORDER.filter(m => moodCounts[m] > 0).map(m => {
              const cfg = MOOD_CFG[m]
              return (
                <View key={m} style={styles.moodRow}>
                  <Text style={styles.moodEmoji}>{cfg.emoji}</Text>
                  <Text style={styles.moodLabel}>{cfg.label}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${(moodCounts[m] / maxCount) * 100}%` as any, backgroundColor: cfg.color }]} />
                  </View>
                  <Text style={[styles.moodCount, { color: cfg.color }]}>{moodCounts[m]}x</Text>
                </View>
              )
            })}
          </View>
        )}

        {hasData && (
          <View style={styles.totalCard}>
            <Text style={styles.totalNum}>{moodHistory.length}</Text>
            <Text style={styles.totalLabel}>total check-ins{'\n'}Every one counts. 💛</Text>
          </View>
        )}

        <View style={styles.assumptionBox}>
          <Text style={styles.assumptionTitle}>App assumptions</Text>
          <Text style={styles.assumptionText}>
            This app assumes you have a device with internet and an email. AI is used only for suggestions — all final decisions are yours.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },

  streakCard: { backgroundColor: Colors.primary, borderRadius: Radius.xl, padding: Spacing.xl, flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginBottom: Spacing.xl, ...Shadows.lg },
  streakLeft:  { alignItems: 'center', minWidth: 56 },
  streakNum:   { fontSize: 48, fontWeight: Typography.bold, color: '#FFFFFF', lineHeight: 52 },
  streakUnit:  { fontSize: Typography.xs, color: 'rgba(255,255,255,0.7)' },
  streakRight: { flex: 1 },
  streakTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#FFFFFF', marginBottom: 2 },
  streakSub:   { fontSize: Typography.xs, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.sm },
  dotRow:   { flexDirection: 'row', gap: 5 },
  dot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotFilled:{ backgroundColor: '#FFFFFF' },

  section:     { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg, ...Shadows.sm },
  sectionTitle:{ fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  sectionSub:  { fontSize: Typography.xs, color: Colors.textMuted, marginBottom: Spacing.md, marginTop: -Spacing.sm },

  weekRow: { flexDirection: 'row', gap: 6, justifyContent: 'space-between' },
  dayCol:  { flex: 1, alignItems: 'center', gap: 6 },
  dayBox:  { width: '100%', aspectRatio: 1, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface2 },
  dayBoxEmpty: { backgroundColor: Colors.surface2, borderColor: Colors.border },
  dayEmoji:    { fontSize: 18 },
  dayDash:     { fontSize: 18, color: Colors.textMuted },
  dayLabel:    { fontSize: 10, color: Colors.textMuted, fontWeight: Typography.medium },
  dayLabelToday: { color: Colors.primary, fontWeight: Typography.bold },
  emptyNote:   { fontSize: Typography.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.md, fontStyle: 'italic' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard:  { flex: 1, minWidth: '44%', backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: Typography.bold },
  statLabel: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },

  moodRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  moodEmoji: { fontSize: 16, width: 22 },
  moodLabel: { fontSize: Typography.xs, color: Colors.textSecondary, width: 84 },
  barTrack:  { flex: 1, height: 12, backgroundColor: Colors.surface2, borderRadius: Radius.full, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  barFill:   { height: '100%', borderRadius: Radius.full, opacity: 0.85 },
  moodCount: { fontSize: Typography.xs, fontWeight: Typography.bold, width: 28, textAlign: 'right' },

  totalCard: { backgroundColor: Colors.primaryBg, borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.primaryBorder },
  totalNum:  { fontSize: 56, fontWeight: Typography.bold, color: Colors.primary },
  totalLabel:{ fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: 4, lineHeight: 20 },

  assumptionBox: { backgroundColor: Colors.surface2, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  assumptionTitle: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textSecondary, marginBottom: 4 },
  assumptionText:  { fontSize: Typography.xs, color: Colors.textMuted, lineHeight: 18 },
})
