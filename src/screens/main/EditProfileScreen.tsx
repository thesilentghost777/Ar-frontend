import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { theme } from '../../config/theme';
import { useNavigation } from '@react-navigation/native';
import { apiRequest } from '../../config/api';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// CORRECTION: Déplacer InputField EN DEHORS du composant principal
const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  editable = true,
  showPassword,
  onTogglePassword,
}: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputContainer, error && styles.inputError]}>
      <Ionicons
        name={icon}
        size={20}
        color={error ? '#EF4444' : theme.colors.primary}
        style={styles.inputIcon}
      />
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        secureTextEntry={secureTextEntry && !showPassword}
        keyboardType={keyboardType}
        editable={editable}
      />
      {secureTextEntry && (
        <TouchableOpacity
          onPress={onTogglePassword}
          style={styles.eyeIcon}
        >
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={20}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      )}
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

export const EditProfileScreen = () => {
  const { user, token, refreshUser } = useAuth();
  const { lieuxPratique } = useConfig();
  const navigation = useNavigation<any>();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [nom, setNom] = useState(user?.nom || '');
  const [prenom, setPrenom] = useState(user?.prenom || '');
  const [telephone, setTelephone] = useState(user?.telephone || '');
  const [quartier, setQuartier] = useState(user?.quartier || '');
  const [typeCours, setTypeCours] = useState(user?.type_cours || 'en_ligne');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [selectedLieux, setSelectedLieux] = useState<number[]>(
    user?.lieuxPratique?.map(l => l.id) || []
  );

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }

    if (!prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }

    if (!telephone.trim()) {
      newErrors.telephone = 'Le téléphone est requis';
    } else if (telephone.length < 9) {
      newErrors.telephone = 'Numéro de téléphone invalide';
    }

    if (password) {
      if (password.length < 6) {
        newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      }
      if (password !== passwordConfirmation) {
        newErrors.passwordConfirmation = 'Les mots de passe ne correspondent pas';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Erreur de validation',
        text2: 'Veuillez corriger les erreurs',
      });
      return;
    }

    setIsLoading(true);

    try {
      const updateData: any = {
        nom: nom.trim(),
        prenom: prenom.trim(),
        telephone: telephone.trim(),
        quartier: quartier.trim(),
        type_cours: typeCours,
        lieux_pratique: selectedLieux,
      };

      if (password) {
        updateData.password = password;
      }

      const response = await apiRequest<{
        success: boolean;
        message: string;
        user: any;
      }>('/profil/update', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      }, token);

      if (response.success) {
        await refreshUser();
        Toast.show({
          type: 'success',
          text1: 'Profil mis à jour',
          text2: 'Vos modifications ont été enregistrées',
        });
        navigation.goBack();
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible de mettre à jour le profil',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLieuPratique = (lieuId: number) => {
    setSelectedLieux(prev => {
      if (prev.includes(lieuId)) {
        return prev.filter(id => id !== lieuId);
      } else {
        return [...prev, lieuId];
      }
    });
  };

  return (
     <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Informations personnelles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          <View style={styles.card}>
            <InputField
              label="Nom"
              value={nom}
              onChangeText={setNom}
              placeholder="Votre nom"
              icon="person"
              error={errors.nom}
            />
            <InputField
              label="Prénom"
              value={prenom}
              onChangeText={setPrenom}
              placeholder="Votre prénom"
              icon="person-outline"
              error={errors.prenom}
            />
            <InputField
              label="Téléphone"
              value={telephone}
              onChangeText={setTelephone}
              placeholder="690123456"
              icon="call"
              keyboardType="phone-pad"
              error={errors.telephone}
            />
            <InputField
              label="Quartier"
              value={quartier}
              onChangeText={setQuartier}
              placeholder="Votre quartier"
              icon="location"
              error={errors.quartier}
            />
          </View>
        </View>

        {/* Type de cours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Préférences de formation</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Type de cours théorique</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={typeCours}
                onValueChange={(value) => setTypeCours(value)}
                style={styles.picker}
              >
                <Picker.Item label="En ligne" value="en_ligne" />
                <Picker.Item label="En présentiel (Samedi)" value="presentiel" />
                <Picker.Item label="En ligne & Présentiel" value="les_deux" />
              </Picker>
            </View>
          </View>
        </View>

        {/* Lieux de pratique */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lieux de pratique</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Sélectionnez vos lieux de pratique</Text>
            {lieuxPratique.map(lieu => (
              <TouchableOpacity
                key={lieu.id}
                style={styles.checkboxRow}
                onPress={() => toggleLieuPratique(lieu.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    selectedLieux.includes(lieu.id) && styles.checkboxActive,
                  ]}
                >
                  {selectedLieux.includes(lieu.id) && (
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  )}
                </View>
                <View style={styles.lieuInfo}>
                  <Text style={styles.lieuNom}>{lieu.nom}</Text>
                  {lieu.adresse && (
                    <Text style={styles.lieuAdresse}>{lieu.adresse}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Modifier le mot de passe */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sécurité</Text>
          <View style={styles.card}>
            <Text style={styles.infoText}>
              Laissez vide si vous ne souhaitez pas modifier votre mot de passe
            </Text>
            <InputField
              label="Nouveau mot de passe"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              icon="lock-closed"
              secureTextEntry={true}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              error={errors.password}
            />
            <InputField
              label="Confirmer le mot de passe"
              value={passwordConfirmation}
              onChangeText={setPasswordConfirmation}
              placeholder="••••••••"
              icon="lock-closed"
              secureTextEntry={true}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              error={errors.passwordConfirmation}
            />
          </View>
        </View>

        {/* Informations non modifiables */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations non modifiables</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type de permis</Text>
              <Text style={styles.infoValue}>
                {user.type_permis === 'permis_a' && 'Permis A (Moto)'}
                {user.type_permis === 'permis_b' && 'Permis B (Voiture)'}
                {user.type_permis === 'permis_t' && 'Permis T (Tracteur)'}
              </Text>
            </View>
            {user.session && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Session d'examen</Text>
                <Text style={styles.infoValue}>{user.session.nom}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vague</Text>
              <Text style={styles.infoValue}>Vague {user.vague}</Text>
            </View>
          </View>
        </View>

        {/* Bouton de sauvegarde */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    marginHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputDisabled: {
    color: '#9CA3AF',
  },
  eyeIcon: {
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  lieuInfo: {
    flex: 1,
  },
  lieuNom: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  lieuAdresse: {
    fontSize: 13,
    color: '#6B7280',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  saveButton: {
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  bottomSpacer: {
    height: 32,
  },
});

export default EditProfileScreen;