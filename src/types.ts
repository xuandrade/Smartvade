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
  
  isRead?: boolean;
  isFavorite?: boolean;
  needsReview?: boolean; // legacy
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
  color: 'yellow' | 'green' | 'pink' | 'blue' | 'bold' | 'underline';
}

export type ExamBoard = 'FGV' | 'FCC' | 'CEBRASPE' | 'PRÓPRIA';

export type IncidenceMap = Record<ExamBoard, Record<string, number>>;

export interface Legislation {
  id: string;
  title: string;
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
}

