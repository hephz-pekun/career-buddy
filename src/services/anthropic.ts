import Constants from 'expo-constants'
import type {
  AISkillExtractResponse,
  AIJobMatchResponse,
  AIScholarshipResponse,
  AIDayPlanResponse,
  MoodType,
  UserProfile,
} from '../../src/constants'

const API_KEY =
  Constants.expoConfig?.extra?.anthropicApiKey ??
  process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ??
  ''

const MODEL = 'claude-sonnet-4-20250514'

// ─── Core fetch helper ────────────────────────────────────────────────────────

async function callClaude(
  systemPrompt: string | null,
  userMessage: string,
  useWebSearch = false,
): Promise<string> {
  const body: Record<string, unknown> = {
    model: MODEL,
    max_tokens: 1500,
    messages: [{ role: 'user', content: userMessage }],
  }

  if (systemPrompt) body.system = systemPrompt

  if (useWebSearch) {
    body.tools = [{ type: 'web_search_20250305', name: 'web_search' }]
  }

  const res = await fetch('https://ntbymxzahqzmuqwilqyo.supabase.co/functions/v1/claude-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status}`)
  }

  const data = await res.json()
  return (
    data.content
      ?.map((b: { type: string; text?: string }) =>
        b.type === 'text' ? b.text : '',
      )
      .join('') ?? ''
  )
}

function parseJSON<T>(raw: string): T {
  const cleaned = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}

// ─── Resume skill extraction ──────────────────────────────────────────────────

export async function extractResumeSkills(
  resumeText: string,
  existingFields: string[],
): Promise<AISkillExtractResponse> {
  const raw = await callClaude(
    'You are a resume parser. Extract skills, tools, technologies, and experiences. Return ONLY valid JSON — no markdown, no explanation.',
    'Resume content (may be a PDF filename if text extraction failed):\n' + resumeText.slice(0, 4000) + '\n\nIMPORTANT: Always return valid JSON even if resume content is limited. Use reasonable defaults.'  )
  return parseJSON<AISkillExtractResponse>(raw)
}

// ─── Job matching ─────────────────────────────────────────────────────────────

export async function generateAIJobs(profile: UserProfile): Promise<AIJobMatchResponse> {
  const raw = await callClaude(
    null,
    `You are a job matching engine for college students. Use the student's resume skills as the PRIMARY matching signal.

Student profile:
- Name: ${profile.name}
- School: ${profile.school ?? 'college student'}, Major: ${profile.major ?? 'undeclared'}
- Career interests: ${profile.fields.join(', ') || 'general'}
- Job types wanted: ${profile.jobTypes.join(', ') || 'any'}
- Location preference: ${profile.location || 'anywhere'}
- Skills from resume: ${profile.skills.join(', ') || 'not provided'}

Today is ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
Generate exactly 6 realistic, specific job or internship matches. Prioritize roles where their skills are directly applicable. Return ONLY a JSON array:
[{"title":"","company":"","type":"internship|full-time|part-time|remote","field":"","location":"","matchScore":60-99,"matchReason":"1 warm sentence citing specific resume skills","tags":["3 short strings"],"source":"ai"}]`,
  )
  const jobs = parseJSON<Omit<AIJobMatchResponse['jobs'][number], 'id'>[]>(raw)
  return { jobs }
}

export async function fetchLiveJobs(profile: UserProfile): Promise<AIJobMatchResponse> {
  const raw = await callClaude(
    null,
    `Search for real current job postings right now for a student with:
- Skills: ${profile.skills.slice(0, 8).join(', ')}
- Field: ${profile.fields[0] ?? 'general'}
- Type: ${profile.jobTypes[0] ?? 'internship'}
- Location: ${profile.location ?? 'anywhere'}

Search LinkedIn, Indeed, Handshake, and company career pages. Return ONLY a JSON array of up to 4 real current listings:
[{"title":"","company":"","type":"","field":"","location":"","url":"","postedDate":"","matchReason":"1 sentence why this fits their skills","tags":[],"matchScore":90,"source":"live"}]`,
    true, // useWebSearch
  )
  const jobs = parseJSON<Omit<AIJobMatchResponse['jobs'][number], 'id'>[]>(raw)
  return { jobs }
}

// ─── Scholarship matching ─────────────────────────────────────────────────────

export async function generateAIScholarships(
  profile: UserProfile,
): Promise<AIScholarshipResponse> {
  const raw = await callClaude(
    null,
    `You are a scholarship advisor for college students. Match scholarships to the student's actual background.

Student profile:
- Name: ${profile.name}
- School: ${profile.school ?? 'college student'}, Major: ${profile.major ?? 'undeclared'}
- Skills: ${profile.skills.join(', ') || 'not provided'}
- Interests: ${profile.fields.join(', ') || 'general'}

Today's date is ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Generate 4 realistic scholarship matches with deadlines in the next 12 months from today. Return ONLY JSON array:
[{"name":"","organization":"","amount":"$X,XXX","type":"merit|need|identity|essay","deadlineDate":"YYYY-MM-DD","deadlineLabel":"Month YYYY","matchReason":"1 warm sentence","tags":["3 strings"],"matchScore":60-99,"source":"ai"}]`,
  )
  const scholarships = parseJSON<
    Omit<AIScholarshipResponse['scholarships'][number], 'id'>[]
  >(raw)
  return { scholarships }
}

export async function fetchLiveScholarships(
  profile: UserProfile,
): Promise<AIScholarshipResponse> {
  const raw = await callClaude(
    null,
    `Search for real open scholarships for college students in 2025-2026 that match:
- Major: ${profile.major ?? 'undeclared'}
- Interests: ${profile.fields.join(', ') || 'general'}
- Skills: ${profile.skills.slice(0, 6).join(', ') || 'general'}

Search Fastweb, Scholarships.com, College Board, Unigo, and foundation websites. Return ONLY JSON array of up to 5 real currently-open scholarships:
[{"name":"","organization":"","amount":"$X,XXX","type":"merit|need|identity|essay","deadlineDate":"YYYY-MM-DD","deadlineLabel":"Month YYYY","url":"","matchReason":"1 sentence","tags":["3 strings"],"matchScore":75-99,"source":"live"}]`,
    true, // useWebSearch
  )
  const scholarships = parseJSON<
    Omit<AIScholarshipResponse['scholarships'][number], 'id'>[]
  >(raw)
  return { scholarships }
}

// ─── Daily check-in plan ──────────────────────────────────────────────────────

export async function generateDayPlan(
  profile: UserProfile,
  mood: MoodType,
  note: string,
  context: {
    jobsApplied: number
    scholsTracked: number
    hasUpcomingInterview: boolean
  },
): Promise<AIDayPlanResponse> {
  const raw = await callClaude(
    null,
    `You are a warm, supportive career coach for a college student. Generate a personalized day plan.

About them:
- Name: ${profile.name}
- School: ${profile.school ?? 'college'}, Major: ${profile.major ?? 'undeclared'}
- Resume skills: ${profile.skills.slice(0, 8).join(', ') || 'not provided'}
- Career interests: ${profile.fields.join(', ') || 'general'}
- Jobs applied so far: ${context.jobsApplied}
- Scholarships tracked: ${context.scholsTracked}
- Has upcoming interview: ${context.hasUpcomingInterview}
- Today's mood: ${mood}
- What's on their mind: "${note || 'nothing specific'}"

Return ONLY JSON:
{
  "greeting": "1 warm sentence referencing their mood and name — like a supportive friend",
  "subtitle": "1 short encouraging line, never guilt-trippy",
  "activities": [
    {"title":"short task","desc":"1-2 sentences specific to their skills/field/situation","tag":"easy|medium|focus|rest","action":"matches|tracker|prep|null"}
  ]
}

Mood rules (follow strictly):
- motivated/hopeful: 4-5 tasks, mix easy/medium/focus, include applying + prep
- okay: 3-4 tasks, balanced
- overwhelmed/stressed: max 3 tasks, only easy or rest, very gentle language
- tired: 2-3 tasks, easy/rest only, never push hard tasks

If upcoming interview: include 1 prep task.
If tracking scholarships: include 1 scholarship task.
Reference their actual skills in at least 1 task description.
Never shame, never guilt. JSON only.`,
  )
  return parseJSON<AIDayPlanResponse>(raw)
}

// ─── Rejection reframe ────────────────────────────────────────────────────────

export async function generateRejectionReframe(
  profile: UserProfile,
  role: string,
  company: string,
): Promise<string> {
  return callClaude(
    'You are a warm, supportive career coach. Write a short (2-3 sentence) personal rejection reframe for a college student. Be human and warm. No bullet points.',
    `${profile.name} just got rejected from ${role} at ${company}. Their skills: ${profile.skills.slice(0, 5).join(', ')}. Their field: ${profile.fields[0] ?? 'general'}. Write a short personal encouragement.`,
  )
}

// ─── Interview prep feedback ──────────────────────────────────────────────────

export async function generateInterviewFeedback(
  question: string,
  answer: string,
  mood: string,
): Promise<string> {
  return callClaude(
    `You are a warm, casual interview coach for college students. Give feedback in 3-4 sentences max. ${mood === 'nervous' ? 'They are nervous — lead with encouragement, be very gentle.' : ''} ${mood === 'tired' ? 'They are tired — be brief and kind above all.' : ''} Always start with what worked. Then one specific actionable suggestion. No bullet points. Talk like a supportive friend.`,
    `Question: "${question}"\nAnswer: "${answer}"`,
  )
}

