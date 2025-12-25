import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import { apiRequest } from '../../config/api';
import { useAuth } from '../../context/AuthContext'; // Ajustez le chemin selon votre structure de projet
import Toast from 'react-native-toast-message';

export default function LeconWebViewScreen({ route, navigation }: any) {
  const { url, titre, leconId } = route.params;
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [completed, setCompleted] = useState(false);
  const { token } = useAuth();

  const markAsComplete = async () => {
    if (completed) {
      navigation.goBack();
      return;
    }

    Alert.alert(
      'Terminer la leçon',
      'Avez-vous terminé la lecture de cette leçon ?',
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

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement du contenu...</Text>
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          Toast.show({
            type: 'error',
            text1: 'Erreur de chargement',
            text2: 'Impossible de charger le contenu web',
          });
        }}
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.completeButton,
            marking && styles.completeButtonDisabled,
            completed && styles.completeButtonSuccess,
          ]}
          onPress={markAsComplete}
          disabled={marking}
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
                {completed ? 'Leçon terminée' : "J'ai terminé"}
              </Text>
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
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
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
  completeButtonSuccess: {
    backgroundColor: theme.colors.success,
  },
  completeButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    marginLeft: theme.spacing.sm,
  },
});