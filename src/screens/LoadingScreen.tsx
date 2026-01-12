import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const LoadingScreen: React.FC = () => {
  return (
     <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Ionicons name="car-sport" size={80} color={theme.colors.textInverse} />
      </View>
      <Text style={styles.title}>Ange Raphael</Text>
      <Text style={styles.subtitle}>Auto École</Text>
      <ActivityIndicator size="large" color={theme.colors.secondary} style={styles.loader} />
    </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.textInverse,
  },
  subtitle: {
    ...theme.typography.h4,
    color: theme.colors.secondary,
    marginTop: theme.spacing.xs,
  },
  loader: {
    marginTop: theme.spacing.xl,
  },
});

export default LoadingScreen;
