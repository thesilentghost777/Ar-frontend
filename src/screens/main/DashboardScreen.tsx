import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList, Dashboard } from '../../types';
import { theme } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../config/api';
import { formatCurrency } from '../../utils/formatters';
import Card from '../../components/common/Card';
import ProgressBar from '../../components/common/ProgressBar';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

type Props = { navigation: NativeStackNavigationProp<MainStackParamList, 'Dashboard'> };

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user, token } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState({ jours: 0, heures: 0, minutes: 0, secondes: 0 });

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (dashboard?.compte_a_rebours?.timestamp_cible) {
      const interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const diff = dashboard.compte_a_rebours.timestamp_cible - now;
        if (diff > 0) {
          setCountdown({
            jours: Math.floor(diff / 86400),
            heures: Math.floor((diff % 86400) / 3600),
            minutes: Math.floor((diff % 3600) / 60),
            secondes: diff % 60,
          });
        } else {
          setCountdown({ jours: 0, heures: 0, minutes: 0, secondes: 0 });
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [dashboard]);

  const fetchDashboard = async () => {
    try {
      const data = await apiRequest<Dashboard>('/dashboard', { method: 'GET' }, token);
      setDashboard(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Vérifier si l'utilisateur est prêt
  const checkReadiness = () => {
    const allPaid = dashboard?.frais 
      ? Object.values(dashboard.frais).every(f => f.status === 'paye')
      : false;
    
    const theoriqueComplete = (dashboard?.progression?.theorique?.global?.pourcentage || 0) >= 100;
    const pratiqueComplete = (dashboard?.progression?.pratique?.global?.pourcentage || 0) >= 100;
    
    const isReady = allPaid && theoriqueComplete && pratiqueComplete;
    
    const missing = [];
    if (!allPaid) missing.push('Frais de formation');
    if (!theoriqueComplete) missing.push('Cours théoriques');
    if (!pratiqueComplete) missing.push('Cours pratiques');
    
    return { isReady, missing };
  };

  const { isReady, missing } = checkReadiness();

  if (loading) return <LoadingSpinner fullScreen message="Chargement..." />;

  const menuItems = [
    { icon: 'wallet', label: 'Recharger', color: theme.colors.success, route: 'Paiement' },
    { icon: 'swap-horizontal', label: 'Transférer', color: theme.colors.info, route: 'Transfert' },
    { icon: 'receipt', label: 'Historique Transaction', color: theme.colors.warning, route: 'Historique' },
    { icon: 'card', label: 'Payer Frais', color: theme.colors.secondary, route: 'PayerFrais' },
    { icon: 'book', label: 'Cours Théorique', color: theme.colors.primary, route: 'CoursTheorique' },
    { icon: 'videocam', label: 'Cours Pratique', color: theme.colors.error, route: 'CoursPratique' },
    { icon: 'people', label: 'Parrainage', color: '#8B5CF6', route: 'Parrainage' },
  ];

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Non définie';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return 'Non définie';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboard(); }} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Bienvenue,</Text>
            <Text style={styles.userName}>{user?.prenom}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarButton}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={24} color={theme.colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <Card style={styles.balanceCard}>
          <View style={styles.balanceContent}>
            <View style={styles.balanceHeader}>
              <View style={styles.balanceIconWrapper}>
                <Ionicons name="wallet-outline" size={20} color="#fff" />
              </View>
              <Text style={styles.balanceLabel}>Mon Solde</Text>
            </View>
            <Text style={styles.balanceAmount}>{formatCurrency(dashboard?.utilisateur?.solde || 0)}</Text>
          </View>
        </Card>

        {/* Statut de Préparation */}
        <Card style={styles.readinessCard}>
          <View style={styles.readinessHeader}>
            <View style={[styles.readinessIconWrapper, isReady ? styles.readyIcon : styles.notReadyIcon]}>
              <Ionicons 
                name={isReady ? "checkmark-circle" : "alert-circle"} 
                size={24} 
                color="#fff" 
              />
            </View>
            <View style={styles.readinessTextContainer}>
              <Text style={styles.readinessTitle}>
                {isReady ? "Vous êtes prêt !" : "Vous n'êtes pas encore prêt à passer l'examen"}
              </Text>
              <Text style={styles.readinessSubtitle}>
                {isReady 
                  ? "Tous les critères sont remplis pour passer l'examen" 
                  : "Complétez les éléments suivants"}
              </Text>
            </View>
          </View>
          
          {!isReady && missing.length > 0 && (
            <View style={styles.missingContainer}>
              {missing.map((item, index) => (
                <View key={index} style={styles.missingItem}>
                  <Ionicons name="close-circle" size={18} color={theme.colors.error} />
                  <Text style={styles.missingText}>{item}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Compte à rebours */}
        {dashboard?.compte_a_rebours && !dashboard.compte_a_rebours.passe && (
          <Card title="Compte à rebours - Examen" style={styles.section}>
            <View style={styles.countdownRow}>
              {[
                { v: countdown.jours, l: 'Jours' },
                { v: countdown.heures, l: 'Heures' },
                { v: countdown.minutes, l: 'Min' },
                { v: countdown.secondes, l: 'Sec' },
              ].map((item, i) => (
                <View key={i} style={styles.countdownItem}>
                  <View style={styles.countdownBox}>
                    <Text style={styles.countdownValue}>{item.v.toString().padStart(2, '0')}</Text>
                  </View>
                  <Text style={styles.countdownLabel}>{item.l}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Menu Grid */}
        <View style={styles.menuGrid}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={26} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Progression */}
        <Card title="Ma Progression" style={styles.section}>
          <View style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Cours Théoriques</Text>
              <Text style={styles.progressPercentage}>
                {dashboard?.progression?.theorique?.global?.pourcentage || 0}%
              </Text>
            </View>
            <ProgressBar
              progress={dashboard?.progression?.theorique?.global?.pourcentage || 0}
              showLabel={false}
              progressColor={theme.colors.primary}
            />
          </View>
          <View style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Cours Pratiques</Text>
              <Text style={styles.progressPercentage}>
                {dashboard?.progression?.pratique?.global?.pourcentage || 0}%
              </Text>
            </View>
            <ProgressBar
              progress={dashboard?.progression?.pratique?.global?.pourcentage || 0}
              showLabel={false}
              progressColor={theme.colors.secondary}
            />
          </View>
        </Card>

        {/* Frais de Formation */}
        <Card title="Frais de Formation" style={styles.section}>
          {dashboard?.frais &&
            Object.entries(dashboard.frais).map(([key, frais]) => (
              <View key={key} style={styles.fraisItem}>
                <View style={styles.fraisLeft}>
                  <Text style={styles.fraisLabel}>{frais.label}</Text>
                  <Text style={styles.fraisMontant}>{formatCurrency(frais.montant)}</Text>
                </View>
                <StatusBadge status={frais.status as any} />
              </View>
            ))}
        </Card>

        {/* Ma Session */}
        {dashboard?.session && (
          <Card title="Ma Session" style={styles.section}>
            <View style={styles.sessionItem}>
              <Text style={styles.sessionLabel}>Nom de la session</Text>
              <Text style={styles.sessionValue}>{dashboard.session.nom}</Text>
            </View>
            <View style={styles.sessionItem}>
              <Text style={styles.sessionLabel}>Vague</Text>
              <Text style={styles.sessionValue}>
                Vague {dashboard.utilisateur.vague || user?.vague || 'Non définie'}
              </Text>
            </View>

            {dashboard.session.date_communication_enregistrement && (
              <View style={styles.sessionItem}>
                <Text style={styles.sessionLabel}>Communication enregistrement</Text>
                <Text style={styles.sessionValue}>
                  {formatDate(dashboard.session.date_communication_enregistrement)}
                </Text>
              </View>
            )}

            {dashboard.session.date_enregistrement_vague1 && (
              <View style={styles.sessionItem}>
                <Text style={styles.sessionLabel}>Enregistrement Vague 1</Text>
                <Text style={styles.sessionValue}>
                  {formatDate(dashboard.session.date_enregistrement_vague1)}
                </Text>
              </View>
            )}

            {dashboard.session.date_enregistrement_vague2 && (
              <View style={styles.sessionItem}>
                <Text style={styles.sessionLabel}>Enregistrement Vague 2</Text>
                <Text style={styles.sessionValue}>
                  {formatDate(dashboard.session.date_enregistrement_vague2)}
                </Text>
              </View>
            )}

            {dashboard.session.date_transfert_reconduction && (
              <View style={styles.sessionItem}>
                <Text style={styles.sessionLabel}>Transfert / Reconduction</Text>
                <Text style={styles.sessionValue}>
                  {formatDate(dashboard.session.date_transfert_reconduction)}
                </Text>
              </View>
            )}

            {dashboard.session.date_depot_departemental && (
              <View style={styles.sessionItem}>
                <Text style={styles.sessionLabel}>Dépôt départemental</Text>
                <Text style={styles.sessionValue}>
                  {formatDate(dashboard.session.date_depot_departemental)}
                </Text>
              </View>
            )}

            {dashboard.session.date_depot_regional && (
              <View style={styles.sessionItem}>
                <Text style={styles.sessionLabel}>Dépôt régional</Text>
                <Text style={styles.sessionValue}>
                  {formatDate(dashboard.session.date_depot_regional)}
                </Text>
              </View>
            )}

            {dashboard.session.date_examen_theorique && (
              <View style={styles.sessionItem}>
                <Text style={styles.sessionLabel}>Examen National</Text>
                <Text style={styles.sessionValue}>
                  {formatDate(dashboard.session.date_examen_theorique)}
                </Text>
              </View>
            )}

            
          </Card>
        )}
        {/* Powered By Footer */}
<TouchableOpacity 
  style={styles.footerContainer}
  onPress={() => {
    // Ouvrir le site web
    const url = 'https://techforgesolution237.site';
    // Vous devrez importer Linking de react-native
    // import { Linking } from 'react-native';
    Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
  }}
  activeOpacity={0.7}
>
  <Text style={styles.footerText}>
    Powered by <Text style={styles.footerLink}>TechForgeSolution237</Text>
  </Text>
</TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerLeft: { 
    flex: 1 
  },
  greeting: { 
    ...theme.typography.bodySmall, 
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  userName: { 
    ...theme.typography.h2, 
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  avatarButton: {
    padding: 4,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary + '30',
  },
  balanceCard: { 
    backgroundColor: theme.colors.primary, 
    marginHorizontal: theme.spacing.lg, 
    marginBottom: theme.spacing.md,
    elevation: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  balanceContent: {
    paddingVertical: theme.spacing.sm,
  },
  balanceHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  balanceIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: { 
    ...theme.typography.bodySmall, 
    color: '#fff', 
    opacity: 0.95,
    fontWeight: '500',
  },
  balanceAmount: { 
    ...theme.typography.h1, 
    color: '#fff', 
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerContainer: {
  alignItems: 'center',
  paddingVertical: theme.spacing.lg,
  paddingHorizontal: theme.spacing.lg,
  marginBottom: theme.spacing.md,
},
footerText: {
  ...theme.typography.caption,
  color: theme.colors.textSecondary,
  textAlign: 'center',
},
footerLink: {
  color: theme.colors.primary,
  fontWeight: '600',
},
  readinessCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  readinessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  readinessIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyIcon: {
    backgroundColor: theme.colors.success,
  },
  notReadyIcon: {
    backgroundColor: theme.colors.warning,
  },
  readinessTextContainer: {
    flex: 1,
  },
  readinessTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  readinessSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  missingContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  missingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  missingText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textPrimary,
  },
  section: { 
    marginHorizontal: theme.spacing.lg, 
    marginBottom: theme.spacing.md 
  },
  countdownRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.sm,
  },
  countdownItem: { 
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  countdownBox: {
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  countdownValue: { 
    ...theme.typography.h2, 
    color: theme.colors.primary,
    fontWeight: '700',
  },
  countdownLabel: { 
    ...theme.typography.caption, 
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  menuGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: theme.spacing.md, 
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  menuItem: { 
    width: '25%', 
    alignItems: 'center', 
    paddingVertical: theme.spacing.sm,
  },
  menuIcon: { 
    width: 56, 
    height: 56, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: theme.spacing.sm,
  },
  menuLabel: { 
    ...theme.typography.caption, 
    color: theme.colors.textPrimary, 
    textAlign: 'center',
    fontWeight: '500',
  },
  fraisItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  fraisLeft: {
    flex: 1,
  },
  fraisLabel: { 
    ...theme.typography.bodySmall, 
    color: theme.colors.textPrimary,
    fontWeight: '500',
    marginBottom: 4,
  },
  fraisMontant: { 
    ...theme.typography.caption, 
    color: theme.colors.textSecondary 
  },
  progressItem: { 
    marginBottom: theme.spacing.lg 
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  progressLabel: { 
    ...theme.typography.bodySmall, 
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  progressPercentage: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sessionLabel: { 
    ...theme.typography.bodySmall, 
    color: theme.colors.textSecondary,
    flex: 1,
  },
  sessionValue: { 
    ...theme.typography.bodySmall, 
    color: theme.colors.textPrimary, 
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
});

export default DashboardScreen;