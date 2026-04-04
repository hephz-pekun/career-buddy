import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { format, subDays, parseISO } from 'date-fns'
import { useAppStore, selectCheckinStreak } from '@/store'
import { Card, Button } from '@/components/ui'
import { Colors, Typography, Spacing, Radius, MOOD_CONFIG } from '@/constants'
import type { MoodType } from '@/types'

const MOOD_ORDER: MoodType[] = ['motivated', 'hopeful', 'okay', 'tired', 'stressed', 'overwhelmed']

export default function HistoryScreen() {
  const profile = useAppStore((s) => s.profile)
  const moodHistory = useAppStore((s) => s.moodHistory)
  const jobApplications = useAppStore((s) => s.jobApplications)
  const scholApplications = useAppStore((s) => s.scholApplications)
  const streak = useAppStore(selectCheckinStreak)

  // Build last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    const key = format(d, 'yyyy-MM-dd')
    const entry = moodHistory.find((m) => m.date === key)
    return {
      label: format(d, 'EEE'),
      date: key,
      mood: entry?.mood ?? null,
    }
  })

  // Stats
  const stats = [
    { label: 'applications',        value: jobApplications.length },
    { label: 'interviews',          value: jobApplications.filter((j) => j.status === 'interview').length },
    { label: 'offers',              value: jobApplications.filter((j) => j.status === 'offer').length },
    { label: 'scholarships tracked',value: scholApplications.length },
  ]

  // Streak dots (last 7 days)
  const streakDots = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    const key = format(d, 'yyyy-MM-dd')
    return { key, hit: !!moodHistory.find((m) => m.date === key) }
  })

  // Mood distribution for last 30 days
  const last30 = moodHistory.slice(0, 30)
  const moodCounts = MOOD_ORDER.reduce(
    (acc, m) => {
      acc[m] = last30.filter((e) => e.mood === m).length
      return acc
    },
    {} as Record<MoodType, number>,
  )
  const maxCount = Math.max(...Object.values(moodCounts), 1)

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>your week</Text>
        <Text style={styles.subheading}>how you've been showing up</Text>

        {/* 7-day mood bar chart */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>mood this week</Text>
          {last7.map((day) => {
            const cfg = day.mood ? MOOD_CONFIG[day.mood] : null
            return (
              <View key={day.date} style={styles.moodBarRow}>
                <Text style={styles.moodBarLabel}>{day.label}</Text>
                <View style={styles.moodBarTrack}>
                  {cfg ? (
                    <View
                      style={[
                        styles.moodBarFill,
                        { backgroundColor: cfg.color + 'CC' },
                      ]}
                    >
                      <Text style={styles.moodBarText}>
                        {cfg.emoji} {cfg.label}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.moodBarEmpty}>no check-in</Text>
                  )}
                </View>
              </View>
            )
          })}
        </Card>

        {/* Stats grid */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>application progress</Text>
          <View style={styles.statsGrid}>
            {stats.map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Check-in streak */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>check-in streak</Text>
          <View style={styles.streakRow}>
            <Text style={styles.streakNumber}>{streak}</Text>
            <View style={styles.streakInfo}>
              <Text style={styles.streakTitle}>
                {streak === 0 ? 'check in today to start!' : `day${streak !== 1 ? 's' : ''} in a row`}
              </Text>
              <Text style={styles.streakSub}>
                {streak === 0
                  ? 'no pressure — just show up when you can.'
                  : streak < 3
                  ? 'great start!'
                  : streak < 7
                  ? 'building a real habit.'
                  : 'you\'re on a roll. 💛'}
              </Text>
            </View>
          </View>
          <View style={styles.streakDots}>
            {streakDots.map((d) => (
              <View
                key={d.key}
                style={[styles.streakDot, d.hit && styles.streakDotFilled]}
              />
            ))}
          </View>
        </Card>

        {/* 30-day mood distribution */}
        {last30.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>mood breakdown (last 30 days)</Text>
            {MOOD_ORDER.filter((m) => moodCounts[m] > 0).map((m) => {
              const cfg = MOOD_CONFIG[m]
              const pct = (moodCounts[m] / maxCount) * 100
              return (
                <View key={m} style={styles.distRow}>
                  <Text style={styles.distEmoji}>{cfg.emoji}</Text>
                  <Text style={styles.distLabel}>{cfg.label}</Text>
                  <View style={styles.distBarTrack}>
                    <View
                      style={[
                        styles.distBarFill,
                        { width: `${pct}%`, backgroundColor: cfg.color + 'AA' },
                      ]}
                    />
                  </View>
                  <Text style={styles.distCount}>{moodCounts[m]}x</Text>
                </View>
              )
            })}
          </Card>
        )}

        {/* Assumptions note — FutureBuilders rubric compliance */}
        <View style={styles.assumptionBox}>
          <Text style={styles.assumptionTitle}>app assumptions</Text>
          <Text style={styles.assumptionText}>
            this app assumes you have a device with internet access, a resume (even a basic one),
            and an email address. AI is used only for matching and suggestions — all final
            decisions are yours. no-tech alternative: job matches and scholarship results can be
            screenshotted or printed for offline use.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.gray50 },
  scroll:     { padding: Spacing.lg, paddingBottom: Spacing['4xl'] },
  heading:    { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.gray900 },
  subheading: { fontSize: Typography.sm, color: Colors.gray500, marginBottom: Spacing.xl },

  card:      { marginBottom: Spacing.lg },
  cardTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.gray900, marginBottom: Spacing.lg },

  moodBarRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  moodBarLabel: { fontSize: Typography.xs, color: Colors.gray500, width: 32 },
  moodBarTrack: { flex: 1, height: 28, backgroundColor: Colors.gray100, borderRadius: Radius.sm, overflow: 'hidden', justifyContent: 'center' },
  moodBarFill:  { height: '100%', justifyContent: 'center', paddingLeft: Spacing.sm },
  moodBarText:  { fontSize: Typography.xs, color: Colors.gray800, fontWeight: Typography.medium },
  moodBarEmpty: { fontSize: Typography.xs, color: Colors.gray400, paddingLeft: Spacing.sm },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: Colors.gray50,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statValue: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.gray900 },
  statLabel: { fontSize: Typography.xs,   color: Colors.gray500, marginTop: 2, textAlign: 'center' },

  streakRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  streakNumber:{ fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.primary },
  streakInfo:  { flex: 1 },
  streakTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.gray900 },
  streakSub:   { fontSize: Typography.sm, color: Colors.gray500, marginTop: 2 },
  streakDots:  { flexDirection: 'row', gap: Spacing.sm },
  streakDot:   { flex: 1, height: 8, borderRadius: Radius.full, backgroundColor: Colors.gray100 },
  streakDotFilled: { backgroundColor: Colors.primary },

  distRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  distEmoji:     { fontSize: 16, width: 22 },
  distLabel:     { fontSize: Typography.xs, color: Colors.gray600, width: 80 },
  distBarTrack:  { flex: 1, height: 14, backgroundColor: Colors.gray100, borderRadius: Radius.full, overflow: 'hidden' },
  distBarFill:   { height: '100%', borderRadius: Radius.full },
  distCount:     { fontSize: Typography.xs, color: Colors.gray500, width: 24, textAlign: 'right' },

  assumptionBox: {
    backgroundColor: Colors.gray100,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  assumptionTitle: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.gray700, marginBottom: 4 },
  assumptionText:  { fontSize: Typography.xs, color: Colors.gray500, lineHeight: 18 },
})
