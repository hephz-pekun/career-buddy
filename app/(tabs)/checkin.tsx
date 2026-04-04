import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { format } from 'date-fns'
import { useAppStore, selectProgressToday } from '@/store'
import { Button, Card, ProgressBar, LoadingSpinner } from '@/components/ui'
import { Colors, Typography, Spacing, Radius, Shadows, MOOD_CONFIG } from '@/constants'
import { generateDayPlan } from '@/services/anthropic'
import type { MoodType, Activity } from '@/types'

export default function CheckinScreen() {
  const {
    profile,
    activities,
    todayPlan,
    checkedInToday,
    moodHistory,
    jobApplications,
    scholApplications,
    setTodayPlan,
    setActivities,
    toggleActivity,
    addMoodEntry,
    setCheckedInToday,
    resetCheckin,
  } = useAppStore()

  const progress = useAppStore(selectProgressToday)
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')
  const displayDate = format(new Date(), 'EEEE, MMMM d')

  const hasUpcomingInterview = jobApplications.some((j) => j.status === 'interview')

  const onBuildPlan = async () => {
    if (!selectedMood || !profile) return
    setLoading(true)

    try {
      const plan = await generateDayPlan(profile, selectedMood, note, {
        jobsApplied: jobApplications.length,
        scholsTracked: scholApplications.length,
        hasUpcomingInterview,
      })

      // Save mood entry
      addMoodEntry({
        id: `${today}-${Date.now()}`,
        userId: profile.id,
        mood: selectedMood,
        note,
        date: today,
        createdAt: new Date().toISOString(),
      })

      // Set plan + activities
      const actsWithIds: Activity[] = plan.activities.map((a, i) => ({
        ...a,
        id: `act-${i}-${Date.now()}`,
        done: false,
      }))

      setTodayPlan(plan)
      setActivities(actsWithIds)
      setCheckedInToday(true)
    } catch {
      Alert.alert('oops', 'couldn\'t build your plan right now. try again!')
    } finally {
      setLoading(false)
    }
  }

  const allDone = activities.length > 0 && activities.every((a) => a.done)

  // ── Check-in form ──────────────────────────────────────────────────────────
  if (!checkedInToday) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>hey, {profile?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.date}>{displayDate}</Text>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>how are you feeling today?</Text>
            <Text style={styles.cardSub}>no right answer — just be honest.</Text>

            <View style={styles.moodGrid}>
              {(Object.entries(MOOD_CONFIG) as [MoodType, typeof MOOD_CONFIG[MoodType]][]).map(
                ([key, cfg]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.moodCard,
                      selectedMood === key && styles.moodCardSelected,
                    ]}
                    onPress={() => setSelectedMood(key)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.moodEmoji}>{cfg.emoji}</Text>
                    <Text
                      style={[
                        styles.moodLabel,
                        selectedMood === key && styles.moodLabelSelected,
                      ]}
                    >
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>

            <Text style={styles.noteLabel}>anything on your mind? (optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="e.g. 'nervous about an interview' or 'haven't applied in a while'"
              placeholderTextColor={Colors.gray400}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />

            <Button
              label={loading ? 'building your plan...' : 'build my day plan'}
              onPress={onBuildPlan}
              disabled={!selectedMood}
              loading={loading}
            />
          </Card>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ── Day plan ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Greeting banner */}
        {todayPlan && (
          <Card style={styles.banner}>
            <Text style={styles.bannerTitle}>{todayPlan.greeting}</Text>
            <Text style={styles.bannerSub}>{todayPlan.subtitle}</Text>
          </Card>
        )}

        {/* Win state */}
        {allDone && (
          <View style={styles.winBanner}>
            <Text style={styles.winText}>
              every task done. you showed up for yourself today. 💛
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>your plan for today</Text>

        {activities.map((act) => (
          <ActivityCard key={act.id} activity={act} onToggle={() => toggleActivity(act.id)} />
        ))}

        {/* Progress */}
        <Card style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>progress</Text>
            <ProgressBar value={progress} />
            <Text style={styles.progressPct}>{progress}%</Text>
          </View>
        </Card>

        <Button
          label="re-check in"
          variant="secondary"
          onPress={resetCheckin}
          style={styles.resetBtn}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

// ── Activity card ────────────────────────────────────────────────────────────

function ActivityCard({
  activity,
  onToggle,
}: {
  activity: Activity
  onToggle: () => void
}) {
  const TAG_COLORS: Record<string, { bg: string; text: string }> = {
    easy:   { bg: Colors.successLight, text: Colors.success },
    medium: { bg: Colors.warningLight, text: Colors.warning },
    focus:  { bg: Colors.infoLight,    text: Colors.info    },
    rest:   { bg: Colors.gray100,      text: Colors.gray500 },
  }
  const tagColors = TAG_COLORS[activity.tag] ?? TAG_COLORS.easy

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.8}
      style={[styles.actCard, activity.done && styles.actCardDone]}
    >
      <View style={[styles.checkbox, activity.done && styles.checkboxDone]}>
        {activity.done && <Text style={styles.checkmark}>✓</Text>}
      </View>

      <View style={styles.actContent}>
        <Text style={[styles.actTitle, activity.done && styles.actTitleDone]}>
          {activity.title}
        </Text>
        <Text style={styles.actDesc}>{activity.desc}</Text>
      </View>

      <View style={[styles.actTag, { backgroundColor: tagColors.bg }]}>
        <Text style={[styles.actTagText, { color: tagColors.text }]}>{activity.tag}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.gray50 },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },

  heading: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.gray900 },
  date:    { fontSize: Typography.sm, color: Colors.gray500, marginBottom: Spacing.xl },

  card: { marginBottom: Spacing.lg },
  cardTitle: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.gray900, marginBottom: 4 },
  cardSub:   { fontSize: Typography.sm, color: Colors.gray500, marginBottom: Spacing.lg },

  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  moodCard: {
    width: '30%',
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    minHeight: 72,
    justifyContent: 'center',
  },
  moodCardSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  moodEmoji:        { fontSize: 22, marginBottom: 4 },
  moodLabel:        { fontSize: Typography.xs, color: Colors.gray600, textAlign: 'center' },
  moodLabelSelected:{ color: Colors.primary, fontWeight: Typography.semibold },

  noteLabel: { fontSize: Typography.sm, color: Colors.gray600, marginBottom: Spacing.sm },
  noteInput: {
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: Typography.sm,
    color: Colors.gray800,
    marginBottom: Spacing.lg,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  banner: { marginBottom: Spacing.lg },
  bannerTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.gray900, marginBottom: 4 },
  bannerSub:   { fontSize: Typography.sm, color: Colors.gray600 },

  winBanner: {
    backgroundColor: Colors.successLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  winText: { fontSize: Typography.sm, color: Colors.success, textAlign: 'center' },

  sectionTitle: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.gray900, marginBottom: Spacing.md },

  actCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  actCardDone: { opacity: 0.45 },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: Colors.gray300,
    borderRadius: Radius.sm,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark:    { color: Colors.white, fontSize: 12, fontWeight: Typography.bold },
  actContent:   { flex: 1 },
  actTitle:     { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.gray900, marginBottom: 3 },
  actTitleDone: { textDecorationLine: 'line-through', color: Colors.gray400 },
  actDesc:      { fontSize: Typography.sm, color: Colors.gray600, lineHeight: 20 },
  actTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  actTagText: { fontSize: Typography.xs, fontWeight: Typography.semibold },

  progressCard: { marginTop: Spacing.md, marginBottom: Spacing.lg },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progressLabel: { fontSize: Typography.sm, color: Colors.gray600, width: 64 },
  progressPct:   { fontSize: Typography.sm, color: Colors.gray600, width: 36, textAlign: 'right' },

  resetBtn: { marginTop: Spacing.sm },
})
