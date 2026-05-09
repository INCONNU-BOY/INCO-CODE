import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../utils/store';
import { Colors, BorderRadius } from '../themes';
import { getProjectSize } from '../storage';

// ===========================
// COMMANDES SIMULÉES
// ===========================

interface CommandResult {
  output: string[];
  type: 'success' | 'error' | 'info' | 'system';
}

const processCommand = (
  cmd: string,
  activeProject: any,
  settings: any,
): CommandResult => {
  const parts = cmd.trim().split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (command) {
    case 'help':
      return {
        type: 'info',
        output: [
          '╔══════════════════════════════════╗',
          '║     INCO CODE Terminal v1.0      ║',
          '╚══════════════════════════════════╝',
          '',
          'Commandes disponibles:',
          '  help          — Afficher cette aide',
          '  ls            — Lister les fichiers',
          '  cat <file>    — Afficher un fichier',
          '  info          — Infos du projet',
          '  stats         — Statistiques',
          '  clear          — Effacer le terminal',
          '  echo <text>   — Afficher du texte',
          '  date           — Date et heure',
          '  pwd            — Répertoire courant',
          '  version        — Version de l\'IDE',
          '  whoami         — Utilisateur courant',
          '  count          — Compter les lignes',
          '',
        ],
      };

    case 'ls':
    case 'dir': {
      if (!activeProject) {
        return { type: 'error', output: ['Erreur: Aucun projet ouvert.'] };
      }
      const files = activeProject.files.map((f: any) =>
        `  ${f.language === 'html' ? '🌐' : f.language === 'css' ? '🎨' : f.language === 'javascript' ? '⚡' : '📄'} ${f.name.padEnd(25)} ${new Blob([f.content]).size} bytes`
      );
      return {
        type: 'success',
        output: [
          `📁 ${activeProject.name}/`,
          ...files,
          '',
          `Total: ${activeProject.files.length} fichier(s)  ·  ${getProjectSize(activeProject)}`,
        ],
      };
    }

    case 'cat': {
      if (!activeProject) return { type: 'error', output: ['Aucun projet ouvert.'] };
      const fileName = args[0];
      if (!fileName) return { type: 'error', output: ['Usage: cat <nom-fichier>'] };
      const file = activeProject.files.find((f: any) =>
        f.name.toLowerCase() === fileName.toLowerCase()
      );
      if (!file) return { type: 'error', output: [`Fichier "${fileName}" introuvable.`] };
      const lines = file.content.split('\n').map((line: string, i: number) =>
        `${String(i + 1).padStart(4, ' ')} │ ${line}`
      );
      return {
        type: 'success',
        output: [`── ${file.name} ──`, ...lines, `── ${lines.length} ligne(s) ──`],
      };
    }

    case 'info': {
      if (!activeProject) return { type: 'error', output: ['Aucun projet ouvert.'] };
      return {
        type: 'info',
        output: [
          `Projet:      ${activeProject.name}`,
          `Description: ${activeProject.description || '(aucune)'}`,
          `Fichiers:    ${activeProject.files.length}`,
          `Taille:      ${getProjectSize(activeProject)}`,
          `Créé le:     ${new Date(activeProject.createdAt).toLocaleString('fr-FR')}`,
          `Modifié:     ${new Date(activeProject.updatedAt).toLocaleString('fr-FR')}`,
          `Favori:      ${activeProject.isFavorite ? 'Oui ★' : 'Non'}`,
        ],
      };
    }

    case 'stats': {
      if (!activeProject) return { type: 'error', output: ['Aucun projet ouvert.'] };
      const totalLines = activeProject.files.reduce(
        (sum: number, f: any) => sum + f.content.split('\n').length, 0
      );
      const totalChars = activeProject.files.reduce(
        (sum: number, f: any) => sum + f.content.length, 0
      );
      const langs = [...new Set(activeProject.files.map((f: any) => f.language))];
      return {
        type: 'info',
        output: [
          '── Statistiques du projet ──',
          `  Fichiers:    ${activeProject.files.length}`,
          `  Lignes:      ${totalLines}`,
          `  Caractères:  ${totalChars}`,
          `  Langages:    ${langs.join(', ')}`,
          `  Taille:      ${getProjectSize(activeProject)}`,
        ],
      };
    }

    case 'echo':
      return {
        type: 'success',
        output: [args.join(' ') || ''],
      };

    case 'date':
      return {
        type: 'info',
        output: [new Date().toLocaleString('fr-FR', {
          weekday: 'long', year: 'numeric', month: 'long',
          day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
        })],
      };

    case 'pwd':
      return {
        type: 'info',
        output: [activeProject ? `/inco-code/projects/${activeProject.name}` : '/inco-code'],
      };

    case 'version':
      return {
        type: 'info',
        output: [
          'INCO CODE v1.0.0',
          'React Native 0.73',
          'FREE VERSION',
          'INCO BOY TECH © 2024',
        ],
      };

    case 'whoami':
      return { type: 'info', output: ['inco-user (FREE)'] };

    case 'count': {
      if (!activeProject) return { type: 'error', output: ['Aucun projet ouvert.'] };
      return {
        type: 'success',
        output: activeProject.files.map((f: any) => {
          const lines = f.content.split('\n').length;
          return `  ${f.name.padEnd(25)} ${lines} lignes`;
        }),
      };
    }

    case 'clear':
      return { type: 'system', output: [] }; // handled externally

    case '':
      return { type: 'success', output: [] };

    default:
      return {
        type: 'error',
        output: [
          `Commande introuvable: "${command}"`,
          'Tapez "help" pour voir les commandes disponibles.',
        ],
      };
  }
};

// ===========================
// TYPES LIGNE TERMINAL
// ===========================

interface TerminalLine {
  id: number;
  kind: 'input' | 'output' | 'error' | 'info' | 'system' | 'welcome';
  text: string;
}

// ===========================
// ÉCRAN TERMINAL
// ===========================

let lineId = 0;

export default function TerminalScreen() {
  const navigation = useNavigation<any>();
  const activeProject = useStore(s => s.activeProject);
  const settings = useStore(s => s.settings);

  const [lines, setLines] = useState<TerminalLine[]>([
    { id: lineId++, kind: 'welcome', text: '╔════════════════════════════════════════╗' },
    { id: lineId++, kind: 'welcome', text: '║      INCO CODE Terminal v1.0.0         ║' },
    { id: lineId++, kind: 'welcome', text: '║      FREE VERSION · INCO BOY TECH      ║' },
    { id: lineId++, kind: 'welcome', text: '╚════════════════════════════════════════╝' },
    { id: lineId++, kind: 'system',  text: '' },
    { id: lineId++, kind: 'info',    text: 'Tapez "help" pour voir les commandes.' },
    { id: lineId++, kind: 'system',  text: '' },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [lines]);

  const addLines = (newLines: TerminalLine[]) => {
    setLines(prev => [...prev, ...newLines]);
  };

  const handleSubmit = () => {
    const cmd = input.trim();
    if (!cmd) return;

    // Ajouter la ligne de commande
    const promptLine: TerminalLine = {
      id: lineId++,
      kind: 'input',
      text: `${activeProject ? activeProject.name : '~'} $ ${cmd}`,
    };

    setHistory(prev => [cmd, ...prev.slice(0, 49)]);
    setHistoryIdx(-1);
    setInput('');

    if (cmd.toLowerCase() === 'clear') {
      setLines([promptLine, { id: lineId++, kind: 'system', text: 'Terminal effacé.' }]);
      return;
    }

    const result = processCommand(cmd, activeProject, settings);
    const outputLines: TerminalLine[] = result.output.map(text => ({
      id: lineId++,
      kind: result.type === 'error' ? 'error' : result.type === 'info' ? 'info' : 'output',
      text,
    }));

    addLines([promptLine, ...outputLines, { id: lineId++, kind: 'system', text: '' }]);
  };

  const handleKeyDown = (key: string) => {
    if (key === 'ArrowUp') {
      const newIdx = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(newIdx);
      setInput(history[newIdx] || '');
    } else if (key === 'ArrowDown') {
      const newIdx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(newIdx);
      setInput(newIdx === -1 ? '' : history[newIdx]);
    }
  };

  const lineColor = (kind: TerminalLine['kind']): string => {
    switch (kind) {
      case 'input':   return Colors.accent.primary;
      case 'error':   return Colors.accent.danger;
      case 'info':    return Colors.accent.cyan;
      case 'welcome': return Colors.accent.purple;
      case 'system':  return Colors.text.muted;
      default:        return Colors.text.primary;
    }
  };

  const prompt = activeProject ? `${activeProject.name} $ ` : '~ $ ';

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.termDot} />
          <Text style={styles.headerTitle}>Terminal</Text>
        </View>
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={() => setLines([{ id: lineId++, kind: 'system', text: 'Terminal effacé.' }])}
        >
          <Text style={styles.clearBtnText}>Effacer</Text>
        </TouchableOpacity>
      </View>

      {/* Output */}
      <ScrollView
        ref={scrollRef}
        style={styles.output}
        contentContainerStyle={styles.outputContent}
        showsVerticalScrollIndicator
        indicatorStyle="white"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {lines.map(line => (
          <Text
            key={line.id}
            style={[styles.line, { color: lineColor(line.kind) }]}
            selectable
          >
            {line.text || ' '}
          </Text>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputRow}>
        <Text style={styles.promptText}>{prompt}</Text>
        <TextInput
          ref={inputRef}
          style={styles.cmdInput}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSubmit}
          placeholder="tapez une commande..."
          placeholderTextColor={Colors.text.muted}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          returnKeyType="go"
          blurOnSubmit={false}
        />
        <TouchableOpacity style={styles.runBtn} onPress={handleSubmit}>
          <Text style={styles.runBtnText}>↵</Text>
        </TouchableOpacity>
      </View>

      {/* Quick commands */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickBar}
        contentContainerStyle={styles.quickBarContent}
      >
        {['help', 'ls', 'info', 'stats', 'count', 'date', 'clear'].map(cmd => (
          <TouchableOpacity
            key={cmd}
            style={styles.quickBtn}
            onPress={() => { setInput(cmd); setTimeout(handleSubmit, 50); }}
          >
            <Text style={styles.quickBtnText}>{cmd}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0A0E14',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.secondary,
    paddingTop: Platform.OS === 'android' ? 40 : 56,
    paddingBottom: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
    gap: 10,
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.bg.tertiary,
  },
  backBtnText: { fontSize: 18, color: Colors.text.primary },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  termDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent.secondary,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: 'Courier New',
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  clearBtnText: {
    fontSize: 12,
    color: Colors.text.muted,
  },
  output: {
    flex: 1,
    backgroundColor: '#0A0E14',
  },
  outputContent: {
    padding: 14,
    paddingBottom: 20,
  },
  line: {
    fontFamily: 'Courier New',
    fontSize: 12,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.secondary,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  promptText: {
    fontFamily: 'Courier New',
    fontSize: 13,
    color: Colors.accent.primary,
    fontWeight: '700',
  },
  cmdInput: {
    flex: 1,
    fontFamily: 'Courier New',
    fontSize: 13,
    color: Colors.text.primary,
    padding: 0,
  },
  runBtn: {
    padding: 6,
    backgroundColor: Colors.accent.primary + '20',
    borderRadius: 6,
  },
  runBtnText: {
    fontSize: 16,
    color: Colors.accent.primary,
  },
  quickBar: {
    backgroundColor: Colors.bg.secondary,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.divider,
    maxHeight: 36,
  },
  quickBarContent: {
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 6,
  },
  quickBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  quickBtnText: {
    fontFamily: 'Courier New',
    fontSize: 12,
    color: Colors.text.secondary,
  },
});
