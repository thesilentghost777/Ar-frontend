import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  rightIcon?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  onPress,
  style,
  variant = 'default',
  rightIcon,
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return { ...styles.elevated, ...theme.shadows.lg };
      case 'outlined':
        return styles.outlined;
      default:
        return { ...styles.default, ...theme.shadows.md };
    }
  };

  const content = (
    <View style={[styles.card, getVariantStyle(), style]}>
      {(title || subtitle) && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {rightIcon && (
            <Ionicons
              name={rightIcon as any}
              size={20}
              color={theme.colors.textSecondary}
            />
          )}
        </View>
      )}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
  },
  default: {
    backgroundColor: theme.colors.surface,
  },
  elevated: {
    backgroundColor: theme.colors.surface,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});

export default Card;
