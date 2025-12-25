import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import WebView from 'react-native-webview';
import { CreditCard, Smartphone, ChevronRight } from 'lucide-react-native';
import { theme } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../config/api';
import { formatCurrency} from '../../utils/formatters';
import { validateAmount } from '../../utils/validators';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types';

type PaymentMethod = 'mobile' | 'code_caisse';
type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export default function PaiementScreen() {
  const { token, refreshUser } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('mobile');
  const [montant, setMontant] = useState('');
  const [numeroPayeur, setNumeroPayeur] = useState('');
  const [codeCaisse, setCodeCaisse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');

  const handleDepotMobile = async () => {
    const amount = parseInt(montant);
    const validation = validateAmount(amount);
    if (!validation.valid) {
      Toast.show({
        type: 'error',
        text1: 'Montant invalide',
        text2: validation.message,
      });
      return;
    }
    if (!numeroPayeur || numeroPayeur.length !== 9) {
      Toast.show({
        type: 'error',
        text1: 'Numero invalide',
        text2: 'Veuillez entrer un numero valide',
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiRequest<{
        success: boolean;
        message: string;
        nouveau_solde?: number;
        url?: string;
      }>(
        '/depot/mobile',
        {
          method: 'POST',
          body: JSON.stringify({
            montant: amount,
            numero_payeur: numeroPayeur,
          }),
        },
        token
      );
      if (response.success) {
        if (response.url) {
          // Ouvrir WebView pour le paiement
          setPaymentUrl(response.url);
          setShowWebView(true);
        } else {
          Toast.show({
            type: 'success',
            text1: 'Depot reussi',
          });
          await refreshUser();
          setMontant('');
          setNumeroPayeur('');
        }
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible d\'effectuer le depot',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDepotCodeCaisse = async () => {
    if (!codeCaisse || codeCaisse.trim() === '') {
      Toast.show({
        type: 'error',
        text1: 'Code requis',
        text2: 'Veuillez entrer le code caisse',
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiRequest<{
        success: boolean;
        message: string;
        nouveau_solde: number;
      }>(
        '/depot/code-caisse',
        {
          method: 'POST',
          body: JSON.stringify({
            code: codeCaisse,
          }),
        },
        token
      );
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Depot reussi',
          text2: `Nouveau solde: ${formatCurrency(response.nouveau_solde)}`,
        });
        await refreshUser();
        setCodeCaisse('');
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Code caisse invalide',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (selectedMethod === 'mobile') {
      handleDepotMobile();
    } else {
      handleDepotCodeCaisse();
    }
  };

  const handleWebViewClose = async () => {
    setShowWebView(false);
    Toast.show({
      type: 'success',
      text1: 'Paiement effectué',
      text2: 'Votre paiement a été traité avec succès',
    });
    await refreshUser();
    // Redirection vers le Dashboard
    navigation.navigate('Dashboard');
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Recharger mon compte</Text>
          <Text style={styles.subtitle}>
            Choisissez votre mode de paiement
          </Text>
        </View>

        <View style={styles.methodsContainer}>
          <TouchableOpacity
            style={[
              styles.methodCard,
              selectedMethod === 'mobile' && styles.methodCardActive,
            ]}
            onPress={() => setSelectedMethod('mobile')}
          >
            <View style={styles.methodIcon}>
              <Smartphone
                size={24}
                color={
                  selectedMethod === 'mobile'
                    ? theme.colors.primary
                    : theme.colors.textSecondary
                }
              />
            </View>
            <View style={styles.methodContent}>
              <Text
                style={[
                  styles.methodTitle,
                  selectedMethod === 'mobile' && styles.methodTitleActive,
                ]}
              >
                Mobile Money
              </Text>
              <Text style={styles.methodDescription}>
                Orange Money, MTN Mobile Money
              </Text>
            </View>
            {selectedMethod === 'mobile' && (
              <ChevronRight size={20} color={theme.colors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.methodCard,
              selectedMethod === 'code_caisse' && styles.methodCardActive,
            ]}
            onPress={() => setSelectedMethod('code_caisse')}
          >
            <View style={styles.methodIcon}>
              <CreditCard
                size={24}
                color={
                  selectedMethod === 'code_caisse'
                    ? theme.colors.primary
                    : theme.colors.textSecondary
                }
              />
            </View>
            <View style={styles.methodContent}>
              <Text
                style={[
                  styles.methodTitle,
                  selectedMethod === 'code_caisse' && styles.methodTitleActive,
                ]}
              >
                Code Caisse
              </Text>
              <Text style={styles.methodDescription}>
                Code fourni par l'administration
              </Text>
            </View>
            {selectedMethod === 'code_caisse' && (
              <ChevronRight size={20} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          {selectedMethod === 'mobile' ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Montant (FCFA)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 50000"
                  keyboardType="numeric"
                  value={montant}
                  onChangeText={setMontant}
                  editable={!isLoading}
                />
                <Text style={styles.hint}>Montant minimum: 10 000 FCFA</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Numero du payeur</Text>
                <TextInput
                  style={styles.input}
                  placeholder="690123456"
                  keyboardType="phone-pad"
                  value={numeroPayeur}
                  onChangeText={setNumeroPayeur}
                  maxLength={9}
                  editable={!isLoading}
                />
              </View>
            </>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Code Caisse</Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez le code fourni"
                value={codeCaisse}
                onChangeText={setCodeCaisse}
                autoCapitalize="characters"
                editable={!isLoading}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.textInverse} />
            ) : (
              <Text style={styles.submitButtonText}>
                {selectedMethod === 'mobile' ? 'Recharger' : 'Valider le code'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Transfert')}
          >
            <Text style={styles.secondaryButtonText}>Transferer des fonds</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Historique')}
          >
            <Text style={styles.secondaryButtonText}>Voir l'historique</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showWebView && (
        <Modal
          visible={showWebView}
          onRequestClose={handleWebViewClose}
          animationType="slide"
        >
          <WebView
            source={{ uri: paymentUrl }}
            onNavigationStateChange={(navState) => {
              if (navState.url.includes('end_payment')) {
                handleWebViewClose();
              }
            }}
          />
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  methodsContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  methodCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight + '10',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  methodTitleActive: {
    color: theme.colors.primary,
  },
  methodDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  formContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  inputGroup: {
    gap: theme.spacing.sm,
  },
  label: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  input: {
    ...theme.typography.body,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.textPrimary,
  },
  hint: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
  actionsContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryButtonText: {
    ...theme.typography.button,
    color: theme.colors.primary,
  },
});