import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import { apiRequest } from '../../config/api';
import { Chapitre, Lecon } from '../../types';
import { useAuth } from '../../context/AuthContext'; // Assurez-vous que le chemin est correct selon votre structure de projet
import Toast from 'react-native-toast-message';

export default function ChapitreDetailScreen({ route, navigation }: any) {
  const { chapitreId, moduleId, type } = route.params;
  const [chapitre, setChapitre] = useState<Chapitre | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    loadChapitre();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadChapitre();
    });
    return unsubscribe;
  }, [navigation]);

  const loadChapitre = async () => {
    try {
      const endpoint = type === 'theorique' ? '/cours/theorique' : '/cours/pratique';
      const response = await apiRequest<any>(endpoint, {}, token);
      if (response.success) {
        const module = response.modules.find((m: any) => m.id === moduleId);
        if (module) {
          const foundChapitre = module.chapitres.find((c: Chapitre) => c.id === chapitreId);
          if (foundChapitre) {
            setChapitre(foundChapitre);
            navigation.setOptions({ title: foundChapitre.nom });
          }
        }
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible de charger le chapitre',
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateToLecon = (lecon: Lecon) => {
    if (!lecon.accessible) {
      Toast.show({
        type: 'warning',
        text1: 'Leçon non accessible',
        text2: 'Terminez les leçons précédentes pour débloquer celle-ci',
      });
      return;
    }
    if (type === 'theorique' && lecon.url_web) {
      navigation.navigate('LeconWebView', {
        url: lecon.url_web,
        titre: lecon.titre,
        leconId: lecon.id,
      });
    } else if (type === 'pratique' && lecon.url_video) {
      navigation.navigate('LeconVideo', {
        url: lecon.url_video,
        titre: lecon.titre,
        leconId: lecon.id,
        contenu: lecon.contenu_texte,
      });
    } else {
      navigation.navigate('LeconDetail', {
        leconId: lecon.id,
        chapitreId,
        moduleId,
        type,
      });
    }
  };

  const handleQuizPress = () => {
    if (!chapitre?.quiz) return;
    if (!chapitre.quiz.disponible) {
      Toast.show({
        type: 'warning',
        text1: 'Quiz non disponible',
        text2: 'Terminez toutes les leçons pour débloquer le quiz',
      });
      return;
    }
    if (chapitre.quiz.reussi) {
      Alert.alert(
        'Quiz déjà réussi',
        `Vous avez déjà réussi ce quiz avec une note de ${chapitre.quiz.meilleure_note}/20. Voulez-vous le repasser ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Repasser',
            onPress: () => {
              navigation.navigate('Quiz', {
                chapitreId,
                quizId: chapitre.quiz!.id,
              });
            },
          },
        ]
      );
    } else {
      navigation.navigate('Quiz', {
        chapitreId,
        quizId: chapitre.quiz.id,
      });
    }
  };

  const renderLeconItem = ({ item, index }: { item: Lecon; index: number }) => (
    <TouchableOpacity
      style={[
        styles.leconCard,
        !item.accessible && styles.leconCardDisabled,
      ]}
      onPress={() => navigateToLecon(item)}
      disabled={!item.accessible}
    >
      <View style={styles.leconNumber}>
        <Text style={styles.leconNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.leconContent}>
        <Text style={styles.leconTitle}>{item.titre}</Text>
       
        <View style={styles.leconMeta}>
          <View style={styles.metaItem}>
            <Ionicons
              name="time-outline"
              size={14}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.metaText}>{item.duree_minutes} min</Text>
          </View>
          {item.completee && item.date_completion && (
            <View style={styles.metaItem}>
              <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
              <Text style={[styles.metaText, { color: theme.colors.success }]}>
                Terminée
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.leconAction}>
        {item.accessible ? (
          <Ionicons
            name={item.completee ? 'checkmark-circle' : 'play-circle'}
            size={32}
            color={
              item.completee
                ? theme.colors.success
                : type === 'theorique'
                ? theme.colors.primary
                : theme.colors.secondary
            }
          />
        ) : (
          <Ionicons name="lock-closed" size={24} color={theme.colors.textMuted} />
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator
          size="large"
          color={type === 'theorique' ? theme.colors.primary : theme.colors.secondary}
        />
      </View>
    );
  }

  if (!chapitre) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Chapitre introuvable</Text>
      </View>
    );
  }

  const totalLecons = chapitre.lecons.length;
  const leconsCompletes = chapitre.lecons.filter(l => l.completee).length;
  const progress = totalLecons > 0 ? (leconsCompletes / totalLecons) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {chapitre.description && (
          <Text style={styles.description}>{chapitre.description}</Text>
        )}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progression du chapitre</Text>
            <Text style={styles.progressValue}>
              {leconsCompletes}/{totalLecons}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor:
                    type === 'theorique' ? theme.colors.primary : theme.colors.secondary,
                },
              ]}
            />
          </View>
        </View>
        {chapitre.quiz && (
          <TouchableOpacity
            style={[
              styles.quizButton,
              !chapitre.quiz.disponible && styles.quizButtonDisabled,
              chapitre.quiz.reussi && styles.quizButtonSuccess,
            ]}
            onPress={handleQuizPress}
          >
            <Ionicons
              name={chapitre.quiz.reussi ? 'trophy' : 'help-circle'}
              size={24}
              color={
                chapitre.quiz.reussi
                  ? theme.colors.success
                  : chapitre.quiz.disponible
                  ? theme.colors.textInverse
                  : theme.colors.textMuted
              }
            />
            <View style={styles.quizButtonContent}>
              <Text
                style={[
                  styles.quizButtonTitle,
                  chapitre.quiz.reussi && { color: theme.colors.success },
                  !chapitre.quiz.disponible && { color: theme.colors.textMuted },
                ]}
              >
                {chapitre.quiz.titre}
              </Text>
              {chapitre.quiz.reussi ? (
                <Text style={[styles.quizButtonSubtitle, { color: theme.colors.success }]}>
                  Réussi avec {chapitre.quiz.meilleure_note}/20 - Repasser ?
                </Text>
              ) : chapitre.quiz.disponible ? (
                <Text style={styles.quizButtonSubtitle}>
                  {chapitre.quiz.duree_minutes} min · Note de passage: {chapitre.quiz.note_passage}/20
                </Text>
              ) : (
                <Text style={[styles.quizButtonSubtitle, { color: theme.colors.textMuted }]}>
                  Terminez toutes les leçons pour débloquer
                </Text>
              )}
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={
                chapitre.quiz.reussi
                  ? theme.colors.success
                  : chapitre.quiz.disponible
                  ? theme.colors.textInverse
                  : theme.colors.textMuted
              }
            />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={chapitre.lecons}
        renderItem={renderLeconItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Aucune leçon disponible</Text>
          </View>
        }
      />
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
    padding: theme.spacing.xl,
  },
  header: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  progressCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  progressLabel: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  progressValue: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  quizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  quizButtonDisabled: {
    backgroundColor: theme.colors.borderLight,
  },
  quizButtonSuccess: {
    backgroundColor: theme.colors.successLight + '30',
    borderWidth: 2,
    borderColor: theme.colors.success,
  },
  quizButtonContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  quizButtonTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textInverse,
    marginBottom: 2,
  },
  quizButtonSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textInverse,
    opacity: 0.8,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  leconCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  leconCardDisabled: {
    opacity: 0.6,
  },
  leconNumber: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  leconNumberText: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  leconContent: {
    flex: 1,
  },
  leconTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  leconMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  metaText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  leconAction: {
    marginLeft: theme.spacing.sm,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});