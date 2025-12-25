import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../config/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: {
    icon: string;
    onPress: () => void;
  };
  transparent?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  rightAction,
  transparent = false,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + theme.spacing.sm },
        transparent && styles.transparent,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.left}>
          {showBack && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={transparent ? theme.colors.textPrimary : theme.colors.textInverse}
              />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.center}>
          <Text
            style={[
              styles.title,
              transparent && styles.titleDark,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, transparent && styles.subtitleDark]}>
              {subtitle}
            </Text>
          )}
        </View>
        
        <View style={styles.right}>
          {rightAction && (
            <TouchableOpacity onPress={rightAction.onPress} style={styles.actionButton}>
              <Ionicons
                name={rightAction.icon as any}
                size={24}
                color={transparent ? theme.colors.textPrimary : theme.colors.textInverse}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.primary,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  left: {
    width: 44,
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  right: {
    width: 44,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  actionButton: {
    padding: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h4,
    color: theme.colors.textInverse,
    textAlign: 'center',
  },
  titleDark: {
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textInverse,
    opacity: 0.8,
  },
  subtitleDark: {
    color: theme.colors.textSecondary,
  },
});

export default Header;
