import { useState } from 'react'
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  TouchableOpacity, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppStore } from '../../src/store'
import { Colors, Typography, Spacing, Radius, Shadows, SKILL_SUGGESTIONS } from '../../src/constants'
import { OnboardingHeader, StepDots } from '../../src/components/brand'
import { extractResumeSkills } from '../../src/services/anthropic'

type Mode = 'choose' | 'resume' | 'skills'

async function extractPDFViaEdge(uri: string, fileName: string): Promise<string> {
  try {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('missing config')
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 })
    const chars = atob(base64)
    const arrays = []
    for (let i = 0; i < chars.length; i += 512) {
      const slice = chars.slice(i, i + 512)
      const bytes = new Array(slice.length)
      for (let j = 0; j < slice.length; j++) bytes[j] = slice.charCodeAt(j)
      arrays.push(new Uint8Array(bytes))
    }
    const blob = new Blob(arrays, { type: 'application/pdf' })
    const form = new FormData()
    form.append('file', blob, fileName)
    const res = await fetch(`${url}/functions/v1/claude-proxy`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    })
    const data = await res.json()
    return data.text || `[PDF: ${fileName}]`
  } catch { return `[PDF: ${fileName}]` }
}

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

export default function OnboardingStep3() {
  const router = useRouter()
  const { profile, updateProfile, setResumeText, setOnboardingComplete } = useAppStore()

  const [mode, setMode]           = useState<Mode>('choose')
  const [fileName, setFileName]   = useState<string | null>(null)
  const [skills, setSkills]       = useState<string[]>([])
  const [customSkill, setCustomSkill] = useState('')
  const [uploading, setUploading] = useState(false)
  const [status, setStatus]       = useState('')
  const [ready, setReady]         = useState(false)
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
      setStatus('Reading your resume...')
      let text = file.mimeType === 'text/plain'
        ? await FileSystem.readAsStringAsync(file.uri)
        : await extractPDFViaEdge(file.uri, file.name)
      setResumeText(text)
      setStatus('Identifying your skills...')
      try {
        const extracted = await extractResumeSkills(text, profile?.fields ?? [])
        setSkills(extracted.skills)
        updateProfile({
          skills: extracted.skills,
          fields: [...new Set([...(profile?.fields ?? []), ...extracted.inferredFields])],
          jobTypes: [...new Set([...(profile?.jobTypes ?? []), ...extracted.inferredJobTypes])],
        })
      } catch {
        const fallback = ['Communication', 'Teamwork', 'Problem Solving']
        setSkills(fallback)
        updateProfile({ skills: fallback, fields: profile?.fields ?? [], jobTypes: profile?.jobTypes ?? [] })
      }
      setStatus('')
      setReady(true)
    } catch { Alert.alert('Oops', "Couldn't read that file. Try a .txt version.") }
    finally { setUploading(false) }
  }

  const toggleSkill = (s: string) =>
    setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const addCustom = () => {
    const s = customSkill.trim()
    if (!s || skills.includes(s)) return
    setSkills(prev => [...prev, s])
    setCustomSkill('')
  }

  const confirmSkills = () => {
    if (skills.length === 0) { Alert.alert('', 'Add at least one skill!'); return }
    updateProfile({ skills, fields: profile?.fields ?? [], jobTypes: profile?.jobTypes ?? [] })
    setReady(true)
  }

  const onFinish = async () => {
    if (!ready) return
    setFinishing(true)
    setOnboardingComplete(true)
    router.replace('/(tabs)/checkin')
  }

  if (mode === 'choose') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <OnboardingHeader />
          <StepDots current={2} />
          <Text style={styles.heading}>Add your skills</Text>
          <Text style={styles.sub}>This powers your job matches, scholarships, and daily plan.</Text>

          <TouchableOpacity style={styles.modeCard} onPress={() => setMode('resume')} activeOpacity={0.85}>
            <View style={[styles.modeIcon, { backgroundColor: Colors.primaryBg }]}>
              <Text style={styles.modeIconText}>📄</Text>
            </View>
            <View style={styles.modeContent}>
              <Text style={styles.modeTitle}>Upload my resume</Text>
              <Text style={styles.modeSub}>PDF or .txt — we'll read your skills automatically</Text>
            </View>
            <Text style={styles.modeArrow}>→</Text>
          </TouchableOpacity>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.orLine} />
          </View>

          <TouchableOpacity style={styles.modeCard} onPress={() => setMode('skills')} activeOpacity={0.85}>
            <View style={[styles.modeIcon, { backgroundColor: Colors.infoBg }]}>
              <Text style={styles.modeIconText}>✏️</Text>
            </View>
            <View style={styles.modeContent}>
              <Text style={styles.modeTitle}>Enter my skills manually</Text>
              <Text style={styles.modeSub}>No resume? No problem — pick or type your skills</Text>
            </View>
            <Text style={styles.modeArrow}>→</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>You can always update this later from Settings.</Text>
        </ScrollView>
      </SafeAreaView>
    )
  }

  if (mode === 'resume') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <OnboardingHeader />
          <StepDots current={2} />
          <TouchableOpacity onPress={() => setMode('choose')} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.heading}>Upload your resume</Text>
          <Text style={styles.sub}>PDF or .txt — we read your actual content to match you accurately.</Text>

          <TouchableOpacity
            onPress={pickResume}
            style={[styles.uploadZone, !!fileName && styles.uploadZoneDone]}
            activeOpacity={0.7}
            disabled={uploading}
          >
            {uploading ? (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 28, marginBottom: 8 }}>⏳</Text>
                <Text style={styles.uploadStatusText}>{status}</Text>
              </View>
            ) : (
              <>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>{fileName ? '✅' : '📄'}</Text>
                <Text style={styles.uploadTitle}>{fileName ?? 'Tap to upload your resume'}</Text>
                <Text style={styles.uploadSub}>{fileName ? 'Tap to replace' : 'PDF or .txt accepted'}</Text>
              </>
            )}
          </TouchableOpacity>

          {skills.length > 0 && (
            <View style={styles.skillsBox}>
              <Text style={styles.skillsBoxTitle}>Skills we found on your resume</Text>
              <View style={styles.skillsWrap}>
                {skills.map(s => (
                  <View key={s} style={styles.skillTag}>
                    <Text style={styles.skillTagText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, (!ready || finishing) && styles.btnDisabled]}
            onPress={onFinish}
            disabled={!ready || finishing}
          >
            <Text style={styles.btnText}>{finishing ? 'Setting up...' : 'Generate my matches →'}</Text>
          </TouchableOpacity>
          {!ready && <Text style={styles.hint}>Upload your resume above to continue</Text>}
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <OnboardingHeader />
        <StepDots current={2} />
        <TouchableOpacity onPress={() => setMode('choose')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Your skills</Text>
        <Text style={styles.sub}>Tap to select, or type your own below. These power your job matches.</Text>

        <View style={styles.chipRow}>
          {SKILL_SUGGESTIONS.map(s => (
            <Chip key={s} label={s} selected={skills.includes(s)} onPress={() => toggleSkill(s)} />
          ))}
        </View>

        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            placeholder="Add your own skill..."
            placeholderTextColor={Colors.textMuted}
            value={customSkill}
            onChangeText={setCustomSkill}
            onSubmitEditing={addCustom}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addBtn} onPress={addCustom}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {skills.length > 0 && (
          <View style={styles.selectedBox}>
            <Text style={styles.selectedTitle}>Selected ({skills.length})</Text>
            <View style={styles.skillsWrap}>
              {skills.map(s => (
                <TouchableOpacity key={s} style={styles.selectedChip} onPress={() => toggleSkill(s)}>
                  <Text style={styles.selectedChipText}>{s} ×</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {!ready ? (
          <TouchableOpacity
            style={[styles.btn, skills.length === 0 && styles.btnDisabled]}
            onPress={confirmSkills}
            disabled={skills.length === 0}
          >
            <Text style={styles.btnText}>Confirm my skills →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btn, finishing && styles.btnDisabled]}
            onPress={onFinish}
            disabled={finishing}
          >
            <Text style={styles.btnText}>{finishing ? 'Setting up...' : 'Generate my matches →'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  heading: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  sub:     { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing['2xl'] },
  backBtn:  { marginBottom: Spacing.md },
  backText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semibold },

  modeCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl,
    borderWidth: 1, borderColor: Colors.border, flexDirection: 'row',
    alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md, ...Shadows.sm,
  },
  modeIcon:    { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  modeIconText:{ fontSize: 22 },
  modeContent: { flex: 1 },
  modeTitle:   { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary, marginBottom: 2 },
  modeSub:     { fontSize: Typography.xs, color: Colors.textSecondary },
  modeArrow:   { fontSize: Typography.lg, color: Colors.textMuted },

  orRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.sm },
  orLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  orText: { fontSize: Typography.sm, color: Colors.textMuted },

  uploadZone: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderStyle: 'dashed', borderRadius: Radius.xl, padding: Spacing['3xl'],
    alignItems: 'center', marginBottom: Spacing.xl, minHeight: 140, justifyContent: 'center', ...Shadows.sm,
  },
  uploadZoneDone:   { borderStyle: 'solid', borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  uploadStatusText: { fontSize: Typography.sm, color: Colors.textSecondary },
  uploadTitle:      { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  uploadSub:        { fontSize: Typography.xs, color: Colors.textMuted, textAlign: 'center' },

  skillsBox:      { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  skillsBoxTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  skillsWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  skillTag:       { backgroundColor: Colors.primaryBg, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4, borderWidth: 1, borderColor: Colors.primaryBorder },
  skillTagText:   { fontSize: Typography.xs, color: Colors.primary, fontWeight: Typography.semibold },

  chipRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  chip:     { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipSelected:     { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  chipText:         { fontSize: Typography.sm, color: Colors.textSecondary },
  chipTextSelected: { color: Colors.primary, fontWeight: Typography.semibold },

  customRow:  { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  customInput:{ flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary },
  addBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, justifyContent: 'center' },
  addBtnText: { color: '#FFFFFF', fontSize: Typography.sm, fontWeight: Typography.bold },

  selectedBox:    { backgroundColor: Colors.successBg, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.successBorder },
  selectedTitle:  { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.success, marginBottom: Spacing.sm },
  selectedChip:   { backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4, borderWidth: 1, borderColor: Colors.successBorder },
  selectedChipText: { fontSize: Typography.xs, color: Colors.success, fontWeight: Typography.semibold },

  hint:       { fontSize: Typography.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },
  btn:        { backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.sm, ...Shadows.md },
  btnDisabled:{ opacity: 0.4 },
  btnText:    { color: '#FFFFFF', fontSize: Typography.base, fontWeight: Typography.bold },
})
