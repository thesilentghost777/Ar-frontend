import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import { apiRequest } from '../../config/api';
import { Module, Chapitre } from '../../types';
import { useAuth } from '../../context/AuthContext'; // Ajustez le chemin selon votre structure de projet
import Toast from 'react-native-toast-message';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function ModuleDetailScreen({ route, navigation }: any) {
  const { moduleId, type } = route.params;
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    loadModule();
  }, []);

  const loadModule = async () => {
    try {
      const endpoint = type === 'theorique' ? '/cours/theorique' : '/cours/pratique';
      const response = await apiRequest<any>(endpoint, {}, token);
      if (response.success) {
        const foundModule = response.modules.find((m: Module) => m.id === moduleId);
        if (foundModule) {
          setModule(foundModule);
          navigation.setOptions({ title: foundModule.nom });
        }
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible de charger le module',
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const renderChapitreItem = ({ item }: { item: Chapitre }) => {
    const totalLecons = item.lecons.length;
    const leconsCompletes = item.lecons.filter(l => l.completee).length;
    const progress = totalLecons > 0 ? (leconsCompletes / totalLecons) * 100 : 0;

    return (
      <TouchableOpacity
        style={[
          styles.chapitreCard,
          !item.accessible && styles.chapitreCardDisabled,
        ]}
        onPress={() => {
          if (item.accessible) {
            navigation.navigate('ChapitreDetail', {
              chapitreId: item.id,
              moduleId,
              type,
            });
          }
        }}
        disabled={!item.accessible}
      >
        <View style={styles.chapitreHeader}>
          <View style={styles.chapitreIconContainer}>
            <Ionicons
              name={item.complete ? 'checkmark-circle' : type === 'theorique' ? 'book' : 'videocam'}
              size={28}
              color={
                item.complete
                  ? theme.colors.success
                  : type === 'theorique'
                  ? theme.colors.primary
                  : theme.colors.secondary
              }
            />
          </View>
          <View style={styles.chapitreInfo}>
            <Text style={styles.chapitreName}>{item.nom}</Text>
            {item.description && (
              <Text style={styles.chapitreDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.progressContainer}>
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
          <Text style={styles.progressText}>
            {leconsCompletes}/{totalLecons} {type === 'theorique' ? 'leçons' : 'vidéos'}
          </Text>
        </View>
        <View style={styles.chapitreFooter}>
          <View style={styles.quizBadge}>
            {item.quiz ? (
              <>
                <Ionicons
                  name={item.quiz.reussi ? 'trophy' : 'help-circle-outline'}
                  size={16}
                  color={item.quiz.reussi ? theme.colors.success : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.quizText,
                    item.quiz.reussi && { color: theme.colors.success, fontWeight: '600' },
                  ]}
                >
                  {item.quiz.reussi
                    ? `Quiz réussi (${item.quiz.meilleure_note}/20)`
                    : 'Quiz disponible'}
                </Text>
              </>
            ) : (
              <Text style={styles.quizText}>Pas de quiz</Text>
            )}
          </View>
          {item.accessible ? (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={type === 'theorique' ? theme.colors.primary : theme.colors.secondary}
            />
          ) : (
            <View style={styles.lockedBadge}>
              <Ionicons name="lock-closed" size={16} color={theme.colors.textMuted} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

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

  if (!module) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Module introuvable</Text>
      </View>
    );
  }

  return (
     <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.moduleTitle}>{module.nom}</Text>
        {module.description && (
          <Text style={styles.moduleDescription}>{module.description}</Text>
        )}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons
              name={type === 'theorique' ? 'book-outline' : 'videocam-outline'}
              size={20}
              color={type === 'theorique' ? theme.colors.primary : theme.colors.secondary}
            />
            <Text style={styles.statValue}>{module.chapitres.length}</Text>
            <Text style={styles.statLabel}>chapitres</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color={theme.colors.success}
            />
            <Text style={styles.statValue}>
              {module.chapitres.filter(c => c.complete).length}
            </Text>
            <Text style={styles.statLabel}>complétés</Text>
          </View>
        </View>
      </View>
      <FlatList
        data={module.chapitres}
        renderItem={renderChapitreItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Aucun chapitre disponible</Text>
          </View>
        }
      />
    </SafeAreaView>
    </SafeAreaProvider>
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
  moduleTitle: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  moduleDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  chapitreCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  chapitreCardDisabled: {
    opacity: 0.6,
  },
  chapitreHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  chapitreIconContainer: {
    marginRight: theme.spacing.md,
  },
  chapitreInfo: {
    flex: 1,
  },
  chapitreName: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  chapitreDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  progressContainer: {
    marginBottom: theme.spacing.md,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  progressText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  chapitreFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quizBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quizText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  lockedBadge: {
    padding: theme.spacing.xs,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});