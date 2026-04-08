import { useState } from 'react'
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  TouchableOpacity, Alert, Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppStore } from '../../src/store'
import { Colors, Typography, Spacing, Radius, Shadows } from '../../src/constants'
import { BrandHeader } from '../../src/components/brand'
import { generateProjectIdeas } from '../../src/services/anthropic'

interface Project {
  id: string
  title: string
  description: string
  skills: string[]
  link?: string
}

interface Idea {
  title: string
  description: string
  skills: string[]
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  timeEstimate: string
  whyItImpress: string
}

const DIFF_STYLES = {
  Beginner:     { bg: Colors.successBg,  text: Colors.success,  border: Colors.successBorder  },
  Intermediate: { bg: Colors.warningBg,  text: Colors.warning,  border: Colors.warningBorder  },
  Advanced:     { bg: Colors.dangerBg,   text: Colors.danger,   border: Colors.dangerBorder   },
}

export default function PortfolioScreen() {
  const { profile } = useAppStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [ideas, setIdeas]       = useState<Idea[]>([])
  const [loading, setLoading]   = useState(false)
  const [tab, setTab]           = useState<'ideas' | 'projects'>('ideas')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle]       = useState('')
  const [desc, setDesc]         = useState('')
  const [link, setLink]         = useState('')
  const [skillsInput, setSkillsInput] = useState('')
  const [copied, setCopied]     = useState(false)

  const handleGenerateIdeas = async () => {
    if (!profile) { Alert.alert('', 'Complete your profile first!'); return }
    setLoading(true)
    try {
      const result = await generateProjectIdeas(profile)
      setIdeas(result)
    } catch (e: any) {
      console.log('Project ideas error:', e)
      // If API fails (e.g. no credit), use skill-based mock ideas
      const s = profile.skills?.slice(0, 3) ?? ['Communication', 'Research', 'Problem Solving']
      const field = profile.fields?.[0] ?? 'general'
      setIdeas([
        {
          title: `${field} Skills Showcase Website`,
          description: `Build a simple personal website that highlights your ${s[0] ?? 'core'} skills and projects. Use it as a living portfolio you can share with employers.`,
          skills: [s[0] ?? 'Writing', s[1] ?? 'Research', 'Web basics'],
          difficulty: 'Beginner',
          timeEstimate: '3-5 days',
          whyItImpress: 'Shows initiative and gives employers something concrete to look at beyond your resume.',
        },
        {
          title: `${s[0] ?? 'Skills'} Case Study Blog`,
          description: `Document a real problem you solved using your ${s[0] ?? 'skills'} and write it up as a 500-word case study. Post it on LinkedIn or a free blog.`,
          skills: [s[0] ?? 'Communication', 'Writing', 'Critical Thinking'],
          difficulty: 'Beginner',
          timeEstimate: '2-3 days',
          whyItImpress: 'Demonstrates your thought process — something interviews always probe but rarely see upfront.',
        },
        {
          title: `Data or Research Mini-Project`,
          description: `Pick a question you're curious about in your field and answer it using publicly available data. Present your findings in a one-page summary or slide deck.`,
          skills: [s[1] ?? 'Research', s[2] ?? 'Analysis', 'Presentation'],
          difficulty: 'Intermediate',
          timeEstimate: '5-7 days',
          whyItImpress: `Shows ${field} employers you can turn information into insight — a skill every role needs.`,
        },
        {
          title: 'Volunteer or Community Project',
          description: `Apply your ${s[0] ?? 'skills'} to a real community need. Even a small project for a local organization gives you concrete impact to talk about.`,
          skills: [s[0] ?? 'Leadership', 'Project Management', 'Communication'],
          difficulty: 'Beginner',
          timeEstimate: '1-2 weeks',
          whyItImpress: 'Real-world impact is the most compelling portfolio item — it proves you can operate outside a classroom.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const addProject = () => {
    if (!title.trim()) { Alert.alert('', 'Add a project title first!'); return }
    setProjects(prev => [{
      id: `p-${Date.now()}`,
      title: title.trim(),
      description: desc.trim(),
      skills: skillsInput.split(',').map(s => s.trim()).filter(Boolean),
      link: link.trim() || undefined,
    }, ...prev])
    setTitle(''); setDesc(''); setLink(''); setSkillsInput('')
    setShowForm(false)
  }

  const generatePortfolioText = () => {
    const lines = [
      `${profile?.name ?? 'My'} — Portfolio`,
      profile?.email ?? '',
      profile?.school ? `${profile.school}${profile.major ? ' | ' + profile.major : ''}` : '',
      '',
      'SKILLS',
      (profile?.skills ?? []).join(' · ') || 'See projects below',
      '',
      'PROJECTS',
      ...projects.flatMap(p => [
        `• ${p.title}`,
        p.description,
        `Skills: ${p.skills.join(', ')}`,
        p.link ? `Link: ${p.link}` : '',
        '',
      ]),
      '—',
      'Generated with Career Buddy',
    ].filter(l => l !== undefined)
    return lines.join('\n')
  }

  const handleCopyPortfolio = async () => {
    try {
      const text = generatePortfolioText()
      // Use clipboard API on web
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
      Alert.alert('Copied!', 'Your portfolio text has been copied. Paste it into Google Docs, Notion, or LinkedIn.')
    } catch {
      Alert.alert('Portfolio text', generatePortfolioText())
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <BrandHeader title="Skill Portfolio" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.heading}>Turn skills into proof.</Text>
        <Text style={styles.sub}>
          {profile?.skills?.length
            ? `Using ${profile.skills.length} skills from your profile to generate personalized project ideas.`
            : 'Add skills in your profile settings, then come back to generate project ideas.'}
        </Text>

        {/* Tab toggle */}
        <View style={styles.tabRow}>
          {(['ideas', 'projects'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
                {t === 'ideas' ? 'Project Ideas' : `My Projects (${projects.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'ideas' && (
          <>
            {/* Skills preview */}
            {profile?.skills && profile.skills.length > 0 && (
              <View style={styles.skillsPreviewCard}>
                <Text style={styles.skillsPreviewLabel}>Your skills (used for matching)</Text>
                <View style={styles.skillsWrap}>
                  {profile.skills.slice(0, 12).map(s => (
                    <View key={s} style={styles.skillTag}>
                      <Text style={styles.skillTagText}>{s}</Text>
                    </View>
                  ))}
                  {profile.skills.length > 12 && (
                    <View style={styles.skillTag}>
                      <Text style={styles.skillTagText}>+{profile.skills.length - 12} more</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Why build projects?</Text>
              <Text style={styles.infoText}>
                Employers want proof, not promises. Even a small project shows you can do the work — and it's something you can link in your resume, LinkedIn, or emails.
              </Text>
            </View>

            {ideas.length === 0 ? (
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={handleGenerateIdeas}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? 'Generating ideas from your skills...' : 'Generate project ideas for me →'}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                {ideas.map((idea, i) => {
                  const ds = DIFF_STYLES[idea.difficulty] ?? DIFF_STYLES.Beginner
                  return (
                    <View key={i} style={styles.ideaCard}>
                      <View style={styles.ideaTop}>
                        <Text style={styles.ideaTitle}>{idea.title}</Text>
                        <View style={[styles.diffBadge, { backgroundColor: ds.bg, borderColor: ds.border }]}>
                          <Text style={[styles.diffText, { color: ds.text }]}>{idea.difficulty}</Text>
                        </View>
                      </View>
                      <Text style={styles.ideaDesc}>{idea.description}</Text>
                      <View style={styles.skillsRow}>
                        {idea.skills.map((s, j) => (
                          <View key={j} style={styles.skillTag}>
                            <Text style={styles.skillTagText}>{s}</Text>
                          </View>
                        ))}
                      </View>
                      <View style={styles.ideaMeta}>
                        <Text style={styles.ideaTime}>⏱ {idea.timeEstimate}</Text>
                      </View>
                      <View style={styles.impressBox}>
                        <Text style={styles.impressText}>⭐ {idea.whyItImpress}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.addToProjectsBtn}
                        onPress={() => {
                          setTitle(idea.title)
                          setDesc(idea.description)
                          setSkillsInput(idea.skills.join(', '))
                          setTab('projects')
                          setShowForm(true)
                        }}
                      >
                        <Text style={styles.addToProjectsBtnText}>+ Add to my projects</Text>
                      </TouchableOpacity>
                    </View>
                  )
                })}
                <TouchableOpacity style={styles.secondaryBtn} onPress={handleGenerateIdeas} disabled={loading}>
                  <Text style={styles.secondaryBtnText}>{loading ? 'Generating...' : 'Generate new ideas'}</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {tab === 'projects' && (
          <>
            <TouchableOpacity
              style={showForm ? styles.secondaryBtn : styles.primaryBtn}
              onPress={() => setShowForm(!showForm)}
              activeOpacity={0.85}
            >
              <Text style={showForm ? styles.secondaryBtnText : styles.primaryBtnText}>
                {showForm ? 'Cancel' : '+ Add a project'}
              </Text>
            </TouchableOpacity>

            {showForm && (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Add project</Text>
                <Text style={styles.fieldLabel}>Title</Text>
                <TextInput style={styles.input} placeholder="e.g. Budget Tracker App" placeholderTextColor={Colors.textMuted} value={title} onChangeText={setTitle} />
                <Text style={styles.fieldLabel}>What did you build?</Text>
                <TextInput style={[styles.input, styles.textarea]} placeholder="Describe what it is and what problem it solves..." placeholderTextColor={Colors.textMuted} value={desc} onChangeText={setDesc} multiline numberOfLines={3} />
                <Text style={styles.fieldLabel}>Skills used (comma separated)</Text>
                <TextInput style={styles.input} placeholder="e.g. Python, Excel, Problem Solving" placeholderTextColor={Colors.textMuted} value={skillsInput} onChangeText={setSkillsInput} />
                <Text style={styles.fieldLabel}>Link (optional)</Text>
                <TextInput style={styles.input} placeholder="e.g. github.com/you/project" placeholderTextColor={Colors.textMuted} value={link} onChangeText={setLink} autoCapitalize="none" />
                <TouchableOpacity style={[styles.primaryBtn, { marginTop: Spacing.md }]} onPress={addProject}>
                  <Text style={styles.primaryBtnText}>Save project</Text>
                </TouchableOpacity>
              </View>
            )}

            {projects.length === 0 && !showForm ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🛠️</Text>
                <Text style={styles.emptyTitle}>No projects yet</Text>
                <Text style={styles.emptySub}>Check the Project Ideas tab — we'll suggest projects based on your skills.</Text>
              </View>
            ) : (
              <>
                {projects.map(p => (
                  <View key={p.id} style={styles.projectCard}>
                    <View style={styles.projectHeader}>
                      <Text style={styles.projectTitle}>{p.title}</Text>
                      {p.link && (
                        <TouchableOpacity onPress={() => Linking.openURL(p.link!.startsWith('http') ? p.link! : `https://${p.link}`)}>
                          <Text style={styles.projectLink}>View →</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {!!p.description && <Text style={styles.projectDesc}>{p.description}</Text>}
                    {p.skills.length > 0 && (
                      <View style={styles.skillsRow}>
                        {p.skills.map((s, i) => (
                          <View key={i} style={styles.skillTag}>
                            <Text style={styles.skillTagText}>{s}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}

                <View style={styles.shareCard}>
                  <Text style={styles.shareTitle}>Share your portfolio</Text>
                  <Text style={styles.shareText}>
                    Copy your portfolio as text and paste it into a LinkedIn post, email, Notion page, or Google Doc.
                  </Text>
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleCopyPortfolio}>
                    <Text style={styles.primaryBtnText}>{copied ? '✓ Copied!' : 'Copy portfolio text'}</Text>
                  </TouchableOpacity>
                  <Text style={styles.shareHint}>Or paste into notion.so or github.com for a shareable link.</Text>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  heading: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  sub:     { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.xl },

  tabRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 4, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  tabBtn:           { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radius.md },
  tabBtnActive:     { backgroundColor: Colors.primary },
  tabBtnText:       { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  tabBtnTextActive: { color: '#FFFFFF', fontWeight: Typography.bold },

  skillsPreviewCard: { backgroundColor: Colors.primaryBg, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.primaryBorder },
  skillsPreviewLabel:{ fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.primary, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  skillsWrap:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  skillTag:    { backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4, borderWidth: 1, borderColor: Colors.primaryBorder },
  skillTagText:{ fontSize: Typography.xs, color: Colors.primary, fontWeight: Typography.semibold },

  infoCard:  { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 4, borderLeftColor: Colors.primary },
  infoTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 4 },
  infoText:  { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },

  primaryBtn:         { backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.lg, ...Shadows.md },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText:     { color: '#FFFFFF', fontSize: Typography.base, fontWeight: Typography.bold },
  secondaryBtn:     { backgroundColor: Colors.surface2, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  secondaryBtnText: { color: Colors.textSecondary, fontSize: Typography.base, fontWeight: Typography.medium },

  ideaCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm, borderLeftWidth: 4, borderLeftColor: Colors.primary },
  ideaTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  ideaTitle:  { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary, flex: 1, marginRight: Spacing.sm },
  ideaDesc:   { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.sm },
  diffBadge:  { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1 },
  diffText:   { fontSize: Typography.xs, fontWeight: Typography.bold },
  skillsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  ideaMeta:   { marginBottom: 4 },
  ideaTime:   { fontSize: Typography.xs, color: Colors.textMuted },
  impressBox: { backgroundColor: Colors.surface2, borderRadius: Radius.sm, padding: Spacing.sm, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  impressText:{ fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 16 },
  addToProjectsBtn:     { backgroundColor: Colors.primaryBg, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.primaryBorder },
  addToProjectsBtnText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.bold },

  formCard:   { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  formTitle:  { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.lg },
  fieldLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  input:      { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary },
  textarea:   { minHeight: 80, textAlignVertical: 'top' },

  emptyState: { alignItems: 'center', paddingVertical: Spacing['4xl'] },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textSecondary },
  emptySub:   { fontSize: Typography.sm, color: Colors.textMuted, marginTop: Spacing.sm, textAlign: 'center', lineHeight: 20 },

  projectCard:   { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  projectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  projectTitle:  { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary, flex: 1 },
  projectLink:   { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semibold },
  projectDesc:   { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.sm },

  shareCard:  { backgroundColor: Colors.primaryBg, borderRadius: Radius.xl, padding: Spacing.xl, marginTop: Spacing.sm, borderWidth: 1, borderColor: Colors.primaryBorder },
  shareTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.primary, marginBottom: 4 },
  shareText:  { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.lg },
  shareHint:  { fontSize: Typography.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },
})
