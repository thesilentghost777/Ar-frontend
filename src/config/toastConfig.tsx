import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from './theme';

export const toastConfig = {
  success: ({ text1, text2 }: any) => (
    <View style={[styles.container, styles.success]}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
    </View>
  ),
  error: ({ text1, text2 }: any) => (
    <View style={[styles.container, styles.error]}>
      <View style={styles.iconContainer}>
        <Ionicons name="close-circle" size={24} color={theme.colors.error} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
    </View>
  ),
  info: ({ text1, text2 }: any) => (
    <View style={[styles.container, styles.info]}>
      <View style={styles.iconContainer}>
        <Ionicons name="information-circle" size={24} color={theme.colors.info} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
    </View>
  ),
  warning: ({ text1, text2 }: any) => (
    <View style={[styles.container, styles.warning]}>
      <View style={styles.iconContainer}>
        <Ionicons name="warning" size={24} color={theme.colors.warning} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.lg,
    borderLeftWidth: 4,
  },
  success: {
    borderLeftColor: theme.colors.success,
  },
  error: {
    borderLeftColor: theme.colors.error,
  },
  info: {
    borderLeftColor: theme.colors.info,
  },
  warning: {
    borderLeftColor: theme.colors.warning,
  },
  iconContainer: {
    marginRight: theme.spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  message: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
