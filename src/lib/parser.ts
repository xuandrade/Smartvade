import { LawNode, LawNodeType } from '../types';

/**
 * A simplified Regex-based parser to break raw law text into an AST (Abstract Syntax Tree).
 * This maintains 100% fidelity to the original text while allowing structured navigation.
 */
export function parseLaw(text: string): LawNode[] {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const nodes: LawNode[] = [];
  
  let currentLivro: LawNode | null = null;
  let currentTitle: LawNode | null = null;
  let currentChapter: LawNode | null = null;
  let currentArticle: LawNode | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Livro
    if (/^LIVRO\s+[IVXLCDM]+/i.test(trimmed)) {
      const node: LawNode = {
        id: crypto.randomUUID(),
        type: 'livro',
        label: trimmed, // keep full title
        text: line,
        children: []
      };
      nodes.push(node);
      currentLivro = node;
      currentTitle = null;
      currentChapter = null;
      currentArticle = null;
    }
    // Título
    else if (/^TÍTULO\s+[IVXLCDM]+/i.test(trimmed)) {
      const node: LawNode = {
        id: crypto.randomUUID(),
        type: 'titulo',
        label: trimmed,
        text: line,
        children: []
      };
      if (currentLivro) {
        currentLivro.children.push(node);
      } else {
        nodes.push(node);
      }
      currentTitle = node;
      currentChapter = null;
      currentArticle = null;
    } 
    // Capítulo
    else if (/^CAPÍTULO\s+[IVXLCDM]+/i.test(trimmed)) {
      const node: LawNode = {
        id: crypto.randomUUID(),
        type: 'capitulo',
        label: trimmed,
        text: line,
        children: []
      };
      if (currentTitle) {
        currentTitle.children.push(node);
      } else if (currentLivro) {
        currentLivro.children.push(node);
      } else {
        nodes.push(node);
      }
      currentChapter = node;
      currentArticle = null;
    }
    // Article detection
    else if (/^Art\.\s+\d+[a-zº]*/.test(trimmed)) {
      const articleMatch = trimmed.match(/^Art\.\s+\d+[a-zº]*/);
      
      const node: LawNode = {
        id: crypto.randomUUID(),
        type: 'artigo',
        label: articleMatch ? articleMatch[0] : 'Art.',
        text: line,
        children: []
      };
      
      if (currentChapter) {
        currentChapter.children.push(node);
      } else if (currentTitle) {
        currentTitle.children.push(node);
      } else if (currentLivro) {
        currentLivro.children.push(node);
      } else {
        nodes.push(node);
      }
      currentArticle = node;
    }
    // Paragrafos, Incisos, Alineas
    else if (/^(§\s*\d+[a-zº]*|Parágrafo único)/i.test(trimmed)) {
      const match = trimmed.match(/^(§\s*\d+[a-zº]*|Parágrafo único)/i);
      const node: LawNode = {
        id: crypto.randomUUID(),
        type: 'paragrafo',
        label: match ? match[0] : '§',
        text: line,
        children: []
      };
      if (currentArticle) currentArticle.children.push(node);
      else nodes.push(node); // Handle detached paragraphs gracefully
    }
    else if (/^[IVXLCDM]+\s*-/.test(trimmed)) {
      const match = trimmed.match(/^[IVXLCDM]+\s*-/);
      const node: LawNode = {
        id: crypto.randomUUID(),
        type: 'inciso',
        label: match ? match[0].replace('-', '').trim() : 'Inciso',
        text: line,
        children: []
      };
      if (currentArticle) currentArticle.children.push(node);
      else nodes.push(node);
    }
    else if (/^[a-z]\)/.test(trimmed)) {
      const match = trimmed.match(/^[a-z]\)/);
      const node: LawNode = {
        id: crypto.randomUUID(),
        type: 'alinea',
        label: match ? match[0] : 'Alinea',
        text: line,
        children: []
      };
      if (currentArticle) {
        // Find last inciso to attach to, or attach to article
        const lastChild = currentArticle.children[currentArticle.children.length - 1];
        if (lastChild && lastChild.type === 'inciso') {
          lastChild.children.push(node);
        } else {
          currentArticle.children.push(node);
        }
      }
      else nodes.push(node);
    }
    else {
      // Pure text block
      const node: LawNode = {
        id: crypto.randomUUID(),
        type: 'texto_puro',
        label: '',
        text: line,
        children: []
      };
      if (currentArticle) { 
         currentArticle.children.push(node);
      } else if (currentChapter) { 
         currentChapter.children.push(node);
      } else if (currentTitle) { 
         currentTitle.children.push(node);
      } else if (currentLivro) {
         currentLivro.children.push(node);
      } else { 
         nodes.push(node);
      }
    }
  }
  return nodes;
}
