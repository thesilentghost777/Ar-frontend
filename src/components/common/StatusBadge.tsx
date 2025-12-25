import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';

interface StatusBadgeProps {
  status: 'paye' | 'non_paye' | 'dispense' | 'en_cours' | 'passe';
  label?: string;
  size?: 'small' | 'medium';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'medium',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'paye':
        return {
          backgroundColor: theme.colors.successLight + '20',
          textColor: theme.colors.success,
          icon: 'checkmark-circle',
          defaultLabel: 'Payé',
        };
      case 'non_paye':
        return {
          backgroundColor: theme.colors.errorLight + '20',
          textColor: theme.colors.error,
          icon: 'close-circle',
          defaultLabel: 'Non payé',
        };
      case 'dispense':
        return {
          backgroundColor: theme.colors.infoLight + '20',
          textColor: theme.colors.info,
          icon: 'gift',
          defaultLabel: 'Dispensé',
        };
      case 'en_cours':
        return {
          backgroundColor: theme.colors.warningLight + '20',
          textColor: theme.colors.warning,
          icon: 'time',
          defaultLabel: 'En cours',
        };
      case 'passe':
        return {
          backgroundColor: theme.colors.textMuted + '20',
          textColor: theme.colors.textMuted,
          icon: 'checkmark',
          defaultLabel: 'Passé',
        };
      default:
        return {
          backgroundColor: theme.colors.surfaceVariant,
          textColor: theme.colors.textSecondary,
          icon: 'help-circle',
          defaultLabel: status,
        };
    }
  };

  const config = getStatusConfig();
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.backgroundColor },
        isSmall && styles.containerSmall,
      ]}
    >
      <Ionicons
        name={config.icon as any}
        size={isSmall ? 12 : 14}
        color={config.textColor}
      />
      <Text
        style={[
          styles.text,
          { color: config.textColor },
          isSmall && styles.textSmall,
        ]}
      >
        {label || config.defaultLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    gap: 4,
  },
  containerSmall: {
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.xs,
  },
  text: {
    ...theme.typography.caption,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 10,
  },
});

export default StatusBadge;
