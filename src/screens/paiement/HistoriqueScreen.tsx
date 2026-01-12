import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  Wallet,
  Calendar,
} from 'lucide-react-native';
import { theme } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../config/api';
import { Paiement } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function HistoriqueScreen() {
  const { token, user } = useAuth();
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadHistorique();
  }, []);

  const loadHistorique = async () => {
    try {
      const response = await apiRequest<{
        success: boolean;
        paiements: Paiement[];
        solde_actuel: number;
      }>('/historique?limit=50', { method: 'GET' }, token);

      if (response.success) {
        setPaiements(response.paiements);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible de charger l\'historique',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadHistorique();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'depot':
        return (
          <ArrowDownCircle size={24} color={theme.colors.success} />
        );
      case 'transfert_entrant':
        return (
          <ArrowDownCircle size={24} color={theme.colors.success} />
        );
      case 'transfert_sortant':
        return (
          <ArrowUpCircle size={24} color={theme.colors.warning} />
        );
      case 'paiement_frais':
        return (
          <CreditCard size={24} color={theme.colors.error} />
        );
      default:
        return (
          <Wallet size={24} color={theme.colors.textSecondary} />
        );
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'depot':
      case 'transfert_entrant':
        return theme.colors.success;
      case 'transfert_sortant':
        return theme.colors.warning;
      case 'paiement_frais':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'depot':
        return 'Depot';
      case 'transfert_entrant':
        return 'Transfert recu';
      case 'transfert_sortant':
        return 'Transfert envoye';
      case 'paiement_frais':
        return 'Paiement de frais';
      default:
        return 'Transaction';
    }
  };

  const getMethodeLabel = (methode: string) => {
    switch (methode) {
      case 'mobile_money':
        return 'Mobile Money';
      case 'code_caisse':
        return 'Code Caisse';
      case 'transfert':
        return 'Transfert';
      case 'systeme':
        return 'Systeme';
      default:
        return methode;
    }
  };

  const renderPaiement = ({ item }: { item: Paiement }) => {
    const isPositive = item.type === 'depot' || item.type === 'transfert_entrant';

    return (
      <View style={styles.paiementCard}>
        <View style={styles.paiementIcon}>
          {getTransactionIcon(item.type)}
        </View>

        <View style={styles.paiementContent}>
          <View style={styles.paiementHeader}>
            <Text style={styles.paiementType}>
              {getTransactionLabel(item.type)}
            </Text>
            <Text
              style={[
                styles.paiementMontant,
                { color: getTransactionColor(item.type) },
              ]}
            >
              {isPositive ? '+' : '-'}
              {formatCurrency(item.montant)}
            </Text>
          </View>

          {item.description && (
            <Text style={styles.paiementDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.paiementFooter}>
            <View style={styles.paiementDetail}>
              <Calendar size={12} color={theme.colors.textMuted} />
              <Text style={styles.paiementDetailText}>
                {formatDateTime(item.created_at)}
              </Text>
            </View>
            <Text style={styles.paiementMethode}>
              {getMethodeLabel(item.methode)}
            </Text>
          </View>

          <View style={styles.soldeInfo}>
            <Text style={styles.soldeLabel}>
              Solde: {formatCurrency(item.solde_avant)}
            </Text>
            <ArrowUpCircle
              size={12}
              color={theme.colors.textMuted}
              style={styles.soldeArrow}
            />
            <Text style={styles.soldeLabel}>
              {formatCurrency(item.solde_apres)}
            </Text>
          </View>

          {item.status && item.status !== 'valide' && (
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.status === 'en_attente'
                      ? theme.colors.warning + '20'
                      : theme.colors.error + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      item.status === 'en_attente'
                        ? theme.colors.warning
                        : theme.colors.error,
                  },
                ]}
              >
                {item.status === 'en_attente' ? 'En attente' : item.status}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
     <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historique des transactions</Text>
        {user && (
          <View style={styles.soldeCard}>
            <Text style={styles.soldeCardLabel}>Solde actuel</Text>
            <Text style={styles.soldeCardAmount}>
              {formatCurrency(user.solde)}
            </Text>
          </View>
        )}
      </View>

      {paiements.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Wallet size={64} color={theme.colors.textMuted} />
          <Text style={styles.emptyTitle}>Aucune transaction</Text>
          <Text style={styles.emptyText}>
            Votre historique de transactions apparaitra ici
          </Text>
        </View>
      ) : (
        <FlatList
          data={paiements}
          renderItem={renderPaiement}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        />
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
    gap: theme.spacing.md,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
  },
  soldeCard: {
    backgroundColor: theme.colors.primary + '10',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  soldeCardLabel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  soldeCardAmount: {
    ...theme.typography.h4,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  listContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  paiementCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    ...theme.shadows.sm,
  },
  paiementIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paiementContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  paiementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paiementType: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  paiementMontant: {
    ...theme.typography.body,
    fontWeight: '700',
  },
  paiementDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  paiementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  paiementDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  paiementDetailText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  paiementMethode: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  soldeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  soldeLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  soldeArrow: {
    marginHorizontal: theme.spacing.xs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.xs,
  },
  statusText: {
    ...theme.typography.caption,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
