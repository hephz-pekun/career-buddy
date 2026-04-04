import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type {
  UserProfile,
  JobMatch,
  JobApplication,
  ScholarshipMatch,
  ScholarshipApplication,
  MoodEntry,
  Activity,
  DayPlan,
} from '@/types'

// ─── Auth slice ───────────────────────────────────────────────────────────────

interface AuthSlice {
  userId: string | null
  isAuthenticated: boolean
  setUserId: (id: string | null) => void
}

// ─── Profile slice ────────────────────────────────────────────────────────────

interface ProfileSlice {
  profile: UserProfile | null
  resumeText: string
  onboardingComplete: boolean
  setProfile: (profile: UserProfile) => void
  updateProfile: (partial: Partial<UserProfile>) => void
  setResumeText: (text: string) => void
  setOnboardingComplete: (v: boolean) => void
}

// ─── Check-in slice ───────────────────────────────────────────────────────────

interface CheckinSlice {
  todayPlan: DayPlan | null
  activities: Activity[]
  moodHistory: MoodEntry[]
  checkedInToday: boolean
  setTodayPlan: (plan: DayPlan) => void
  setActivities: (acts: Activity[]) => void
  toggleActivity: (id: string) => void
  addMoodEntry: (entry: MoodEntry) => void
  setCheckedInToday: (v: boolean) => void
  resetCheckin: () => void
}

// ─── Matches slice ────────────────────────────────────────────────────────────

interface MatchesSlice {
  aiJobs: JobMatch[]
  liveJobs: JobMatch[]
  aiScholarships: ScholarshipMatch[]
  liveScholarships: ScholarshipMatch[]
  lastJobsFetch: string | null
  lastScholsFetch: string | null
  setAIJobs: (jobs: JobMatch[]) => void
  setLiveJobs: (jobs: JobMatch[]) => void
  setAIScholarships: (s: ScholarshipMatch[]) => void
  setLiveScholarships: (s: ScholarshipMatch[]) => void
}

// ─── Tracker slice ────────────────────────────────────────────────────────────

interface TrackerSlice {
  jobApplications: JobApplication[]
  scholApplications: ScholarshipApplication[]
  addJobApplication: (app: JobApplication) => void
  updateJobApplication: (id: string, partial: Partial<JobApplication>) => void
  removeJobApplication: (id: string) => void
  addScholApplication: (app: ScholarshipApplication) => void
  updateScholApplication: (id: string, partial: Partial<ScholarshipApplication>) => void
  removeScholApplication: (id: string) => void
}

// ─── Combined store ───────────────────────────────────────────────────────────

type AppStore = AuthSlice & ProfileSlice & CheckinSlice & MatchesSlice & TrackerSlice

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ── Auth ──
      userId: null,
      isAuthenticated: false,
      setUserId: (id) => set({ userId: id, isAuthenticated: !!id }),

      // ── Profile ──
      profile: null,
      resumeText: '',
      onboardingComplete: false,
      setProfile: (profile) => set({ profile }),
      updateProfile: (partial) =>
        set((s) => ({ profile: s.profile ? { ...s.profile, ...partial } : null })),
      setResumeText: (resumeText) => set({ resumeText }),
      setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),

      // ── Check-in ──
      todayPlan: null,
      activities: [],
      moodHistory: [],
      checkedInToday: false,
      setTodayPlan: (todayPlan) => set({ todayPlan }),
      setActivities: (activities) => set({ activities }),
      toggleActivity: (id) =>
        set((s) => ({
          activities: s.activities.map((a) =>
            a.id === id ? { ...a, done: !a.done } : a,
          ),
        })),
      addMoodEntry: (entry) =>
        set((s) => {
          const filtered = s.moodHistory.filter((m) => m.date !== entry.date)
          const updated = [entry, ...filtered].slice(0, 90) // keep 90 days
          return { moodHistory: updated }
        }),
      setCheckedInToday: (checkedInToday) => set({ checkedInToday }),
      resetCheckin: () =>
        set({ todayPlan: null, activities: [], checkedInToday: false }),

      // ── Matches ──
      aiJobs: [],
      liveJobs: [],
      aiScholarships: [],
      liveScholarships: [],
      lastJobsFetch: null,
      lastScholsFetch: null,
      setAIJobs: (aiJobs) => set({ aiJobs, lastJobsFetch: new Date().toISOString() }),
      setLiveJobs: (liveJobs) => set({ liveJobs }),
      setAIScholarships: (aiScholarships) =>
        set({ aiScholarships, lastScholsFetch: new Date().toISOString() }),
      setLiveScholarships: (liveScholarships) => set({ liveScholarships }),

      // ── Tracker ──
      jobApplications: [],
      scholApplications: [],
      addJobApplication: (app) =>
        set((s) => ({ jobApplications: [app, ...s.jobApplications] })),
      updateJobApplication: (id, partial) =>
        set((s) => ({
          jobApplications: s.jobApplications.map((a) =>
            a.id === id ? { ...a, ...partial, updatedAt: new Date().toISOString() } : a,
          ),
        })),
      removeJobApplication: (id) =>
        set((s) => ({
          jobApplications: s.jobApplications.filter((a) => a.id !== id),
        })),
      addScholApplication: (app) =>
        set((s) => ({ scholApplications: [app, ...s.scholApplications] })),
      updateScholApplication: (id, partial) =>
        set((s) => ({
          scholApplications: s.scholApplications.map((a) =>
            a.id === id ? { ...a, ...partial, updatedAt: new Date().toISOString() } : a,
          ),
        })),
      removeScholApplication: (id) =>
        set((s) => ({
          scholApplications: s.scholApplications.filter((a) => a.id !== id),
        })),
    }),
    {
      name: 'career-buddy-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist non-sensitive, non-ephemeral state
      partialize: (state) => ({
        profile: state.profile,
        onboardingComplete: state.onboardingComplete,
        moodHistory: state.moodHistory,
        jobApplications: state.jobApplications,
        scholApplications: state.scholApplications,
        aiJobs: state.aiJobs,
        aiScholarships: state.aiScholarships,
        lastJobsFetch: state.lastJobsFetch,
        lastScholsFetch: state.lastScholsFetch,
        checkedInToday: state.checkedInToday,
        activities: state.activities,
        todayPlan: state.todayPlan,
      }),
    },
  ),
)

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectAllJobs = (s: AppStore): JobMatch[] => [
  ...s.liveJobs,
  ...s.aiJobs,
]

export const selectAllScholarships = (s: AppStore): ScholarshipMatch[] => [
  ...s.liveScholarships,
  ...s.aiScholarships,
]

export const selectProgressToday = (s: AppStore): number => {
  if (!s.activities.length) return 0
  const done = s.activities.filter((a) => a.done).length
  return Math.round((done / s.activities.length) * 100)
}

export const selectCheckinStreak = (s: AppStore): number => {
  let streak = 0
  for (let i = 0; i < 90; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    if (s.moodHistory.find((m) => m.date === key)) {
      streak++
    } else {
      break
    }
  }
  return streak
}