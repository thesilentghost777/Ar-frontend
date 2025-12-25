import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import { apiRequest } from '../../config/api';
import { Quiz, Question, Reponse } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Toast from 'react-native-toast-message';

export default function QuizScreen({ route, navigation }: any) {
  const { chapitreId, quizId } = route.params;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<{ [key: number]: number }>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const { token } = useAuth();

  useEffect(() => {
    loadQuiz();
  }, []);

  useEffect(() => {
    if (quiz && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTimeExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quiz, timeRemaining]);

  const loadQuiz = async () => {
    try {
      const response = await apiRequest<any>(
        `/cours/chapitre/${chapitreId}/quiz`,
        {},
        token
      );
      if (response.success) {
        setQuiz(response.quiz);
        setTimeRemaining(response.quiz.duree_minutes * 60);
        navigation.setOptions({ title: response.quiz.titre });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible de charger le quiz',
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleTimeExpired = () => {
    Alert.alert(
      'Temps écoulé',
      'Le temps du quiz est terminé. Vous allez être redirigé.',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ],
      { cancelable: false }
    );
  };

  const handleSelectResponse = (questionId: number, responseId: number) => {
    setResponses({ ...responses, [questionId]: responseId });
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    const answeredCount = Object.keys(responses).length;
    if (answeredCount < quiz.questions.length) {
      Alert.alert(
        'Questions non répondues',
        `Vous avez répondu à ${answeredCount}/${quiz.questions.length} questions. Voulez-vous quand même soumettre ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Soumettre', onPress: () => submitQuiz() },
        ]
      );
      return;
    }
    submitQuiz();
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    try {
      const response = await apiRequest<any>(
        `/cours/chapitre/${chapitreId}/quiz`,
        {
          method: 'POST',
          body: JSON.stringify({ reponses: responses }),
        },
        token
      );
      if (response.success) {
        navigation.replace('QuizResultat', {
          resultat: response.resultat,
          corrections: response.corrections,
          chapitreId,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible de soumettre le quiz',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const goToNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!quiz) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Quiz introuvable</Text>
      </View>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const answeredCount = Object.keys(responses).length;

  return (
    <View style={styles.container}>
      {/* Header avec timer et progression */}
      <View style={styles.header}>
        <View style={styles.timerContainer}>
          <Ionicons
            name="time"
            size={20}
            color={timeRemaining < 300 ? theme.colors.error : theme.colors.primary}
          />
          <Text
            style={[
              styles.timerText,
              timeRemaining < 300 && { color: theme.colors.error },
            ]}
          >
            {formatTime(timeRemaining)}
          </Text>
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1}/{quiz.questions.length}
          </Text>
        </View>
      </View>

      {/* Barre de progression */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Navigation Précédent/Suivant */}
      <View style={styles.topNavigation}>
        <TouchableOpacity
          style={[
            styles.topNavButton,
            currentQuestionIndex === 0 && styles.topNavButtonDisabled,
          ]}
          onPress={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <Ionicons name="chevron-back" size={20} color={theme.colors.primary} />
          <Text style={styles.topNavButtonText}>Précédent</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.topNavButton,
            currentQuestionIndex === quiz.questions.length - 1 &&
              styles.topNavButtonDisabled,
          ]}
          onPress={goToNextQuestion}
          disabled={currentQuestionIndex === quiz.questions.length - 1}
        >
          <Text style={styles.topNavButtonText}>Suivant</Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Question actuelle */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionNumber}>
              Question {currentQuestionIndex + 1}
            </Text>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>{currentQuestion.points} pts</Text>
            </View>
          </View>

          <Text style={styles.questionText}>{currentQuestion.enonce}</Text>

          {currentQuestion.image_url && (
            <Image
              source={{ uri: currentQuestion.image_url }}
              style={styles.questionImage}
              resizeMode="contain"
            />
          )}

          <View style={styles.responsesContainer}>
            {currentQuestion.reponses.map((reponse: Reponse) => (
              <TouchableOpacity
                key={reponse.id}
                style={[
                  styles.responseCard,
                  responses[currentQuestion.id] === reponse.id &&
                    styles.responseCardSelected,
                ]}
                onPress={() =>
                  handleSelectResponse(currentQuestion.id, reponse.id)
                }
              >
                <View
                  style={[
                    styles.radioButton,
                    responses[currentQuestion.id] === reponse.id &&
                      styles.radioButtonSelected,
                  ]}
                >
                  {responses[currentQuestion.id] === reponse.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text
                  style={[
                    styles.responseText,
                    responses[currentQuestion.id] === reponse.id &&
                      styles.responseTextSelected,
                  ]}
                >
                  {reponse.texte}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Navigation des questions */}
        <View style={styles.questionNavigation}>
          <Text style={styles.navTitle}>Navigation des questions</Text>
          <View style={styles.questionGrid}>
            {quiz.questions.map((q, index) => (
              <TouchableOpacity
                key={q.id}
                style={[
                  styles.questionNavButton,
                  index === currentQuestionIndex && styles.questionNavButtonActive,
                  responses[q.id] !== undefined && styles.questionNavButtonAnswered,
                ]}
                onPress={() => goToQuestion(index)}
              >
                <Text
                  style={[
                    styles.questionNavButtonText,
                    (index === currentQuestionIndex ||
                      responses[q.id] !== undefined) &&
                      styles.questionNavButtonTextActive,
                  ]}
                >
                  {index + 1}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer avec bouton de soumission */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={theme.colors.textInverse} />
          ) : (
            <>
              <Text style={styles.submitButtonText}>
                Soumettre ({answeredCount}/{quiz.questions.length})
              </Text>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.colors.textInverse}
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    ...theme.typography.h4,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  progressInfo: {},
  progressText: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.borderLight,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  topNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  topNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  topNavButtonDisabled: {
    opacity: 0.3,
  },
  topNavButtonText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    marginHorizontal: theme.spacing.xs,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  questionCard: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  questionNumber: {
    ...theme.typography.bodySmall,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  pointsBadge: {
    backgroundColor: theme.colors.primaryLight + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  pointsText: {
    ...theme.typography.caption,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  questionText: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    lineHeight: 28,
  },
  questionImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  responsesContainer: {
    marginTop: theme.spacing.md,
  },
  responseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  responseCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight + '10',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: theme.colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  responseText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  responseTextSelected: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  questionNavigation: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  navTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  questionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  questionNavButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionNavButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  questionNavButtonAnswered: {
    backgroundColor: theme.colors.successLight + '30',
    borderColor: theme.colors.success,
  },
  questionNavButtonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  questionNavButtonTextActive: {
    color: theme.colors.textInverse,
    fontWeight: '600',
  },
  footer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.lg,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    marginRight: theme.spacing.xs,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});