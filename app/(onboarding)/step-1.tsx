import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui'
import { Colors, Typography, Spacing, Radius } from '@/constants'

const schema = z.object({
  name:   z.string().min(1, 'just your name — that\'s all we need!'),
  email:  z.string().email('enter a valid email'),
  school: z.string().optional(),
  major:  z.string().optional(),
})

type FormData = z.infer<typeof schema>

// Step indicator component
function StepDots({ current }: { current: number }) {
  return (
    <View style={styles.dots}>
      {[0, 1, 2].map((i) => (
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

export default function OnboardingStep1() {
  const router = useRouter()
  const updateProfile = useAppStore((s) => s.updateProfile)
  const setProfile = useAppStore((s) => s.setProfile)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', school: '', major: '' },
  })

  const onNext = handleSubmit((data) => {
    setProfile({
      id: '',
      name: data.name,
      email: data.email,
      school: data.school ?? '',
      major: data.major ?? '',
      location: '',
      fields: [],
      jobTypes: [],
      wantsScholarships: true,
      skills: [],
      resumeUrl: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    router.push('/(onboarding)/step-2')
  })

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <StepDots current={0} />

          <Text style={styles.heading}>hey there 👋</Text>
          <Text style={styles.sub}>let's get you set up — takes about 2 minutes.</Text>

          <Text style={styles.sectionTitle}>first, the basics</Text>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>what's your name?</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="e.g. Jordan"
                  placeholderTextColor={Colors.gray400}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                  autoComplete="name"
                />
                {errors.name && (
                  <Text style={styles.error}>{errors.name.message}</Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>email</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="you@school.edu"
                  placeholderTextColor={Colors.gray400}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                {errors.email && (
                  <Text style={styles.error}>{errors.email.message}</Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="school"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>school & year <Text style={styles.optional}>(optional)</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. UCLA, Junior"
                  placeholderTextColor={Colors.gray400}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="major"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>major <Text style={styles.optional}>(optional)</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Psychology, Computer Science"
                  placeholderTextColor={Colors.gray400}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              </View>
            )}
          />

          <Button
            label="next →"
            onPress={onNext}
            style={styles.nextBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.gray50 },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },

  dots: { flexDirection: 'row', gap: 6, marginBottom: Spacing['2xl'] },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.gray200,
  },
  dotDone:   { backgroundColor: Colors.gray400 },
  dotActive: { backgroundColor: Colors.primary },

  heading:      { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.gray900, marginBottom: Spacing.sm },
  sub:          { fontSize: Typography.sm, color: Colors.gray500, marginBottom: Spacing['2xl'] },
  sectionTitle: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.gray900, marginBottom: Spacing.lg },

  fieldGroup: { marginBottom: Spacing.lg },
  label:      { fontSize: Typography.sm, color: Colors.gray600, marginBottom: Spacing.sm },
  optional:   { color: Colors.gray400 },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: Typography.base,
    color: Colors.gray900,
  },
  inputError: { borderColor: Colors.danger },
  error:      { fontSize: Typography.xs, color: Colors.danger, marginTop: 4 },

  nextBtn: { marginTop: Spacing.xl },
})
