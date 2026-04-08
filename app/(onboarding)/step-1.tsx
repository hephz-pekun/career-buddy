import {
  View, Text, TextInput, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppStore } from '../../src/store'
import { Colors, Typography, Spacing, Radius, Shadows } from '../../src/constants'
import { OnboardingHeader, StepDots } from '../../src/components/brand'

const schema = z.object({
  name:   z.string().min(1, 'We need your name!'),
  email:  z.string().email('Enter a valid email'),
  school: z.string().optional(),
  major:  z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function OnboardingStep1() {
  const router = useRouter()
  const { setProfile } = useAppStore()

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', school: '', major: '' },
  })

  const onNext = handleSubmit((data) => {
    setProfile({
      id: '', name: data.name, email: data.email,
      school: data.school ?? '', major: data.major ?? '',
      location: '', fields: [], jobTypes: [],
      wantsScholarships: true, skills: [],
      resumeUrl: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    router.push('/(onboarding)/step-2')
  })

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <OnboardingHeader />
          <StepDots current={0} />

          <Text style={styles.heading}>The basics</Text>
          <Text style={styles.sub}>Takes about 60 seconds to set up.</Text>

          <View style={styles.card}>
            {[
              { name: 'name' as const, label: 'Your name', placeholder: 'e.g. Jordan Smith', caps: 'words' as const },
              { name: 'email' as const, label: 'Email address', placeholder: 'you@school.edu', type: 'email-address' as const, caps: 'none' as const },
              { name: 'school' as const, label: 'School & year', placeholder: 'e.g. UCLA, Junior', opt: true },
              { name: 'major' as const, label: 'Major', placeholder: 'e.g. Psychology', opt: true },
            ].map(f => (
              <Controller key={f.name} control={control} name={f.name} render={({ field: { onChange, value, onBlur } }) => (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    {f.label} {f.opt && <Text style={styles.optional}>(optional)</Text>}
                  </Text>
                  <TextInput
                    style={[styles.input, !!errors[f.name] && styles.inputError]}
                    placeholder={f.placeholder}
                    placeholderTextColor={Colors.textMuted}
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType={f.type}
                    autoCapitalize={f.caps ?? 'sentences'}
                  />
                  {errors[f.name] && <Text style={styles.error}>{errors[f.name]?.message}</Text>}
                </View>
              )} />
            ))}
          </View>

          <TouchableOpacity style={styles.btn} onPress={onNext} activeOpacity={0.85}>
            <Text style={styles.btnText}>Next →</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  heading: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  sub:     { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing['2xl'] },
  card:    { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.xl, ...Shadows.sm },
  fieldGroup: { marginBottom: Spacing.lg },
  label:    { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  optional: { fontWeight: Typography.regular, color: Colors.textMuted },
  input: {
    backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  inputError: { borderColor: Colors.danger },
  error: { fontSize: Typography.xs, color: Colors.danger, marginTop: 4 },
  btn:     { backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', ...Shadows.md },
  btnText: { color: '#FFFFFF', fontSize: Typography.base, fontWeight: Typography.bold },
})
