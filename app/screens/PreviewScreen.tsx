import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { useStore, selectActiveContent } from '../utils/store';
import { Colors, Spacing, BorderRadius, Typography } from '../themes';

const { width: W, height: H } = Dimensions.get('window');

// ===========================
// TYPES
// ===========================

interface ConsoleLog {
  id: string;
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: string;
}

// ===========================
// GÉNÉRATEUR HTML
// ===========================

/**
 * Génère le HTML complet à injecter dans la WebView
 * en fusionnant tous les fichiers du projet
 */
const buildPreviewHTML = (
  projectFiles: { name: string; language: string; content: string }[],
): string => {
  // Récupérer les fichiers par type
  const htmlFile  = projectFiles.find(f => f.language === 'html');
  const cssFiles  = projectFiles.filter(f => f.language === 'css');
  const jsFiles   = projectFiles.filter(f => f.language === 'javascript' || f.language === 'typescript');

  if (!htmlFile) {
    // Pas de HTML : afficher un message
    const allCode = projectFiles.map(f => `// ${f.name}\n${f.content}`).join('\n\n');
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>INCO CODE Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0D1117;
      color: #E6EDF3;
      font-family: 'Courier New', monospace;
      padding: 20px;
      font-size: 13px;
      line-height: 1.6;
    }
    .info {
      background: #161B22;
      border: 1px solid #30363D;
      border-left: 3px solid #58A6FF;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .info p { color: #8B949E; font-size: 12px; }
    pre {
      background: #161B22;
      border: 1px solid #30363D;
      border-radius: 8px;
      padding: 16px;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="info">
    <p>ℹ️ Aucun fichier HTML trouvé dans ce projet.</p>
    <p>Créez un fichier <strong>index.html</strong> pour voir le rendu en direct.</p>
  </div>
  <pre>${allCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
  }

  // Injecter les CSS inline dans le HTML
  let html = htmlFile.content;

  // Remplacer les balises <link rel="stylesheet"> par les CSS inline
  for (const cssFile of cssFiles) {
    const cssContent = cssFile.content;
    const linkRegex = new RegExp(
      `<link[^>]*href=["']${cssFile.name}["'][^>]*/?>`,
      'gi',
    );
    if (linkRegex.test(html)) {
      html = html.replace(linkRegex, `<style>\n${cssContent}\n</style>`);
    } else {
      // Si pas de lien, ajouter avant </head>
      html = html.replace('</head>', `<style>\n${cssContent}\n</style>\n</head>`);
    }
  }

  // Remplacer les <script src="..."> par les scripts inline
  for (const jsFile of jsFiles) {
    const jsContent = jsFile.content;
    const scriptRegex = new RegExp(
      `<script[^>]*src=["']${jsFile.name}["'][^>]*></script>`,
      'gi',
    );
    if (scriptRegex.test(html)) {
      html = html.replace(scriptRegex, `<script>\n${jsContent}\n</script>`);
    } else {
      html = html.replace('</body>', `<script>\n${jsContent}\n</script>\n</body>`);
    }
  }

  // Injecter un intercepteur de console pour renvoyer les logs à React Native
  const consoleInterceptor = `
<script>
(function() {
  const _log = console.log.bind(console);
  const _error = console.error.bind(console);
  const _warn = console.warn.bind(console);
  const _info = console.info.bind(console);

  function postLog(type, args) {
    try {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
        JSON.stringify({ type, message: Array.from(args).map(a => {
          try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
          catch { return '[object]'; }
        }).join(' ') })
      );
    } catch(e) {}
  }

  console.log   = (...a) => { _log(...a);   postLog('log',  a); };
  console.error = (...a) => { _error(...a); postLog('error',a); };
  console.warn  = (...a) => { _warn(...a);  postLog('warn', a); };
  console.info  = (...a) => { _info(...a);  postLog('info', a); };

  window.onerror = function(msg, src, line, col, err) {
    postLog('error', [\`❌ \${msg} (ligne \${line})\`]);
    return false;
  };
})();
</script>`;

  // Ajouter l'intercepteur juste après <head>
  html = html.replace('<head>', `<head>${consoleInterceptor}`);

  // Ajouter meta viewport si absent
  if (!html.includes('viewport')) {
    html = html.replace(
      '<head>',
      '<head>\n<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    );
  }

  return html;
};

// ===========================
// LOG ENTRY
// ===========================

const LogEntry = ({ log }: { log: ConsoleLog }) => {
  const colors: Record<ConsoleLog['type'], string> = {
    log:   Colors.text.primary,
    error: Colors.accent.danger,
    warn:  Colors.accent.warning,
    info:  Colors.accent.primary,
  };
  const icons: Record<ConsoleLog['type'], string> = {
    log:   '>',
    error: '✕',
    warn:  '⚠',
    info:  'ℹ',
  };

  return (
    <View style={[logStyles.entry, log.type === 'error' && logStyles.entryError]}>
      <Text style={[logStyles.icon, { color: colors[log.type] }]}>{icons[log.type]}</Text>
      <Text style={[logStyles.message, { color: colors[log.type] }]} selectable>
        {log.message}
      </Text>
      <Text style={logStyles.time}>{log.timestamp}</Text>
    </View>
  );
};

const logStyles = StyleSheet.create({
  entry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.divider,
    gap: 8,
  },
  entryError: {
    backgroundColor: Colors.accent.danger + '08',
  },
  icon: {
    fontSize: 11,
    fontFamily: 'Courier New',
    marginTop: 1,
    width: 12,
  },
  message: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Courier New',
    lineHeight: 18,
  },
  time: {
    fontSize: 9,
    color: Colors.text.muted,
    fontFamily: 'Courier New',
  },
});

// ===========================
// ÉCRAN PREVIEW
// ===========================

type Tab = 'preview' | 'console';

export default function PreviewScreen() {
  const navigation = useNavigation<any>();
  const activeProject = useStore(s => s.activeProject);
  const settings = useStore(s => s.settings);
  const unsavedChanges = useStore(s => s.unsavedChanges);

  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<'phone' | 'tablet'>('phone');
  const [showControls, setShowControls] = useState(true);

  const webViewRef = useRef<WebView>(null);
  const logCounter = useRef(0);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Générer le HTML à partir des fichiers (avec les unsaved changes)
  const htmlContent = useMemo(() => {
    if (!activeProject) return '';
    const filesWithChanges = activeProject.files.map(f => ({
      name: f.name,
      language: f.language,
      content: f.id in unsavedChanges ? unsavedChanges[f.id] : f.content,
    }));
    return buildPreviewHTML(filesWithChanges);
  }, [activeProject?.id, unsavedChanges, refreshKey]);

  // Auto-refresh sur changements
  useEffect(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      setRefreshKey(k => k + 1);
    }, settings.livePreviewDelay);
    return () => { if (refreshTimer.current) clearTimeout(refreshTimer.current); };
  }, [unsavedChanges]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as { type: ConsoleLog['type']; message: string };
      const log: ConsoleLog = {
        id: String(++logCounter.current),
        type: data.type,
        message: data.message,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setConsoleLogs(prev => [...prev.slice(-200), log]);

      // Passer en onglet console si erreur
      if (data.type === 'error') setActiveTab('console');
    } catch {}
  }, []);

  const handleRefresh = useCallback(() => {
    setConsoleLogs([]);
    setRefreshKey(k => k + 1);
    setIsLoading(true);
  }, []);

  const errorCount = consoleLogs.filter(l => l.type === 'error').length;

  if (!activeProject) {
    return (
      <View style={styles.noProject}>
        <Text style={styles.noProjectText}>Aucun projet ouvert</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.goHomeBtn}>
          <Text style={styles.goHomeBtnText}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* ── Header ───────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={[styles.liveIndicator, isLoading && styles.liveIndicatorLoading]}>
            <Text style={styles.liveDot}>●</Text>
            <Text style={styles.liveText}>{isLoading ? 'Chargement...' : 'LIVE'}</Text>
          </View>
          <Text style={styles.projectName} numberOfLines={1}>{activeProject.name}</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.viewModeBtn, viewMode === 'phone' && styles.viewModeBtnActive]}
            onPress={() => setViewMode(viewMode === 'phone' ? 'tablet' : 'phone')}
          >
            <Text style={styles.viewModeBtnText}>{viewMode === 'phone' ? '📱' : '💻'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
            <Text style={styles.refreshBtnText}>↺</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Onglets Preview / Console ─────────────────── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBarBtn, activeTab === 'preview' && styles.tabBarBtnActive]}
          onPress={() => setActiveTab('preview')}
        >
          <Text style={[styles.tabBarBtnText, activeTab === 'preview' && styles.tabBarBtnTextActive]}>
            👁 Preview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBarBtn, activeTab === 'console' && styles.tabBarBtnActive]}
          onPress={() => setActiveTab('console')}
        >
          <Text style={[styles.tabBarBtnText, activeTab === 'console' && styles.tabBarBtnTextActive]}>
            🖥 Console
            {errorCount > 0 && (
              <Text style={styles.errorBadge}> {errorCount}</Text>
            )}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Contenu ───────────────────────────────────── */}
      <View style={styles.content}>
        {/* Preview WebView */}
        {activeTab === 'preview' && (
          <View style={[
            styles.webViewContainer,
            viewMode === 'phone' && styles.webViewPhone,
          ]}>
            {viewMode === 'phone' && <View style={styles.phoneFrame} />}
            <WebView
              ref={webViewRef}
              source={{ html: htmlContent, baseUrl: '' }}
              style={styles.webView}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              onMessage={handleMessage}
              javaScriptEnabled
              domStorageEnabled
              mixedContentMode="always"
              originWhitelist={['*']}
              allowFileAccess
              scalesPageToFit={false}
              showsVerticalScrollIndicator={false}
              bounces={false}
              overScrollMode="never"
              scrollEnabled
            />
          </View>
        )}

        {/* Console */}
        {activeTab === 'console' && (
          <View style={styles.console}>
            {/* Toolbar console */}
            <View style={styles.consoleToolbar}>
              <Text style={styles.consoleTitle}>
                Console — {consoleLogs.length} entrée{consoleLogs.length > 1 ? 's' : ''}
              </Text>
              <TouchableOpacity
                onPress={() => setConsoleLogs([])}
                style={styles.clearBtn}
              >
                <Text style={styles.clearBtnText}>Effacer</Text>
              </TouchableOpacity>
            </View>

            {/* Logs */}
            <ScrollView
              style={styles.logScroll}
              showsVerticalScrollIndicator={true}
              indicatorStyle="white"
            >
              {consoleLogs.length === 0 ? (
                <View style={styles.emptyConsole}>
                  <Text style={styles.emptyConsoleText}>
                    {'>'} Aucune sortie console.{'\n'}
                    {'>'} Utilisez console.log() dans votre code JS.
                  </Text>
                </View>
              ) : (
                consoleLogs.map(log => <LogEntry key={log.id} log={log} />)
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* ── Barre d'infos ─────────────────────────────── */}
      <View style={styles.infoBar}>
        <Text style={styles.infoBarText}>
          {activeProject.files.length} fichier{activeProject.files.length > 1 ? 's' : ''}  ·
          {' '}{viewMode === 'phone' ? '📱 Mobile' : '💻 Tablet'}  ·
          {errorCount > 0
            ? <Text style={{ color: Colors.accent.danger }}> {errorCount} erreur{errorCount > 1 ? 's' : ''}</Text>
            : ' ✅ OK'
          }
        </Text>
        <Text style={[styles.infoBarText, { color: Colors.accent.cyan }]}>LIVE PREVIEW</Text>
      </View>
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

  // Header
  header: {
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.status.running + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    marginBottom: 2,
  },
  liveIndicatorLoading: {
    backgroundColor: Colors.accent.warning + '20',
  },
  liveDot: {
    fontSize: 8,
    color: Colors.status.running,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.status.running,
    letterSpacing: 1,
  },
  projectName: {
    fontSize: 12,
    color: Colors.text.muted,
    fontFamily: 'Courier New',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  viewModeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  viewModeBtnActive: {
    borderColor: Colors.accent.primary,
    backgroundColor: Colors.accent.primary + '15',
  },
  viewModeBtnText: {
    fontSize: 16,
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  refreshBtnText: {
    fontSize: 18,
    color: Colors.text.primary,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  tabBarBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBarBtnActive: {
    borderBottomColor: Colors.accent.primary,
  },
  tabBarBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.muted,
  },
  tabBarBtnTextActive: {
    color: Colors.accent.primary,
  },
  errorBadge: {
    color: Colors.accent.danger,
    fontWeight: '700',
  },

  // Content
  content: {
    flex: 1,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webViewPhone: {
    marginHorizontal: 0,
  },
  phoneFrame: {
    height: 0,
  },
  webView: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Console
  console: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  consoleToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bg.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  consoleTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'Courier New',
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  clearBtnText: {
    fontSize: 11,
    color: Colors.text.muted,
  },
  logScroll: {
    flex: 1,
  },
  emptyConsole: {
    padding: 20,
  },
  emptyConsoleText: {
    color: Colors.text.muted,
    fontFamily: 'Courier New',
    fontSize: 12,
    lineHeight: 20,
  },

  // Info bar
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bg.secondary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border,
  },
  infoBarText: {
    fontSize: 10,
    color: Colors.text.muted,
    fontFamily: 'Courier New',
  },

  // No project
  noProject: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg.primary,
    gap: 16,
  },
  noProjectText: {
    color: Colors.text.secondary,
    fontSize: 16,
  },
  goHomeBtn: {
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  goHomeBtnText: {
    color: Colors.ui.tabActive,
    fontWeight: '700',
  },
});
