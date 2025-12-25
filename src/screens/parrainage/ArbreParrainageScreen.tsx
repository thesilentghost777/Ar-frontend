// ArbreParrainageScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../config/api';
import { ArbreParrainage } from '../../types';

interface ArbreNodeProps {
  node: ArbreParrainage;
  level: number;
  isLast?: boolean;
}

const ArbreNode: React.FC<ArbreNodeProps> = ({ node, level, isLast = false }) => {
  const [expanded, setExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const hasChildren = node.enfants && node.enfants.length > 0;

  const getColorByLevel = (lvl: number) => {
    const colors = ['#6C63FF', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];
    return colors[lvl % colors.length];
  };

  return (
    <View style={styles.nodeWrapper}>
      {/* Ligne de connexion */}
      {level > 0 && (
        <View style={[styles.connectionLine, { backgroundColor: getColorByLevel(level - 1) }]} />
      )}

      <TouchableOpacity
        style={[
          styles.nodeContainer,
          { marginLeft: level * 16 },
          level === 0 && styles.rootNode,
        ]}
        onPress={() => hasChildren && setExpanded(!expanded)}
        activeOpacity={hasChildren ? 0.7 : 1}
      >
        <View style={[styles.nodeCard, { borderLeftColor: getColorByLevel(level), borderLeftWidth: 4 }]}>
          <View style={styles.nodeHeader}>
            <View style={[styles.nodeAvatar, { backgroundColor: getColorByLevel(level) }]}>
              <Text style={styles.nodeAvatarText}>
                {node.prenom.charAt(0)}{node.nom.charAt(0)}
              </Text>
            </View>

            <View style={styles.nodeInfo}>
              <Text style={styles.nodeName}>{node.prenom} {node.nom}</Text>
              <View style={styles.nodeMetaContainer}>
                <View style={[styles.levelBadge, { backgroundColor: `${getColorByLevel(level)}15` }]}>
                  <Text style={[styles.levelText, { color: getColorByLevel(level) }]}>
                    Niveau {node.niveau}
                  </Text>
                </View>
                {hasChildren && (
                  <View style={styles.childrenBadge}>
                    <Text style={styles.childrenText}>👥 {node.enfants.length}</Text>
                  </View>
                )}
              </View>
            </View>

            {hasChildren && (
              <View style={styles.expandButton}>
                <Text style={[styles.expandIcon, { color: getColorByLevel(level) }]}>
                  {expanded ? '▼' : '▶'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Enfants */}
      {expanded && hasChildren && (
        <View style={styles.childrenContainer}>
          <FlatList
            data={node.enfants}
            renderItem={({ item, index }) => (
              <ArbreNode
                node={item}
                level={level + 1}
                isLast={index === node.enfants.length - 1}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        </View>
      )}
    </View>
  );
};

const ArbreParrainageScreen: React.FC = () => {
  const { token } = useAuth();
  const [arbre, setArbre] = useState<ArbreParrainage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const profondeur = 5;

  const fetchArbre = async () => {
    try {
      setError(null);
      const response = await apiRequest<{ success: boolean; arbre: ArbreParrainage }>(
        `/parrainage/arbre?profondeur=${profondeur}`,
        { method: 'GET' },
        token
      );
      if (response.success) {
        setArbre(response.arbre);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de l\'arbre');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArbre();
  }, [token]);

  const calculateStats = (node: ArbreParrainage): { total: number; niveaux: number } => {
    let total = 1;
    let maxNiveau = node.niveau;

    const traverse = (n: ArbreParrainage) => {
      if (n.enfants) {
        n.enfants.forEach(child => {
          total++;
          maxNiveau = Math.max(maxNiveau, child.niveau);
          traverse(child);
        });
      }
    };

    traverse(node);
    return { total, niveaux: maxNiveau };
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Chargement de l'arbre...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!arbre) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>🌳</Text>
        <Text style={styles.emptyText}>Aucun arbre de parrainage disponible</Text>
      </View>
    );
  }

  const stats = calculateStats(arbre);

  return (
    <View style={styles.container}>
      {/* Header avec statistiques */}
      <View style={styles.header}>
        <Text style={styles.title}>Arbre de Parrainage</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Membres</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.niveaux}</Text>
            <Text style={styles.statLabel}>Niveaux</Text>
          </View>
        </View>
      </View>

      {/* Légende */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>💡 Appuyez pour développer/réduire</Text>
      </View>

      {/* Arbre */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ArbreNode node={arbre} level={0} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6C63FF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  legendContainer: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  legendTitle: {
    fontSize: 13,
    color: '#6C63FF',
    fontWeight: '500',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  nodeWrapper: {
    marginBottom: 8,
  },
  connectionLine: {
    position: 'absolute',
    left: 8,
    top: -8,
    width: 2,
    height: 24,
    opacity: 0.3,
  },
  nodeContainer: {
    marginBottom: 4,
  },
  rootNode: {
    marginBottom: 16,
  },
  nodeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  nodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  nodeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nodeAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  nodeInfo: {
    flex: 1,
  },
  nodeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  nodeMetaContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  childrenBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  childrenText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  expandButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  childrenContainer: {
    marginTop: 4,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
});

export default ArbreParrainageScreen;