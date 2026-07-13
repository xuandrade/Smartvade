import { LawNode, LawNodeType } from '../types';

function extractLegislativeUpdate(text: string) {
  const match = text.match(/\((Incluíd[ao]|Redação dada|Revogad[ao]|Vide).*?(Lei|Emenda Constitucional|Decreto|EC)[^\d]*([\d.]+).*?(?:de\s*)?(\d{4})\)/i);
  if (match) {
    let type = match[1].toLowerCase();
    if (type.startsWith('incluíd')) type = 'inclusão';
    else if (type.startsWith('revogad')) type = 'revogação';
    else if (type === 'redação dada') type = 'alteração de texto';
    
    return {
      type,
      normType: match[2],
      law: match[3],
      year: parseInt(match[4], 10),
      isLegislativeUpdate: true
    };
  }
  return undefined;
}

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
  
  let pendingHeading: { id: string; text: string } | null = null;

  const flushPendingHeading = () => {
    if (pendingHeading) {
      const node: LawNode = {
        id: pendingHeading.id,
        type: 'texto_puro',
        label: '',
        text: pendingHeading.text,
        legislativeUpdate: extractLegislativeUpdate(pendingHeading.text),
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
      pendingHeading = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Livro
    if (/^LIVRO\s+[IVXLCDM]+/i.test(trimmed)) {
      flushPendingHeading();
      const node: LawNode = {
        id: crypto.randomUUID(),
        type: 'livro',
        label: trimmed, // keep full title
        text: line,
        legislativeUpdate: extractLegislativeUpdate(line),
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
      flushPendingHeading();
      const node: LawNode = {
        id: crypto.randomUUID(),
        type: 'titulo',
        label: trimmed,
        text: line,
        legislativeUpdate: extractLegislativeUpdate(line),
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
      flushPendingHeading();
      const node: LawNode = {
        id: crypto.randomUUID(),
        type: 'capitulo',
        label: trimmed,
        text: line,
        legislativeUpdate: extractLegislativeUpdate(line),
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
        legislativeUpdate: extractLegislativeUpdate(line),
        children: []
      };

      if (pendingHeading) {
        node.heading = pendingHeading.text;
        pendingHeading = null;
      }
      
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
        legislativeUpdate: extractLegislativeUpdate(line),
        children: []
      };

      if (pendingHeading) {
        node.heading = pendingHeading.text;
        pendingHeading = null;
      }

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
        legislativeUpdate: extractLegislativeUpdate(line),
        children: []
      };

      if (pendingHeading) {
        node.heading = pendingHeading.text;
        pendingHeading = null;
      }

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
        legislativeUpdate: extractLegislativeUpdate(line),
        children: []
      };

      if (pendingHeading) {
        node.heading = pendingHeading.text;
        pendingHeading = null;
      }

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
    else if (/^Pena\s*[:-]/i.test(trimmed)) {
      // Pena is a typical consequence text, flush heading and treat as pure text
      flushPendingHeading();
      const node: LawNode = {
        id: crypto.randomUUID(),
        type: 'texto_puro',
        label: '',
        text: line,
        legislativeUpdate: extractLegislativeUpdate(line),
        children: []
      };
      if (currentArticle) { 
         currentArticle.children.push(node);
      } else {
         nodes.push(node);
      }
    }
    else {
      // Pure text block (potential heading or generic text)
      flushPendingHeading();
      pendingHeading = {
        id: crypto.randomUUID(),
        text: line
      };
    }
  }
  
  // Flush any remaining heading at the end
  flushPendingHeading();
  
  return nodes;
}

export function migrateExistingNodes(nodes: LawNode[]): LawNode[] {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    
    // First, recursively migrate children
    if (node.children && node.children.length > 0) {
      node.children = migrateExistingNodes(node.children);
    }
    
    // Check if we can move a trailing pure text child to the next sibling's heading
    if (node.children && node.children.length > 0) {
      const lastChild = node.children[node.children.length - 1];
      const nextSibling = nodes[i + 1];
      
      if (
        lastChild && 
        lastChild.type === 'texto_puro' && 
        !/^Pena\s*[:-]/i.test(lastChild.text) &&
        nextSibling && 
        ['artigo', 'paragrafo', 'inciso', 'alinea'].includes(nextSibling.type) &&
        !nextSibling.heading
      ) {
        // Move it!
        nextSibling.heading = lastChild.text;
        node.children.pop(); // remove it from parent's children
      }
    }
  }
  return nodes;
}
