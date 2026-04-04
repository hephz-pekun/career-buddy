import { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppStore, selectAllJobs, selectAllScholarships } from '@/store'
import {
  Card,
  Badge,
  Button,
  EmptyState,
  LoadingSpinner,
} from '@/components/ui'
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants'
import {
  generateAIJobs,
  fetchLiveJobs,
  generateAIScholarships,
  fetchLiveScholarships,
} from '@/services/anthropic'
import type { JobMatch, ScholarshipMatch } from '@/types'
import { differenceInDays, parseISO } from 'date-fns'

type Tab = 'jobs' | 'scholarships'
type JobFilter = 'all' | 'live' | 'ai'
type ScholFilter = 'all' | 'live' | 'ai' | 'urgent' | 'soon'

// ─── Urgency helper ───────────────────────────────────────────────────────────

function getUrgency(deadlineDate?: string): {
  label: string
  variant: 'danger' | 'warning' | 'neutral'
  key: 'urgent' | 'soon' | 'later'
} {
  if (!deadlineDate) return { label: 'deadline TBD', variant: 'neutral', key: 'later' }
  const days = differenceInDays(parseISO(deadlineDate), new Date())
  if (days < 0)  return { label: 'passed',               variant: 'neutral', key: 'later'  }
  if (days <= 14) return { label: `due in ${days} days!`, variant: 'danger',  key: 'urgent' }
  if (days <= 30) return { label: `due in ~${Math.ceil(days / 7)} wks`, variant: 'warning', key: 'soon' }
  return {
    label: `due ${new Date(deadlineDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    variant: 'neutral',
    key: 'later',
  }
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MatchesScreen() {
  const profile = useAppStore((s) => s.profile)
  const { setAIJobs, setLiveJobs, setAIScholarships, setLiveScholarships, addJobApplication } =
    useAppStore()
  const allJobs = useAppStore(selectAllJobs)
  const allSchols = useAppStore(selectAllScholarships)

  const [activeTab, setActiveTab] = useState<Tab>('jobs')
  const [jobFilter, setJobFilter] = useState<JobFilter>('all')
  const [scholFilter, setScholFilter] = useState<ScholFilter>('all')
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [loadingSchols, setLoadingSchols] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Load on mount if empty
  useEffect(() => {
    if (allJobs.length === 0) loadJobs()
    if (allSchols.length === 0 && profile?.wantsScholarships) loadScholarships()
  }, [])

  const loadJobs = async () => {
    if (!profile) return
    setLoadingJobs(true)
    try {
      const [aiRes, liveRes] = await Promise.allSettled([
        generateAIJobs(profile),
        fetchLiveJobs(profile),
      ])
      if (aiRes.status === 'fulfilled') {
        setAIJobs(aiRes.value.jobs.map((j, i) => ({ ...j, id: `ai-${i}-${Date.now()}` })))
      }
      if (liveRes.status === 'fulfilled') {
        setLiveJobs(liveRes.value.jobs.map((j, i) => ({ ...j, id: `live-${i}-${Date.now()}` })))
      }
    } catch {
      Alert.alert('oops', 'couldn\'t load matches right now. check your connection and try again.')
    } finally {
      setLoadingJobs(false)
    }
  }

  const loadScholarships = async () => {
    if (!profile) return
    setLoadingSchols(true)
    try {
      const [aiRes, liveRes] = await Promise.allSettled([
        generateAIScholarships(profile),
        fetchLiveScholarships(profile),
      ])
      if (aiRes.status === 'fulfilled') {
        setAIScholarships(
          aiRes.value.scholarships.map((s, i) => ({ ...s, id: `ai-schol-${i}-${Date.now()}` })),
        )
      }
      if (liveRes.status === 'fulfilled') {
        setLiveScholarships(
          liveRes.value.scholarships.map((s, i) => ({
            ...s,
            id: `live-schol-${i}-${Date.now()}`,
          })),
        )
      }
    } catch {
      Alert.alert('oops', 'couldn\'t load scholarships right now.')
    } finally {
      setLoadingSchols(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    if (activeTab === 'jobs') await loadJobs()
    else await loadScholarships()
    setRefreshing(false)
  }

  // ── Job filtering ──────────────────────────────────────────────────────────
  const filteredJobs = allJobs
    .filter((j) => {
      if (jobFilter === 'live') return j.source === 'live'
      if (jobFilter === 'ai')   return j.source === 'ai'
      return true
    })
    .sort((a, b) => {
      // live first, then by score
      if (a.source !== b.source) return a.source === 'live' ? -1 : 1
      return b.matchScore - a.matchScore
    })

  // ── Scholarship filtering ──────────────────────────────────────────────────
  const filteredSchols = allSchols
    .filter((s) => {
      if (scholFilter === 'live')   return s.source === 'live'
      if (scholFilter === 'ai')     return s.source === 'ai'
      if (scholFilter === 'urgent') return getUrgency(s.deadlineDate).key === 'urgent'
      if (scholFilter === 'soon')   return getUrgency(s.deadlineDate).key === 'soon'
      return true
    })
    .sort((a, b) => {
      const urgOrder = { urgent: 0, soon: 1, later: 2 }
      const ua = urgOrder[getUrgency(a.deadlineDate).key]
      const ub = urgOrder[getUrgency(b.deadlineDate).key]
      if (ua !== ub) return ua - ub
      if (a.source !== b.source) return a.source === 'live' ? -1 : 1
      return b.matchScore - a.matchScore
    })

  return (
    <SafeAreaView style={styles.safe}>
      {/* Tab toggle */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'jobs' && styles.tabBtnActive]}
          onPress={() => setActiveTab('jobs')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'jobs' && styles.tabBtnTextActive]}>
            jobs & internships
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'scholarships' && styles.tabBtnActive]}
          onPress={() => {
            setActiveTab('scholarships')
            if (allSchols.length === 0) loadScholarships()
          }}
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === 'scholarships' && styles.tabBtnTextActive,
            ]}
          >
            scholarships
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'jobs' ? (
          <>
            {/* Filter pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              {(['all', 'live', 'ai'] as JobFilter[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterPill, jobFilter === f && styles.filterPillActive]}
                  onPress={() => setJobFilter(f)}
                >
                  <Text style={[styles.filterPillText, jobFilter === f && styles.filterPillTextActive]}>
                    {f === 'all' ? 'all sources' : f === 'live' ? '🟢 live' : '🤖 AI matched'}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.refreshBtn} onPress={loadJobs}>
                <Text style={styles.refreshBtnText}>↻ refresh</Text>
              </TouchableOpacity>
            </ScrollView>

            {loadingJobs ? (
              <LoadingSpinner message="finding your best matches..." />
            ) : filteredJobs.length === 0 ? (
              <EmptyState emoji="🔍" message="no matches yet" sub="pull to refresh or tap ↻ refresh" />
            ) : (
              <>
                {filteredJobs
                  .filter((j) => j.source === 'live')
                  .length > 0 && (
                  <Text style={styles.sourceDivider}>live listings</Text>
                )}
                {filteredJobs
                  .filter((j) => j.source === 'live')
                  .map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}

                {filteredJobs
                  .filter((j) => j.source === 'ai')
                  .length > 0 && (
                  <Text style={styles.sourceDivider}>AI-matched roles</Text>
                )}
                {filteredJobs
                  .filter((j) => j.source === 'ai')
                  .map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
              </>
            )}
          </>
        ) : (
          <>
            {/* Scholarship filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              {(['all', 'live', 'ai', 'urgent', 'soon'] as ScholFilter[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterPill, scholFilter === f && styles.filterPillActive]}
                  onPress={() => setScholFilter(f)}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      scholFilter === f && styles.filterPillTextActive,
                    ]}
                  >
                    {f === 'all'    ? 'all'
                     : f === 'live'   ? '🟢 live'
                     : f === 'ai'     ? '🤖 AI'
                     : f === 'urgent' ? '🔴 urgent'
                     :                  '🟡 soon'}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.refreshBtn} onPress={loadScholarships}>
                <Text style={styles.refreshBtnText}>↻ refresh</Text>
              </TouchableOpacity>
            </ScrollView>

            {loadingSchols ? (
              <LoadingSpinner message="searching scholarship databases..." />
            ) : filteredSchols.length === 0 ? (
              <EmptyState emoji="🎓" message="no scholarships found" sub="pull to refresh or tap ↻ refresh" />
            ) : (
              <>
                {filteredSchols
                  .filter((s) => s.source === 'live')
                  .length > 0 && (
                  <Text style={styles.sourceDivider}>live scholarships</Text>
                )}
                {filteredSchols
                  .filter((s) => s.source === 'live')
                  .map((s) => (
                    <ScholarshipCard key={s.id} scholarship={s} />
                  ))}

                {filteredSchols
                  .filter((s) => s.source === 'ai')
                  .length > 0 && (
                  <Text style={styles.sourceDivider}>AI-matched scholarships</Text>
                )}
                {filteredSchols
                  .filter((s) => s.source === 'ai')
                  .map((s) => (
                    <ScholarshipCard key={s.id} scholarship={s} />
                  ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Job card ─────────────────────────────────────────────────────────────────

function JobCard({ job }: { job: JobMatch }) {
  const addJobApplication = useAppStore((s) => s.addJobApplication)
  const profile = useAppStore((s) => s.profile)

  const scoreColor =
    job.matchScore >= 85 ? Colors.success :
    job.matchScore >= 70 ? Colors.warning : Colors.gray500

  const onTrack = () => {
    addJobApplication({
      id: `app-${Date.now()}`,
      userId: profile?.id ?? '',
      role: job.title,
      company: job.company,
      status: 'applied',
      jobMatchId: job.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    Alert.alert('tracked!', `${job.title} at ${job.company} added to your tracker.`)
  }

  const onApply = () => {
    if (job.url) Linking.openURL(job.url)
  }

  return (
    <Card style={[styles.matchCard, job.source === 'live' && styles.matchCardLive]}>
      <View style={styles.matchHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.matchTitleRow}>
            <Text style={styles.matchTitle} numberOfLines={1}>{job.title}</Text>
            {job.source === 'live' && (
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>live</Text>
              </View>
            )}
          </View>
          <Text style={styles.matchSub}>{job.company} · {job.location}</Text>
          {job.postedDate && (
            <Text style={styles.matchMeta}>posted {job.postedDate}</Text>
          )}
        </View>
        <Text style={[styles.matchScore, { color: scoreColor }]}>{job.matchScore}%</Text>
      </View>

      <View style={styles.tagRow}>
        {[job.type, job.field, ...(job.tags ?? [])].filter(Boolean).map((t, i) => (
          <View key={i} style={styles.tag}>
            <Text style={styles.tagText}>{t}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.reason}>{job.matchReason}</Text>

      <View style={styles.matchActions}>
        {job.source === 'live' && job.url && (
          <TouchableOpacity style={styles.applyBtn} onPress={onApply}>
            <Text style={styles.applyBtnText}>apply →</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.trackBtn} onPress={onTrack}>
          <Text style={styles.trackBtnText}>+ track</Text>
        </TouchableOpacity>
      </View>
    </Card>
  )
}

// ─── Scholarship card ─────────────────────────────────────────────────────────

function ScholarshipCard({ scholarship: s }: { scholarship: ScholarshipMatch }) {
  const addScholApplication = useAppStore((s) => s.addScholApplication)
  const profile = useAppStore((state) => state.profile)
  const urgency = getUrgency(s.deadlineDate)

  const urgencyColor =
    urgency.key === 'urgent' ? Colors.danger :
    urgency.key === 'soon'   ? Colors.warning : Colors.gray500

  const onTrack = () => {
    addScholApplication({
      id: `schol-${Date.now()}`,
      userId: profile?.id ?? '',
      name: s.name,
      org: s.organization,
      deadline: s.deadlineDate,
      amount: s.amount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    Alert.alert('tracked!', `${s.name} added to your scholarships tracker.`)
  }

  const onApply = () => {
    if (s.url) Linking.openURL(s.url)
  }

  return (
    <Card style={[styles.matchCard, styles.matchCardSchol]}>
      <View style={styles.matchHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.matchTitleRow}>
            <Text style={styles.matchTitle} numberOfLines={1}>{s.name}</Text>
            {s.source === 'live' && (
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>live</Text>
              </View>
            )}
          </View>
          <Text style={styles.matchSub}>{s.organization} · {s.amount}</Text>
        </View>
        <Text style={[styles.matchScore, { color: Colors.info }]}>{s.matchScore}%</Text>
      </View>

      <View style={styles.tagRow}>
        <View style={[styles.tag, { backgroundColor: urgencyColor + '22' }]}>
          <Text style={[styles.tagText, { color: urgencyColor }]}>{urgency.label}</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{s.type}</Text>
        </View>
        {(s.tags ?? []).map((t, i) => (
          <View key={i} style={styles.tag}>
            <Text style={styles.tagText}>{t}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.reason}>{s.matchReason}</Text>

      <View style={styles.matchActions}>
        {s.source === 'live' && s.url && (
          <TouchableOpacity style={styles.applyBtn} onPress={onApply}>
            <Text style={styles.applyBtnText}>apply →</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.trackBtn} onPress={onTrack}>
          <Text style={styles.trackBtnText}>+ track</Text>
        </TouchableOpacity>
      </View>
    </Card>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive:     { borderBottomColor: Colors.primary },
  tabBtnText:       { fontSize: Typography.sm, color: Colors.gray500, fontWeight: Typography.medium },
  tabBtnTextActive: { color: Colors.primary },

  filterRow:  { marginBottom: Spacing.lg },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.gray100,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  filterPillActive:     { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  filterPillText:       { fontSize: Typography.xs, color: Colors.gray600, fontWeight: Typography.medium },
  filterPillTextActive: { color: Colors.primary },
  refreshBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  refreshBtnText: { fontSize: Typography.xs, color: Colors.gray600 },

  sourceDivider: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },

  matchCard: {
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.info,
  },
  matchCardLive:  { borderLeftColor: Colors.success },
  matchCardSchol: { borderLeftColor: Colors.primary },

  matchHeader:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  matchTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  matchTitle:    { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.gray900, flex: 1 },
  matchSub:      { fontSize: Typography.xs, color: Colors.gray500, marginTop: 2 },
  matchMeta:     { fontSize: Typography.xs, color: Colors.gray400, marginTop: 1 },
  matchScore:    { fontSize: Typography.base, fontWeight: Typography.bold, marginLeft: Spacing.sm },

  liveBadge: {
    backgroundColor: Colors.successLight,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  liveBadgeText: { fontSize: 10, color: Colors.success, fontWeight: Typography.bold },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.gray100,
  },
  tagText: { fontSize: Typography.xs, color: Colors.gray600 },

  reason: { fontSize: Typography.xs, color: Colors.gray500, lineHeight: 18, marginBottom: Spacing.md },

  matchActions: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end' },
  applyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  applyBtnText: { fontSize: Typography.xs, color: Colors.white, fontWeight: Typography.semibold },
  trackBtn: {
    backgroundColor: Colors.gray100,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  trackBtnText: { fontSize: Typography.xs, color: Colors.gray700 },
})
