import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import { AuthStackParamList } from '../../types';
import { theme } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

type Vague = '1' | '2';

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register } = useAuth();
  const { sessions, centresExamen, lieuxPratique, getDefaultParrainageCode } = useConfig();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(new Date(2000, 0, 1));
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    password: '',
    password_confirmation: '',
    date_naissance: '',
    quartier: '',
    type_permis: 'permis_b' as 'permis_a' | 'permis_b' | 'permis_t',
    type_cours: 'en_ligne' as 'en_ligne' | 'presentiel' | 'les_deux',
    vague: '' as Vague | '',
    session_id: 0,
    centre_examen_id: 0,
    code_parrainage: '',
    lieux_pratique: [] as number[],
  });

  const [availableVagues, setAvailableVagues] = useState<Vague[]>([]);

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  // Génération des années (de 1940 à aujourd'hui)
  const currentYearNow = new Date().getFullYear();
  const years = Array.from({ length: currentYearNow - 1939 }, (_, i) => currentYearNow - i);

  useEffect(() => {
    if (formData.session_id === 0) {
      setAvailableVagues([]);
      updateField('vague', '');
      return;
    }

    const selectedSession = sessions?.find((s) => s.id === formData.session_id);
    if (!selectedSession) {
      setAvailableVagues([]);
      updateField('vague', '');
      return;
    }

    const vagues: Vague[] = [];
    if (selectedSession.date_enregistrement_vague1) vagues.push('1');
    if (selectedSession.date_enregistrement_vague2) vagues.push('2');

    setAvailableVagues(vagues);

    if (vagues.length === 1) {
      updateField('vague', vagues[0]);
    } else {
      updateField('vague', '');
    }
  }, [formData.session_id, sessions]);

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => setFormData((prev) => ({ ...prev, [field]: value }));

  const toggleLieuPratique = (id: number) => {
    setFormData((prev) => {
      const lieux = prev.lieux_pratique;
      if (lieux.includes(id)) {
        return { ...prev, lieux_pratique: lieux.filter((l) => l !== id) };
      }
      return { ...prev, lieux_pratique: [...lieux, id] };
    });
  };

  const handleNoCode = async () => {
    const defaultCode = await getDefaultParrainageCode();
    if (defaultCode) {
      updateField('code_parrainage', defaultCode);
      Toast.show({
        type: 'info',
        text1: 'Code par défaut appliqué',
        text2: defaultCode,
      });
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
  };

  const handleDateConfirm = () => {
    const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    updateField('date_naissance', formattedDate);
    setShowDatePicker(false);
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const previousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    const today = new Date();
    if (currentYear === today.getFullYear() && currentMonth === today.getMonth()) {
      return;
    }
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentMonth === today.getMonth() && 
           currentYear === today.getFullYear();
  };

  const isSelected = (day: number) => {
    return day === selectedDate.getDate() && 
           currentMonth === selectedDate.getMonth() && 
           currentYear === selectedDate.getFullYear();
  };

  const handleYearSelect = (year: number) => {
    setCurrentYear(year);
    setShowYearPicker(false);
  };

  const validateAndNext = () => {
    if (step === 2 && formData.session_id === 0) {
      Toast.show({ type: 'error', text1: 'Veuillez sélectionner une session' });
      return false;
    }
    if (step === 2 && availableVagues.length === 0) {
      Toast.show({ type: 'error', text1: 'Aucune vague disponible pour cette session' });
      return false;
    }
    if (step === 2 && formData.vague === '') {
      Toast.show({ type: 'error', text1: 'Veuillez choisir une vague' });
      return false;
    }
    if (step === 3 && formData.centre_examen_id === 0) {
      Toast.show({ type: 'error', text1: 'Veuillez sélectionner un centre d\'examen' });
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (
      formData.session_id === 0 ||
      formData.centre_examen_id === 0 ||
      formData.lieux_pratique.length === 0 ||
      formData.vague === ''
    ) {
      Toast.show({ type: 'error', text1: 'Veuillez remplir tous les champs obligatoires' });
      return;
    }

    setLoading(true);
    const success = await register({
      ...formData,
      vague: formData.vague as Vague,
    });
    setLoading(false);
    if (success) {
      navigation.navigate('Login');
    }
  };

  const renderStep1 = () => (
    <>
      <Input label="Nom" placeholder="Votre nom" value={formData.nom} onChangeText={(v) => updateField('nom', v)} leftIcon="person-outline" />
      <Input label="Prénom" placeholder="Votre prénom" value={formData.prenom} onChangeText={(v) => updateField('prenom', v)} leftIcon="person-outline" />
      <Input label="Téléphone" placeholder="6XXXXXXXX" value={formData.telephone} onChangeText={(v) => updateField('telephone', v)} keyboardType="phone-pad" leftIcon="call-outline" />
      
      <Text style={styles.label}>Date de naissance (facultatif)</Text>
      <TouchableOpacity 
        style={styles.datePickerButton} 
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={[styles.datePickerText, !formData.date_naissance && styles.placeholderText]}>
          {formData.date_naissance ? formatDateDisplay(formData.date_naissance) : 'Sélectionner une date'}
        </Text>
        <Text style={styles.calendarIcon}>📅</Text>
      </TouchableOpacity>
      
      <Input label="Quartier (facultatif)" placeholder="Votre quartier" value={formData.quartier} onChangeText={(v) => updateField('quartier', v)} leftIcon="location-outline" />
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.label}>Catégorie de permis</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={formData.type_permis} onValueChange={(v) => updateField('type_permis', v)}>
          <Picker.Item label="A" value="permis_a" />
          <Picker.Item label="B" value="permis_b" />
          <Picker.Item label="BE (Non disponible)" value="permis_be" enabled={false} color="#999" />
          <Picker.Item label="C (Non disponible)" value="permis_c" enabled={false} color="#999" />
          <Picker.Item label="D (Non disponible)" value="permis_d" enabled={false} color="#999" />
          <Picker.Item label="DE (Non disponible)" value="permis_de" enabled={false} color="#999" />
          <Picker.Item label="FA1 (Non disponible)" value="permis_fa1" enabled={false} color="#999"/>
          <Picker.Item label="FA (Non disponible)" value="permis_fa" enabled={false} color="#999"/>
          <Picker.Item label="FB (Non disponible)" value="permis_fb" enabled={false} color="#999"/>
          <Picker.Item label="G (Non disponible)" value="permis_g" enabled={false} color="#999"/>
        </Picker>
      </View>

      <Text style={styles.label}>Type de cours</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={formData.type_cours} onValueChange={(v) => updateField('type_cours', v)}>
          <Picker.Item label="En ligne" value="en_ligne" />
          <Picker.Item label="En présentiel (Samedi)" value="presentiel" />
          <Picker.Item label="Les deux" value="les_deux" />
        </Picker>
      </View>

      <Text style={styles.label}>Session *</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={formData.session_id} onValueChange={(v) => updateField('session_id', Number(v))}>
          <Picker.Item label="Choisir une session" value={0} />
          {sessions?.filter((s) => s.active).map((session) => (
            <Picker.Item key={session.id} label={session.nom} value={session.id} />
          ))}
        </Picker>
      </View>

      {formData.session_id > 0 && availableVagues.length > 0 && (
        <>
          <Text style={styles.label}>Vague disponible *</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={formData.vague} onValueChange={(v) => updateField('vague', v as Vague)}>
              <Picker.Item label="Choisir une vague" value="" />
              {availableVagues.includes('1') && <Picker.Item label="Vague 1" value="1" />}
              {availableVagues.includes('2') && <Picker.Item label="Vague 2" value="2" />}
            </Picker>
          </View>
        </>
      )}

      {formData.session_id > 0 && availableVagues.length === 0 && (
        <Text style={styles.errorText}>Aucune vague d'enregistrement ouverte pour cette session.</Text>
      )}
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.label}>Centre d'examen *</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={formData.centre_examen_id} onValueChange={(v) => updateField('centre_examen_id', Number(v))}>
          <Picker.Item label="Choisir un centre" value={0} />
          {centresExamen?.filter((c) => c.active).map((centre) => (
            <Picker.Item
              key={centre.id}
              label={`${centre.nom} ${centre.ville ? `(${centre.ville})` : ''}`}
              value={centre.id}
            />
          ))}
        </Picker>
      </View>
    </>
  );

  const renderStep4 = () => (
    <>
      <Text style={styles.label}>Lieux de pratique (au moins un) *</Text>
      <View style={styles.checkboxContainer}>
        {lieuxPratique?.filter((l) => l.active).map((lieu) => (
          <TouchableOpacity key={lieu.id} style={styles.checkboxItem} onPress={() => toggleLieuPratique(lieu.id)}>
            <View
              style={[
                styles.checkbox,
                formData.lieux_pratique.includes(lieu.id) && styles.checkboxChecked,
              ]}
            >
              {formData.lieux_pratique.includes(lieu.id) && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              {lieu.nom} {lieu.ville ? `(${lieu.ville})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input
        label="Code de parrainage (facultatif)"
        placeholder="Code de votre parrain"
        value={formData.code_parrainage}
        onChangeText={(v) => updateField('code_parrainage', v)}
        leftIcon="gift-outline"
      />
      <TouchableOpacity onPress={handleNoCode} style={styles.noCodeBtn}>
        <Text style={styles.noCodeText}>Je n'ai pas de code</Text>
      </TouchableOpacity>

      <Input
        label="Mot de passe"
        placeholder="Min. 6 caractères"
        value={formData.password}
        onChangeText={(v) => updateField('password', v)}
        isPassword
        leftIcon="lock-closed-outline"
      />
      <Input
        label="Confirmer le mot de passe"
        placeholder="Confirmez"
        value={formData.password_confirmation}
        onChangeText={(v) => updateField('password_confirmation', v)}
        isPassword
        leftIcon="lock-closed-outline"
      />
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity
            onPress={() => (step > 1 ? setStep(step - 1) : navigation.goBack())}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← {step > 1 ? 'Étape précédente' : 'Retour'}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Inscription</Text>
          <Text style={styles.stepIndicator}>Étape {step}/4</Text>

          <View style={styles.form}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </View>

          {step < 4 ? (
            <Button
              title="Continuer"
              onPress={() => {
                if (validateAndNext()) {
                  setStep(step + 1);
                }
              }}
              fullWidth
              size="large"
            />
          ) : (
            <Button title="S'inscrire" onPress={handleRegister} loading={loading} fullWidth size="large" />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal du calendrier */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={previousMonth} style={styles.navButton}>
                <Text style={styles.navButtonText}>◀</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowYearPicker(true)} style={styles.titleButton}>
                <Text style={styles.calendarTitle}>
                  {monthNames[currentMonth]} {currentYear}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={nextMonth} 
                style={styles.navButton}
                disabled={currentYear === new Date().getFullYear() && currentMonth === new Date().getMonth()}
              >
                <Text style={[
                  styles.navButtonText,
                  currentYear === new Date().getFullYear() && currentMonth === new Date().getMonth() && styles.navButtonDisabled
                ]}>▶</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekDays}>
              {daysOfWeek.map((day) => (
                <Text key={day} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {generateCalendarDays().map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    day === null && styles.emptyDay,
                    day && isSelected(day) && styles.selectedDay,
                    day && isToday(day) && !isSelected(day) && styles.todayDay,
                  ]}
                  onPress={() => day && handleDateSelect(day)}
                  disabled={day === null}
                >
                  {day && (
                    <Text style={[
                      styles.dayText,
                      isSelected(day) && styles.selectedDayText,
                      isToday(day) && !isSelected(day) && styles.todayDayText,
                    ]}>
                      {day}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.calendarFooter}>
              <TouchableOpacity 
                style={[styles.calendarButton, styles.cancelButton]} 
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.calendarButton, styles.confirmButton]} 
                onPress={handleDateConfirm}
              >
                <Text style={styles.confirmButtonText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal sélection d'année */}
      <Modal
        visible={showYearPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowYearPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.yearPickerModal}>
            <Text style={styles.yearPickerTitle}>Sélectionner l'année</Text>
            <ScrollView style={styles.yearList} showsVerticalScrollIndicator={true}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearItem,
                    year === currentYear && styles.selectedYearItem
                  ]}
                  onPress={() => handleYearSelect(year)}
                >
                  <Text style={[
                    styles.yearText,
                    year === currentYear && styles.selectedYearText
                  ]}>
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={styles.yearPickerCloseButton} 
              onPress={() => setShowYearPicker(false)}
            >
              <Text style={styles.yearPickerCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flexGrow: 1, padding: theme.spacing.lg },
  backButton: { marginBottom: theme.spacing.md },
  backText: { ...theme.typography.body, color: theme.colors.primary },
  title: { ...theme.typography.h1, color: theme.colors.textPrimary },
  stepIndicator: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  form: { marginBottom: theme.spacing.lg },
  label: {
    ...theme.typography.bodySmall,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  pickerContainer: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  datePickerButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  datePickerText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  placeholderText: {
    color: theme.colors.textSecondary,
  },
  calendarIcon: {
    fontSize: 20,
  },
  errorText: {
    ...theme.typography.bodySmall,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  checkboxContainer: { marginBottom: theme.spacing.md },
  checkboxItem: { flexDirection: 'row', alignItems: 'center', marginVertical: theme.spacing.xs },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginRight: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: theme.colors.primary },
  checkmark: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  checkboxLabel: { ...theme.typography.body, color: theme.colors.textPrimary, flex: 1 },
  noCodeBtn: { alignSelf: 'flex-end', marginBottom: theme.spacing.md },
  noCodeText: { ...theme.typography.bodySmall, color: theme.colors.secondary },
  
  // Styles du modal calendrier
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 380,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  titleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dropdownIcon: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  navButton: {
    padding: 8,
  },
  navButtonText: {
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  navButtonDisabled: {
    color: '#ccc',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekDayText: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  emptyDay: {
    backgroundColor: 'transparent',
  },
  dayText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  selectedDay: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
  },
  selectedDayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  todayDay: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 20,
  },
  todayDayText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  calendarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  calendarButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  
  // Styles du sélecteur d'année
  yearPickerModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    maxHeight: '70%',
  },
  yearPickerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  yearList: {
    maxHeight: 400,
  },
  yearItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  selectedYearItem: {
    backgroundColor: theme.colors.primary + '15',
  },
  yearText: {
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  selectedYearText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  yearPickerCloseButton: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center',
  },
  yearPickerCloseText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
});

export default RegisterScreen;