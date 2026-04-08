import { useState } from 'react'
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppStore } from '../../src/store'
import { Colors, Typography, Spacing, Radius, Shadows, CAREER_FIELDS, JOB_TYPES } from '../../src/constants'
import { OnboardingHeader, StepDots } from '../../src/components/brand'

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}
      style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {selected ? '✓ ' : ''}{label}
      </Text>
    </TouchableOpacity>
  )
}

export default function OnboardingStep2() {
  const router = useRouter()
  const { profile, updateProfile } = useAppStore()

  const [fields, setFields] = useState<string[]>(profile?.fields ?? [])
  const [types, setTypes]   = useState<string[]>(profile?.jobTypes ?? [])
  const [scholPref, setScholPref] = useState('')
  const [location, setLocation]   = useState(profile?.location ?? '')

  const toggle = (arr: string[], set: (a: string[]) => void, val: string) =>
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])

  const onNext = () => {
    updateProfile({
      fields, jobTypes: types,
      wantsScholarships: scholPref !== 'Just jobs for now',
      location: location || 'Anywhere',
    })
    router.push('/(onboarding)/step-3')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <OnboardingHeader />
        <StepDots current={1} />

        <Text style={styles.heading}>What are you after?</Text>
        <Text style={styles.sub}>Pick everything that applies — no wrong answers.</Text>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Career fields</Text>
          <View style={styles.chipRow}>
            {CAREER_FIELDS.map(f => (
              <Chip key={f} label={f} selected={fields.includes(f)} onPress={() => toggle(fields, setFields, f)} />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Job type</Text>
          <View style={styles.chipRow}>
            {JOB_TYPES.map(t => (
              <Chip key={t} label={t} selected={types.includes(t)} onPress={() => toggle(types, setTypes, t)} />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Scholarships?</Text>
          <View style={styles.chipRow}>
            {['Yes, definitely', 'Maybe, show me options', 'Just jobs for now'].map(opt => (
              <Chip key={opt} label={opt} selected={scholPref === opt} onPress={() => setScholPref(opt)} />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Preferred location</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. New York, Remote, open to anything"
            placeholderTextColor={Colors.textMuted}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <TouchableOpacity style={styles.btn} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.btnText}>Next →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  heading: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  sub:     { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing['2xl'] },
  card:    { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg, ...Shadows.sm },
  sectionLabel: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border },
  chipSelected:     { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  chipText:         { fontSize: Typography.sm, color: Colors.textSecondary },
  chipTextSelected: { color: Colors.primary, fontWeight: Typography.semibold },
  input: { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary },
  btn:     { backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.sm, ...Shadows.md },
  btnText: { color: '#FFFFFF', fontSize: Typography.base, fontWeight: Typography.bold },
})
