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
import { useRouter } from 'expo-router'
import { format } from 'date-fns'
import { useAppStore, selectProgressToday } from '../../src/store'
import { ProgressBar, LoadingSpinner } from '../../src/components/ui'
import { Colors, Typography, Spacing, Radius, Shadows, MOOD_CONFIG } from '../../src/constants'
import { generateDayPlan } from '../../src/services/anthropic'
import type { MoodType, Activity } from '../../src/types'

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  easy:   { bg: '#DCFCE7', text: '#22C55E' },
  medium: { bg: '#FEF3C7', text: '#F59E0B' },
  focus:  { bg: '#DBEAFE', text: '#3B82F6' },
  rest:   { bg: '#F1F5F9', text: '#64748B' },
}

export default function CheckinScreen() {
  const router = useRouter()
  const {
    profile, activities, todayPlan, checkedInToday,
    jobApplications, scholApplications,
    setTodayPlan, setActivities, toggleActivity,
    addMoodEntry, setCheckedInToday, resetCheckin,
  } = useAppStore()

  const progress = useAppStore(selectProgressToday)
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')
  const displayDate = format(new Date(), 'EEEE, MMMM d')
  const hasUpcomingInterview = jobApplications.some((j) => j.status === 'interview')

  // Single "go do it" — points to first uncompleted actionable task
  const nextAction = activities.find((a) => !a.done && a.action && a.action !== 'null')

  const navigateToTab = (action: string) => {
    const routes: Record<string, string> = {
      matches:   '/(tabs)/matches',
      tracker:   '/(tabs)/tracker',
      prep:      '/(tabs)/prep',
      portfolio: '/(tabs)/portfolio',
      history:   '/(tabs)/history',
    }
    const route = routes[action]
    if (route) router.push(route as any)
  }

  const onBuildPlan = async () => {
    if (!selectedMood || !profile) return
    setLoading(true)
    try {
      const plan = await generateDayPlan(profile, selectedMood, note, {
        jobsApplied: jobApplications.length,
        scholsTracked: scholApplications.length,
        hasUpcomingInterview,
      })

      // This is what history tab reads — must be saved here
      addMoodEntry({
        id: `${today}-${Date.now()}`,
        userId: profile.id,
        mood: selectedMood,
        note,
        date: today,
        createdAt: new Date().toISOString(),
      })

      setTodayPlan(plan)
      setActivities(plan.activities.map((a, i) => ({ ...a, id: `act-${i}-${Date.now()}`, done: false })))
      setCheckedInToday(true)
    } catch {
      Alert.alert('oops', "couldn't build your plan right now. try again!")
    } finally {
      setLoading(false)
    }
  }

  const allDone = activities.length > 0 && activities.every((a) => a.done)

  if (!checkedInToday) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>hey, {profile?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.date}>{displayDate}</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>how are you feeling today?</Text>
            <Text style={styles.cardSub}>no right answer — just be honest.</Text>
            <View style={styles.moodGrid}>
              {(Object.entries(MOOD_CONFIG) as [MoodType, typeof MOOD_CONFIG[MoodType]][]).map(([key, cfg]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.moodCard, selectedMood === key && styles.moodCardSelected]}
                  onPress={() => setSelectedMood(key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moodEmoji}>{cfg.emoji}</Text>
                  <Text style={[styles.moodLabel, selectedMood === key && styles.moodLabelSelected]}>{cfg.label}</Text>
                </TouchableOpacity>
              ))}
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
            <TouchableOpacity
              style={[styles.buildBtn, (!selectedMood || loading) && styles.buildBtnDisabled]}
              onPress={onBuildPlan}
              disabled={!selectedMood || loading}
              activeOpacity={0.8}
            >
              {loading
                ? <LoadingSpinner message="building your plan..." />
                : <Text style={styles.buildBtnText}>build my day plan</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {todayPlan && (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>{todayPlan.greeting}</Text>
            <Text style={styles.bannerSub}>{todayPlan.subtitle}</Text>
          </View>
        )}

        {allDone && (
          <View style={styles.winBanner}>
            <Text style={styles.winText}>every task done. you showed up for yourself today. 💛</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>your plan for today</Text>

        {activities.map((act) => (
          <TouchableOpacity
            key={act.id}
            onPress={() => toggleActivity(act.id)}
            activeOpacity={0.8}
            style={[styles.actCard, act.done && styles.actCardDone]}
          >
            <View style={[styles.checkbox, act.done && styles.checkboxDone]}>
              {act.done && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.actContent}>
              <Text style={[styles.actTitle, act.done && styles.actTitleDone]}>{act.title}</Text>
              <Text style={styles.actDesc}>{act.desc}</Text>
            </View>
            <View style={[styles.actTag, { backgroundColor: TAG_COLORS[act.tag]?.bg ?? '#F1F5F9' }]}>
              <Text style={[styles.actTagText, { color: TAG_COLORS[act.tag]?.text ?? '#64748B' }]}>{act.tag}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Single go do it button */}
        {nextAction && (
          <TouchableOpacity
            style={styles.goDoItBtn}
            onPress={() => navigateToTab(nextAction.action!)}
            activeOpacity={0.8}
          >
            <Text style={styles.goDoItText}>go do it: {nextAction.title} →</Text>
          </TouchableOpacity>
        )}

        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>progress</Text>
            <View style={{ flex: 1, marginHorizontal: 10 }}><ProgressBar value={progress} /></View>
            <Text style={styles.progressPct}>{progress}%</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={resetCheckin}>
          <Text style={styles.resetBtnText}>re-check in</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.gray50 },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  heading: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.gray900 },
  date:    { fontSize: Typography.sm, color: Colors.gray500, marginBottom: Spacing.xl },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.sm },
  cardTitle: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.gray900, marginBottom: 4 },
  cardSub:   { fontSize: Typography.sm, color: Colors.gray500, marginBottom: Spacing.lg },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  moodCard: { width: '30%', backgroundColor: Colors.gray50, borderWidth: 1, borderColor: Colors.gray200, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', minHeight: 72, justifyContent: 'center' },
  moodCardSelected:  { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  moodEmoji:         { fontSize: 22, marginBottom: 4 },
  moodLabel:         { fontSize: Typography.xs, color: Colors.gray600, textAlign: 'center' },
  moodLabelSelected: { color: Colors.primary, fontWeight: Typography.semibold },
  noteLabel: { fontSize: Typography.sm, color: Colors.gray600, marginBottom: Spacing.sm },
  noteInput: { backgroundColor: Colors.gray50, borderWidth: 1, borderColor: Colors.gray200, borderRadius: Radius.md, padding: Spacing.md, fontSize: Typography.sm, color: Colors.gray800, marginBottom: Spacing.lg, minHeight: 80, textAlignVertical: 'top' },
  buildBtn:         { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  buildBtnDisabled: { opacity: 0.4 },
  buildBtnText:     { color: Colors.white, fontSize: Typography.base, fontWeight: Typography.semibold },
  banner:      { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.sm },
  bannerTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.gray900, marginBottom: 4 },
  bannerSub:   { fontSize: Typography.sm, color: Colors.gray600 },
  winBanner: { backgroundColor: '#DCFCE7', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.success },
  winText:   { fontSize: Typography.sm, color: Colors.success, textAlign: 'center' },
  sectionTitle: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.gray900, marginBottom: Spacing.md },
  actCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.md, ...Shadows.sm },
  actCardDone:  { opacity: 0.45 },
  checkbox:     { width: 20, height: 20, borderWidth: 1.5, borderColor: Colors.gray300, borderRadius: Radius.sm, marginTop: 2, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark:    { color: Colors.white, fontSize: 12, fontWeight: Typography.bold },
  actContent:   { flex: 1 },
  actTitle:     { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.gray900, marginBottom: 3 },
  actTitleDone: { textDecorationLine: 'line-through', color: Colors.gray400 },
  actDesc:      { fontSize: Typography.sm, color: Colors.gray600, lineHeight: 20 },
  actTag:       { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full, alignSelf: 'flex-start' },
  actTagText:   { fontSize: Typography.xs, fontWeight: Typography.semibold },
  goDoItBtn:    { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.sm, marginBottom: Spacing.md },
  goDoItText:   { color: Colors.white, fontSize: Typography.base, fontWeight: Typography.semibold },
  progressCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.sm },
  progressRow:  { flexDirection: 'row', alignItems: 'center' },
  progressLabel:{ fontSize: Typography.sm, color: Colors.gray600, width: 64 },
  progressPct:  { fontSize: Typography.sm, color: Colors.gray600, width: 36, textAlign: 'right' },
  resetBtn:     { backgroundColor: Colors.gray100, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.gray200 },
  resetBtnText: { fontSize: Typography.sm, color: Colors.gray600 },
})
