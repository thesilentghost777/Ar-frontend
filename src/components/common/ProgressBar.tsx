import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../config/theme';

interface ProgressBarProps {
  progress: number; // 0 to 100
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  showLabel?: boolean;
  label?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  backgroundColor = theme.colors.surfaceVariant,
  progressColor = theme.colors.primary,
  showLabel = false,
  label,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View style={styles.container}>
      {(showLabel || label) && (
        <View style={styles.labelContainer}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showLabel && <Text style={styles.percentage}>{Math.round(clampedProgress)}%</Text>}
        </View>
      )}
      <View style={[styles.track, { height, backgroundColor }]}>
        <View
          style={[
            styles.progress,
            {
              width: `${clampedProgress}%`,
              backgroundColor: progressColor,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  label: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  percentage: {
    ...theme.typography.bodySmall,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  track: {
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progress: {
    borderRadius: theme.borderRadius.full,
  },
});

export default ProgressBar;
