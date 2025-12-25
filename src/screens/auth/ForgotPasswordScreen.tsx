import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { theme } from '../../config/theme';
import { useConfig } from '../../context/ConfigContext';
import Button from '../../components/common/Button';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'> };

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { configuration } = useConfig();
  
  const handleWhatsApp = () => {
    const phone = configuration?.whatsapp_support || '+237690000000';
    const message = encodeURIComponent("Bonjour, j'ai oublié mon mot de passe et j'aimerais le réinitialiser. Merci.");
    Linking.openURL(`whatsapp://send?phone=${phone}&text=${message}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="lock-open-outline" size={80} color={theme.colors.primary} />
        <Text style={styles.title}>Mot de passe oublié ?</Text>
        <Text style={styles.description}>
          Pour réinitialiser votre mot de passe, contactez notre support via WhatsApp.
        </Text>
        <Button title="Contacter via WhatsApp" onPress={handleWhatsApp} fullWidth size="large" icon={<Ionicons name="logo-whatsapp" size={20} color="#fff" />} />
        <Button title="Retour à la connexion" onPress={() => navigation.navigate('Login')} variant="outline" fullWidth style={{ marginTop: theme.spacing.md }} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, padding: theme.spacing.lg, alignItems: 'center', justifyContent: 'center' },
  title: { ...theme.typography.h2, color: theme.colors.textPrimary, marginTop: theme.spacing.lg, textAlign: 'center' },
  description: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', marginVertical: theme.spacing.lg },
});

export default ForgotPasswordScreen;
