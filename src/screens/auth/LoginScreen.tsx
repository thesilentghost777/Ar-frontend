import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { theme } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login } = useAuth();
  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ telephone?: string; password?: string }>({});

  const handleLogin = async () => {
    const newErrors: { telephone?: string; password?: string } = {};
    if (!telephone) newErrors.telephone = 'Le téléphone est requis';
    if (!password) newErrors.password = 'Le mot de passe est requis';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    await login(telephone, password);
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Connexion</Text>
            <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Numéro de téléphone"
              placeholder="6XXXXXXXX"
              value={telephone}
              onChangeText={setTelephone}
              keyboardType="phone-pad"
              leftIcon="call-outline"
              error={errors.telephone}
            />

            <Input
              label="Mot de passe"
              placeholder="Votre mot de passe"
              value={password}
              onChangeText={setPassword}
              isPassword
              leftIcon="lock-closed-outline"
              error={errors.password}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            <Button
              title="Se connecter"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="large"
            />
          </View>

          <View style={styles.registerSection}>
            <Text style={styles.registerText}>Pas encore de compte ?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>S'inscrire</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  keyboardView: { flex: 1 },
  content: { flexGrow: 1, padding: theme.spacing.lg },
  backButton: { marginBottom: theme.spacing.lg },
  backText: { ...theme.typography.body, color: theme.colors.primary },
  header: { marginBottom: theme.spacing.xl },
  title: { ...theme.typography.h1, color: theme.colors.textPrimary },
  subtitle: { ...theme.typography.body, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  form: { marginTop: theme.spacing.md },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: theme.spacing.lg },
  forgotPasswordText: { ...theme.typography.bodySmall, color: theme.colors.primary },
  registerSection: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing.xl, gap: theme.spacing.xs },
  registerText: { ...theme.typography.body, color: theme.colors.textSecondary },
  registerLink: { ...theme.typography.body, color: theme.colors.primary, fontWeight: '600' },
});

export default LoginScreen;
