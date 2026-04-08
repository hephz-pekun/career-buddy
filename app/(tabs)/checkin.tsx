import { useState } from 'react'
import {
  View, Text, TextInput, ScrollView,
  TouchableOpacity, StyleSheet, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { format } from 'date-fns'
import { useAppStore, selectProgressToday } from '../../src/store'
import { Colors, Typography, Spacing, Radius, Shadows, MOOD_CONFIG } from '../../src/constants'
import { BrandHeader } from '../../src/components/brand'
import { generateDayPlan } from '../../src/services/anthropic'
import type { MoodType, Activity } from '../../src/types'

const TAG_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  easy:   { bg: Colors.successBg,  text: Colors.success,  border: Colors.successBorder  },
  medium: { bg: Colors.warningBg,  text: Colors.warning,  border: Colors.warningBorder  },
  focus:  { bg: Colors.infoBg,     text: Colors.info,     border: Colors.infoBorder     },
  rest:   { bg: Colors.surface2,   text: Colors.textMuted, border: Colors.border        },
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
  const [mood, setMood]       = useState<MoodType | null>(null)
  const [note, setNote]       = useState('')
  const [loading, setLoading] = useState(false)

  const today       = format(new Date(), 'yyyy-MM-dd')
  const displayDate = format(new Date(), 'EEEE, MMMM d')
  const nextAction  = activities.find(a => !a.done && a.action && a.action !== 'null')

  const navigateTo = (action: string) => {
    const map: Record<string, string> = {
      matches: '/(tabs)/matches', tracker: '/(tabs)/tracker',
      prep: '/(tabs)/prep', portfolio: '/(tabs)/portfolio',
    }
    if (map[action]) router.push(map[action] as any)
  }

  const onBuildPlan = async () => {
    if (!mood || !profile) return
    setLoading(true)
    try {
      const plan = await generateDayPlan(profile, mood, note, {
        jobsApplied: jobApplications.length,
        scholsTracked: scholApplications.length,
        hasUpcomingInterview: jobApplications.some(j => j.status === 'interview'),
      })
      addMoodEntry({ id: `${today}-${Date.now()}`, userId: profile.id, mood, note, date: today, createdAt: new Date().toISOString() })
      setTodayPlan(plan)
      setActivities(plan.activities.map((a, i) => ({ ...a, id: `act-${i}-${Date.now()}`, done: false })))
      setCheckedInToday(true)
    } catch { Alert.alert('Oops', "Couldn't build your plan right now. Try again!") }
    finally { setLoading(false) }
  }

  const allDone = activities.length > 0 && activities.every(a => a.done)

  if (!checkedInToday) {
    return (
      <SafeAreaView style={styles.safe}>
        <BrandHeader title="Daily Check-In" />
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.greeting}>Hey, {profile?.name?.split(' ')[0]} 👋</Text>
              <Text style={styles.date}>{displayDate}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>How are you feeling today?</Text>
            <Text style={styles.cardSub}>No right answer — just be honest with yourself.</Text>
            <View style={styles.moodGrid}>
              {(Object.entries(MOOD_CONFIG) as [MoodType, typeof MOOD_CONFIG[MoodType]][]).map(([key, cfg]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.moodCard, mood === key && { borderColor: cfg.color, backgroundColor: cfg.bg }]}
                  onPress={() => setMood(key)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.moodEmoji}>{cfg.emoji}</Text>
                  <Text style={[styles.moodLabel, mood === key && { color: cfg.color, fontWeight: Typography.semibold }]}>{cfg.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.noteLabel}>Anything on your mind? <Text style={styles.noteOpt}>(optional)</Text></Text>
            <TextInput
              style={styles.noteInput}
              placeholder="e.g. 'Nervous about an interview' or 'Haven't applied in a while'..."
              placeholderTextColor={Colors.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={2}
            />

            <TouchableOpacity
              style={[styles.buildBtn, (!mood || loading) && styles.buildBtnDisabled]}
              onPress={onBuildPlan}
              disabled={!mood || loading}
            >
              <Text style={styles.buildBtnText}>{loading ? 'Building your plan...' : 'Build my day plan'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <BrandHeader title="Today's Plan" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {todayPlan && (
          <View style={styles.bannerCard}>
            <Text style={styles.bannerGreeting}>{todayPlan.greeting}</Text>
            <Text style={styles.bannerSub}>{todayPlan.subtitle}</Text>
          </View>
        )}

        {allDone && (
          <View style={styles.winCard}>
            <Text style={styles.winEmoji}>🎉</Text>
            <Text style={styles.winText}>Every task done. You showed up for yourself today. 💛</Text>
          </View>
        )}

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Today's progress</Text>
            <Text style={styles.progressPct}>{progress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your tasks</Text>

        {activities.map((act) => {
          const ts = TAG_STYLES[act.tag] ?? TAG_STYLES.rest
          return (
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
              <View style={[styles.actTag, { backgroundColor: ts.bg, borderColor: ts.border }]}>
                <Text style={[styles.actTagText, { color: ts.text }]}>{act.tag}</Text>
              </View>
            </TouchableOpacity>
          )
        })}

        {nextAction && (
          <TouchableOpacity style={styles.goBtn} onPress={() => navigateTo(nextAction.action!)} activeOpacity={0.85}>
            <Text style={styles.goBtnText}>Go do it: {nextAction.title} →</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.resetBtn} onPress={resetCheckin}>
          <Text style={styles.resetText}>Re-check in</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },

  topRow:   { marginBottom: Spacing.xl },
  greeting: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  date:     { fontSize: Typography.sm, color: Colors.textMuted, marginTop: 2 },

  card:      { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.xl, ...Shadows.sm },
  cardLabel: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 4 },
  cardSub:   { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.xl },

  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  moodCard: {
    width: '30%', borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center',
    backgroundColor: Colors.surface2, borderWidth: 1.5, borderColor: Colors.border,
    minHeight: 76, justifyContent: 'center',
  },
  moodEmoji: { fontSize: 24, marginBottom: 4 },
  moodLabel: { fontSize: Typography.xs, color: Colors.textSecondary, textAlign: 'center' },

  noteLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  noteOpt:   { fontWeight: Typography.regular, color: Colors.textMuted },
  noteInput: {
    backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, fontSize: Typography.sm,
    color: Colors.textPrimary, minHeight: 72, textAlignVertical: 'top', marginBottom: Spacing.lg,
  },
  buildBtn:         { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.lg, alignItems: 'center', ...Shadows.md },
  buildBtnDisabled: { opacity: 0.35 },
  buildBtnText:     { color: '#FFFFFF', fontSize: Typography.base, fontWeight: Typography.bold },

  bannerCard: { backgroundColor: Colors.primaryBg, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.primaryBorder, marginBottom: Spacing.lg },
  bannerGreeting: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.primary, marginBottom: 4 },
  bannerSub:      { fontSize: Typography.sm, color: Colors.textSecondary },

  winCard:  { backgroundColor: Colors.successBg, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.successBorder, marginBottom: Spacing.lg, flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  winEmoji: { fontSize: 28 },
  winText:  { flex: 1, fontSize: Typography.sm, color: Colors.success, lineHeight: 20, fontWeight: Typography.semibold },

  progressSection: { marginBottom: Spacing.xl },
  progressHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  progressLabel:   { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  progressPct:     { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.bold },
  progressTrack:   { height: 8, backgroundColor: Colors.surface2, borderRadius: Radius.full, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  progressFill:    { height: '100%', backgroundColor: Colors.primary, borderRadius: Radius.full },

  sectionTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.md },

  actCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.sm,
    gap: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  actCardDone:  { opacity: 0.45 },
  checkbox:     { width: 22, height: 22, borderWidth: 2, borderColor: Colors.border, borderRadius: Radius.sm, marginTop: 1, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark:    { color: '#FFFFFF', fontSize: 12, fontWeight: Typography.bold },
  actContent:   { flex: 1 },
  actTitle:     { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary, marginBottom: 3 },
  actTitleDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  actDesc:      { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 19 },
  actTag:       { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full, alignSelf: 'flex-start', borderWidth: 1 },
  actTagText:   { fontSize: Typography.xs, fontWeight: Typography.semibold },

  goBtn:    { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.sm, marginBottom: Spacing.md, ...Shadows.md },
  goBtnText:{ color: '#FFFFFF', fontSize: Typography.base, fontWeight: Typography.bold },

  resetBtn:  { backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  resetText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
})
