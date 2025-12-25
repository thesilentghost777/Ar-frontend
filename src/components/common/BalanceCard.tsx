import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import { formatCurrency } from '../../utils/formatters';

interface BalanceCardProps {
  solde: number;
  onRecharge?: () => void;
  onTransfert?: () => void;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ solde }) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="wallet-outline" size={24} color={theme.colors.textInverse} />
          <Text style={styles.label}>Mon Solde</Text>
        </View>
        <Text style={styles.amount}>{formatCurrency(solde)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  label: {
    ...theme.typography.bodySmall,
    color: theme.colors.textInverse,
    opacity: 0.9,
  },
  amount: {
    ...theme.typography.h1,
    color: theme.colors.textInverse,
    marginTop: theme.spacing.sm,
  },
});

export default BalanceCard;
