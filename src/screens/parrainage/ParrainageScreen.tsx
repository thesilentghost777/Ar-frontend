import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  StyleSheet,
  StatusBar,
  Clipboard,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../config/api';
import { MainStackParamList, ParrainageInfo } from '../../types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'Parrainage'>;

const ParrainageScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { token } = useAuth();

  const [info, setInfo] = useState<ParrainageInfo | null>(null);
  const [shareMessage, setShareMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const infoRes = await apiRequest<ParrainageInfo>(
          '/parrainage',
          { method: 'GET' },
          token
        );

        const msgRes = await apiRequest<{ message: string }>(
          '/parrainage/message',
          { method: 'GET' },
          token
        );

        setInfo(infoRes);
        setShareMessage(msgRes.message);
      } catch (e: any) {
        setError(e.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  const handleCopyCode = () => {
    if (info?.code_parrainage) {
      Clipboard.setString(info.code_parrainage);
      Alert.alert('✅ Copié !', 'Code de parrainage copié dans le presse-papiers');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: shareMessage });
    } catch (e) {
      console.log('Erreur partage:', e);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
      </View>
    );
  }

  if (!info) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Aucune information disponible</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
        <View style={styles.content}>
          {/* Carte Niveau Actuel */}
          <View style={styles.levelCard}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>NIVEAU {info.niveau_actuel}</Text>
            </View>
            <Text style={styles.levelTitle}>Votre niveau actuel</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{info.nombre_filleuls}</Text>
                <Text style={styles.statLabel}>Filleuls</Text>
              </View>
            </View>
          </View>

          {/* Code de Parrainage avec boutons */}
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Votre code de parrainage</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{info.code_parrainage}</Text>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
                <Text style={styles.copyButtonText}>📋 Copier</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Text style={styles.shareButtonText}>📤 Partager</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Avantages du niveau suivant */}
          {info.avantages_niveau_suivant && (
            <View style={styles.nextLevelCard}>
              <View style={styles.nextLevelHeader}>
                <Text style={styles.nextLevelIcon}>🎯</Text>
                <View style={styles.nextLevelInfo}>
                  <Text style={styles.nextLevelTitle}>
                    Prochain niveau : {info.avantages_niveau_suivant.niveau_cible}
                  </Text>
                  <Text style={styles.nextLevelCondition}>
                    {info.avantages_niveau_suivant.condition}
                  </Text>
                </View>
              </View>
              <View style={styles.advantageBox}>
                <Text style={styles.advantageLabel}>Avantage débloqué :</Text>
                <Text style={styles.advantageText}>
                  {info.avantages_niveau_suivant.avantage}
                </Text>
              </View>
            </View>
          )}

          {/* Comment ça marche */}
          <View style={styles.howItWorksCard}>
            <Text style={styles.sectionTitle}>📚 Comment ça marche ?</Text>
            <Text style={styles.introText}>{info.explication_systeme.intro}</Text>

            {info.explication_systeme.niveaux.map((n, i) => (
              <View key={i} style={styles.levelInfoCard}>
                <View style={styles.levelInfoHeader}>
                  <View style={styles.levelNumberBadge}>
                    <Text style={styles.levelNumberText}>{n.niveau}</Text>
                  </View>
                  <Text style={styles.levelInfoTitle}>Niveau {n.niveau}</Text>
                </View>
                <View style={styles.levelInfoContent}>
                  <Text style={styles.levelInfoLabel}>📝 Condition :</Text>
                  <Text style={styles.levelInfoText}>{n.condition}</Text>
                  <Text style={[styles.levelInfoLabel, { marginTop: 8 }]}>
                    ✨ Avantage :
                  </Text>
                  <Text style={styles.levelInfoAdvantage}>{n.avantage}</Text>
                </View>
              </View>
            ))}

            {/* Points importants */}
            <View style={styles.importantBox}>
              <Text style={styles.importantTitle}>⚠️ Points importants</Text>
              {info.explication_systeme.important.map((item, idx) => (
                <View key={idx} style={styles.importantItem}>
                  <Text style={styles.importantBullet}>•</Text>
                  <Text style={styles.importantText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Boutons d'action */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Filleuls')}
            >
              <Text style={styles.secondaryButtonText}>👥 Voir mes filleuls</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('ArbreParrainage')}
            >
              <Text style={styles.secondaryButtonText}>🌳 Arbre de parrainage</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#e0f2fe',
    lineHeight: 22,
  },
  content: {
    padding: 16,
  },
  levelCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  levelBadge: {
    backgroundColor: '#1e3a8a',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  levelBadgeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
  },
  statsRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  codeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  codeLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  codeText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e3a8a',
    letterSpacing: 2,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  copyButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  nextLevelCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  nextLevelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  nextLevelIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  nextLevelInfo: {
    flex: 1,
  },
  nextLevelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  nextLevelCondition: {
    fontSize: 14,
    color: '#b45309',
    lineHeight: 20,
  },
  advantageBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  advantageLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  advantageText: {
    fontSize: 15,
    color: '#78350f',
    lineHeight: 22,
    fontWeight: '600',
  },
  howItWorksCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
  },
  introText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 20,
  },
  levelInfoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  levelInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  levelNumberText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  levelInfoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
  },
  levelInfoContent: {
    paddingLeft: 48,
  },
  levelInfoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
  },
  levelInfoText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  levelInfoAdvantage: {
    fontSize: 14,
    color: '#059669',
    lineHeight: 20,
    fontWeight: '600',
  },
  importantBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  importantTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 12,
  },
  importantItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  importantBullet: {
    fontSize: 16,
    color: '#dc2626',
    marginRight: 8,
    fontWeight: '700',
  },
  importantText: {
    flex: 1,
    fontSize: 14,
    color: '#7f1d1d',
    lineHeight: 20,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ParrainageScreen;