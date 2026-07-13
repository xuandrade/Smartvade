import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { StudyTask, LawNode, UserAnnotation, Highlight, Legislation, IncidenceMap, AppFilters, ExamBoard, SRSData, PersonalTag, RetaFinalProject } from '../types';
import { parseLaw, migrateExistingNodes } from '../lib/parser';

import { calculateSM2 } from '../lib/srs';

const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

interface AppState {
  // Data
  legislations: Legislation[];
  currentLegislationId: string | null;
  annotations: Record<string, UserAnnotation[]>;
  highlights: Record<string, Highlight[]>;
  srsTracking: Record<string, SRSData>;
  expandedTocs: Record<string, boolean>;
  retaFinalMode: boolean;
  dailyGoal: number;
  tasks: StudyTask[];

  
  // UI State
  filters: AppFilters;
  focusMode: boolean;
  sidebarCollapsed: boolean;
  rightPanelOpen: boolean;
  activeNodeId: string | null;
  mobileMenuOpen: boolean;
  showCreateModal: boolean;
  showReviewMode: boolean;
  showDashboard: boolean;
  
  // V3 Features
  personalTags: PersonalTag[];
  articleTags: Record<string, string[]>; // nodeId -> tagIds[]
  retaFinalProjects: RetaFinalProject[];
  activeRetaFinalId: string | null;
  
  studyTime: Record<string, number>;
  

  legislativeCutOffYear: number;
  setLegislativeCutOffYear: (year: number) => void;

  // Backup and Snapshots
  autoBackupEnabled: boolean;
  snapshots: { id: string; name: string; date: number; data: string }[];
  lastBackupDate: number | null;
  
  // Edit Mode V3
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
  
  editDrawerOpen: boolean;
  editDrawerAction: string | null;
  editDrawerNodeId: string | null;
  openEditDrawer: (action: string, nodeId: string) => void;
  closeEditDrawer: () => void;

  updateLawNode: (legId: string, nodeId: string, changes: Partial<LawNode>) => void;
  insertLawNode: (legId: string, targetId: string, position: 'before' | 'after' | 'child', newNode: LawNode) => void;
  removeLawNode: (legId: string, nodeId: string) => void;

  // Computed / Accessors
  getCurrentLegislation: () => Legislation | undefined;

  // Actions
  // V3 Actions
  addPersonalTag: (tag: Omit<PersonalTag, 'id'>) => void;
  updatePersonalTag: (id: string, updates: Partial<PersonalTag>) => void;
  deletePersonalTag: (id: string) => void;
  toggleArticleTag: (nodeId: string, tagId: string) => void;
  
  createRetaFinalProject: (project: Omit<RetaFinalProject, 'id' | 'createdAt' | 'studiedArticles'>) => void;
  updateRetaFinalProject: (id: string, updates: Partial<RetaFinalProject>) => void;
  deleteRetaFinalProject: (id: string) => void;
  setActiveRetaFinalId: (id: string | null) => void;
  toggleRetaFinalArticleStudied: (projectId: string, nodeId: string) => void;
  importBackup: (data: any, mode: 'replace' | 'merge') => void;
  setAutoBackup: (enabled: boolean) => void;
  createSnapshot: (name: string) => void;
  restoreSnapshot: (id: string) => void;
  deleteSnapshot: (id: string) => void;
  updateLastBackupDate: () => void;
  
  createLegislation: (title: string, text: string, incidences: IncidenceMap, discipline?: string) => void;
  setCurrentLegislation: (id: string) => void;
  deleteLegislation: (id: string) => void;
  reorderLegislations: (sourceId: string, targetId: string) => void;
  setMetadata: (nodeId: string, metadata: any) => void;
  
  addAnnotation: (nodeId: string, content: string) => void;
  deleteAnnotation: (nodeId: string, annotationId: string) => void;
  updateAnnotation: (nodeId: string, annotationId: string, content: string) => void;
  
  addHighlight: (nodeId: string, highlight: Omit<Highlight, 'id'>) => void;
  removeHighlight: (nodeId: string, highlightId: string) => void;
  addHighlightsBatch: (nodeId: string, highlights: Omit<Highlight, 'id'>[]) => void;
  clearOverlappingHighlights: (nodeId: string, start: number, end: number) => void;
  
  setFilters: (filters: Partial<AppFilters>) => void;
  toggleFocusMode: () => void;
  toggleSidebar: () => void;
  toggleRightPanel: (nodeId?: string) => void;
  toggleMobileMenu: () => void;
  setShowCreateModal: (show: boolean) => void;
  setShowReviewMode: (show: boolean) => void;
  setShowDashboard: (show: boolean) => void;
  incrementStudyTime: (seconds: number) => void;
  
  // Node interaction actions
  toggleToc: (id: string) => void;
  toggleRetaFinalMode: () => void;
  toggleTask: (id: string) => void;



  toggleNodeProperty: (nodeId: string, property: 'isRead' | 'isFavorite' | 'needsReview') => void;

  // SRS Actions
  addToSRS: (nodeId: string) => void;
  removeFromSRS: (nodeId: string) => void;
  processSRSReview: (nodeId: string, quality: 0 | 1 | 2 | 3 | 4 | 5) => void;
}

const defaultFilters: AppFilters = {
  searchQuery: '',
  minIncidence: 0,
  board: 'ALL',
  showFavorites: false,
  showNeedsReview: false,
  showRead: 'ALL',
  colorCodeConfig: "Prazos e datas em 'green', Exceções e advertências em 'pink', Verbos e ações em 'blue', Conceitos fundamentais em 'bold'."
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      legislations: [],
      currentLegislationId: null,
      annotations: {},
      highlights: {},
      srsTracking: {},
      expandedTocs: {},
      retaFinalMode: false,
      dailyGoal: 14400,
      tasks: [],
      
      editMode: false,
      
      personalTags: [],
      articleTags: {},
      retaFinalProjects: [],
      activeRetaFinalId: null,
      
      
      filters: defaultFilters,
      focusMode: false,
      sidebarCollapsed: false,
      rightPanelOpen: false,
      activeNodeId: null,
      mobileMenuOpen: false,
      showCreateModal: false,
      showReviewMode: false,
      showDashboard: false,
      
      autoBackupEnabled: false,
      snapshots: [],
      lastBackupDate: null,
      
      studyTime: {},
      legislativeCutOffYear: 2023,
      setLegislativeCutOffYear: (year) => set({ legislativeCutOffYear: year }),

      setEditMode: (mode) => set({ 
        editMode: mode,
        // automatically close drawer when exiting edit mode
        editDrawerOpen: mode ? get().editDrawerOpen : false
      }),

      editDrawerOpen: false,
      editDrawerAction: null,
      editDrawerNodeId: null,
      openEditDrawer: (action, nodeId) => set({ editDrawerOpen: true, editDrawerAction: action, editDrawerNodeId: nodeId }),
      closeEditDrawer: () => set({ editDrawerOpen: false, editDrawerAction: null, editDrawerNodeId: null }),
      
      updateLawNode: (legId, nodeId, changes) => set(state => {
        const updateTree = (nodes: LawNode[]): LawNode[] => {
          return nodes.map(node => {
            if (node.id === nodeId) {
              return { ...node, ...changes };
            }
            if (node.children && node.children.length > 0) {
              return { ...node, children: updateTree(node.children) };
            }
            return node;
          });
        };
        return {
          legislations: state.legislations.map(l => l.id === legId ? { ...l, nodes: updateTree(l.nodes) } : l)
        };
      }),

      insertLawNode: (legId, targetId, position, newNode) => set(state => {
        const insertTree = (nodes: LawNode[]): LawNode[] => {
          const result: LawNode[] = [];
          let inserted = false;
          
          for (const node of nodes) {
            if (node.id === targetId) {
              if (position === 'before') { result.push(newNode, node); inserted = true; }
              else if (position === 'after') { result.push(node, newNode); inserted = true; }
              else if (position === 'child') { result.push({ ...node, children: [...(node.children || []), newNode] }); inserted = true; }
            } else {
              if (node.children && node.children.length > 0) {
                const newChildren = insertTree(node.children);
                if (newChildren !== node.children) inserted = true;
                result.push({ ...node, children: newChildren });
              } else {
                result.push(node);
              }
            }
          }
          return result;
        };
        
        return {
          legislations: state.legislations.map(l => l.id === legId ? { ...l, nodes: insertTree(l.nodes) } : l)
        };
      }),

      removeLawNode: (legId, nodeId) => set(state => {
        const removeTree = (nodes: LawNode[]): LawNode[] => {
          return nodes.filter(n => n.id !== nodeId).map(n => ({
            ...n,
            children: n.children ? removeTree(n.children) : []
          }));
        };
        return {
          legislations: state.legislations.map(l => l.id === legId ? { ...l, nodes: removeTree(l.nodes) } : l)
        };
      }),

      getCurrentLegislation: () => {
        const state = get();
        return state.legislations.find(l => l.id === state.currentLegislationId);
      },

      addPersonalTag: (tag) => set(state => ({
        personalTags: [...state.personalTags, { ...tag, id: crypto.randomUUID() }]
      })),
      updatePersonalTag: (id, updates) => set(state => ({
        personalTags: state.personalTags.map(t => t.id === id ? { ...t, ...updates } : t)
      })),
      deletePersonalTag: (id) => set(state => {
        const newArticleTags = { ...state.articleTags };
        for (const nodeId in newArticleTags) {
          newArticleTags[nodeId] = newArticleTags[nodeId].filter(tId => tId !== id);
          if (newArticleTags[nodeId].length === 0) delete newArticleTags[nodeId];
        }
        return {
          personalTags: state.personalTags.filter(t => t.id !== id),
          articleTags: newArticleTags
        };
      }),
      toggleArticleTag: (nodeId, tagId) => set(state => {
        const tags = state.articleTags[nodeId] || [];
        const newTags = tags.includes(tagId) ? tags.filter(id => id !== tagId) : [...tags, tagId];
        const newArticleTags = { ...state.articleTags, [nodeId]: newTags };
        if (newTags.length === 0) delete newArticleTags[nodeId];
        return { articleTags: newArticleTags };
      }),
      createRetaFinalProject: (project) => set(state => ({
        retaFinalProjects: [...state.retaFinalProjects, {
          ...project,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          studiedArticles: {}
        }]
      })),
      updateRetaFinalProject: (id, updates) => set(state => ({
        retaFinalProjects: state.retaFinalProjects.map(p => p.id === id ? { ...p, ...updates } : p)
      })),
      deleteRetaFinalProject: (id) => set(state => ({
        retaFinalProjects: state.retaFinalProjects.filter(p => p.id !== id),
        activeRetaFinalId: state.activeRetaFinalId === id ? null : state.activeRetaFinalId
      })),
      setActiveRetaFinalId: (id) => set({ activeRetaFinalId: id, currentLegislationId: null, showDashboard: false, showReviewMode: false }),
      toggleRetaFinalArticleStudied: (projectId, nodeId) => set(state => {
        return {
          retaFinalProjects: state.retaFinalProjects.map(p => {
            if (p.id !== projectId) return p;
            const newStudied = { ...p.studiedArticles };
            if (newStudied[nodeId]) {
              delete newStudied[nodeId];
            } else {
              newStudied[nodeId] = Date.now();
            }
            return { ...p, studiedArticles: newStudied };
          })
        };
      }),
      importBackup: (data, mode) => set(state => {
        if (mode === 'replace') {
          return {
            ...state,
            ...data,
            activeRetaFinalId: null,
            currentLegislationId: null
          };
        } else {
          const mergeRecord = (obj1, obj2) => ({ ...obj1, ...(obj2 || {}) });
          const mergeArray = (arr1, arr2) => {
            if (!arr2) return arr1;
            const existingIds = new Set((arr1 || []).map(i => i.id));
            return [...(arr1 || []), ...(arr2.filter(i => !existingIds.has(i.id)))];
          };
          return {
            legislations: mergeArray(state.legislations, data.legislations),
            personalTags: mergeArray(state.personalTags, data.personalTags),
            retaFinalProjects: mergeArray(state.retaFinalProjects, data.retaFinalProjects),
            annotations: mergeRecord(state.annotations, data.annotations),
            highlights: mergeRecord(state.highlights, data.highlights),
            srsTracking: mergeRecord(state.srsTracking, data.srsTracking),
            articleTags: mergeRecord(state.articleTags, data.articleTags),
            studyTime: mergeRecord(state.studyTime, data.studyTime),
          };
        }
      }),
      setAutoBackup: (enabled) => set({ autoBackupEnabled: enabled }),
      updateLastBackupDate: () => set({ lastBackupDate: Date.now() }),
      createSnapshot: (name) => {
        const state = get();
        const snapshotData = JSON.stringify({
          legislations: state.legislations,
          annotations: state.annotations,
          highlights: state.highlights,
          srsTracking: state.srsTracking,
          personalTags: state.personalTags,
          articleTags: state.articleTags,
          retaFinalProjects: state.retaFinalProjects,
          filters: state.filters,
          studyTime: state.studyTime
        });
        set(state => {
          const newSnapshot = {
            id: crypto.randomUUID(),
            name,
            date: Date.now(),
            data: snapshotData
          };
          // limit to max 10 snapshots to save space
          const newSnapshots = [...state.snapshots, newSnapshot];
          if (newSnapshots.length > 10) {
             return { snapshots: newSnapshots.slice(newSnapshots.length - 10) };
          }
          return { snapshots: newSnapshots };
        });
      },
      restoreSnapshot: (id) => set(state => {
        const snapshot = state.snapshots.find(s => s.id === id);
        if (!snapshot) return state;
        const parsed = JSON.parse(snapshot.data);
        return {
          ...state,
          ...parsed,
          activeRetaFinalId: null,
          currentLegislationId: null
        };
      }),
      deleteSnapshot: (id) => set(state => ({
        snapshots: state.snapshots.filter(s => s.id !== id)
      })),
      createLegislation: (title, text, incidences, discipline) => set((state) => {
        const newLeg: Legislation = {
          id: crypto.randomUUID(),
          title,
          discipline,
          nodes: parseLaw(text),
          incidences,
          createdAt: Date.now()
        };
        return {
          legislations: [...state.legislations, newLeg],
          currentLegislationId: newLeg.id,
          showCreateModal: false
        };
      }),

      setCurrentLegislation: (id) => set({ currentLegislationId: id, showDashboard: false, showReviewMode: false, activeRetaFinalId: null }),
      
      deleteLegislation: (id) => set((state) => ({
        legislations: state.legislations.filter(l => l.id !== id),
        currentLegislationId: state.currentLegislationId === id ? null : state.currentLegislationId
      })),
      reorderLegislations: (sourceId, targetId) => set((state) => {
        const legislations = [...state.legislations];
        const sourceIndex = legislations.findIndex(l => l.id === sourceId);
        const targetIndex = legislations.findIndex(l => l.id === targetId);
        if (sourceIndex === -1 || targetIndex === -1) return state;
        const [moved] = legislations.splice(sourceIndex, 1);
        legislations.splice(targetIndex, 0, moved);
        return { legislations };
      }),

      setMetadata: (nodeId, metadata) => set((state) => {
        const updateNode = (nodes: LawNode[]): LawNode[] => {
          return nodes.map(node => {
            if (node.id === nodeId) {
              return { ...node, metadata };
            }
            if (node.children.length > 0) {
              return { ...node, children: updateNode(node.children) };
            }
            return node;
          });
        };
        
        return {
          legislations: state.legislations.map(leg => 
            leg.id === state.currentLegislationId 
              ? { ...leg, nodes: updateNode(leg.nodes) }
              : leg
          )
        };
      }),
      
      toggleNodeProperty: (nodeId, property) => set((state) => {
        const updateNode = (nodes: LawNode[]): LawNode[] => {
          return nodes.map(node => {
            if (node.id === nodeId) {
              return { ...node, [property]: !node[property] };
            }
            if (node.children.length > 0) {
              return { ...node, children: updateNode(node.children) };
            }
            return node;
          });
        };
        return {
          legislations: state.legislations.map(leg => 
            leg.id === state.currentLegislationId 
              ? { ...leg, nodes: updateNode(leg.nodes) }
              : leg
          )
        };
      }),

      addAnnotation: (nodeId, content) => set((state) => {
        const id = crypto.randomUUID();
        const current = state.annotations[nodeId] || [];
        return {
          annotations: {
            ...state.annotations,
            [nodeId]: [...current, { id, nodeId, content, createdAt: Date.now() }]
          }
        };
      }),

      deleteAnnotation: (nodeId, annotationId) => set((state) => {
        const current = state.annotations[nodeId] || [];
        return {
          annotations: {
            ...state.annotations,
            [nodeId]: current.filter(a => a.id !== annotationId)
          }
        };
      }),

      updateAnnotation: (nodeId, annotationId, content) => set((state) => {
        const current = state.annotations[nodeId] || [];
        return {
          annotations: {
            ...state.annotations,
            [nodeId]: current.map(a => a.id === annotationId ? { ...a, content } : a)
          }
        };
      }),

      addHighlight: (nodeId, highlight) => set((state) => {
        const id = crypto.randomUUID();
        const current = state.highlights[nodeId] || [];
        return {
          highlights: {
            ...state.highlights,
            [nodeId]: [...current, { ...highlight, id }]
          }
        };
      }),

      removeHighlight: (nodeId, highlightId) => set((state) => {
        const current = state.highlights[nodeId] || [];
        return {
          highlights: {
            ...state.highlights,
            [nodeId]: current.filter(h => h.id !== highlightId)
          }
        };
      }),

      addHighlightsBatch: (nodeId, newHighlights) => set((state) => {
        const current = state.highlights[nodeId] || [];
        const toAdd = newHighlights.map(h => ({ ...h, id: crypto.randomUUID() }));
        return {
          highlights: {
            ...state.highlights,
            [nodeId]: [...current, ...toAdd]
          }
        };
      }),

      clearOverlappingHighlights: (nodeId, start, end) => set((state) => {
        const current = state.highlights[nodeId] || [];
        return {
          highlights: {
            ...state.highlights,
            [nodeId]: current.filter(h => {
              if (h.startOffset === undefined || h.endOffset === undefined) return true;
              const overlaps = h.startOffset < end && h.endOffset > start;
              return !overlaps;
            })
          }
        };
      }),

      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
      })),

      
      toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      toggleToc: (id) => set((state) => ({ expandedTocs: { ...state.expandedTocs, [id]: !state.expandedTocs[id] } })),
      toggleRetaFinalMode: () => set((state) => ({ retaFinalMode: !state.retaFinalMode })),
      toggleTask: (id) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
      })),




      
      toggleRightPanel: (nodeId) => set((state) => ({
        rightPanelOpen: nodeId ? true : !state.rightPanelOpen,
        activeNodeId: nodeId || state.activeNodeId
      })),
      
      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
      
      setShowCreateModal: (show) => set({ showCreateModal: show }),
      setShowReviewMode: (show) => set({ showReviewMode: show, showDashboard: false, activeRetaFinalId: null }),
      setShowDashboard: (show) => set({ showDashboard: show, showReviewMode: false, activeRetaFinalId: null }),
      incrementStudyTime: (seconds) => set((state) => {
        const today = new Date().toISOString().split("T")[0];
        return {
          studyTime: { ...state.studyTime, [today]: (state.studyTime[today] || 0) + seconds }
        };
      }),

      addToSRS: (nodeId) => set((state) => {
        if (state.srsTracking[nodeId]) return state; // already tracking
        return {
          srsTracking: {
            ...state.srsTracking,
            [nodeId]: {
              easeFactor: 2.5,
              interval: 0,
              repetitions: 0,
              nextReviewDate: Date.now(), // due immediately
              history: []
            }
          }
        };
      }),

      removeFromSRS: (nodeId) => set((state) => {
        const newSrs = { ...state.srsTracking };
        delete newSrs[nodeId];
        return { srsTracking: newSrs };
      }),

      processSRSReview: (nodeId, quality) => set((state) => {
        const current = state.srsTracking[nodeId];
        if (!current) return state;

        const { newRepetitions, newInterval, newEaseFactor } = calculateSM2(
          quality,
          current.repetitions,
          current.easeFactor,
          current.interval
        );

        const nextReviewDate = Date.now() + newInterval * 24 * 60 * 60 * 1000;

        return {
          srsTracking: {
            ...state.srsTracking,
            [nodeId]: {
              easeFactor: newEaseFactor,
              interval: newInterval,
              repetitions: newRepetitions,
              nextReviewDate,
              history: [...current.history, { date: Date.now(), quality }]
            }
          }
        };
      })
    }),
    {
      name: 'smart-vade-storage',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version < 1 && persistedState && persistedState.legislations) {
          persistedState.legislations = persistedState.legislations.map((leg: any) => ({
            ...leg,
            nodes: migrateExistingNodes(leg.nodes)
          }));
        }
        return persistedState;
      },
      partialize: (state) => ({
        legislations: state.legislations,
        currentLegislationId: state.currentLegislationId,
        annotations: state.annotations,
        highlights: state.highlights,
        srsTracking: state.srsTracking,
        filters: state.filters,
        expandedTocs: state.expandedTocs,
        tasks: state.tasks,
        
        personalTags: state.personalTags,
        articleTags: state.articleTags,
        retaFinalProjects: state.retaFinalProjects,
        activeRetaFinalId: state.activeRetaFinalId,
        retaFinalMode: state.retaFinalMode,
        sidebarCollapsed: state.sidebarCollapsed,
        
        autoBackupEnabled: state.autoBackupEnabled,
        snapshots: state.snapshots,
        lastBackupDate: state.lastBackupDate,
        studyTime: state.studyTime
      }),
      storage: createJSONStorage(() => idbStorage)
    }
  )
);
