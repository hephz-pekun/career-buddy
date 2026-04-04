import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppStore } from '@/store'
import { Button, Chip } from '@/components/ui'
import { Colors, Typography, Spacing, Radius, CAREER_FIELDS, JOB_TYPES } from '@/constants'

function StepDots({ current }: { current: number }) {
  return (
    <View style={styles.dots}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.dot, i < current && styles.dotDone, i === current && styles.dotActive]} />
      ))}
    </View>
  )
}

export default function OnboardingStep2() {
  const router = useRouter()
  const { profile, updateProfile } = useAppStore()

  const [selectedFields, setSelectedFields] = useState<string[]>(profile?.fields ?? [])
  const [selectedTypes, setSelectedTypes] = useState<string[]>(profile?.jobTypes ?? [])
  const [scholPref, setScholPref] = useState<string>('')
  const [location, setLocation] = useState(profile?.location ?? '')

  const toggleField = (f: string) =>
    setSelectedFields((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    )

  const toggleType = (t: string) =>
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    )

  const onNext = () => {
    updateProfile({
      fields: selectedFields,
      jobTypes: selectedTypes,
      wantsScholarships: scholPref !== 'just jobs for now',
      location: location || 'anywhere',
    })
    router.push('/(onboarding)/step-3')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <StepDots current={1} />

        <Text style={styles.heading}>what are you after?</Text>
        <Text style={styles.sub}>pick everything that applies — no wrong answers.</Text>

        {/* Career fields */}
        <Text style={styles.sectionLabel}>career fields you're into</Text>
        <View style={styles.chipWrap}>
          {CAREER_FIELDS.map((f) => (
            <Chip
              key={f}
              label={f}
              selected={selectedFields.includes(f)}
              onPress={() => toggleField(f)}
            />
          ))}
        </View>

        <View style={styles.divider} />

        {/* Job types */}
        <Text style={styles.sectionLabel}>job type preference</Text>
        <View style={styles.chipWrap}>
          {JOB_TYPES.map((t) => (
            <Chip
              key={t}
              label={t}
              selected={selectedTypes.includes(t)}
              onPress={() => toggleType(t)}
            />
          ))}
        </View>

        <View style={styles.divider} />

        {/* Scholarship pref */}
        <Text style={styles.sectionLabel}>also looking for scholarships?</Text>
        <View style={styles.chipWrap}>
          {['yes, definitely', 'maybe, show me options', 'just jobs for now'].map((opt) => (
            <Chip
              key={opt}
              label={opt}
              selected={scholPref === opt}
              onPress={() => setScholPref(opt)}
            />
          ))}
        </View>

        <View style={styles.divider} />

        {/* Location */}
        <Text style={styles.sectionLabel}>preferred location</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. New York, Remote, open to anything"
          placeholderTextColor={Colors.gray400}
          value={location}
          onChangeText={setLocation}
        />

        <Button label="next →" onPress={onNext} style={styles.nextBtn} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.gray50 },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  dots:   { flexDirection: 'row', gap: 6, marginBottom: Spacing['2xl'] },
  dot:    { flex: 1, height: 4, borderRadius: Radius.full, backgroundColor: Colors.gray200 },
  dotDone:   { backgroundColor: Colors.gray400 },
  dotActive: { backgroundColor: Colors.primary },
  heading: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.gray900, marginBottom: Spacing.sm },
  sub:     { fontSize: Typography.sm, color: Colors.gray500, marginBottom: Spacing['2xl'] },
  sectionLabel: { fontSize: Typography.sm, color: Colors.gray600, marginBottom: Spacing.sm, fontWeight: Typography.medium },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  divider:  { height: 1, backgroundColor: Colors.gray100, marginVertical: Spacing.lg },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: Typography.base,
    color: Colors.gray900,
    marginBottom: Spacing.lg,
  },
  nextBtn: { marginTop: Spacing.sm },
})
