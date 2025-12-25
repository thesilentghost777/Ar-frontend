import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Send, User, Phone, AlertCircle } from 'lucide-react-native';
import { theme } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../config/api';
import { validatePhone, validateAmount } from '../../utils/validators';
import { formatCurrency } from '../../utils/formatters';

import Toast from 'react-native-toast-message';

interface Destinataire {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
}

export default function TransfertScreen() {
  const { token, user, refreshUser } = useAuth();
  const [telephone, setTelephone] = useState('');
  const [montant, setMontant] = useState('');
  const [destinataire, setDestinataire] = useState<Destinataire | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  const handleSearchDestinataire = async () => {
    if (!validatePhone(telephone)) {
      Toast.show({
        type: 'error',
        text1: 'Numero invalide',
        text2: 'Veuillez entrer un numero valide',
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiRequest<{
        success: boolean;
        destinataire: Destinataire;
      }>(
        `/transfert/rechercher?telephone=${telephone}`,
        { method: 'GET' },
        token
      );

      if (response.success) {
        setDestinataire(response.destinataire);
        Toast.show({
          type: 'success',
          text1: 'Utilisateur trouve',
          text2: `${response.destinataire.prenom} ${response.destinataire.nom}`,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Utilisateur non trouve',
        text2: error.message || 'Aucun utilisateur avec ce numero',
      });
      setDestinataire(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTransfert = async () => {
    if (!destinataire) {
      Toast.show({
        type: 'error',
        text1: 'Destinataire requis',
        text2: 'Veuillez rechercher un destinataire',
      });
      return;
    }

    const amount = parseInt(montant);
    const validation = validateAmount(amount, 1000);

    if (!validation.valid) {
      Toast.show({
        type: 'error',
        text1: 'Montant invalide',
        text2: validation.message,
      });
      return;
    }

    if (user && amount > user.solde) {
      Toast.show({
        type: 'error',
        text1: 'Solde insuffisant',
        text2: `Votre solde: ${formatCurrency(user.solde)}`,
      });
      return;
    }

    setIsTransferring(true);
    try {
      const response = await apiRequest<{
        success: boolean;
        message: string;
        nouveau_solde: number;
        destinataire: {
          nom: string;
          prenom: string;
        };
      }>(
        '/transfert',
        {
          method: 'POST',
          body: JSON.stringify({
            telephone_destinataire: telephone,
            montant: amount,
          }),
        },
        token
      );

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Transfert reussi',
          text2: `Nouveau solde: ${formatCurrency(response.nouveau_solde)}`,
        });
        await refreshUser();
        setTelephone('');
        setMontant('');
        setDestinataire(null);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible d\'effectuer le transfert',
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const handleReset = () => {
    setTelephone('');
    setMontant('');
    setDestinataire(null);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transfert d'argent</Text>
        <Text style={styles.subtitle}>
          Envoyez de l'argent a un autre utilisateur
        </Text>
      </View>

      {user && (
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Votre solde</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(user.solde)}</Text>
        </View>
      )}

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Numero du destinataire</Text>
          <View style={styles.searchContainer}>
            <Phone
              size={20}
              color={theme.colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="690123456"
              keyboardType="phone-pad"
              value={telephone}
              onChangeText={(text) => {
                setTelephone(text);
                setDestinataire(null);
              }}
              maxLength={9}
              editable={!isSearching && !isTransferring}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearchDestinataire}
              disabled={isSearching || isTransferring}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text style={styles.searchButtonText}>Rechercher</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {destinataire && (
          <View style={styles.destinataireCard}>
            <View style={styles.destinataireIcon}>
              <User size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.destinataireInfo}>
              <Text style={styles.destinataireNom}>
                {destinataire.prenom} {destinataire.nom}
              </Text>
              <Text style={styles.destinataireTel}>{destinataire.telephone}</Text>
            </View>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.changeButton}>Modifier</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Montant a transferer (FCFA)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 15000"
            keyboardType="numeric"
            value={montant}
            onChangeText={setMontant}
            editable={!isTransferring && !!destinataire}
          />
          <Text style={styles.hint}>Aucun frais de transfert applique</Text>
        </View>

        {!destinataire && (
          <View style={styles.infoCard}>
            <AlertCircle size={20} color={theme.colors.info} />
            <Text style={styles.infoText}>
              Recherchez d'abord le destinataire avant de saisir le montant
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!destinataire || isTransferring) && styles.submitButtonDisabled,
          ]}
          onPress={handleTransfert}
          disabled={!destinataire || isTransferring}
        >
          {isTransferring ? (
            <ActivityIndicator color={theme.colors.textInverse} />
          ) : (
            <>
              <Send size={20} color={theme.colors.textInverse} />
              <Text style={styles.submitButtonText}>Effectuer le transfert</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.warningCard}>
        <AlertCircle size={20} color={theme.colors.warning} />
        <Text style={styles.warningText}>
          Verifiez bien les informations du destinataire avant de valider le
          transfert. Cette operation est irreversible.
        </Text>
      </View>
    </ScrollView>
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
  balanceCard: {
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  balanceLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textInverse,
    marginBottom: theme.spacing.xs,
  },
  balanceAmount: {
    ...theme.typography.h2,
    color: theme.colors.textInverse,
    fontWeight: '700',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingLeft: theme.spacing.md,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    ...theme.typography.body,
    flex: 1,
    padding: theme.spacing.md,
    color: theme.colors.textPrimary,
  },
  searchButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primaryLight + '20',
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.border,
  },
  searchButtonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
    fontWeight: '600',
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
  destinataireCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.success + '10',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  destinataireIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  destinataireInfo: {
    flex: 1,
  },
  destinataireNom: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  destinataireTel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  changeButton: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.info + '10',
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  infoText: {
    ...theme.typography.bodySmall,
    color: theme.colors.info,
    flex: 1,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: theme.spacing.lg,
    marginTop: 0,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.warning + '10',
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  warningText: {
    ...theme.typography.bodySmall,
    color: theme.colors.warning,
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
});
