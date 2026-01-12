import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import { apiRequest } from '../../config/api';
import { Lecon } from '../../types';
import { useAuth } from '../../context/AuthContext'; // Adjust the path according to your project structure
import Toast from 'react-native-toast-message';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function LeconDetailScreen({ route, navigation }: any) {
  const { leconId, chapitreId, moduleId, type } = route.params;
  const [lecon, setLecon] = useState<Lecon | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    loadLecon();
  }, []);

  const loadLecon = async () => {
    try {
      const response = await apiRequest<any>(`/cours/lecon/${leconId}`, {}, token);
      if (response.success) {
        setLecon(response.lecon);
        navigation.setOptions({ title: response.lecon.titre });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible de charger la leçon',
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const markAsComplete = async () => {
    if (!lecon || lecon.completee) return;
    setMarking(true);
    try {
      const response = await apiRequest<any>(
        `/cours/lecon/${leconId}/terminer`,
        { method: 'POST' },
        token
      );
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Bravo !',
          text2: response.message,
        });
        setLecon({ ...lecon, completee: true, date_completion: new Date().toISOString() });
        if (response.quiz_disponible) {
          Toast.show({
            type: 'info',
            text1: 'Quiz débloqué',
            text2: 'Vous pouvez maintenant passer le quiz du chapitre',
          });
        }
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

  if (!lecon) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Leçon introuvable</Text>
      </View>
    );
  }

  return (
     <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{lecon.titre}</Text>
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.metaText}>{lecon.duree_minutes} minutes</Text>
            </View>
            {lecon.completee && (
              <View style={styles.completeBadge}>
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                <Text style={styles.completeText}>Terminée</Text>
              </View>
            )}
          </View>
        </View>
        {lecon.contenu_texte && (
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>{lecon.contenu_texte}</Text>
          </View>
        )}
        {lecon.url_web && (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => {
              navigation.navigate('LeconWebView', {
                url: lecon.url_web,
                titre: lecon.titre,
                leconId: lecon.id,
              });
            }}
          >
            <Ionicons name="globe-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.linkButtonText}>Ouvrir le contenu web</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
        {lecon.url_video && (
          <TouchableOpacity
            style={[styles.linkButton, { borderColor: theme.colors.secondary }]}
            onPress={() => {
              navigation.navigate('LeconVideo', {
                url: lecon.url_video,
                titre: lecon.titre,
                leconId: lecon.id,
                contenu: lecon.contenu_texte,
              });
            }}
          >
            <Ionicons name="play-circle-outline" size={20} color={theme.colors.secondary} />
            <Text style={[styles.linkButtonText, { color: theme.colors.secondary }]}>
              Regarder la vidéo
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.secondary} />
          </TouchableOpacity>
        )}
      </ScrollView>
      {!lecon.completee && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.completeButton,
              marking && styles.completeButtonDisabled,
              { backgroundColor: type === 'theorique' ? theme.colors.primary : theme.colors.secondary },
            ]}
            onPress={markAsComplete}
            disabled={marking}
          >
            {marking ? (
              <ActivityIndicator color={theme.colors.textInverse} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.textInverse} />
                <Text style={styles.completeButtonText}>Marquer comme terminée</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  metaText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.successLight + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  completeText: {
    ...theme.typography.bodySmall,
    color: theme.colors.success,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  contentCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  contentText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    lineHeight: 24,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  linkButtonText: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.primary,
    flex: 1,
    marginLeft: theme.spacing.sm,
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
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    marginLeft: theme.spacing.sm,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});