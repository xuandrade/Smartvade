import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LawNode, UserAnnotation, Highlight, Legislation, IncidenceMap, AppFilters, ExamBoard, SRSData } from '../types';
import { parseLaw } from '../lib/parser';

import { calculateSM2 } from '../lib/srs';

interface AppState {
  // Data
  legislations: Legislation[];
  currentLegislationId: string | null;
  annotations: Record<string, UserAnnotation[]>;
  highlights: Record<string, Highlight[]>;
  srsTracking: Record<string, SRSData>;
  
  // UI State
  filters: AppFilters;
  focusMode: boolean;
  rightPanelOpen: boolean;
  activeNodeId: string | null;
  mobileMenuOpen: boolean;
  showCreateModal: boolean;
  showReviewMode: boolean;

  // Computed / Accessors
  getCurrentLegislation: () => Legislation | undefined;

  // Actions
  createLegislation: (title: string, text: string, incidences: IncidenceMap) => void;
  setCurrentLegislation: (id: string) => void;
  deleteLegislation: (id: string) => void;
  setMetadata: (nodeId: string, metadata: any) => void;
  
  addAnnotation: (nodeId: string, content: string) => void;
  deleteAnnotation: (nodeId: string, annotationId: string) => void;
  updateAnnotation: (nodeId: string, annotationId: string, content: string) => void;
  
  addHighlight: (nodeId: string, highlight: Omit<Highlight, 'id'>) => void;
  removeHighlight: (nodeId: string, highlightId: string) => void;
  addHighlightsBatch: (nodeId: string, highlights: Omit<Highlight, 'id'>[]) => void;
  
  setFilters: (filters: Partial<AppFilters>) => void;
  toggleFocusMode: () => void;
  toggleRightPanel: (nodeId?: string) => void;
  toggleMobileMenu: () => void;
  setShowCreateModal: (show: boolean) => void;
  setShowReviewMode: (show: boolean) => void;
  
  // Node interaction actions
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
      
      filters: defaultFilters,
      focusMode: false,
      rightPanelOpen: false,
      activeNodeId: null,
      mobileMenuOpen: false,
      showCreateModal: false,
      showReviewMode: false,

      getCurrentLegislation: () => {
        const state = get();
        return state.legislations.find(l => l.id === state.currentLegislationId);
      },

      createLegislation: (title, text, incidences) => set((state) => {
        const newLeg: Legislation = {
          id: crypto.randomUUID(),
          title,
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

      setCurrentLegislation: (id) => set({ currentLegislationId: id }),
      
      deleteLegislation: (id) => set((state) => ({
        legislations: state.legislations.filter(l => l.id !== id),
        currentLegislationId: state.currentLegislationId === id ? null : state.currentLegislationId
      })),

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

      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
      })),

      toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
      
      toggleRightPanel: (nodeId) => set((state) => ({
        rightPanelOpen: nodeId ? true : !state.rightPanelOpen,
        activeNodeId: nodeId || state.activeNodeId
      })),
      
      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
      
      setShowCreateModal: (show) => set({ showCreateModal: show }),
      setShowReviewMode: (show) => set({ showReviewMode: show }),

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
      partialize: (state) => ({
        legislations: state.legislations,
        currentLegislationId: state.currentLegislationId,
        annotations: state.annotations,
        highlights: state.highlights,
        srsTracking: state.srsTracking,
        filters: state.filters
      }),
    }
  )
);
