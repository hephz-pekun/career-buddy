# career buddy 💛

a mental-health-aware job + scholarship app for college students.

## stack

- **React Native** via Expo (iOS + Android)
- **Expo Router** for file-based navigation
- **Supabase** — auth, postgres database, file storage
- **Zustand** — global state with AsyncStorage persistence
- **TanStack Query** — server state + caching
- **Anthropic Claude API** — AI matching, day plans, prep feedback
- **EAS** — builds + deployment to App Store / Google Play

---

## getting started

### 1. clone and install

```bash
git clone https://github.com/your-username/career-buddy.git
cd career-buddy
npm install
```

### 2. set up supabase

1. go to [supabase.com](https://supabase.com) and create a new project
2. in the SQL editor, run the contents of `supabase/schema.sql`
3. in Storage, create a private bucket called `resumes`
4. copy your project URL and anon key from Settings → API

### 3. set up environment variables

```bash
cp .env.example .env
```

fill in `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_ANTHROPIC_API_KEY=your-anthropic-key
```

> ⚠️ never commit `.env` to git. the `.gitignore` already handles this.

### 4. start the dev server

```bash
npx expo start
```

scan the QR code with Expo Go on your phone, or press `i` for iOS simulator / `a` for Android emulator.

---

## project structure

```
career-buddy/
├── app/
│   ├── _layout.tsx              # root layout, auth gate
│   ├── (onboarding)/
│   │   ├── step-1.tsx           # name, email, school
│   │   ├── step-2.tsx           # fields, job types, scholarship pref
│   │   └── step-3.tsx           # resume upload (required)
│   └── (tabs)/
│       ├── checkin.tsx          # daily mood + AI day plan
│       ├── matches.tsx          # live + AI jobs & scholarships
│       ├── tracker.tsx          # application tracking
│       ├── prep.tsx             # interview prep + AI feedback
│       └── history.tsx          # mood chart, streak, stats
├── src/
│   ├── types/index.ts           # all TypeScript types
│   ├── constants/index.ts       # colors, typography, spacing
│   ├── store/index.ts           # Zustand global store
│   ├── services/
│   │   ├── supabase.ts          # Supabase client
│   │   └── anthropic.ts         # all Claude API calls
│   └── components/
│       └── ui.tsx               # shared UI components
└── supabase/
    └── schema.sql               # database schema
```

---

## building for production

### set up EAS

```bash
npm install -g eas-cli
eas login
eas build:configure
```

update `app.json` with your real EAS project ID, then:

```bash
# preview build (internal testing)
npm run build:preview

# production build
npm run build:production

# submit to stores
npm run submit
```

---

## key design decisions

**resume is required** — every feature (job matching, scholarship matching, day plans, prep questions) is personalized from your resume. skipping it would make everything generic.

**mood-first** — the check-in screen is the first tab. the day plan adapts to your energy. overwhelmed = 3 gentle tasks. motivated = 5 action-oriented ones.

**live + AI matches** — jobs and scholarships come from two sources: a web search for real current listings, and AI-generated matches from your resume. live listings show first with a green badge.

**rejection reframe** — marking a job as rejected immediately surfaces a warm, personalized reframe. no shame, no guilt. data, not defeat.

**data stays yours** — everything persists in AsyncStorage locally and syncs to Supabase when online. works offline.

---

## FutureBuilders Challenge alignment

this app directly addresses three focus areas:
- **AI-Guided Skill Journeys** — resume → skill extraction → personalized matches
- **AI-Powered Income Streams** — job matching, scholarship discovery
- **Local Knowledge Assistants** — live job/scholarship search via web

rubric compliance:
- **clarity** — dummy-easy onboarding, plain language, no jargon
- **practicality** — works on any smartphone, free to use
- **AI ethics** — ethics note on prep screen, assumptions stated in history tab
- **evidence** — this codebase is the artifact
- **creativity** — mental health + job search in one tool is genuinely new

assumptions (stated clearly per competition rules):
- user has a smartphone with internet
- user has a resume (even a basic one works)
- user has an email address
- no-tech alternative: screenshots/prints of matches for offline use
