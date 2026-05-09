// utils/store.ts
// INCO CODE — Global State (Zustand)

import { create } from 'zustand';
import type { Project, FileItem, AppSettings } from '../storage';
import {
  getProjects,
  getSettings,
  saveSettings,
  updateProject,
  deleteProject as _deleteProject,
  createProject as _createProject,
  saveFile as _saveFile,
  addFile as _addFile,
  deleteFile as _deleteFile,
  toggleFavorite as _toggleFavorite,
  touchProject,
  addToHistory,
  DEFAULT_SETTINGS,
} from '../storage';

// ===========================
// TYPES
// ===========================

interface EditorTab {
  fileId: string;
  projectId: string;
}

interface AppState {
  // Data
  projects: Project[];
  settings: AppSettings;

  // Editor state
  activeProject: Project | null;
  openTabs: EditorTab[];
  activeTab: EditorTab | null;
  unsavedChanges: Record<string, string>; // fileId -> content

  // UI state
  isLoading: boolean;
  searchQuery: string;
  showPreview: boolean;
  terminalOutput: string[];

  // ===========================
  // ACTIONS
  // ===========================

  // Init
  initialize: () => Promise<void>;

  // Projects
  loadProjects: () => Promise<void>;
  createProject: (name: string, desc: string, color: string, icon: string) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  openProject: (project: Project) => Promise<void>;
  closeProject: () => void;
  toggleFavorite: (id: string) => Promise<void>;
  setSearchQuery: (q: string) => void;

  // Files / Editor
  openFile: (projectId: string, fileId: string) => void;
  closeTab: (fileId: string) => void;
  setActiveTab: (tab: EditorTab) => void;
  updateFileContent: (fileId: string, content: string) => void;
  saveCurrentFile: () => Promise<void>;
  saveAllFiles: () => Promise<void>;
  addFile: (projectId: string, name: string, lang: any) => Promise<FileItem>;
  deleteFile: (projectId: string, fileId: string) => Promise<void>;

  // Settings
  updateSettings: (s: Partial<AppSettings>) => Promise<void>;

  // Preview
  togglePreview: () => void;

  // Terminal
  addTerminalLine: (line: string) => void;
  clearTerminal: () => void;
}

// ===========================
// STORE
// ===========================

export const useStore = create<AppState>((set, get) => ({
  // ── Initial state ──────────────────────────────────
  projects: [],
  settings: DEFAULT_SETTINGS,
  activeProject: null,
  openTabs: [],
  activeTab: null,
  unsavedChanges: {},
  isLoading: true,
  searchQuery: '',
  showPreview: false,
  terminalOutput: ['> INCO CODE Terminal v1.0', '> Prêt.'],

  // ── Initialize ─────────────────────────────────────
  initialize: async () => {
    const [projects, settings] = await Promise.all([getProjects(), getSettings()]);
    set({ projects, settings, isLoading: false });
  },

  // ── Projects ───────────────────────────────────────
  loadProjects: async () => {
    const projects = await getProjects();
    set({ projects });
  },

  createProject: async (name, desc, color, icon) => {
    const project = await _createProject(name, desc, color, icon, true);
    const projects = await getProjects();
    set({ projects });
    return project;
  },

  updateProject: async (id, updates) => {
    await updateProject(id, updates);
    const projects = await getProjects();
    // Si c'est le projet actif, on le met à jour aussi
    const activeProject = get().activeProject;
    if (activeProject?.id === id) {
      const updated = projects.find(p => p.id === id);
      set({ projects, activeProject: updated || activeProject });
    } else {
      set({ projects });
    }
  },

  deleteProject: async (id) => {
    await _deleteProject(id);
    const { activeProject } = get();
    const projects = await getProjects();
    if (activeProject?.id === id) {
      set({ projects, activeProject: null, openTabs: [], activeTab: null });
    } else {
      set({ projects });
    }
  },

  openProject: async (project) => {
    await touchProject(project.id);
    await addToHistory(project.id, project.name);

    // Ouvrir le premier fichier par défaut
    const firstFile = project.files[0];
    const firstTab = firstFile ? { fileId: firstFile.id, projectId: project.id } : null;

    set({
      activeProject: project,
      openTabs: firstTab ? [firstTab] : [],
      activeTab: firstTab,
      unsavedChanges: {},
      showPreview: false,
    });
  },

  closeProject: () => {
    set({
      activeProject: null,
      openTabs: [],
      activeTab: null,
      unsavedChanges: {},
      showPreview: false,
    });
  },

  toggleFavorite: async (id) => {
    await _toggleFavorite(id);
    const projects = await getProjects();
    set({ projects });
  },

  setSearchQuery: (q) => set({ searchQuery: q }),

  // ── Files ──────────────────────────────────────────
  openFile: (projectId, fileId) => {
    const { openTabs } = get();
    const tab: EditorTab = { fileId, projectId };
    const alreadyOpen = openTabs.find(t => t.fileId === fileId);
    if (!alreadyOpen) {
      set({ openTabs: [...openTabs, tab], activeTab: tab });
    } else {
      set({ activeTab: tab });
    }
  },

  closeTab: (fileId) => {
    const { openTabs, activeTab } = get();
    const filtered = openTabs.filter(t => t.fileId !== fileId);
    let newActive = activeTab?.fileId === fileId
      ? filtered[filtered.length - 1] || null
      : activeTab;
    set({ openTabs: filtered, activeTab: newActive });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  updateFileContent: (fileId, content) => {
    set(state => ({
      unsavedChanges: { ...state.unsavedChanges, [fileId]: content },
    }));
  },

  saveCurrentFile: async () => {
    const { activeTab, unsavedChanges, activeProject } = get();
    if (!activeTab || !activeProject) return;
    const content = unsavedChanges[activeTab.fileId];
    if (content === undefined) return;

    await _saveFile(activeProject.id, activeTab.fileId, content);

    // Mettre à jour le projet en mémoire
    const projects = await getProjects();
    const updatedProject = projects.find(p => p.id === activeProject.id);

    set(state => {
      const newUnsaved = { ...state.unsavedChanges };
      delete newUnsaved[activeTab.fileId];
      return {
        unsavedChanges: newUnsaved,
        activeProject: updatedProject || state.activeProject,
        projects,
      };
    });
  },

  saveAllFiles: async () => {
    const { unsavedChanges, activeProject } = get();
    if (!activeProject) return;

    await Promise.all(
      Object.entries(unsavedChanges).map(([fileId, content]) =>
        _saveFile(activeProject.id, fileId, content)
      )
    );

    const projects = await getProjects();
    const updatedProject = projects.find(p => p.id === activeProject.id);
    set({ unsavedChanges: {}, activeProject: updatedProject || activeProject, projects });
  },

  addFile: async (projectId, name, lang) => {
    const file = await _addFile(projectId, name, lang);
    const projects = await getProjects();
    const updatedProject = projects.find(p => p.id === projectId);
    const tab: EditorTab = { fileId: file.id, projectId };
    set(state => ({
      projects,
      activeProject: updatedProject || state.activeProject,
      openTabs: [...state.openTabs, tab],
      activeTab: tab,
    }));
    return file;
  },

  deleteFile: async (projectId, fileId) => {
    await _deleteFile(projectId, fileId);
    const projects = await getProjects();
    const updatedProject = projects.find(p => p.id === projectId);

    set(state => {
      const filtered = state.openTabs.filter(t => t.fileId !== fileId);
      const newActive = state.activeTab?.fileId === fileId
        ? filtered[filtered.length - 1] || null
        : state.activeTab;
      return {
        projects,
        activeProject: updatedProject || state.activeProject,
        openTabs: filtered,
        activeTab: newActive,
      };
    });
  },

  // ── Settings ───────────────────────────────────────
  updateSettings: async (updates) => {
    const current = get().settings;
    const newSettings = { ...current, ...updates };
    await saveSettings(newSettings);
    set({ settings: newSettings });
  },

  // ── Preview ────────────────────────────────────────
  togglePreview: () => set(state => ({ showPreview: !state.showPreview })),

  // ── Terminal ───────────────────────────────────────
  addTerminalLine: (line) => {
    set(state => ({
      terminalOutput: [...state.terminalOutput.slice(-200), line], // max 200 lignes
    }));
  },

  clearTerminal: () => set({ terminalOutput: ['> Terminal effacé.', '> Prêt.'] }),
}));

// ===========================
// SELECTORS UTILITAIRES
// ===========================

/**
 * Retourne le fichier actif dans l'éditeur
 */
export const selectActiveFile = (state: AppState): FileItem | null => {
  if (!state.activeTab || !state.activeProject) return null;
  return state.activeProject.files.find(f => f.id === state.activeTab!.fileId) || null;
};

/**
 * Retourne le contenu actuel du fichier actif (modifié ou sauvegardé)
 */
export const selectActiveContent = (state: AppState): string => {
  const file = selectActiveFile(state);
  if (!file) return '';
  return state.unsavedChanges[file.id] ?? file.content;
};

/**
 * Retourne les projets filtrés par la recherche
 */
export const selectFilteredProjects = (state: AppState): Project[] => {
  const q = state.searchQuery.toLowerCase().trim();
  if (!q) return state.projects;
  return state.projects.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q)
  );
};

/**
 * Vérifie si un fichier a des changements non sauvegardés
 */
export const selectIsUnsaved = (state: AppState, fileId: string): boolean => {
  return fileId in state.unsavedChanges;
};
