import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  CheckCircle,
  XCircle,
  Award,
  AlertCircle,
  Wallet,
} from 'lucide-react-native';
import { theme } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../config/api';
import {  FraisInfo } from '../../types/index';
import { formatCurrency, getFraisStatusLabel } from '../../utils/formatters';

import Toast from 'react-native-toast-message';

interface FraisStatus {
  formation: FraisInfo;
  inscription: FraisInfo;
  examen_blanc: FraisInfo;
  examen: FraisInfo;
}

type FraisType = 'formation' | 'inscription' | 'examen_blanc' | 'examen';

export default function PayerFraisScreen() {
  const { token, user, refreshUser } = useAuth();
  const [fraisStatus, setFraisStatus] = useState<FraisStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState<FraisType | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadFraisStatus();
  }, []);

  const loadFraisStatus = async () => {
    try {
      const response = await apiRequest<{
        success: boolean;
        frais: FraisStatus;
        solde: number;
      }>('/frais/status', { method: 'GET' }, token);

      if (response.success) {
        setFraisStatus(response.frais);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible de charger les frais',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadFraisStatus();
  };

  const handlePayerFrais = async (typeFrais: FraisType) => {
    if (!user) return;

    const frais = fraisStatus?.[typeFrais];
    if (!frais) return;

    if (frais.status === 'paye' || frais.status === 'dispense') {
      Toast.show({
        type: 'info',
        text1: 'Information',
        text2: 'Ces frais sont deja payes ou dispenses',
      });
      return;
    }

    if (user.solde < frais.montant) {
      Toast.show({
        type: 'error',
        text1: 'Solde insuffisant',
        text2: `Il vous manque ${formatCurrency(frais.montant - user.solde)}`,
      });
      return;
    }

    setIsPaying(typeFrais);
    try {
      const response = await apiRequest<{
        success: boolean;
        message: string;
        nouveau_solde: number;
        frais_payes: string;
      }>(
        '/frais/payer',
        {
          method: 'POST',
          body: JSON.stringify({ type_frais: typeFrais }),
        },
        token
      );

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Paiement reussi',
          text2: `Nouveau solde: ${formatCurrency(response.nouveau_solde)}`,
        });
        await refreshUser();
        await loadFraisStatus();
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible d\'effectuer le paiement',
      });
    } finally {
      setIsPaying(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paye':
        return <CheckCircle size={24} color={theme.colors.success} />;
      case 'dispense':
        return <Award size={24} color={theme.colors.niveau['3']} />;
      case 'non_paye':
        return <XCircle size={24} color={theme.colors.error} />;
      default:
        return <AlertCircle size={24} color={theme.colors.textSecondary} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paye':
        return theme.colors.success;
      case 'dispense':
        return theme.colors.niveau['3'];
      case 'non_paye':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const fraisArray: { key: FraisType; data: FraisInfo }[] = fraisStatus
    ? [
        { key: 'formation', data: fraisStatus.formation },
        { key: 'inscription', data: fraisStatus.inscription },
        { key: 'examen_blanc', data: fraisStatus.examen_blanc },
        { key: 'examen', data: fraisStatus.examen },
      ]
    : [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Payer mes frais</Text>
        <Text style={styles.subtitle}>
          Gerez vos paiements de formation
        </Text>
      </View>

      {user && (
        <View style={styles.balanceCard}>
          <Wallet size={24} color={theme.colors.textInverse} />
          <View style={styles.balanceContent}>
            <Text style={styles.balanceLabel}>Solde disponible</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(user.solde)}</Text>
          </View>
        </View>
      )}

      <View style={styles.fraisContainer}>
        {fraisArray.map(({ key, data }) => (
          <View key={key} style={styles.fraisCard}>
            <View style={styles.fraisHeader}>
              <View style={styles.fraisIcon}>{getStatusIcon(data.status)}</View>
              <View style={styles.fraisInfo}>
                <Text style={styles.fraisLabel}>{data.label}</Text>
                <Text style={styles.fraisMontant}>
                  {formatCurrency(data.montant)}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(data.status) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(data.status) },
                ]}
              >
                {getFraisStatusLabel(data.status)}
              </Text>
            </View>

            {data.description && (
              <Text style={styles.fraisDescription}>{data.description}</Text>
            )}

            {data.status === 'non_paye' && (
              <TouchableOpacity
                style={[
                  styles.payButton,
                  isPaying === key && styles.payButtonDisabled,
                ]}
                onPress={() => handlePayerFrais(key)}
                disabled={isPaying !== null}
              >
                {isPaying === key ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.textInverse}
                  />
                ) : (
                  <Text style={styles.payButtonText}>Payer maintenant</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <View style={styles.infoCard}>
        <AlertCircle size={20} color={theme.colors.info} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Information importante</Text>
          <Text style={styles.infoText}>
            Les frais peuvent etre dispenses automatiquement lorsque vous
            atteignez certains niveaux de parrainage. Consultez la section
            Parrainage pour plus de details.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.md,
  },
  balanceContent: {
    flex: 1,
  },
  balanceLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textInverse,
    marginBottom: theme.spacing.xs,
  },
  balanceAmount: {
    ...theme.typography.h2,
    color: theme.colors.textInverse,
    fontWeight: '700',
  },
  fraisContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  fraisCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    ...theme.shadows.md,
  },
  fraisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  fraisIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fraisInfo: {
    flex: 1,
  },
  fraisLabel: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  fraisMontant: {
    ...theme.typography.h4,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    ...theme.typography.bodySmall,
    fontWeight: '600',
  },
  fraisDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  payButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: theme.spacing.lg,
    marginTop: 0,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.info + '10',
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.info,
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    ...theme.typography.bodySmall,
    color: theme.colors.info,
  },
});
