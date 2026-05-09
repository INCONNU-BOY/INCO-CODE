import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

// =====================================================
// TYPES
// =====================================================

export interface FileItem {
  id: string;
  name: string;
  language: LanguageType;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  files: FileItem[];
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string | null;
  isFavorite: boolean;
}

export interface AppSettings {
  theme: 'dark' | 'darker' | 'midnight';
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
  showLineNumbers: boolean;
  showMinimap: boolean;
  fontFamily: 'mono' | 'jetbrains' | 'fira';
  livePreviewDelay: number;
  hapticFeedback: boolean;
  language: 'en' | 'fr';
}

export type LanguageType = 'html' | 'css' | 'javascript' | 'typescript' | 'json' | 'markdown' | 'python' | 'txt';

// =====================================================
// STORAGE KEYS
// =====================================================

const KEYS = {
  PROJECTS: '@inco_projects',
  SETTINGS: '@inco_settings',
  RECENT:   '@inco_recent',
  HISTORY:  '@inco_history',
} as const;

// =====================================================
// DEFAULT VALUES
// =====================================================

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  autoSave: true,
  autoSaveDelay: 1500,
  showLineNumbers: true,
  showMinimap: false,
  fontFamily: 'mono',
  livePreviewDelay: 500,
  hapticFeedback: true,
  language: 'fr',
};

export const PROJECT_COLORS = [
  '#58A6FF', '#3FB950', '#BC8CFF', '#F85149',
  '#D29922', '#39D0D8', '#FF7B54', '#FFA657',
];

export const PROJECT_ICONS = [
  'code', 'web', 'phone-android', 'storage',
  'dashboard', 'api', 'game', 'school',
  'work', 'star', 'favorite', 'build',
];

// =====================================================
// TEMPLATE DE PROJET (HTML/CSS/JS Starter)
// =====================================================

export const createStarterFiles = (projectName: string): FileItem[] => {
  const now = new Date().toISOString();
  return [
    {
      id: uuidv4(),
      name: 'index.html',
      language: 'html',
      createdAt: now,
      updatedAt: now,
      content: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${projectName}</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>

  <div class="container">
    <header class="hero">
      <h1 class="title">${projectName}</h1>
      <p class="subtitle">Créé avec INCO CODE 🚀</p>
    </header>

    <main class="content">
      <div class="card">
        <div class="card-icon">⚡</div>
        <h2>Prêt à coder</h2>
        <p>Modifiez ce fichier pour commencer votre projet.</p>
        <button class="btn" onclick="handleClick()">Cliquez ici</button>
      </div>
    </main>
  </div>

  <script src="app.js"></script>
</body>
</html>`,
    },
    {
      id: uuidv4(),
      name: 'style.css',
      language: 'css',
      createdAt: now,
      updatedAt: now,
      content: `/* Style principal — ${projectName} */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --bg: #0D1117;
  --surface: #161B22;
  --accent: #58A6FF;
  --text: #E6EDF3;
  --muted: #8B949E;
  --radius: 12px;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Segoe UI', system-ui, sans-serif;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  max-width: 600px;
  width: 100%;
  padding: 2rem;
  text-align: center;
}

.hero {
  margin-bottom: 2rem;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #58A6FF, #BC8CFF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--muted);
  font-size: 1.1rem;
}

.card {
  background: var(--surface);
  border: 1px solid #30363D;
  border-radius: var(--radius);
  padding: 2rem;
  transition: transform 0.2s, border-color 0.2s;
}

.card:hover {
  transform: translateY(-4px);
  border-color: var(--accent);
}

.card-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.card h2 {
  font-size: 1.4rem;
  margin-bottom: 0.75rem;
}

.card p {
  color: var(--muted);
  margin-bottom: 1.5rem;
}

.btn {
  background: var(--accent);
  color: #0D1117;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}

.btn:hover {
  opacity: 0.9;
  transform: scale(1.02);
}

.btn:active {
  transform: scale(0.98);
}`,
    },
    {
      id: uuidv4(),
      name: 'app.js',
      language: 'javascript',
      createdAt: now,
      updatedAt: now,
      content: `// app.js — Script principal de ${projectName}

/**
 * Gestionnaire de clic sur le bouton
 */
function handleClick() {
  const btn = document.querySelector('.btn');
  const card = document.querySelector('.card');

  // Animation de feedback
  btn.textContent = '✅ Ça marche!';
  btn.style.background = '#3FB950';

  card.style.borderColor = '#3FB950';

  // Message dans la console
  console.log('✅ Projet ${projectName} — bouton cliqué!');
  console.log('🚀 Propulsé par INCO CODE');

  // Reset après 2 secondes
  setTimeout(() => {
    btn.textContent = 'Cliquez ici';
    btn.style.background = '';
    card.style.borderColor = '';
  }, 2000);
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎉 ${projectName} chargé avec succès!');
  console.log('📱 IDE: INCO CODE v1.0');
});`,
    },
  ];
};

// =====================================================
// PROJECTS CRUD
// =====================================================

/**
 * Récupère tous les projets
 */
export const getProjects = async (): Promise<Project[]> => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PROJECTS);
    if (!raw) return [];
    const projects: Project[] = JSON.parse(raw);
    // Trier par date de dernière ouverture
    return projects.sort((a, b) => {
      const da = a.lastOpenedAt || a.updatedAt;
      const db = b.lastOpenedAt || b.updatedAt;
      return new Date(db).getTime() - new Date(da).getTime();
    });
  } catch (e) {
    console.error('[Storage] getProjects error:', e);
    return [];
  }
};

/**
 * Crée un nouveau projet
 */
export const createProject = async (
  name: string,
  description = '',
  color = PROJECT_COLORS[0],
  icon = PROJECT_ICONS[0],
  withStarterFiles = true,
): Promise<Project> => {
  const now = new Date().toISOString();
  const project: Project = {
    id: uuidv4(),
    name: name.trim(),
    description: description.trim(),
    color,
    icon,
    files: withStarterFiles ? createStarterFiles(name) : [],
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: null,
    isFavorite: false,
  };

  const projects = await getProjects();
  await AsyncStorage.setItem(KEYS.PROJECTS, JSON.stringify([project, ...projects]));
  return project;
};

/**
 * Met à jour un projet
 */
export const updateProject = async (id: string, updates: Partial<Project>): Promise<void> => {
  try {
    const projects = await getProjects();
    const idx = projects.findIndex(p => p.id === id);
    if (idx === -1) return;

    projects[idx] = {
      ...projects[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(KEYS.PROJECTS, JSON.stringify(projects));
  } catch (e) {
    console.error('[Storage] updateProject error:', e);
  }
};

/**
 * Supprime un projet
 */
export const deleteProject = async (id: string): Promise<void> => {
  try {
    const projects = await getProjects();
    const filtered = projects.filter(p => p.id !== id);
    await AsyncStorage.setItem(KEYS.PROJECTS, JSON.stringify(filtered));
  } catch (e) {
    console.error('[Storage] deleteProject error:', e);
  }
};

/**
 * Marque l'ouverture d'un projet
 */
export const touchProject = async (id: string): Promise<void> => {
  await updateProject(id, { lastOpenedAt: new Date().toISOString() });
};

/**
 * Bascule le favori d'un projet
 */
export const toggleFavorite = async (id: string): Promise<void> => {
  const projects = await getProjects();
  const project = projects.find(p => p.id === id);
  if (!project) return;
  await updateProject(id, { isFavorite: !project.isFavorite });
};

// =====================================================
// FILE OPERATIONS
// =====================================================

/**
 * Ajoute un fichier à un projet
 */
export const addFile = async (
  projectId: string,
  name: string,
  language: LanguageType,
): Promise<FileItem> => {
  const now = new Date().toISOString();
  const file: FileItem = {
    id: uuidv4(),
    name: name.trim(),
    language,
    content: getFileTemplate(name, language),
    createdAt: now,
    updatedAt: now,
  };

  const projects = await getProjects();
  const project = projects.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');

  project.files.push(file);
  await updateProject(projectId, { files: project.files });
  return file;
};

/**
 * Sauvegarde le contenu d'un fichier
 */
export const saveFile = async (
  projectId: string,
  fileId: string,
  content: string,
): Promise<void> => {
  const projects = await getProjects();
  const project = projects.find(p => p.id === projectId);
  if (!project) return;

  const fileIdx = project.files.findIndex(f => f.id === fileId);
  if (fileIdx === -1) return;

  project.files[fileIdx] = {
    ...project.files[fileIdx],
    content,
    updatedAt: new Date().toISOString(),
  };
  await updateProject(projectId, { files: project.files });
};

/**
 * Renomme un fichier
 */
export const renameFile = async (
  projectId: string,
  fileId: string,
  newName: string,
): Promise<void> => {
  const projects = await getProjects();
  const project = projects.find(p => p.id === projectId);
  if (!project) return;

  const fileIdx = project.files.findIndex(f => f.id === fileId);
  if (fileIdx === -1) return;

  const language = detectLanguage(newName);
  project.files[fileIdx] = {
    ...project.files[fileIdx],
    name: newName.trim(),
    language,
    updatedAt: new Date().toISOString(),
  };
  await updateProject(projectId, { files: project.files });
};

/**
 * Supprime un fichier
 */
export const deleteFile = async (projectId: string, fileId: string): Promise<void> => {
  const projects = await getProjects();
  const project = projects.find(p => p.id === projectId);
  if (!project) return;

  project.files = project.files.filter(f => f.id !== fileId);
  await updateProject(projectId, { files: project.files });
};

// =====================================================
// SETTINGS
// =====================================================

export const getSettings = async (): Promise<AppSettings> => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (settings: Partial<AppSettings>): Promise<void> => {
  try {
    const current = await getSettings();
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...current, ...settings }));
  } catch (e) {
    console.error('[Storage] saveSettings error:', e);
  }
};

// =====================================================
// HISTORY
// =====================================================

export const addToHistory = async (projectId: string, projectName: string): Promise<void> => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HISTORY);
    const history: { projectId: string; name: string; date: string }[] = raw ? JSON.parse(raw) : [];

    const entry = {
      projectId,
      name: projectName,
      date: new Date().toISOString(),
    };

    const filtered = history.filter(h => h.projectId !== projectId);
    const updated = [entry, ...filtered].slice(0, 50); // max 50 entrées
    await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
  } catch (e) {
    console.error('[Storage] addToHistory error:', e);
  }
};

export const getHistory = async (): Promise<{ projectId: string; name: string; date: string }[]> => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const clearHistory = async (): Promise<void> => {
  await AsyncStorage.removeItem(KEYS.HISTORY);
};

// =====================================================
// UTILS
// =====================================================

/**
 * Détecte le langage selon l'extension du fichier
 */
export const detectLanguage = (filename: string): LanguageType => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, LanguageType> = {
    html: 'html', htm: 'html',
    css: 'css', scss: 'css',
    js: 'javascript', jsx: 'javascript', mjs: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    json: 'json',
    md: 'markdown', mdx: 'markdown',
    py: 'python',
    txt: 'txt',
  };
  return map[ext || ''] || 'txt';
};

/**
 * Retourne le template par défaut pour un nouveau fichier
 */
export const getFileTemplate = (name: string, language: LanguageType): string => {
  const templates: Record<LanguageType, string> = {
    html: `<!DOCTYPE html>\n<html lang="fr">\n<head>\n  <meta charset="UTF-8" />\n  <title>${name}</title>\n</head>\n<body>\n  <!-- ${name} -->\n  <h1>Bonjour depuis ${name}</h1>\n</body>\n</html>`,
    css: `/* ${name} */\n\n:root {\n  --primary: #58A6FF;\n}\n\nbody {\n  font-family: system-ui, sans-serif;\n  margin: 0;\n  padding: 0;\n}\n`,
    javascript: `// ${name}\n// Créé avec INCO CODE\n\n'use strict';\n\n/**\n * Point d'entrée\n */\nfunction main() {\n  console.log('${name} chargé!');\n}\n\nmain();\n`,
    typescript: `// ${name}\n// Créé avec INCO CODE\n\ninterface Config {\n  name: string;\n  version: string;\n}\n\nconst config: Config = {\n  name: '${name}',\n  version: '1.0.0',\n};\n\nexport default config;\n`,
    json: `{\n  "name": "${name}",\n  "version": "1.0.0",\n  "description": ""\n}\n`,
    markdown: `# ${name}\n\n> Créé avec INCO CODE\n\n## Introduction\n\nContenu de votre document.\n\n## Section\n\n- Item 1\n- Item 2\n- Item 3\n`,
    python: `# ${name}\n# Créé avec INCO CODE\n\ndef main():\n    """Point d'entrée principal."""\n    print(f"${name} - démarré!")\n\nif __name__ == "__main__":\n    main()\n`,
    txt: `${name}\nCréé avec INCO CODE\n`,
  };
  return templates[language] || '';
};

/**
 * Calcule la taille d'un projet en octets
 */
export const getProjectSize = (project: Project): string => {
  const bytes = project.files.reduce((sum, f) => sum + new Blob([f.content]).size, 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Formatte une date en français relatif
 */
export const formatRelativeDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1)   return 'À l\'instant';
    if (diffMins < 60)  return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7)   return `Il y a ${diffDays}j`;
    return format(date, 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
};

/**
 * Exporte un projet en JSON string (pour partage)
 */
export const exportProjectJson = (project: Project): string => {
  return JSON.stringify(project, null, 2);
};

/**
 * Importe un projet depuis un JSON string
 */
export const importProjectFromJson = async (jsonStr: string): Promise<Project> => {
  const data = JSON.parse(jsonStr) as Project;
  const now = new Date().toISOString();
  const project: Project = {
    ...data,
    id: uuidv4(), // nouvel ID pour éviter les conflits
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: null,
  };
  const projects = await getProjects();
  await AsyncStorage.setItem(KEYS.PROJECTS, JSON.stringify([project, ...projects]));
  return project;
};

/**
 * Efface toutes les données (reset)
 */
export const clearAllData = async (): Promise<void> => {
  await AsyncStorage.multiRemove([KEYS.PROJECTS, KEYS.SETTINGS, KEYS.RECENT, KEYS.HISTORY]);
};
