import { LawNode, LawNodeType } from '../types';

const ROMAN = '[IVXLCDM]+';
const ARTICLE_REGEX = /^Art\.\s*\d+[A-Za-zº°]*(?:[-‑–][A-Za-z0-9]+)?/i;
const PARAGRAPH_REGEX = /^(§\s*\d+[A-Za-zº°]*(?:[-‑–][A-Za-z0-9]+)?|Parágrafo\s+único)/i;
const INCISO_REGEX = new RegExp(`^${ROMAN}\\s*[-–]`, 'i');
const ALINEA_REGEX = /^[a-z]\)/i;

function createNode(type: LawNodeType, label: string, text: string): LawNode {
  return {
    id: crypto.randomUUID(),
    type,
    label,
    text,
    children: []
  };
}

function appendNode(parent: LawNode | null, roots: LawNode[], node: LawNode) {
  if (parent) parent.children.push(node);
  else roots.push(node);
}

function getHeadingLabel(line: string, prefix: string) {
  const match = line.match(new RegExp(`^${prefix}\\s+${ROMAN}`, 'i'));
  return match ? match[0] : line;
}

/**
 * Parses raw Brazilian legal text into a navigable tree while keeping the original line text intact.
 */
export function parseLaw(text: string): LawNode[] {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const nodes: LawNode[] = [];
  
  let currentLivro: LawNode | null = null;
  let currentTitle: LawNode | null = null;
  let currentChapter: LawNode | null = null;
  let currentSection: LawNode | null = null;
  let currentSubsection: LawNode | null = null;
  let currentArticle: LawNode | null = null;
  let currentParagraph: LawNode | null = null;
  let currentInciso: LawNode | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (new RegExp(`^LIVRO\\s+${ROMAN}`, 'i').test(trimmed)) {
      const node = createNode('livro', getHeadingLabel(trimmed, 'LIVRO'), line);
      nodes.push(node);
      currentLivro = node;
      currentTitle = null;
      currentChapter = null;
      currentSection = null;
      currentSubsection = null;
      currentArticle = null;
      currentParagraph = null;
      currentInciso = null;
    }
    else if (new RegExp(`^TÍTULO\\s+${ROMAN}`, 'i').test(trimmed)) {
      const node = createNode('titulo', getHeadingLabel(trimmed, 'TÍTULO'), line);
      appendNode(currentLivro, nodes, node);
      currentTitle = node;
      currentChapter = null;
      currentSection = null;
      currentSubsection = null;
      currentArticle = null;
      currentParagraph = null;
      currentInciso = null;
    } 
    else if (new RegExp(`^CAPÍTULO\\s+${ROMAN}`, 'i').test(trimmed)) {
      const node = createNode('capitulo', getHeadingLabel(trimmed, 'CAPÍTULO'), line);
      appendNode(currentTitle || currentLivro, nodes, node);
      currentChapter = node;
      currentSection = null;
      currentSubsection = null;
      currentArticle = null;
      currentParagraph = null;
      currentInciso = null;
    }
    else if (new RegExp(`^SEÇÃO\\s+${ROMAN}`, 'i').test(trimmed)) {
      const node = createNode('secao', getHeadingLabel(trimmed, 'SEÇÃO'), line);
      appendNode(currentChapter || currentTitle || currentLivro, nodes, node);
      currentSection = node;
      currentSubsection = null;
      currentArticle = null;
      currentParagraph = null;
      currentInciso = null;
    }
    else if (new RegExp(`^SUBSEÇÃO\\s+${ROMAN}`, 'i').test(trimmed)) {
      const node = createNode('subsecao', getHeadingLabel(trimmed, 'SUBSEÇÃO'), line);
      appendNode(currentSection || currentChapter || currentTitle || currentLivro, nodes, node);
      currentSubsection = node;
      currentArticle = null;
      currentParagraph = null;
      currentInciso = null;
    }
    else if (ARTICLE_REGEX.test(trimmed)) {
      const articleMatch = trimmed.match(ARTICLE_REGEX);
      const node = createNode('artigo', articleMatch ? articleMatch[0] : 'Art.', line);
      appendNode(currentSubsection || currentSection || currentChapter || currentTitle || currentLivro, nodes, node);
      currentArticle = node;
      currentParagraph = null;
      currentInciso = null;
    }
    else if (PARAGRAPH_REGEX.test(trimmed)) {
      const match = trimmed.match(PARAGRAPH_REGEX);
      const node = createNode('paragrafo', match ? match[0] : '§', line);
      appendNode(currentArticle, nodes, node);
      currentParagraph = node;
      currentInciso = null;
    }
    else if (INCISO_REGEX.test(trimmed)) {
      const match = trimmed.match(INCISO_REGEX);
      const node = createNode('inciso', match ? match[0].replace(/[-–]/, '').trim() : 'Inciso', line);
      appendNode(currentParagraph || currentArticle, nodes, node);
      currentInciso = node;
    }
    else if (ALINEA_REGEX.test(trimmed)) {
      const match = trimmed.match(ALINEA_REGEX);
      const node = createNode('alinea', match ? match[0] : 'Alinea', line);
      appendNode(currentInciso || currentParagraph || currentArticle, nodes, node);
    }
    else {
      const node = createNode('texto_puro', '', line);
      appendNode(currentInciso || currentParagraph || currentArticle || currentSubsection || currentSection || currentChapter || currentTitle || currentLivro, nodes, node);
    }
  }
  return nodes;
}
