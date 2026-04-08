import type {
  AISkillExtractResponse,
  AIJobMatchResponse,
  AIScholarshipResponse,
  AIDayPlanResponse,
  MoodType,
  UserProfile,
} from '../types'

const SUPABASE_URL  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? ''
const SUPABASE_KEY  = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''
const PROXY_URL     = `${SUPABASE_URL}/functions/v1/claude-proxy`
const MODEL         = 'claude-sonnet-4-20250514'

// ─── Core fetch helper — routes through Supabase edge function to avoid CORS ──

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

  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Claude proxy error: ${res.status} ${errText}`)
  }

  const data = await res.json()
  return (
    data.content
      ?.map((b: { type: string; text?: string }) => b.type === 'text' ? b.text : '')
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
    `Resume content:\n${resumeText.slice(0, 4000)}\n\nStudent already selected these fields: ${existingFields.join(', ') || 'none yet'}\n\nReturn JSON: {"skills":["up to 20 short skill strings"],"inferredFields":["2-4 career field strings inferred from resume"],"inferredJobTypes":["1-3 job type strings"]}`,
  )
  return parseJSON<AISkillExtractResponse>(raw)
}

// ─── Job matching ─────────────────────────────────────────────────────────────

export async function generateAIJobs(profile: UserProfile): Promise<AIJobMatchResponse> {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const raw = await callClaude(
    null,
    `You are a job matching engine for college students. Today is ${today}. Use the student's actual skills as the PRIMARY matching signal — do NOT generate generic matches.

Student profile:
- Name: ${profile.name}
- School: ${profile.school ?? 'college student'}, Major: ${profile.major ?? 'undeclared'}
- Career interests: ${profile.fields.join(', ') || 'general'}
- Job types wanted: ${profile.jobTypes.join(', ') || 'any'}
- Location preference: ${profile.location || 'anywhere'}
- Skills from resume: ${profile.skills.join(', ') || 'general skills'}

Generate exactly 6 realistic, specific job or internship matches. Each match MUST reference at least one of their actual skills. Return ONLY a JSON array:
[{"title":"","company":"","type":"internship|full-time|part-time|remote","field":"","location":"","matchScore":60-99,"matchReason":"1 warm sentence citing their specific skills","tags":["3 short strings"],"source":"ai"}]`,
  )
  const jobs = parseJSON<Omit<AIJobMatchResponse['jobs'][number], 'id'>[]>(raw)
  return { jobs }
}

export async function fetchLiveJobs(profile: UserProfile): Promise<AIJobMatchResponse> {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const raw = await callClaude(
    null,
    `Search for real current job postings as of ${today} for a student with:
- Skills: ${profile.skills.slice(0, 8).join(', ')}
- Field: ${profile.fields[0] ?? 'general'}
- Type: ${profile.jobTypes[0] ?? 'internship'}
- Location: ${profile.location ?? 'anywhere'}

Search LinkedIn, Indeed, Handshake, and company career pages. Return ONLY a JSON array of up to 4 real currently-open listings:
[{"title":"","company":"","type":"","field":"","location":"","url":"","postedDate":"","matchReason":"1 sentence why this fits their skills","tags":[],"matchScore":90,"source":"live"}]`,
    true,
  )
  const jobs = parseJSON<Omit<AIJobMatchResponse['jobs'][number], 'id'>[]>(raw)
  return { jobs }
}

// ─── Scholarship matching ─────────────────────────────────────────────────────

export async function generateAIScholarships(profile: UserProfile): Promise<AIScholarshipResponse> {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const raw = await callClaude(
    null,
    `You are a scholarship advisor. Today is ${today}. Match scholarships to this student's ACTUAL background — use their specific skills and identity.

Student:
- Name: ${profile.name}
- School: ${profile.school ?? 'college'}, Major: ${profile.major ?? 'undeclared'}
- Skills: ${profile.skills.join(', ') || 'general'}
- Interests: ${profile.fields.join(', ') || 'general'}

Generate 4 realistic scholarship matches with deadlines at least 30 days from today. Return ONLY JSON array:
[{"name":"","organization":"","amount":"$X,XXX","type":"merit|need|identity|essay","deadlineDate":"YYYY-MM-DD","deadlineLabel":"Month YYYY","matchReason":"1 warm sentence referencing their specific background","tags":["3 strings"],"matchScore":60-99,"source":"ai"}]`,
  )
  const scholarships = parseJSON<Omit<AIScholarshipResponse['scholarships'][number], 'id'>[]>(raw)
  return { scholarships }
}

export async function fetchLiveScholarships(profile: UserProfile): Promise<AIScholarshipResponse> {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const raw = await callClaude(
    null,
    `Search for real open scholarships for college students as of ${today} matching:
- Major: ${profile.major ?? 'undeclared'}
- Interests: ${profile.fields.join(', ') || 'general'}
- Skills: ${profile.skills.slice(0, 6).join(', ') || 'general'}

Search Fastweb, Scholarships.com, College Board, Unigo, foundation websites. Return ONLY JSON array of up to 5 real currently-open scholarships:
[{"name":"","organization":"","amount":"$X,XXX","type":"merit|need|identity|essay","deadlineDate":"YYYY-MM-DD","deadlineLabel":"Month YYYY","url":"","matchReason":"1 sentence","tags":["3 strings"],"matchScore":75-99,"source":"live"}]`,
    true,
  )
  const scholarships = parseJSON<Omit<AIScholarshipResponse['scholarships'][number], 'id'>[]>(raw)
  return { scholarships }
}

// ─── Daily check-in plan ──────────────────────────────────────────────────────

export async function generateDayPlan(
  profile: UserProfile,
  mood: MoodType,
  note: string,
  context: { jobsApplied: number; scholsTracked: number; hasUpcomingInterview: boolean },
): Promise<AIDayPlanResponse> {
  const raw = await callClaude(
    null,
    `You are a warm, supportive career coach. Generate a personalized day plan.

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
  "greeting": "1 warm sentence referencing their mood and name",
  "subtitle": "1 short encouraging line",
  "activities": [
    {"title":"short task","desc":"1-2 sentences specific to their skills/field","tag":"easy|medium|focus|rest","action":"matches|tracker|prep|portfolio|null"}
  ]
}

Mood rules:
- motivated/hopeful: 4-5 tasks, mix easy/medium/focus
- okay: 3-4 tasks, balanced
- overwhelmed/stressed: max 3 tasks, only easy or rest, very gentle
- tired: 2-3 tasks, easy/rest only
If upcoming interview: include 1 prep task.
Reference their actual skills. Never shame. JSON only.`,
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
    'You are a warm career coach. Write 2-3 sentences of personal encouragement. Be human. No bullet points.',
    `${profile.name} just got rejected from ${role} at ${company}. Skills: ${profile.skills.slice(0, 5).join(', ')}. Field: ${profile.fields[0] ?? 'general'}.`,
  )
}

// ─── Interview prep feedback ──────────────────────────────────────────────────

export async function generateInterviewFeedback(
  question: string,
  answer: string,
  mood: string,
): Promise<string> {
  return callClaude(
    `You are a warm interview coach for college students. Give feedback in 3-4 sentences. ${mood === 'nervous' ? 'They are nervous — lead with encouragement.' : ''} ${mood === 'tired' ? 'Be brief and kind.' : ''} Start with what worked, then one specific suggestion. No bullet points.`,
    `Question: "${question}"\nAnswer: "${answer}"`,
  )
}

// ─── Portfolio project ideas ──────────────────────────────────────────────────

export async function generateProjectIdeas(profile: UserProfile): Promise<{
  title: string
  description: string
  skills: string[]
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  timeEstimate: string
  whyItImpress: string
}[]> {
  const raw = await callClaude(
    null,
    `Career coach helping a college student build a portfolio that impresses employers.

Student: ${profile.name}, ${profile.major ?? 'undeclared'}
Skills from resume: ${profile.skills.join(', ') || 'general'}
Career interests: ${profile.fields.join(', ') || 'general'}

Generate 4 specific, buildable project ideas using skills they ALREADY have. Each should be achievable in 1-2 weeks and directly relevant to their career interests.

Return ONLY JSON array:
[{"title":"","description":"2-3 sentences of what to build","skills":["3-4 skills this demonstrates"],"difficulty":"Beginner|Intermediate|Advanced","timeEstimate":"e.g. 3-5 days","whyItImpress":"1 sentence why employers will care"}]`,
  )
  return parseJSON(raw)
}
