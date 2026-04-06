import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Clipboard,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppStore } from '../../src/store'
import { Colors, Typography, Spacing, Radius, Shadows } from '../../src/constants'

interface Project {
  id: string
  title: string
  description: string
  skills: string[]
  link?: string
  createdAt: string
}

interface ProjectIdea {
  title: string
  description: string
  skills: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  timeEstimate: string
  whyItImpress: string
}

const DIFF_COLORS = {
  beginner:     { bg: '#DCFCE7', text: '#22C55E' },
  intermediate: { bg: '#FEF3C7', text: '#F59E0B' },
  advanced:     { bg: '#FEE2E2', text: '#EF4444' },
}

export default function PortfolioScreen() {
  const { profile } = useAppStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [ideas, setIdeas] = useState<ProjectIdea[]>([])
  const [loadingIdeas, setLoadingIdeas] = useState(false)
  const [activeTab, setActiveTab] = useState<'ideas' | 'projects'>('ideas')
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newLink, setNewLink] = useState('')
  const [newSkills, setNewSkills] = useState('')
  const [copied, setCopied] = useState(false)

  const generateIdeas = async () => {
    if (!profile) return
    setLoadingIdeas(true)
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
      const res = await fetch(`${supabaseUrl}/functions/v1/claude-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: `Career coach helping a college student build a portfolio.

Student: ${profile.name}, ${profile.major ?? 'undeclared'}
Skills from resume: ${profile.skills.join(', ') || 'general skills'}
Career interests: ${profile.fields.join(', ') || 'general'}

Generate 4 specific, practical project ideas using skills they ALREADY have. Each should be achievable in 1-2 weeks and impressive to employers.

Return ONLY JSON array:
[{"title":"","description":"2-3 sentences","skills":["3-4 skills"],"difficulty":"beginner|intermediate|advanced","timeEstimate":"e.g. 3-5 days","whyItImpress":"1 sentence why employers care"}]
No markdown.`,
          }],
        }),
      })
      const data = await res.json()
      const text = data.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') || '[]'
      setIdeas(JSON.parse(text.replace(/```json|```/g, '').trim()))
    } catch {
      Alert.alert('oops', "couldn't generate ideas right now. try again!")
    } finally {
      setLoadingIdeas(false)
    }
  }

  const addProject = () => {
    if (!newTitle.trim()) { Alert.alert('', 'add a project title first!'); return }
    setProjects(prev => [{
      id: `proj-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      skills: newSkills.split(',').map(s => s.trim()).filter(Boolean),
      link: newLink.trim() || undefined,
      createdAt: new Date().toISOString(),
    }, ...prev])
    setNewTitle(''); setNewDesc(''); setNewLink(''); setNewSkills('')
    setShowForm(false)
  }

  const generatePortfolioText = () => {
    const lines = [
      `${profile?.name ?? 'My'} Portfolio`,
      `${profile?.school ?? ''} ${profile?.major ? '| ' + profile.major : ''}`.trim(),
      '',
      'SKILLS',
      (profile?.skills ?? []).join(' • '),
      '',
      'PROJECTS',
      ...projects.flatMap(p => [
        `• ${p.title}`,
        p.description,
        `Skills: ${p.skills.join(', ')}`,
        p.link ? `Link: ${p.link}` : '',
        '',
      ]),
    ]
    return lines.filter(l => l !== undefined).join('\n')
  }

  const copyPortfolio = () => {
    const text = generatePortfolioText()
    Clipboard.setString(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.heading}>skill portfolio</Text>
        <Text style={styles.sub}>turn what you already do into proof employers can see.</Text>

        {/* Tab toggle */}
        <View style={styles.tabRow}>
          {(['ideas', 'projects'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
              onPress={() => setActiveTab(t)}
            >
              <Text style={[styles.tabBtnText, activeTab === t && styles.tabBtnTextActive]}>
                {t === 'ideas' ? 'project ideas' : `my projects (${projects.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'ideas' && (
          <>
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>why this matters</Text>
              <Text style={styles.infoText}>
                employers want proof, not promises. a project shows you can actually do the work — even if it's small.
              </Text>
            </View>

            {ideas.length === 0 ? (
              <TouchableOpacity
                style={[styles.primaryBtn, loadingIdeas && { opacity: 0.6 }]}
                onPress={generateIdeas}
                disabled={loadingIdeas}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>
                  {loadingIdeas ? 'generating ideas from your skills...' : 'generate project ideas for me'}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                {ideas.map((idea, i) => {
                  const dc = DIFF_COLORS[idea.difficulty]
                  return (
                    <View key={i} style={styles.ideaCard}>
                      <View style={styles.ideaTop}>
                        <Text style={styles.ideaTitle}>{idea.title}</Text>
                        <View style={[styles.diffBadge, { backgroundColor: dc.bg }]}>
                          <Text style={[styles.diffText, { color: dc.text }]}>{idea.difficulty}</Text>
                        </View>
                      </View>
                      <Text style={styles.ideaDesc}>{idea.description}</Text>
                      <View style={styles.skillsRow}>
                        {idea.skills.map((s, j) => (
                          <View key={j} style={styles.skillChip}>
                            <Text style={styles.skillChipText}>{s}</Text>
                          </View>
                        ))}
                      </View>
                      <View style={styles.ideaFooter}>
                        <Text style={styles.ideaTime}>⏱ {idea.timeEstimate}</Text>
                      </View>
                      <View style={styles.ideaImpressBox}>
                        <Text style={styles.ideaImpressText}>⭐ {idea.whyItImpress}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => {
                          setNewTitle(idea.title)
                          setNewDesc(idea.description)
                          setNewSkills(idea.skills.join(', '))
                          setActiveTab('projects')
                          setShowForm(true)
                        }}
                      >
                        <Text style={styles.addBtnText}>+ add to my projects</Text>
                      </TouchableOpacity>
                    </View>
                  )
                })}
                <TouchableOpacity style={styles.secondaryBtn} onPress={generateIdeas}>
                  <Text style={styles.secondaryBtnText}>generate new ideas</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {activeTab === 'projects' && (
          <>
            <TouchableOpacity
              style={[styles.primaryBtn, showForm && styles.secondaryBtn]}
              onPress={() => setShowForm(!showForm)}
              activeOpacity={0.8}
            >
              <Text style={[styles.primaryBtnText, showForm && styles.secondaryBtnText]}>
                {showForm ? 'cancel' : '+ add a project'}
              </Text>
            </TouchableOpacity>

            {showForm && (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>add your project</Text>
                <Text style={styles.fieldLabel}>title</Text>
                <TextInput style={styles.input} placeholder="e.g. Budget Tracker App" placeholderTextColor={Colors.gray400} value={newTitle} onChangeText={setNewTitle} />
                <Text style={styles.fieldLabel}>what did you build?</Text>
                <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="describe what it is and what problem it solves..." placeholderTextColor={Colors.gray400} value={newDesc} onChangeText={setNewDesc} multiline numberOfLines={3} />
                <Text style={styles.fieldLabel}>skills used (comma separated)</Text>
                <TextInput style={styles.input} placeholder="e.g. Python, data analysis, Excel" placeholderTextColor={Colors.gray400} value={newSkills} onChangeText={setNewSkills} />
                <Text style={styles.fieldLabel}>link (optional)</Text>
                <TextInput style={styles.input} placeholder="e.g. github.com/you/project" placeholderTextColor={Colors.gray400} value={newLink} onChangeText={setNewLink} autoCapitalize="none" />
                <TouchableOpacity style={[styles.primaryBtn, { marginTop: Spacing.md }]} onPress={addProject}>
                  <Text style={styles.primaryBtnText}>save project</Text>
                </TouchableOpacity>
              </View>
            )}

            {projects.length === 0 && !showForm ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🛠️</Text>
                <Text style={styles.emptyTitle}>no projects yet</Text>
                <Text style={styles.emptySub}>check the project ideas tab to get started — we'll suggest ones based on your skills.</Text>
              </View>
            ) : (
              <>
                {projects.map((p) => (
                  <View key={p.id} style={styles.projectCard}>
                    <View style={styles.projectHeader}>
                      <Text style={styles.projectTitle}>{p.title}</Text>
                      {p.link && (
                        <TouchableOpacity onPress={() => Linking.openURL(p.link!.startsWith('http') ? p.link! : `https://${p.link}`)}>
                          <Text style={styles.projectLink}>view →</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {!!p.description && <Text style={styles.projectDesc}>{p.description}</Text>}
                    {p.skills.length > 0 && (
                      <View style={styles.skillsRow}>
                        {p.skills.map((s, i) => (
                          <View key={i} style={styles.skillChip}>
                            <Text style={styles.skillChipText}>{s}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}

                {/* Share section */}
                <View style={styles.shareCard}>
                  <Text style={styles.shareTitle}>share your portfolio</Text>
                  <Text style={styles.shareText}>
                    copy your portfolio as text and paste it into a LinkedIn post, email, Notion page, or anywhere you want.
                  </Text>
                  <TouchableOpacity style={styles.copyBtn} onPress={copyPortfolio}>
                    <Text style={styles.copyBtnText}>{copied ? '✓ copied!' : 'copy portfolio text'}</Text>
                  </TouchableOpacity>
                  <Text style={styles.shareHint}>
                    or paste into a free site like notion.so or github.com for a shareable link.
                  </Text>
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
  safe:   { flex: 1, backgroundColor: Colors.gray50 },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  heading: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.gray900 },
  sub:     { fontSize: Typography.sm, color: Colors.gray500, marginBottom: Spacing.xl },

  tabRow: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 4, marginBottom: Spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  tabBtn:            { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radius.md },
  tabBtnActive:      { backgroundColor: Colors.primary },
  tabBtnText:        { fontSize: Typography.sm, color: Colors.gray500, fontWeight: Typography.medium },
  tabBtnTextActive:  { color: Colors.white, fontWeight: Typography.semibold },

  infoBox:   { backgroundColor: Colors.primaryLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.primary + '33' },
  infoTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.primary, marginBottom: 3 },
  infoText:  { fontSize: Typography.xs, color: Colors.gray700, lineHeight: 18 },

  primaryBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.lg },
  primaryBtnText: { color: Colors.white, fontSize: Typography.base, fontWeight: Typography.semibold },
  secondaryBtn:     { backgroundColor: Colors.gray100, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.gray200 },
  secondaryBtnText: { color: Colors.gray600, fontSize: Typography.base, fontWeight: Typography.medium },

  ideaCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.sm, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  ideaTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  ideaTitle:  { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.gray900, flex: 1, marginRight: Spacing.sm },
  ideaDesc:   { fontSize: Typography.sm, color: Colors.gray600, lineHeight: 20, marginBottom: Spacing.sm },
  diffBadge:  { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full },
  diffText:   { fontSize: Typography.xs, fontWeight: Typography.semibold },
  skillsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  skillChip:  { backgroundColor: Colors.primaryLight, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  skillChipText: { fontSize: Typography.xs, color: Colors.primary, fontWeight: Typography.medium },
  ideaFooter:     { marginBottom: 4 },
  ideaTime:       { fontSize: Typography.xs, color: Colors.gray500 },
  ideaImpressBox: { backgroundColor: Colors.gray50, borderRadius: Radius.sm, padding: Spacing.sm, marginBottom: Spacing.md },
  ideaImpressText:{ fontSize: Typography.xs, color: Colors.gray600, lineHeight: 16 },
  addBtn:     { backgroundColor: Colors.primaryLight, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' },
  addBtnText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semibold },

  formCard:   { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.sm },
  formTitle:  { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.gray900, marginBottom: Spacing.lg },
  fieldLabel: { fontSize: Typography.sm, color: Colors.gray600, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  input: { backgroundColor: Colors.gray50, borderWidth: 1, borderColor: Colors.gray200, borderRadius: Radius.md, padding: Spacing.md, fontSize: Typography.base, color: Colors.gray900, marginBottom: 4 },

  emptyState: { alignItems: 'center', paddingVertical: Spacing['4xl'] },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.gray700 },
  emptySub:   { fontSize: Typography.sm, color: Colors.gray500, marginTop: Spacing.sm, textAlign: 'center', lineHeight: 20 },

  projectCard:   { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.sm },
  projectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  projectTitle:  { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.gray900, flex: 1 },
  projectLink:   { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.medium },
  projectDesc:   { fontSize: Typography.sm, color: Colors.gray600, lineHeight: 20, marginBottom: Spacing.sm },

  shareCard:  { backgroundColor: Colors.primaryLight, borderRadius: Radius.lg, padding: Spacing.lg, marginTop: Spacing.sm, borderWidth: 1, borderColor: Colors.primary + '33' },
  shareTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.primary, marginBottom: 4 },
  shareText:  { fontSize: Typography.sm, color: Colors.gray700, lineHeight: 20, marginBottom: Spacing.md },
  copyBtn:    { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', marginBottom: Spacing.sm },
  copyBtnText:{ fontSize: Typography.sm, color: Colors.white, fontWeight: Typography.semibold },
  shareHint:  { fontSize: Typography.xs, color: Colors.gray500, textAlign: 'center' },
})
