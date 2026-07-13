export interface MindMapNode {
  name: string;
  children?: MindMapNode[];
}

export interface AIExtraction {
  termo_nucleo?: string;
  nome_crime?: string;
  principio?: string;
  novidade_legislativa?: boolean;
  palavras_chave?: string[];
  verbos_nucleares?: string[];
  alertas_fgv?: string;
  mapa_mental?: MindMapNode;
}

export type LawNodeType = 'livro' | 'titulo' | 'capitulo' | 'secao' | 'subsecao' | 'artigo' | 'paragrafo' | 'inciso' | 'alinea' | 'texto_puro';

export interface LawNode {
  id: string;
  type: LawNodeType;
  label: string; // e.g., "Art. 1º", "§ 1º"
  text: string;  // The full text of the node
  children: LawNode[];
  metadata?: AIExtraction;
  heading?: string;
  
  isRead?: boolean;
  isFavorite?: boolean;
  needsReview?: boolean; // legacy
  _isHiddenInRetaFinal?: boolean;
  
  legislativeUpdate?: {
    type: string;
    normType?: string;
    law: string;
    year: number;
    isLegislativeUpdate: boolean;
  };
}

export interface SRSHistory {
  date: number;
  quality: number;
}

export interface SRSData {
  easeFactor: number;
  interval: number; // in days
  repetitions: number;
  nextReviewDate: number; // timestamp
  history: SRSHistory[];
}

export interface UserAnnotation {
  id: string;
  nodeId: string;
  content: string;
  createdAt: number;
}

export interface Highlight {
  id: string;
  nodeId: string;
  textStr: string;
  startOffset?: number;
  endOffset?: number;
  color: string;
}

export type ExamBoard = 'FGV' | 'FCC' | 'CEBRASPE' | 'PRÓPRIA';



export type IncidenceMap = Record<ExamBoard, Record<string, number>>;

export interface Legislation {
  id: string;
  title: string;
  discipline?: string;
  nodes: LawNode[];
  incidences: IncidenceMap;
  createdAt: number;
}

export interface AppFilters {
  searchQuery: string;
  minIncidence: number;
  board: ExamBoard | 'ALL';
  showFavorites: boolean;
  showNeedsReview: boolean;
  showRead: boolean | 'ALL'; // true = only read, false = only unread, ALL = both
  colorCodeConfig: string;
  tagFilter?: string | 'NONE' | 'MULTIPLE' | 'ALL';
}


export interface StudyTask {
  id: string;
  title: string;
  completed: boolean;
  date: string;
}

export interface AIRule {
  id: string;
  name: string;
  color: string; // e.g. "red", "yellow", "blue", "pink", "green", "bold", "underline"
  prompt: string;
}

export interface PersonalTag {
  id: string;
  name: string;
  color: string;
}

export interface RetaFinalSettings {
  examName: string;
  examDate: string; // YYYY-MM-DD
  studyHoursPerDay: number;
  studyDaysOfWeek: number[]; // 0 = Sunday, etc.
  disciplineWeights: Record<string, number>;
  coverageLevel: number; // 100, 90, 80, 70, 60
  strategy: {
    prioritizeIncidence: boolean;
    prioritizeNews: boolean;
    prioritizeFavorites: boolean;
    prioritizeCostBenefit: boolean;
  };
  bonusConfig: {
    favoriteBonus: number;
    legislativeBonus: number;
  };
}

export interface PriorityScore {
  historicalIncidence: number;
  disciplineWeight: number;
  lawCostBenefit: number;
  favoriteBonus: number;
  legislativeBonus: number;
  finalScore: number;
}

export interface StudyBlock {
  id: string;
  discipline: string;
  lawId: string;
  lawTitle: string;
  hierarchy: string[]; // ['Livro I', 'Título II', 'Capítulo III']
  articles: LawNode[]; // The articles within this block
  priorityScore: number;
  estimatedTime: number; // in minutes
}


export interface RetaFinalProject {
  id: string;
  name: string;
  settings: RetaFinalSettings;
  blocks: StudyBlock[];
  createdAt: number;
  studiedArticles: Record<string, number>; // nodeId -> timestamp
}
