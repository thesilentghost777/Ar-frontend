import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEventListener } from 'expo'; // Important pour les listeners
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import { apiRequest } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function LeconVideoScreen({ route, navigation }: any) {
  const { url, titre, leconId, contenu } = route.params;

  const [marking, setMarking] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [hasWatchedSignificantPart, setHasWatchedSignificantPart] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const progressCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const { token } = useAuth();

  // Création du player
  const player = useVideoPlayer(url, (player) => {
    player.loop = false;
    player.muted = false;
  });

  // Suivi manuel de la progression (toutes les secondes)
  useEffect(() => {
    const checkProgress = () => {
      try {
        if (player.duration > 0) {
          const currentPos = player.currentTime || 0;
          const totalDuration = player.duration || 0;

          setCurrentTime(currentPos);
          setDuration(totalDuration);

          const progress = currentPos / totalDuration;
          if (progress >= 0.8 && !hasWatchedSignificantPart) {
            setHasWatchedSignificantPart(true);
            Toast.show({
              type: 'success',
              text1: 'Progression atteinte',
              text2: 'Vous pouvez maintenant marquer la leçon comme terminée',
              position: 'bottom',
            });
          }
        }
      } catch (error) {
        console.log('Progress check error:', error);
      }
    };

    progressCheckInterval.current = setInterval(checkProgress, 1000);

    return () => {
      if (progressCheckInterval.current) {
        clearInterval(progressCheckInterval.current);
      }
    };
  }, [player, hasWatchedSignificantPart]);

  // Écoute du statut de lecture (play/pause)
  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    setIsPlaying(isPlaying);
  });

  // Écoute des erreurs de lecture
  useEventListener(player, 'statusChange', ({ status, error }) => {
    if (status === 'error') {
      console.error('Video player error:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur de lecture',
        text2: 'Impossible de charger la vidéo. Vérifiez votre connexion.',
      });
    }
  });

  // Nettoyage au démontage du composant
  useEffect(() => {
    return () => {
      if (progressCheckInterval.current) {
        clearInterval(progressCheckInterval.current);
      }
      // player.pause() supprimé intentionnellement → évite l'erreur "shared object already released"
    };
  }, []);

  const markAsComplete = async () => {
    if (completed) {
      navigation.goBack();
      return;
    }

    if (!hasWatchedSignificantPart) {
      Alert.alert(
        'Vidéo non terminée',
        'Veuillez visionner au moins 80% de la vidéo avant de la marquer comme terminée.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Terminer la leçon',
      'Avez-vous bien compris cette leçon pratique ?',
      [
        { text: 'Pas encore', style: 'cancel' },
        {
          text: 'Oui, terminer',
          onPress: async () => {
            setMarking(true);
            try {
              const response = await apiRequest<any>(
                `/cours/lecon/${leconId}/terminer`,
                { method: 'POST' },
                token
              );

              if (response.success) {
                setCompleted(true);
                Toast.show({
                  type: 'success',
                  text1: 'Bravo !',
                  text2: response.message,
                });

                if (response.quiz_disponible) {
                  Toast.show({
                    type: 'info',
                    text1: 'Quiz débloqué',
                    text2: 'Le quiz du chapitre est maintenant disponible',
                  });
                }

                setTimeout(() => {
                  navigation.goBack();
                }, 1500);
              }
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: error.message || 'Impossible de marquer la leçon comme terminée',
              });
            } finally {
              setMarking(false);
            }
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number) => {
    if (!seconds || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
     <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Lecteur vidéo */}
        <View style={styles.videoWrapper}>
          <VideoView
            player={player}
            style={styles.video}
            allowsFullscreen
            allowsPictureInPicture
            nativeControls
            contentFit="contain"
          />
        </View>

        {/* Barre de progression personnalisée */}
        {duration > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(progressPercentage, 100)}%` },
                ]}
              />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>
        )}

        {/* Description */}
        {contenu && (
          <View style={styles.contentCard}>
            <View style={styles.contentHeader}>
              <Ionicons name="document-text" size={20} color={theme.colors.secondary} />
              <Text style={styles.contentTitle}>Description</Text>
            </View>
            <Text style={styles.contentText}>{contenu}</Text>
          </View>
        )}

        {/* Message validation débloquée */}
        {hasWatchedSignificantPart && !completed && (
          <View style={styles.infoCard}>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
            <Text style={styles.infoText}>
              Vous pouvez maintenant marquer cette leçon comme terminée
            </Text>
          </View>
        )}

        {/* Message progression insuffisante */}
        {!hasWatchedSignificantPart && duration > 0 && (
          <View style={styles.warningCard}>
            <Ionicons name="information-circle" size={24} color={theme.colors.warning} />
            <Text style={styles.warningText}>
              Regardez au moins 80% de la vidéo pour débloquer la validation{'\n'}
              Progression : {Math.floor(progressPercentage)}%
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bouton fixe en bas */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.completeButton,
            (marking || (!hasWatchedSignificantPart && !completed)) && styles.completeButtonDisabled,
            completed && styles.completeButtonSuccess,
          ]}
          onPress={markAsComplete}
          disabled={marking || (!hasWatchedSignificantPart && !completed)}
        >
          {marking ? (
            <ActivityIndicator color={theme.colors.textInverse} />
          ) : (
            <>
              <Ionicons
                name={completed ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={24}
                color={theme.colors.textInverse}
              />
              <Text style={styles.completeButtonText}>
                {completed ? 'Leçon terminée' : "J'ai terminé la leçon"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  videoWrapper: {
    backgroundColor: '#000',
    width: width,
    height: width * 0.5625, // 16:9
  },
  video: {
    width: '100%',
    height: '100%',
  },
  progressSection: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.secondary,
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  contentCard: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  contentTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  contentText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.successLight + '30',
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
  },
  infoText: {
    ...theme.typography.body,
    color: theme.colors.success,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '20',
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  warningText: {
    ...theme.typography.bodySmall,
    color: theme.colors.warning,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  footer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.lg,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonSuccess: {
    backgroundColor: theme.colors.success,
  },
  completeButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    marginLeft: theme.spacing.sm,
  },
});