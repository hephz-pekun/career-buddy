import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import DateTimePicker from '@react-native-community/datetimepicker'
import { format } from 'date-fns'
import { useAppStore } from '../../src/store'
import { Card, Button, EmptyState } from '../../src/components/ui'
import { Colors, Typography, Spacing, Radius, Shadows } from '../../src/constants'
import { generateRejectionReframe } from '../../src/services/anthropic'
import type { ApplicationStatus, ScholarshipStatus } from '../../src/types'

type TrackerTab = 'jobs' | 'scholarships'

// ─── Status config ────────────────────────────────────────────────────────────

const JOB_STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bg: string }> = {
  applied:   { label: 'applied',   color: Colors.info,    bg: Colors.infoLight    },
  interview: { label: 'interview', color: Colors.warning, bg: Colors.warningLight },
  offer:     { label: 'offer! 🎉', color: Colors.success, bg: Colors.successLight },
  rejected:  { label: 'rejected',  color: Colors.danger,  bg: Colors.dangerLight  },
}

const SCHOL_STATUS_CONFIG: Record<ScholarshipStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'researching', color: Colors.gray500, bg: Colors.gray100      },
  submitted: { label: 'submitted',   color: Colors.info,    bg: Colors.infoLight    },
  awarded:   { label: 'awarded! 🎉', color: Colors.success, bg: Colors.successLight },
  rejected:  { label: 'not selected',color: Colors.danger,  bg: Colors.dangerLight  },
}

// ─── Rejection reframe modal ──────────────────────────────────────────────────

function RejectionModal({
  visible,
  role,
  company,
  reframe,
  onClose,
  onPrep,
}: {
  visible: boolean
  role: string
  company: string
  reframe: string
  onClose: () => void
  onPrep: () => void
}) {
  const reframes = [
    { emoji: '💛', title: 'rejection is redirection.' },
    { emoji: '🌱', title: 'this is part of the process.' },
    { emoji: '🔥', title: 'you applied. that took courage.' },
    { emoji: '💪', title: 'data, not defeat.' },
    { emoji: '🌟', title: 'one door closed. others are open.' },
  ]
  const pick = reframes[Math.floor(Math.random() * reframes.length)]

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={reframeStyles.overlay}>
        <View style={reframeStyles.modal}>
          <Text style={reframeStyles.emoji}>{pick.emoji}</Text>
          <Text style={reframeStyles.title}>{pick.title}</Text>
          <Text style={reframeStyles.body}>
            {reframe || `Getting rejected from ${role} at ${company} stings — but it doesn't define your worth or your future. Keep going.`}
          </Text>
          <View style={reframeStyles.actions}>
            <Button label="got it 💛" onPress={onClose} style={{ flex: 1 }} />
            <Button
              label="practice for next one"
              variant="secondary"
              onPress={onPrep}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const reframeStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing['2xl'],
    width: '100%',
    alignItems: 'center',
  },
  emoji:   { fontSize: 48, marginBottom: Spacing.md },
  title:   { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.gray900, textAlign: 'center', marginBottom: Spacing.sm },
  body:    { fontSize: Typography.sm, color: Colors.gray600, lineHeight: 22, textAlign: 'center', marginBottom: Spacing.xl },
  actions: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
})

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function TrackerScreen() {
  const profile = useAppStore((s) => s.profile)
  const { jobApplications, scholApplications, addJobApplication, updateJobApplication, addScholApplication } = useAppStore()

  const [activeTab, setActiveTab] = useState<TrackerTab>('jobs')

  // Job form state
  const [company, setCompany]   = useState('')
  const [role, setRole]         = useState('')
  const [status, setStatus]     = useState<ApplicationStatus>('applied')
  const [interviewDate, setInterviewDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Scholarship form state
  const [scholName, setScholName]         = useState('')
  const [scholOrg, setScholOrg]           = useState('')
  const [scholDeadline, setScholDeadline] = useState<Date | null>(null)
  const [scholAmount, setScholAmount]     = useState('')
  const [scholStatus, setScholStatus]     = useState<ScholarshipStatus>('pending')
  const [showScholDatePicker, setShowScholDatePicker] = useState(false)

  // Rejection reframe
  const [reframeVisible, setReframeVisible] = useState(false)
  const [reframeText, setReframeText]       = useState('')
  const [reframeRole, setReframeRole]       = useState('')
  const [reframeCompany, setReframeCompany] = useState('')

  const addJob = async () => {
    if (!company.trim() || !role.trim()) {
      Alert.alert('hang on', 'add company and role first!')
      return
    }
    const newApp = {
      id: `app-${Date.now()}`,
      userId: profile?.id ?? '',
      role: role.trim(),
      company: company.trim(),
      status,
      interviewDate: interviewDate ? format(interviewDate, 'yyyy-MM-dd') : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addJobApplication(newApp)
    setCompany(''); setRole(''); setStatus('applied'); setInterviewDate(null)

    if (status === 'rejected') {
      triggerReframe(role.trim(), company.trim())
    }
  }

  const triggerReframe = async (r: string, c: string) => {
    setReframeRole(r); setReframeCompany(c); setReframeText('')
    setReframeVisible(true)
    if (profile) {
      try {
        const ai = await generateRejectionReframe(profile, r, c)
        setReframeText(ai)
      } catch {}
    }
  }

  const updateStatus = async (id: string, newStatus: ApplicationStatus, appRole: string, appCompany: string) => {
    updateJobApplication(id, { status: newStatus })
    if (newStatus === 'rejected') {
      triggerReframe(appRole, appCompany)
    }
  }

  const addScholarship = () => {
    if (!scholName.trim()) {
      Alert.alert('hang on', 'add the scholarship name!')
      return
    }
    addScholApplication({
      id: `schol-${Date.now()}`,
      userId: profile?.id ?? '',
      name: scholName.trim(),
      org: scholOrg.trim(),
      deadline: scholDeadline ? format(scholDeadline, 'yyyy-MM-dd') : undefined,
      amount: scholAmount.trim(),
      status: scholStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setScholName(''); setScholOrg(''); setScholDeadline(null); setScholAmount('')
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Tab row */}
      <View style={styles.tabRow}>
        {(['jobs', 'scholarships'] as TrackerTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabBtnText, activeTab === t && styles.tabBtnTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {activeTab === 'jobs' ? (
          <>
            {/* Add job form */}
            <Card style={styles.formCard}>
              <Text style={styles.formTitle}>add application</Text>
              <Text style={styles.fieldLabel}>company</Text>
              <TextInput style={styles.input} placeholder="e.g. Google" placeholderTextColor={Colors.gray400} value={company} onChangeText={setCompany} />
              <Text style={styles.fieldLabel}>role</Text>
              <TextInput style={styles.input} placeholder="e.g. PM Intern" placeholderTextColor={Colors.gray400} value={role} onChangeText={setRole} />
              <Text style={styles.fieldLabel}>status</Text>
              <View style={styles.statusRow}>
                {(Object.keys(JOB_STATUS_CONFIG) as ApplicationStatus[]).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusPill, status === s && { backgroundColor: JOB_STATUS_CONFIG[s].bg }]}
                    onPress={() => setStatus(s)}
                  >
                    <Text style={[styles.statusPillText, status === s && { color: JOB_STATUS_CONFIG[s].color }]}>
                      {JOB_STATUS_CONFIG[s].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {status === 'interview' && (
                <>
                  <Text style={styles.fieldLabel}>interview date</Text>
                  <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                    <Text style={styles.dateBtnText}>
                      {interviewDate ? format(interviewDate, 'MMM d, yyyy') : 'tap to set date'}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={interviewDate ?? new Date()}
                      mode="date"
                      onChange={(_, d) => { setShowDatePicker(false); if (d) setInterviewDate(d) }}
                      minimumDate={new Date()}
                    />
                  )}
                </>
              )}
              <Button label="add application" onPress={addJob} style={{ marginTop: Spacing.md }} />
            </Card>

            {/* Applications list */}
            <Text style={styles.listTitle}>your applications</Text>
            {jobApplications.length === 0 ? (
              <EmptyState emoji="📤" message="no applications yet" sub="add one above or track from matches!" />
            ) : (
              jobApplications.map((app) => {
                const cfg = JOB_STATUS_CONFIG[app.status]
                return (
                  <Card key={app.id} style={styles.appCard}>
                    <View style={styles.appRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.appRole}>{app.role}</Text>
                        <Text style={styles.appCompany}>{app.company}</Text>
                        {app.interviewDate && (
                          <Text style={styles.appDate}>
                            interview: {format(new Date(app.interviewDate), 'MMM d')}
                          </Text>
                        )}
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                    </View>
                    {/* Quick status update */}
                    <View style={styles.quickStatusRow}>
                      {(Object.keys(JOB_STATUS_CONFIG) as ApplicationStatus[])
                        .filter((s) => s !== app.status)
                        .map((s) => (
                          <TouchableOpacity
                            key={s}
                            style={styles.quickStatusBtn}
                            onPress={() => updateStatus(app.id, s, app.role, app.company)}
                          >
                            <Text style={styles.quickStatusText}>→ {JOB_STATUS_CONFIG[s].label}</Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  </Card>
                )
              })
            )}
          </>
        ) : (
          <>
            {/* Add scholarship form */}
            <Card style={styles.formCard}>
              <Text style={styles.formTitle}>add scholarship</Text>
              <Text style={styles.fieldLabel}>scholarship name</Text>
              <TextInput style={styles.input} placeholder="e.g. Gates Scholarship" placeholderTextColor={Colors.gray400} value={scholName} onChangeText={setScholName} />
              <Text style={styles.fieldLabel}>organization</Text>
              <TextInput style={styles.input} placeholder="e.g. Gates Foundation" placeholderTextColor={Colors.gray400} value={scholOrg} onChangeText={setScholOrg} />
              <Text style={styles.fieldLabel}>deadline</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowScholDatePicker(true)}>
                <Text style={styles.dateBtnText}>
                  {scholDeadline ? format(scholDeadline, 'MMM d, yyyy') : 'tap to set deadline'}
                </Text>
              </TouchableOpacity>
              {showScholDatePicker && (
                <DateTimePicker
                  value={scholDeadline ?? new Date()}
                  mode="date"
                  onChange={(_, d) => { setShowScholDatePicker(false); if (d) setScholDeadline(d) }}
                />
              )}
              <Text style={styles.fieldLabel}>amount (optional)</Text>
              <TextInput style={styles.input} placeholder="e.g. $5,000" placeholderTextColor={Colors.gray400} value={scholAmount} onChangeText={setScholAmount} keyboardType="default" />
              <Text style={styles.fieldLabel}>status</Text>
              <View style={styles.statusRow}>
                {(Object.keys(SCHOL_STATUS_CONFIG) as ScholarshipStatus[]).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusPill, scholStatus === s && { backgroundColor: SCHOL_STATUS_CONFIG[s].bg }]}
                    onPress={() => setScholStatus(s)}
                  >
                    <Text style={[styles.statusPillText, scholStatus === s && { color: SCHOL_STATUS_CONFIG[s].color }]}>
                      {SCHOL_STATUS_CONFIG[s].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Button label="add scholarship" onPress={addScholarship} style={{ marginTop: Spacing.md }} />
            </Card>

            <Text style={styles.listTitle}>your scholarships</Text>
            {scholApplications.length === 0 ? (
              <EmptyState emoji="🎓" message="no scholarships yet" sub="add one above or track from matches!" />
            ) : (
              [...scholApplications]
                .sort((a, b) => {
                  if (!a.deadline && !b.deadline) return 0
                  if (!a.deadline) return 1
                  if (!b.deadline) return -1
                  return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
                })
                .map((s) => {
                  const cfg = SCHOL_STATUS_CONFIG[s.status]
                  return (
                    <Card key={s.id} style={styles.appCard}>
                      <View style={styles.appRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.appRole}>{s.name}</Text>
                          <Text style={styles.appCompany}>{s.org}</Text>
                          {s.deadline && (
                            <Text style={styles.appDate}>
                              deadline: {format(new Date(s.deadline), 'MMM d, yyyy')}
                            </Text>
                          )}
                          {s.amount && <Text style={styles.appMeta}>{s.amount}</Text>}
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                          <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                      </View>
                    </Card>
                  )
                })
            )}
          </>
        )}
      </ScrollView>

      <RejectionModal
        visible={reframeVisible}
        role={reframeRole}
        company={reframeCompany}
        reframe={reframeText}
        onClose={() => setReframeVisible(false)}
        onPrep={() => setReframeVisible(false)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.gray50 },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing['4xl'] },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    paddingHorizontal: Spacing.lg,
  },
  tabBtn: {
    flex: 1, paddingVertical: Spacing.md, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabBtnActive:     { borderBottomColor: Colors.primary },
  tabBtnText:       { fontSize: Typography.sm, color: Colors.gray500, fontWeight: Typography.medium },
  tabBtnTextActive: { color: Colors.primary },

  formCard:   { marginBottom: Spacing.xl },
  formTitle:  { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.gray900, marginBottom: Spacing.lg },
  fieldLabel: { fontSize: Typography.sm, color: Colors.gray600, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  input: {
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: Typography.base,
    color: Colors.gray900,
  },
  statusRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statusPill:    { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.gray100, borderWidth: 1, borderColor: Colors.gray200 },
  statusPillText:{ fontSize: Typography.xs, color: Colors.gray600 },

  dateBtn:     { backgroundColor: Colors.gray50, borderWidth: 1, borderColor: Colors.gray200, borderRadius: Radius.md, padding: Spacing.md },
  dateBtnText: { fontSize: Typography.base, color: Colors.gray700 },

  listTitle: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.gray900, marginBottom: Spacing.md },
  appCard: { marginBottom: Spacing.md },
  appRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: Spacing.sm },
  appRole:    { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.gray900 },
  appCompany: { fontSize: Typography.sm,  color: Colors.gray500 },
  appDate:    { fontSize: Typography.xs,  color: Colors.info, marginTop: 2 },
  appMeta:    { fontSize: Typography.xs,  color: Colors.gray400, marginTop: 2 },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full },
  statusBadgeText: { fontSize: Typography.xs, fontWeight: Typography.semibold },
  quickStatusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.gray100, paddingTop: Spacing.sm },
  quickStatusBtn:  { paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  quickStatusText: { fontSize: Typography.xs, color: Colors.gray500 },
})
