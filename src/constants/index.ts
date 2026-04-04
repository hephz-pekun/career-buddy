// ─── User & Profile ───────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  name: string
  email: string
  school?: string
  major?: string
  location: string
  fields: string[]
  jobTypes: string[]
  wantsScholarships: boolean
  resumeUrl?: string
  skills: string[]
  createdAt: string
  updatedAt: string
}

// ─── Mood ─────────────────────────────────────────────────────────────────────

export type MoodType =
  | 'motivated'
  | 'okay'
  | 'overwhelmed'
  | 'tired'
  | 'stressed'
  | 'hopeful'

export interface MoodEntry {
  id: string
  userId: string
  mood: MoodType
  note?: string
  date: string // YYYY-MM-DD
  createdAt: string
}

export interface DayPlan {
  greeting: string
  subtitle: string
  activities: Activity[]
}

export interface Activity {
  id: string
  title: string
  desc: string
  tag: 'easy' | 'medium' | 'focus' | 'rest'
  action: 'matches' | 'tracker' | 'prep' | null
  done: boolean
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export type JobSource = 'ai' | 'live'
export type JobType = 'internship' | 'full-time' | 'part-time' | 'remote' | 'hybrid' | 'on-site'
export type ApplicationStatus = 'applied' | 'interview' | 'offer' | 'rejected'

export interface JobMatch {
  id: string
  title: string
  company: string
  type: JobType
  field: string
  location: string
  matchScore: number
  matchReason: string
  tags: string[]
  source: JobSource
  url?: string
  postedDate?: string
}

export interface JobApplication {
  id: string
  userId: string
  role: string
  company: string
  status: ApplicationStatus
  interviewDate?: string
  interviewTime?: string
  notes?: string
  jobMatchId?: string
  createdAt: string
  updatedAt: string
}

// ─── Scholarships ─────────────────────────────────────────────────────────────

export type ScholarshipType = 'merit' | 'need' | 'identity' | 'essay'
export type ScholarshipStatus = 'pending' | 'submitted' | 'awarded' | 'rejected'

export interface ScholarshipMatch {
  id: string
  name: string
  organization: string
  amount: string
  type: ScholarshipType
  deadlineDate?: string
  deadlineLabel?: string
  matchReason: string
  tags: string[]
  matchScore: number
  source: JobSource
  url?: string
}

export interface ScholarshipApplication {
  id: string
  userId: string
  name: string
  org: string
  deadline?: string
  amount?: string
  status: ScholarshipStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

// ─── Prep ─────────────────────────────────────────────────────────────────────

export type PrepMood = 'pumped' | 'nervous' | 'tired' | 'blank'
export type QuestionType = 'behavioral' | 'strengths' | 'motivation' | 'situational'

export interface PrepSession {
  id: string
  userId: string
  question: string
  answer: string
  aiFeedback?: string
  mood?: PrepMood
  createdAt: string
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  '(onboarding)': undefined
  '(tabs)': undefined
}

export type OnboardingStackParamList = {
  'step-1': undefined
  'step-2': undefined
  'step-3': undefined
}

export type TabParamList = {
  checkin: undefined
  matches: undefined
  tracker: undefined
  prep: undefined
  history: undefined
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface AIJobMatchResponse {
  jobs: Omit<JobMatch, 'id'>[]
}

export interface AIScholarshipResponse {
  scholarships: Omit<ScholarshipMatch, 'id'>[]
}

export interface AIDayPlanResponse {
  greeting: string
  subtitle: string
  activities: Omit<Activity, 'id' | 'done'>[]
}

export interface AISkillExtractResponse {
  skills: string[]
  inferredFields: string[]
  inferredJobTypes: string[]
}