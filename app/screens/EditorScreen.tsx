// INCO CODE 


import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  Pressable,
  Keyboard,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore, selectActiveFile, selectActiveContent, selectIsUnsaved } from '../utils/store';
import { Colors, Typography, Spacing, BorderRadius } from '../themes';
import { getTokenizedLines, getTokenColor, getLanguageIcon, getLanguageColor } from '../utils/syntaxHighlight';
import { detectLanguage, type LanguageType } from '../storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ===========================
// COMPOSANT : ONGLET FICHIER
// ===========================

interface TabItemProps {
  fileId: string;
  fileName: string;
  language: LanguageType;
  isActive: boolean;
  isUnsaved: boolean;
  onPress: () => void;
  onClose: () => void;
}

const TabItem = React.memo(({ fileId, fileName, language, isActive, isUnsaved, onPress, onClose }: TabItemProps) => (
  <TouchableOpacity
    style={[styles.tab, isActive && styles.tabActive]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={styles.tabIcon}>{getLanguageIcon(language)}</Text>
    <Text
      style={[styles.tabName, isActive && styles.tabNameActive]}
      numberOfLines={1}
    >
      {fileName}
      {isUnsaved ? ' ●' : ''}
    </Text>
    <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Text style={[styles.tabClose, isActive && styles.tabCloseActive]}>✕</Text>
    </TouchableOpacity>
  </TouchableOpacity>
));

// ===========================
// COMPOSANT : GUTTER (NUMÉROS DE LIGNES)
// ===========================

interface GutterProps {
  lineCount: number;
  fontSize: number;
  activeLine: number;
}

const Gutter = React.memo(({ lineCount, fontSize, activeLine }: GutterProps) => (
  <View style={[styles.gutter, { width: lineCount > 99 ? 52 : 44 }]}>
    {Array.from({ length: lineCount }).map((_, i) => (
      <Text
        key={i}
        style={[
          styles.lineNum,
          { fontSize, lineHeight: fontSize * 1.6 },
          i + 1 === activeLine && styles.lineNumActive,
        ]}
      >
        {i + 1}
      </Text>
    ))}
  </View>
));

// ===========================
// COMPOSANT : CODE VIEWER (rendu colorisé)
// ===========================

interface CodeViewerProps {
  content: string;
  language: LanguageType;
  fontSize: number;
}

const CodeViewer = React.memo(({ content, language, fontSize }: CodeViewerProps) => {
  const lines = useMemo(() => getTokenizedLines(content, language), [content, language]);
  const lineHeight = fontSize * 1.6;

  return (
    <View style={styles.codeViewer}>
      {lines.map(({ lineNum, tokens }) => (
        <View key={lineNum} style={[styles.codeLine, { minHeight: lineHeight }]}>
          {tokens.map((token, i) => (
            <Text
              key={i}
              style={{
                color: getTokenColor(token.type),
                fontSize,
                fontFamily: 'Courier New',
                lineHeight: lineHeight,
              }}
            >
              {token.value}
            </Text>
          ))}
          {tokens.length === 0 && (
            <Text style={{ fontSize, fontFamily: 'Courier New', lineHeight }}>{' '}</Text>
          )}
        </View>
      ))}
    </View>
  );
});

// ===========================
// COMPOSANT : TOOLBAR ÉDITEUR
// ===========================

interface ToolbarProps {
  onSave: () => void;
  onFormat: () => void;
  onSearch: () => void;
  onAddFile: () => void;
  onPreview: () => void;
  onUndo: () => void;
  isUnsaved: boolean;
  showPreview: boolean;
}

const EditorToolbar = ({
  onSave, onFormat, onSearch, onAddFile,
  onPreview, onUndo, isUnsaved, showPreview,
}: ToolbarProps) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={styles.toolbar}
    contentContainerStyle={styles.toolbarContent}
  >
    <TouchableOpacity style={[styles.toolBtn, isUnsaved && styles.toolBtnSave]} onPress={onSave}>
      <Text style={styles.toolBtnText}>{isUnsaved ? '💾*' : '💾'}</Text>
    </TouchableOpacity>
    <View style={styles.toolDivider} />
    <TouchableOpacity style={styles.toolBtn} onPress={onSearch}>
      <Text style={styles.toolBtnText}>🔍</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.toolBtn} onPress={onUndo}>
      <Text style={styles.toolBtnText}>↩</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.toolBtn} onPress={onFormat}>
      <Text style={styles.toolBtnText}>✨</Text>
    </TouchableOpacity>
    <View style={styles.toolDivider} />
    <TouchableOpacity style={styles.toolBtn} onPress={onAddFile}>
      <Text style={styles.toolBtnText}>📄+</Text>
    </TouchableOpacity>
    <View style={styles.toolDivider} />
    <TouchableOpacity
      style={[styles.toolBtn, showPreview && styles.toolBtnActive]}
      onPress={onPreview}
    >
      <Text style={styles.toolBtnText}>👁 Preview</Text>
    </TouchableOpacity>
  </ScrollView>
);

// ===========================
// COMPOSANT : BARRE DE CARACTÈRES SPÉCIAUX
// ===========================

const SPECIAL_CHARS = [
  '  ', '()', '[]', '{}', '<>', '=>', '===',
  '!==', '&&', '||', '...', '`', '"', "'",
  ';', ':', ',', '.', '/', '\\', '?',
];

interface SpecialCharsBarProps {
  onInsert: (char: string) => void;
}

const SpecialCharsBar = ({ onInsert }: SpecialCharsBarProps) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={styles.specialBar}
    contentContainerStyle={styles.specialBarContent}
    keyboardShouldPersistTaps="always"
  >
    {SPECIAL_CHARS.map((char, i) => (
      <TouchableOpacity key={i} style={styles.specialKey} onPress={() => onInsert(char)}>
        <Text style={styles.specialKeyText}>{char}</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

// ===========================
// MODAL : NOUVEAU FICHIER
// ===========================

interface NewFileModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, lang: LanguageType) => void;
}

const LANGUAGES: { id: LanguageType; label: string; ext: string }[] = [
  { id: 'html',       label: '🌐 HTML',       ext: '.html' },
  { id: 'css',        label: '🎨 CSS',         ext: '.css'  },
  { id: 'javascript', label: '⚡ JavaScript',  ext: '.js'   },
  { id: 'typescript', label: '🔷 TypeScript',  ext: '.ts'   },
  { id: 'json',       label: '📦 JSON',        ext: '.json' },
  { id: 'markdown',   label: '📝 Markdown',    ext: '.md'   },
  { id: 'python',     label: '🐍 Python',      ext: '.py'   },
  { id: 'txt',        label: '📄 Texte',       ext: '.txt'  },
];

const NewFileModal = ({ visible, onClose, onCreate }: NewFileModalProps) => {
  const [name, setName] = useState('');
  const [selectedLang, setSelectedLang] = useState<LanguageType>('javascript');

  const handleCreate = () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Nom de fichier requis.');
      return;
    }
    const finalName = name.includes('.') ? name : name + LANGUAGES.find(l => l.id === selectedLang)!.ext;
    onCreate(finalName, selectedLang);
    setName('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.newFileModal}>
          <Text style={styles.modalTitle}>📄 Nouveau fichier</Text>

          <TextInput
            style={styles.fileInput}
            value={name}
            onChangeText={setName}
            placeholder="nom-fichier"
            placeholderTextColor={Colors.text.muted}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.langLabel}>Langage</Text>
          <View style={styles.langGrid}>
            {LANGUAGES.map(l => (
              <TouchableOpacity
                key={l.id}
                style={[styles.langOption, selectedLang === l.id && styles.langOptionActive]}
                onPress={() => setSelectedLang(l.id)}
              >
                <Text style={[styles.langOptionText, selectedLang === l.id && { color: Colors.accent.primary }]}>
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnCreate} onPress={handleCreate}>
              <Text style={styles.btnCreateText}>Créer</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ===========================
// ÉCRAN PRINCIPAL ÉDITEUR
// ===========================

export default function EditorScreen() {
  const navigation = useNavigation<any>();
  const {
    activeProject,
    openTabs,
    activeTab,
    settings,
    unsavedChanges,
    showPreview,
    openFile,
    closeTab,
    setActiveTab,
    updateFileContent,
    saveCurrentFile,
    saveAllFiles,
    addFile,
    deleteFile,
    togglePreview,
    addTerminalLine,
  } = useStore();

  const activeFile = useStore(selectActiveFile);
  const content = useStore(selectActiveContent);
  const isUnsaved = activeFile ? activeFile.id in unsavedChanges : false;

  const [showNewFile, setShowNewFile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(content);
  const [activeLine, setActiveLine] = useState(1);
  const [showFileTree, setShowFileTree] = useState(false);

  const editorRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchroniser le contenu local
  useEffect(() => {
    setLocalContent(content);
  }, [activeFile?.id]);

  // Auto-save
  useEffect(() => {
    if (!settings.autoSave) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (isUnsaved) saveCurrentFile();
    }, settings.autoSaveDelay);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [localContent, isUnsaved]);

  const handleContentChange = useCallback((text: string) => {
    setLocalContent(text);
    if (activeFile) updateFileContent(activeFile.id, text);
  }, [activeFile?.id]);

  const handleSave = useCallback(async () => {
    await saveCurrentFile();
    addTerminalLine(`> 💾 ${activeFile?.name} sauvegardé`);
  }, [activeFile]);

  const handleAddFile = useCallback(async (name: string, lang: LanguageType) => {
    if (!activeProject) return;
    await addFile(activeProject.id, name, lang);
    addTerminalLine(`> 📄 Fichier "${name}" créé`);
  }, [activeProject]);

  const handleDeleteFile = useCallback((fileId: string, fileName: string) => {
    Alert.alert(
      'Supprimer le fichier',
      `Supprimer "${fileName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            if (activeProject) deleteFile(activeProject.id, fileId);
          },
        },
      ],
    );
  }, [activeProject]);

  const handleInsertChar = useCallback((char: string) => {
    const newContent = localContent + char;
    handleContentChange(newContent);
  }, [localContent]);

  const handleFormat = useCallback(() => {
    if (!activeFile) return;
    let formatted = localContent;
    try {
      if (activeFile.language === 'json') {
        formatted = JSON.stringify(JSON.parse(localContent), null, 2);
      }
    } catch {
      Alert.alert('Format', 'Impossible de formater ce fichier.');
      return;
    }
    handleContentChange(formatted);
    addTerminalLine(`> ✨ ${activeFile.name} formatté`);
  }, [localContent, activeFile]);

  const lineCount = localContent.split('\n').length;

  // Si pas de projet actif
  if (!activeProject) {
    return (
      <View style={styles.noProject}>
        <Text style={styles.noProjectIcon}>{'</>'}</Text>
        <Text style={styles.noProjectText}>Aucun projet ouvert</Text>
        <TouchableOpacity
          style={styles.noProjectBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.noProjectBtnText}>← Retour aux projets</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ─────────────────────────────────── */}
      <View style={styles.editorHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            saveAllFiles();
            navigation.navigate('Home');
          }}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.projectTitle}
          onPress={() => setShowFileTree(!showFileTree)}
        >
          <View style={[styles.projectDot, { backgroundColor: activeProject.color }]} />
          <Text style={styles.projectTitleText} numberOfLines={1}>
            {activeProject.name}
          </Text>
          <Text style={styles.projectChevron}>{showFileTree ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        <View style={styles.editorHeaderActions}>
          {isUnsaved && (
            <TouchableOpacity style={styles.saveIndicator} onPress={handleSave}>
              <Text style={styles.saveIndicatorText}>●</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.previewToggle, showPreview && styles.previewToggleActive]}
            onPress={() => navigation.navigate('Preview')}
          >
            <Text style={styles.previewToggleText}>👁</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── File Tree (dropdown) ────────────────────── */}
      {showFileTree && (
        <View style={styles.fileTree}>
          <ScrollView horizontal={false} showsVerticalScrollIndicator={false}>
            <Text style={styles.fileTreeTitle}>EXPLORATEUR</Text>
            {activeProject.files.map(file => (
              <TouchableOpacity
                key={file.id}
                style={[
                  styles.fileTreeItem,
                  activeFile?.id === file.id && styles.fileTreeItemActive,
                ]}
                onPress={() => {
                  openFile(activeProject.id, file.id);
                  setShowFileTree(false);
                }}
                onLongPress={() => handleDeleteFile(file.id, file.name)}
              >
                <Text style={styles.fileTreeIcon}>{getLanguageIcon(file.language)}</Text>
                <Text style={[
                  styles.fileTreeName,
                  activeFile?.id === file.id && styles.fileTreeNameActive,
                ]}>
                  {file.name}
                </Text>
                {file.id in unsavedChanges && (
                  <Text style={{ color: Colors.accent.warning, fontSize: 10 }}>●</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.fileTreeAdd}
              onPress={() => { setShowFileTree(false); setShowNewFile(true); }}
            >
              <Text style={styles.fileTreeAddText}>+ Nouveau fichier</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* ── Onglets ─────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {openTabs.map(tab => {
          const file = activeProject.files.find(f => f.id === tab.fileId);
          if (!file) return null;
          return (
            <TabItem
              key={tab.fileId}
              fileId={tab.fileId}
              fileName={file.name}
              language={file.language}
              isActive={activeTab?.fileId === tab.fileId}
              isUnsaved={tab.fileId in unsavedChanges}
              onPress={() => setActiveTab(tab)}
              onClose={() => closeTab(tab.fileId)}
            />
          );
        })}
        <TouchableOpacity
          style={styles.tabAdd}
          onPress={() => setShowNewFile(true)}
        >
          <Text style={styles.tabAddText}>+</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Toolbar ─────────────────────────────────── */}
      <EditorToolbar
        onSave={handleSave}
        onFormat={handleFormat}
        onSearch={() => {}}
        onAddFile={() => setShowNewFile(true)}
        onPreview={() => navigation.navigate('Preview')}
        onUndo={() => {}}
        isUnsaved={isUnsaved}
        showPreview={showPreview}
      />

      {/* ── Zone d'édition ──────────────────────────── */}
      {activeFile ? (
        <View style={styles.editorArea}>
          {/* Status bar du fichier */}
          <View style={styles.fileStatusBar}>
            <Text style={[styles.fileStatusLang, { color: getLanguageColor(activeFile.language) }]}>
              {getLanguageIcon(activeFile.language)} {activeFile.language.toUpperCase()}
            </Text>
            <Text style={styles.fileStatusInfo}>
              {lineCount} lignes  ·  {localContent.length} chars
            </Text>
            <Text style={styles.fileStatusInfo}>
              {settings.tabSize} spaces
            </Text>
          </View>

          {/* Éditeur scrollable */}
          <ScrollView
            ref={scrollRef}
            style={styles.codeScroll}
            showsVerticalScrollIndicator={true}
            indicatorStyle="white"
            keyboardShouldPersistTaps="always"
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={true} indicatorStyle="white">
              <View style={styles.editorRow}>
                {/* Numéros de lignes */}
                {settings.showLineNumbers && (
                  <Gutter lineCount={lineCount} fontSize={settings.fontSize} activeLine={activeLine} />
                )}

                {/* Zone de texte invisible par dessus le rendu colorisé */}
                <View style={styles.codeArea}>
                  {/* Rendu colorisé (en dessous) */}
                  <CodeViewer
                    content={localContent}
                    language={activeFile.language}
                    fontSize={settings.fontSize}
                  />

                  {/* TextInput transparent par dessus */}
                  <TextInput
                    ref={editorRef}
                    style={[
                      styles.codeInput,
                      {
                        fontSize: settings.fontSize,
                        lineHeight: settings.fontSize * 1.6,
                        minWidth: SCREEN_WIDTH - (settings.showLineNumbers ? 100 : 50),
                      },
                    ]}
                    value={localContent}
                    onChangeText={handleContentChange}
                    multiline
                    scrollEnabled={false}
                    autoCorrect={false}
                    autoCapitalize="none"
                    spellCheck={false}
                    keyboardType="default"
                    onFocus={() => setIsEditing(true)}
                    onBlur={() => setIsEditing(false)}
                    onSelectionChange={e => {
                      const { start } = e.nativeEvent.selection;
                      const textBefore = localContent.substring(0, start);
                      const line = textBefore.split('\n').length;
                      setActiveLine(line);
                    }}
                    textAlignVertical="top"
                    selectionColor={Colors.ui.selection}
                  />
                </View>
              </View>
            </ScrollView>
          </ScrollView>

          {/* Barre de caractères spéciaux (quand clavier ouvert) */}
          {isEditing && (
            <SpecialCharsBar onInsert={handleInsertChar} />
          )}
        </View>
      ) : (
        /* Pas de fichier ouvert */
        <View style={styles.noFile}>
          <Text style={styles.noFileText}>Ouvrez un fichier pour commencer à éditer</Text>
          <TouchableOpacity
            style={styles.noFileBtn}
            onPress={() => setShowNewFile(true)}
          >
            <Text style={styles.noFileBtnText}>📄 Nouveau fichier</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal nouveau fichier */}
      <NewFileModal
        visible={showNewFile}
        onClose={() => setShowNewFile(false)}
        onCreate={handleAddFile}
      />
    </KeyboardAvoidingView>
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
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.secondary,
    paddingTop: Platform.OS === 'android' ? 40 : 56,
    paddingBottom: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
    gap: 8,
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.bg.tertiary,
  },
  backBtnText: {
    fontSize: 18,
    color: Colors.text.primary,
  },
  projectTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: Colors.bg.tertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  projectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  projectTitleText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
    fontFamily: 'Courier New',
  },
  projectChevron: {
    fontSize: 10,
    color: Colors.text.muted,
  },
  editorHeaderActions: {
    flexDirection: 'row',
    gap: 6,
  },
  saveIndicator: {
    padding: 8,
  },
  saveIndicatorText: {
    color: Colors.accent.warning,
    fontSize: 16,
  },
  previewToggle: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.bg.tertiary,
  },
  previewToggleActive: {
    backgroundColor: Colors.accent.cyan + '20',
  },
  previewToggleText: {
    fontSize: 16,
  },

  // ── File Tree ──────────────────────────────────────
  fileTree: {
    backgroundColor: Colors.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
    maxHeight: 220,
    padding: 12,
  },
  fileTreeTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  fileTreeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 8,
    marginBottom: 2,
  },
  fileTreeItemActive: {
    backgroundColor: Colors.accent.primary + '15',
  },
  fileTreeIcon: {
    fontSize: 14,
  },
  fileTreeName: {
    flex: 1,
    fontSize: 13,
    color: Colors.text.secondary,
    fontFamily: 'Courier New',
  },
  fileTreeNameActive: {
    color: Colors.accent.primary,
    fontWeight: '600',
  },
  fileTreeAdd: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  fileTreeAddText: {
    fontSize: 12,
    color: Colors.text.muted,
  },

  // ── Tabs ───────────────────────────────────────────
  tabsContainer: {
    backgroundColor: Colors.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
    maxHeight: 40,
  },
  tabsContent: {
    alignItems: 'center',
    paddingLeft: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: Colors.ui.border,
    gap: 5,
    backgroundColor: Colors.bg.secondary,
    maxWidth: 160,
  },
  tabActive: {
    backgroundColor: Colors.bg.primary,
    borderTopWidth: 2,
    borderTopColor: Colors.accent.primary,
  },
  tabIcon: {
    fontSize: 12,
  },
  tabName: {
    fontSize: 12,
    color: Colors.text.muted,
    maxWidth: 90,
  },
  tabNameActive: {
    color: Colors.text.primary,
    fontWeight: '600',
  },
  tabClose: {
    fontSize: 10,
    color: Colors.text.muted,
    padding: 2,
  },
  tabCloseActive: {
    color: Colors.text.secondary,
  },
  tabAdd: {
    width: 36,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabAddText: {
    fontSize: 20,
    color: Colors.text.muted,
  },

  // ── Toolbar ────────────────────────────────────────
  toolbar: {
    backgroundColor: Colors.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
    maxHeight: 36,
  },
  toolbarContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 2,
  },
  toolBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toolBtnSave: {
    backgroundColor: Colors.accent.warning + '20',
  },
  toolBtnActive: {
    backgroundColor: Colors.accent.cyan + '20',
  },
  toolBtnText: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontFamily: 'Courier New',
  },
  toolDivider: {
    width: 1,
    height: 18,
    backgroundColor: Colors.ui.border,
    marginHorizontal: 4,
  },

  // ── Editor Area ────────────────────────────────────
  editorArea: {
    flex: 1,
  },
  fileStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.secondary,
    paddingHorizontal: 12,
    paddingVertical: 3,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  fileStatusLang: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Courier New',
  },
  fileStatusInfo: {
    fontSize: 10,
    color: Colors.text.muted,
    fontFamily: 'Courier New',
  },
  codeScroll: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  editorRow: {
    flexDirection: 'row',
    minHeight: SCREEN_HEIGHT,
  },

  // Gutter (numéros de lignes)
  gutter: {
    backgroundColor: Colors.ui.gutter,
    paddingLeft: 4,
    borderRightWidth: 1,
    borderRightColor: Colors.ui.border,
    paddingTop: 12,
  },
  lineNum: {
    textAlign: 'right',
    paddingRight: 8,
    color: Colors.text.muted,
    fontFamily: 'Courier New',
    fontSize: 13,
  },
  lineNumActive: {
    color: Colors.text.primary,
  },

  // Zone de code
  codeArea: {
    flex: 1,
    position: 'relative',
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  codeViewer: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  codeLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  codeInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 12,
    color: 'transparent',
    fontFamily: 'Courier New',
    textAlignVertical: 'top',
    caretColor: Colors.accent.primary,
  },

  // Barre caractères spéciaux
  specialBar: {
    backgroundColor: Colors.bg.elevated,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border,
    maxHeight: 40,
  },
  specialBarContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 2,
  },
  specialKey: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.bg.secondary,
    borderRadius: 6,
    marginHorizontal: 2,
    minWidth: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  specialKeyText: {
    color: Colors.text.primary,
    fontFamily: 'Courier New',
    fontSize: 13,
  },

  // ── No File / No Project ───────────────────────────
  noFile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  noFileText: {
    color: Colors.text.muted,
    fontSize: 14,
  },
  noFileBtn: {
    backgroundColor: Colors.bg.tertiary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  noFileBtnText: {
    color: Colors.text.secondary,
    fontSize: 13,
  },
  noProject: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg.primary,
    gap: 16,
  },
  noProjectIcon: {
    fontSize: 60,
    color: Colors.text.muted,
    fontFamily: 'Courier New',
    opacity: 0.4,
  },
  noProjectText: {
    color: Colors.text.secondary,
    fontSize: 16,
  },
  noProjectBtn: {
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  noProjectBtnText: {
    color: Colors.ui.tabActive,
    fontWeight: '700',
  },

  // ── Modal ──────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.bg.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  newFileModal: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  fileInput: {
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.text.primary,
    fontFamily: 'Courier New',
    fontSize: 14,
    marginBottom: 16,
  },
  langLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  langOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  langOptionActive: {
    borderColor: Colors.accent.primary,
    backgroundColor: Colors.accent.primary + '15',
  },
  langOptionText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
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
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accent.primary,
    alignItems: 'center',
  },
  btnCreateText: {
    color: Colors.ui.tabActive,
    fontWeight: '700',
  },
});
