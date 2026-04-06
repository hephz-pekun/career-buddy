import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppStore } from '../../src/store'
import { Colors, Typography, Spacing, Radius, Shadows } from '../../src/constants'
import { extractResumeSkills } from '../../src/services/anthropic'

function StepDots({ current }: { current: number }) {
  return (
    <View style={styles.dots}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.dot, i < current && styles.dotDone, i === current && styles.dotActive]} />
      ))}
    </View>
  )
}

async function extractPDFText(uri: string, fileName: string): Promise<string> {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) throw new Error('missing config')
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 })
    const byteCharacters = atob(base64)
    const byteArrays = []
    for (let i = 0; i < byteCharacters.length; i += 512) {
      const slice = byteCharacters.slice(i, i + 512)
      const byteNumbers = new Array(slice.length)
      for (let j = 0; j < slice.length; j++) byteNumbers[j] = slice.charCodeAt(j)
      byteArrays.push(new Uint8Array(byteNumbers))
    }
    const blob = new Blob(byteArrays, { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', blob, fileName)
    const res = await fetch(`${supabaseUrl}/functions/v1/claude-proxy`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${supabaseKey}` },
      body: formData,
    })
    const data = await res.json()
    return data.text || `[PDF: ${fileName}]`
  } catch (e) {
    console.log('PDF extraction error:', e)
    return `[PDF: ${fileName}]`
  }
}

export default function OnboardingStep3() {
  const router = useRouter()
  const { profile, updateProfile, setResumeText, setOnboardingComplete } = useAppStore()
  const [fileName, setFileName] = useState<string | null>(null)
  const [skills, setSkills] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [resumeReady, setResumeReady] = useState(false)
  const [finishing, setFinishing] = useState(false)

  const pickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain'],
        copyToCacheDirectory: true,
      })
      if (result.canceled) return
      const file = result.assets[0]
      setFileName(file.name)
      setUploading(true)
      setUploadStatus('reading your resume...')
      let text = ''
      if (file.mimeType === 'text/plain') {
        text = await FileSystem.readAsStringAsync(file.uri)
      } else {
        setUploadStatus('reading PDF content...')
        text = await extractPDFText(file.uri, file.name)
      }
      setResumeText(text)
      setUploadStatus('extracting your skills...')
      try {
        const extracted = await extractResumeSkills(text, profile?.fields ?? [])
        setSkills(extracted.skills)
        updateProfile({
          skills: extracted.skills,
          fields: [...new Set([...(profile?.fields ?? []), ...extracted.inferredFields])],
          jobTypes: [...new Set([...(profile?.jobTypes ?? []), ...extracted.inferredJobTypes])],
        })
        setUploadStatus('done!')
      } catch {
        const fallback = ['communication', 'teamwork', 'problem solving', 'leadership', 'research']
        setSkills(fallback)
        updateProfile({ skills: fallback, fields: profile?.fields ?? [], jobTypes: profile?.jobTypes ?? [] })
        setUploadStatus('done!')
      }
      setResumeReady(true)
    } catch {
      Alert.alert('oops', "something went wrong. try a .txt version if PDF isn't working.")
    } finally {
      setUploading(false)
    }
  }

  const onFinish = async () => {
    if (!resumeReady) return
    setFinishing(true)
    setOnboardingComplete(true)
    router.replace('/(tabs)/checkin')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <StepDots current={2} />
        <Text style={styles.heading}>upload your resume</Text>
        <Text style={styles.sub}>this powers everything — your matches, day plan, all of it.</Text>
        <View style={styles.requiredNote}>
          <Text style={styles.requiredText}>your resume is required — it's what makes everything personal to you.</Text>
        </View>
        <TouchableOpacity
          onPress={pickResume}
          style={[styles.uploadZone, !!fileName && styles.uploadZoneDone]}
          activeOpacity={0.7}
          disabled={uploading}
        >
          {uploading ? (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>⏳</Text>
              <Text style={{ fontSize: Typography.sm, color: Colors.gray600 }}>{uploadStatus}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.uploadIcon}>{fileName ? '✅' : '📄'}</Text>
              <Text style={styles.uploadTitle}>{fileName ?? 'tap to upload your resume'}</Text>
              <Text style={styles.uploadSub}>{fileName ? 'tap to replace' : 'PDF or .txt — we read your actual skills'}</Text>
            </>
          )}
        </TouchableOpacity>
        {skills.length > 0 && (
          <View style={styles.skillsSection}>
            <Text style={styles.skillsLabel}>skills we spotted</Text>
            <View style={styles.skillsWrap}>
              {skills.map((s) => (
                <View key={s} style={styles.skillPill}>
                  <Text style={styles.skillPillText}>{s}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.skillsNote}>these power your job matches and daily plan.</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.finishBtn, (!resumeReady || finishing) && styles.finishBtnDisabled]}
          onPress={onFinish}
          disabled={!resumeReady || finishing}
          activeOpacity={0.8}
        >
          <Text style={styles.finishBtnText}>{finishing ? 'setting things up...' : 'generate my matches →'}</Text>
        </TouchableOpacity>
        {!resumeReady && <Text style={styles.uploadPrompt}>upload your resume above to continue</Text>}
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
  sub:     { fontSize: Typography.sm, color: Colors.gray500, marginBottom: Spacing.lg },
  requiredNote: { backgroundColor: Colors.warningLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.warning },
  requiredText: { fontSize: Typography.xs, color: Colors.warning },
  uploadZone: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.gray200, borderStyle: 'dashed', borderRadius: Radius.lg, padding: Spacing['2xl'], alignItems: 'center', marginBottom: Spacing.xl, minHeight: 140, justifyContent: 'center', ...Shadows.sm },
  uploadZoneDone: { borderStyle: 'solid', borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  uploadIcon:  { fontSize: 36, marginBottom: Spacing.md },
  uploadTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.gray800, textAlign: 'center' },
  uploadSub:   { fontSize: Typography.xs, color: Colors.gray500, marginTop: 4, textAlign: 'center' },
  skillsSection: { marginBottom: Spacing.xl },
  skillsLabel:   { fontSize: Typography.sm, color: Colors.gray600, marginBottom: Spacing.sm, fontWeight: Typography.medium },
  skillsWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  skillPill:     { backgroundColor: Colors.primaryLight, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4 },
  skillPillText: { fontSize: Typography.xs, color: Colors.primary, fontWeight: Typography.medium },
  skillsNote:    { fontSize: Typography.xs, color: Colors.gray500 },
  finishBtn:         { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md },
  finishBtnDisabled: { opacity: 0.4 },
  finishBtnText:     { color: Colors.white, fontSize: Typography.base, fontWeight: Typography.semibold },
  uploadPrompt: { fontSize: Typography.xs, color: Colors.gray400, textAlign: 'center' },
})
