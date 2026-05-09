import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  ScrollView,
  Alert,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore, selectFilteredProjects } from '../utils/store';
import { Colors, Typography, Spacing, BorderRadius } from '../themes';
import {
  PROJECT_COLORS,
  PROJECT_ICONS,
  getProjectSize,
  formatRelativeDate,
  type Project,
} from '../storage';
import { getLanguageIcon } from '../utils/syntaxHighlight';

// ===========================
// COMPOSANT : CARTE PROJET
// ===========================

interface ProjectCardProps {
  project: Project;
  onOpen: () => void;
  onDelete: () => void;
  onToggleFav: () => void;
  onEdit: () => void;
  index: number;
}

const ProjectCard = React.memo(({ project, onOpen, onDelete, onToggleFav, onEdit, index }: ProjectCardProps) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const pressAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const onPressIn = () => {
    Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: true, tension: 100 }).start();
  };
  const onPressOut = () => {
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, tension: 100 }).start();
  };

  const fileCount = project.files.length;
  const size = getProjectSize(project);
  const lastDate = formatRelativeDate(project.lastOpenedAt || project.updatedAt);

  // Aperçu des extensions de fichiers
  const extensions = [...new Set(project.files.map(f => f.language))].slice(0, 4);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
        <TouchableOpacity
          style={[styles.card, { borderLeftColor: project.color }]}
          onPress={onOpen}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={1}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: project.color + '20' }]}>
              <Text style={styles.cardIconText}>{'</>'}</Text>
            </View>

            <View style={styles.cardInfo}>
              <Text style={styles.cardName} numberOfLines={1}>{project.name}</Text>
              {project.description ? (
                <Text style={styles.cardDesc} numberOfLines={1}>{project.description}</Text>
              ) : null}
            </View>

            {/* Actions */}
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={onToggleFav} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={[styles.favIcon, project.isFavorite && styles.favIconActive]}>
                  {project.isFavorite ? '★' : '☆'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Extensions */}
          <View style={styles.extRow}>
            {extensions.map(lang => (
              <View key={lang} style={styles.extBadge}>
                <Text style={styles.extText}>{getLanguageIcon(lang)} {lang}</Text>
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.cardMeta}>
              📁 {fileCount} {fileCount > 1 ? 'fichiers' : 'fichier'}  ·  {size}
            </Text>
            <Text style={styles.cardMeta}>{lastDate}</Text>
          </View>

          {/* Actions secondaires */}
          <View style={styles.cardBottomActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
              <Text style={styles.actionBtnText}>✏️ Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={onDelete}>
              <Text style={[styles.actionBtnText, { color: Colors.accent.danger }]}>🗑 Supprimer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={onOpen}>
              <Text style={[styles.actionBtnText, { color: Colors.ui.tabActive }]}>▶ Ouvrir</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
});

// ===========================
// COMPOSANT : MODAL CRÉATION
// ===========================

interface CreateModalProps {
  visible: boolean;
  onClose: () => void;
  editProject?: Project | null;
}

const TEMPLATES = [
  { id: 'web', label: '🌐 Web (HTML/CSS/JS)', desc: 'Site web classique' },
  { id: 'blank', label: '📄 Vide', desc: 'Projet sans fichiers' },
];

const CreateProjectModal = ({ visible, onClose, editProject }: CreateModalProps) => {
  const { createProject, updateProject: _updateProject } = useStore();

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [template, setTemplate] = useState('web');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editProject) {
      setName(editProject.name);
      setDesc(editProject.description);
      setColor(editProject.color);
    } else {
      setName('');
      setDesc('');
      setColor(PROJECT_COLORS[0]);
      setTemplate('web');
    }
  }, [editProject, visible]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom du projet est requis.');
      return;
    }
    setLoading(true);
    try {
      if (editProject) {
        await _updateProject(editProject.id, { name, description: desc, color });
      } else {
        await createProject(name, desc, color, 'code', template === 'web');
      }
      onClose();
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de créer le projet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          <Text style={styles.modalTitle}>
            {editProject ? '✏️ Modifier le projet' : '🚀 Nouveau projet'}
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nom du projet *</Text>
            <TextInput
              style={styles.formInput}
              value={name}
              onChangeText={setName}
              placeholder="Mon Super Projet"
              placeholderTextColor={Colors.text.muted}
              autoFocus
              maxLength={50}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, { height: 70, textAlignVertical: 'top' }]}
              value={desc}
              onChangeText={setDesc}
              placeholder="Description optionnelle..."
              placeholderTextColor={Colors.text.muted}
              multiline
              maxLength={200}
            />
          </View>

          {/* Couleur */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Couleur du projet</Text>
            <View style={styles.colorRow}>
              {PROJECT_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    color === c && styles.colorDotSelected,
                  ]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>
          </View>

          {/* Template (seulement création) */}
          {!editProject && (
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Template</Text>
              <View style={styles.templateRow}>
                {TEMPLATES.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.templateCard, template === t.id && styles.templateCardActive]}
                    onPress={() => setTemplate(t.id)}
                  >
                    <Text style={styles.templateLabel}>{t.label}</Text>
                    <Text style={styles.templateDesc}>{t.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Boutons */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnCreate, loading && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.btnCreateText}>
                {loading ? '...' : editProject ? 'Sauvegarder' : 'Créer'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ===========================
// SCREEN PRINCIPAL
// ===========================

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { projects, deleteProject, openProject, loadProjects } = useStore();
  const filteredProjects = useStore(selectFilteredProjects);
  const setSearchQuery = useStore(s => s.setSearchQuery);
  const searchQuery = useStore(s => s.searchQuery);

  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const headerAnim = React.useRef(new Animated.Value(-40)).current;
  const headerOpacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  }, []);

  const handleOpen = useCallback(async (project: Project) => {
    await openProject(project);
    navigation.navigate('Editor');
  }, []);

  const handleDelete = useCallback((project: Project) => {
    Alert.alert(
      '🗑 Supprimer le projet',
      `Êtes-vous sûr de vouloir supprimer "${project.name}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteProject(project.id),
        },
      ],
    );
  }, []);

  const stats = {
    total: projects.length,
    files: projects.reduce((sum, p) => sum + p.files.length, 0),
    favorites: projects.filter(p => p.isFavorite).length,
  };

  const favorites = filteredProjects.filter(p => p.isFavorite);
  const recent = filteredProjects.filter(p => !p.isFavorite);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg.primary} />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          { transform: [{ translateY: headerAnim }], opacity: headerOpacity },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerBrand}>
              <Text style={{ color: Colors.accent.primary }}>INCO</Text> CODE
            </Text>
            <Text style={styles.headerSub}>Mobile IDE</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.settingsBtnText}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.newBtn}
              onPress={() => { setEditProject(null); setShowCreate(true); }}
            >
              <Text style={styles.newBtnText}>+ Nouveau</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.total}</Text>
            <Text style={styles.statLabel}>Projets</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxMiddle]}>
            <Text style={styles.statNum}>{stats.files}</Text>
            <Text style={styles.statLabel}>Fichiers</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.favorites}</Text>
            <Text style={styles.statLabel}>Favoris</Text>
          </View>
        </View>

        {/* Recherche */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher un projet..."
            placeholderTextColor={Colors.text.muted}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Liste */}
      {filteredProjects.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>{'</>'}</Text>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'Aucun résultat' : 'Aucun projet'}
          </Text>
          <Text style={styles.emptyDesc}>
            {searchQuery
              ? `Aucun projet ne correspond à "${searchQuery}"`
              : 'Créez votre premier projet pour commencer à coder !'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => { setEditProject(null); setShowCreate(true); }}
            >
              <Text style={styles.emptyBtnText}>🚀 Créer un projet</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredProjects}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <ProjectCard
              project={item}
              index={index}
              onOpen={() => handleOpen(item)}
              onDelete={() => handleDelete(item)}
              onToggleFav={() => useStore.getState().toggleFavorite(item.id)}
              onEdit={() => { setEditProject(item); setShowCreate(true); }}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListHeaderComponent={
            favorites.length > 0 && !searchQuery ? (
              <Text style={styles.sectionTitle}>⭐ Favoris</Text>
            ) : null
          }
        />
      )}

      {/* Modal création */}
      <CreateProjectModal
        visible={showCreate}
        onClose={() => { setShowCreate(false); setEditProject(null); }}
        editProject={editProject}
      />
    </View>
  );
}

// ===========================
// STYLES
// ===========================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },

  // ── Header ─────────────────────────────────────────
  header: {
    backgroundColor: Colors.bg.secondary,
    paddingTop: Platform.OS === 'android' ? 44 : 60,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  headerBrand: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.text.primary,
    letterSpacing: 2,
    fontFamily: 'Courier New',
  },
  headerSub: {
    fontSize: 11,
    color: Colors.text.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsBtn: {
    padding: 8,
  },
  settingsBtnText: {
    fontSize: 20,
  },
  newBtn: {
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  newBtnText: {
    color: Colors.ui.tabActive,
    fontWeight: '700',
    fontSize: 13,
  },

  // ── Stats ──────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.tertiary,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  statBoxMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.ui.border,
  },
  statNum: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.accent.primary,
    fontFamily: 'Courier New',
  },
  statLabel: {
    fontSize: 10,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // ── Search ─────────────────────────────────────────
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.tertiary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    height: 42,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: Typography.sizes.base,
    padding: 0,
  },
  clearBtn: {
    color: Colors.text.muted,
    fontSize: 14,
    padding: 4,
  },

  // ── List ───────────────────────────────────────────
  list: {
    padding: Spacing.base,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  // ── Card ───────────────────────────────────────────
  card: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: BorderRadius.lg,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIconText: {
    fontSize: 16,
    color: Colors.text.primary,
    fontFamily: 'Courier New',
    fontWeight: 'bold',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  cardDesc: {
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 2,
  },
  cardActions: {
    alignItems: 'flex-end',
  },
  favIcon: {
    fontSize: 22,
    color: Colors.text.muted,
  },
  favIconActive: {
    color: '#D29922',
  },
  extRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  extBadge: {
    backgroundColor: Colors.bg.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  extText: {
    fontSize: 10,
    color: Colors.text.secondary,
    fontFamily: 'Courier New',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardMeta: {
    fontSize: 11,
    color: Colors.text.muted,
  },
  cardBottomActions: {
    flexDirection: 'row',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border,
    paddingTop: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bg.tertiary,
    alignItems: 'center',
  },
  actionBtnPrimary: {
    backgroundColor: Colors.accent.primary + '20',
    borderWidth: 1,
    borderColor: Colors.accent.primary + '40',
  },
  actionBtnDanger: {
    backgroundColor: Colors.accent.danger + '10',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.secondary,
  },

  // ── Empty State ────────────────────────────────────
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    color: Colors.text.muted,
    fontFamily: 'Courier New',
    marginBottom: 16,
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  emptyBtnText: {
    color: Colors.ui.tabActive,
    fontWeight: '700',
    fontSize: 15,
  },

  // ── Modal ──────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.bg.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.bg.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.ui.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.text.primary,
    fontSize: Typography.sizes.base,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: Colors.text.primary,
    transform: [{ scale: 1.2 }],
  },
  templateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  templateCard: {
    flex: 1,
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    borderRadius: BorderRadius.md,
    padding: 12,
  },
  templateCardActive: {
    borderColor: Colors.accent.primary,
    backgroundColor: Colors.accent.primary + '10',
  },
  templateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  templateDesc: {
    fontSize: 10,
    color: Colors.text.muted,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bg.tertiary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  btnCancelText: {
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  btnCreate: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accent.primary,
    alignItems: 'center',
  },
  btnCreateText: {
    color: Colors.ui.tabActive,
    fontWeight: '700',
    fontSize: 15,
  },
});
