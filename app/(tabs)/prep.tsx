import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BrandHeader } from '../../src/components/brand'
import { useAppStore } from '../../src/store'
import { Card, Button, LoadingSpinner } from '../../src/components/ui'
import { Colors, Typography, Spacing, Radius } from '../../src/constants'
import { generateInterviewFeedback } from '../../src/services/anthropic'
import type { PrepMood, QuestionType } from '../../src/types'

const PREP_MOODS: { key: PrepMood; emoji: string; label: string }[] = [
  { key: 'pumped',   emoji: '🔥', label: 'pumped'       },
  { key: 'nervous',  emoji: '😬', label: 'nervous'      },
  { key: 'tired',    emoji: '😴', label: 'tired'        },
  { key: 'blank',    emoji: '😶', label: 'totally blank'},
]

const MOOD_TIPS: Record<PrepMood, string> = {
  pumped:  'Push for specific, detailed answers.',
  nervous: 'Take a breath first. Real beats perfect every time.',
  tired:   'Simple and genuine wins. Don\'t overthink it.',
  blank:   'Start with the first thing that comes to mind — you can build from there.',
}

const QUESTIONS: Record<QuestionType, string[]> = {
  behavioral: [
    'Tell me about a time you had to deal with a tough deadline.',
    'Describe a situation where you disagreed with a teammate.',
    'Share an example of a goal you set and how you achieved it.',
    'Tell me about a time you had to learn something quickly.',
    'Describe when you took on more responsibility than expected.',
  ],
  strengths: [
    'What\'s something you\'re genuinely great at?',
    'What area are you actively working to improve?',
    'What do your closest friends say is your biggest strength?',
    'What skill do you wish you had more of?',
    'What comes naturally to you that others find difficult?',
  ],
  motivation: [
    'Why this company — honestly, not just "I love your mission."',
    'Where do you see yourself in 3 years?',
    'What kind of work environment brings out your best?',
    'What excites you most about this role?',
    'What would make you say no to a job offer?',
  ],
  situational: [
    'Priorities shift completely mid-project. What do you do?',
    'A teammate isn\'t pulling weight and the deadline is tomorrow.',
    'You disagree with your manager\'s decision. How do you handle it?',
    'You\'re asked to do something outside your expertise. What happens next?',
    'You made a mistake that affected the team. Walk me through it.',
  ],
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  behavioral: 'behavioral',
  strengths:  'strengths & weaknesses',
  motivation: 'motivation & fit',
  situational:'situational',
}

export default function PrepScreen() {
  const [selectedMood, setSelectedMood] = useState<PrepMood | null>(null)
  const [questionType, setQuestionType] = useState<QuestionType>('behavioral')
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [loadingFeedback, setLoadingFeedback] = useState(false)

  const getQuestion = () => {
    const pool = QUESTIONS[questionType]
    const q = pool[Math.floor(Math.random() * pool.length)]
    setCurrentQuestion(q)
    setAnswer('')
    setFeedback(null)
  }

  const getFeedback = async () => {
    if (!currentQuestion || !answer.trim()) {
      Alert.alert('hang on', 'write something first — even just a few words!')
      return
    }
    setLoadingFeedback(true)
    try {
      const text = await generateInterviewFeedback(
        currentQuestion,
        answer,
        selectedMood ?? 'pumped',
      )
      setFeedback(text)
    } catch {
      Alert.alert('oops', 'couldn\'t get feedback right now. try again!')
    } finally {
      setLoadingFeedback(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <BrandHeader title="Interview Prep" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Ethics note */}
          <View style={styles.ethicsNote}>
            <Text style={styles.ethicsText}>
              AI generates these questions and feedback as starting points — you decide what fits.
              always explain your answers in your own words.
            </Text>
          </View>

          {/* Mood picker */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>interview prep</Text>
            <Text style={styles.fieldLabel}>how are you feeling right now?</Text>
            <View style={styles.moodRow}>
              {PREP_MOODS.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.moodCard, selectedMood === m.key && styles.moodCardSelected]}
                  onPress={() => setSelectedMood(m.key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, selectedMood === m.key && styles.moodLabelSelected]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Mood tip */}
            {selectedMood && (
              <View style={styles.moodTip}>
                <Text style={styles.moodTipText}>tip: {MOOD_TIPS[selectedMood]}</Text>
              </View>
            )}

            {/* Question type */}
            <Text style={styles.fieldLabel}>question type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
              {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((qt) => (
                <TouchableOpacity
                  key={qt}
                  style={[styles.typePill, questionType === qt && styles.typePillActive]}
                  onPress={() => setQuestionType(qt)}
                >
                  <Text
                    style={[styles.typePillText, questionType === qt && styles.typePillTextActive]}
                  >
                    {QUESTION_TYPE_LABELS[qt]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Button label="get a question" onPress={getQuestion} style={styles.getQuestionBtn} />
          </Card>

          {/* Question + answer */}
          {currentQuestion && (
            <Card style={styles.card}>
              <View style={styles.questionBox}>
                <Text style={styles.questionText}>{currentQuestion}</Text>
              </View>

              <Text style={styles.fieldLabel}>your answer</Text>
              <TextInput
                style={styles.answerInput}
                placeholder="write your answer here... rough drafts totally count"
                placeholderTextColor={Colors.gray400}
                value={answer}
                onChangeText={setAnswer}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <Button
                label={loadingFeedback ? 'reading your answer...' : 'get AI feedback'}
                onPress={getFeedback}
                loading={loadingFeedback}
                disabled={!answer.trim()}
              />
            </Card>
          )}

          {/* AI Feedback */}
          {feedback && (
            <Card style={styles.feedbackCard}>
              <Text style={styles.feedbackLabel}>feedback</Text>
              <Text style={styles.feedbackText}>{feedback}</Text>
              <Button
                label="try another question"
                variant="secondary"
                onPress={getQuestion}
                style={styles.nextBtn}
              />
            </Card>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing['4xl'] },

  ethicsNote: {
    backgroundColor: Colors.infoLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.info + '44',
  },
  ethicsText: { fontSize: Typography.xs, color: Colors.info, lineHeight: 18 },

  card:      { marginBottom: Spacing.lg },
  cardTitle: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.gray900, marginBottom: Spacing.lg },
  fieldLabel:{ fontSize: Typography.sm, color: Colors.gray600, marginBottom: Spacing.sm, fontWeight: Typography.medium },

  moodRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  moodCard: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    minHeight: 68,
    justifyContent: 'center',
  },
  moodCardSelected: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  moodEmoji:        { fontSize: 20, marginBottom: 3 },
  moodLabel:        { fontSize: 10, color: Colors.gray600, textAlign: 'center' },
  moodLabelSelected:{ color: Colors.primary, fontWeight: Typography.semibold },

  moodTip: {
    backgroundColor: Colors.bg,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  moodTipText: { fontSize: Typography.xs, color: Colors.gray600, lineHeight: 18 },

  typeRow:         { marginBottom: Spacing.lg },
  typePill:        { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.gray100, marginRight: Spacing.sm, borderWidth: 1, borderColor: Colors.gray200 },
  typePillActive:  { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  typePillText:    { fontSize: Typography.xs, color: Colors.gray600, fontWeight: Typography.medium },
  typePillTextActive: { color: Colors.primary },
  getQuestionBtn: { marginTop: Spacing.sm },

  questionBox: {
    backgroundColor: Colors.bg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    marginBottom: Spacing.lg,
  },
  questionText: { fontSize: Typography.base, color: Colors.gray800, lineHeight: 24 },
  answerInput: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: Typography.sm,
    color: Colors.gray900,
    minHeight: 140,
    marginBottom: Spacing.lg,
  },

  feedbackCard: { marginBottom: Spacing.lg, backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primary + '33' },
  feedbackLabel:{ fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.primary, marginBottom: Spacing.sm },
  feedbackText: { fontSize: Typography.sm, color: Colors.gray700, lineHeight: 22 },
  nextBtn:      { marginTop: Spacing.md },
})
