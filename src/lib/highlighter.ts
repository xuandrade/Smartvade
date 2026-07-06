interface TextSegment {
  text: string;
  classes: string[];
  emoji?: string;
}

const DEFENSORIA_REGEX = /\b(Defensoria Pública)\b/gi;
const NEGATIVE_REGEX = /\b(não poderá|não poderão|não|salvo|vedado|vedada|proibido|proibida|exceto|ressalvado|ressalvada|apenas|somente)\b/gi;
const DEADLINE_REGEX = /\b(\d+\s*(dias|meses|anos|horas)|um terço|dois terços|metade|metades|três quartos)\b/gi;
const DISPOSITIVO_REGEX = /^(Art\.\s*\d+[a-zº]*|§\s*\d+[a-zº]*|Parágrafo único|[IVXLCDM]+\s*-|[a-z]\))/i;

export interface UserHighlightDef {
  textStr: string;
  color: string;
}

export function processHighlights(
  text: string, 
  aiVerbs: string[] = [], 
  aiKeywords: string[] = [],
  userHighlights: UserHighlightDef[] = []
): TextSegment[] {
  const segments: TextSegment[] = [];
  const matches: { start: number; end: number; type: string; color?: string }[] = [];
  
  let match;
  
  while ((match = DEFENSORIA_REGEX.exec(text)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length, type: 'defensoria' });
  }

  while ((match = NEGATIVE_REGEX.exec(text)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length, type: 'negative' });
  }

  while ((match = DEADLINE_REGEX.exec(text)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length, type: 'deadline' });
  }

  if ((match = DISPOSITIVO_REGEX.exec(text)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length, type: 'dispositivo' });
  }

  // AI Verbs
  for (const verb of aiVerbs) {
    if (!verb.trim()) continue;
    const regex = new RegExp(`\\b(${verb})\\b`, 'gi');
    while ((match = regex.exec(text)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length, type: 'ai_verb' });
    }
  }

  // AI Keywords
  for (const kw of aiKeywords) {
    if (!kw.trim()) continue;
    const regex = new RegExp(`\\b(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
    while ((match = regex.exec(text)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length, type: 'ai_keyword' });
    }
  }

  // User Highlights
  for (const uh of userHighlights) {
    if (!uh.textStr.trim()) continue;
    // exact substring match
    let startPos = 0;
    while ((startPos = text.indexOf(uh.textStr, startPos)) !== -1) {
       matches.push({ start: startPos, end: startPos + uh.textStr.length, type: 'user_highlight', color: uh.color });
       startPos += uh.textStr.length;
    }
  }
  
  matches.sort((a, b) => a.start - b.start);
  
  const merged: typeof matches = [];
  for (const m of matches) {
    if (merged.length === 0) {
      merged.push(m);
    } else {
      const last = merged[merged.length - 1];
      if (m.start < last.end) {
        last.end = Math.max(last.end, m.end);
      } else {
        merged.push(m);
      }
    }
  }
  
  let lastIndex = 0;
  for (const m of merged) {
    if (m.start > lastIndex) {
      segments.push({ text: text.substring(lastIndex, m.start), classes: [] });
    }
    
    let colorClass = '';
    let emoji = '';
    let processedText = text.substring(m.start, m.end);

    if (m.type === 'defensoria') {
       colorClass = 'bg-[#D4EFDF] text-[#196F3D] font-bold rounded px-1';
       emoji = ' 💚';
    } else if (m.type === 'negative') {
       colorClass = 'bg-[#FADBD8] text-[#C0392B] font-semibold rounded px-1';
    } else if (m.type === 'deadline') {
       colorClass = 'text-lg font-bold bg-[#FCF3CF] text-[#D35400] rounded px-1';
    } else if (m.type === 'dispositivo') {
       colorClass = 'font-bold text-slate-900';
    } else if (m.type === 'ai_verb') {
       colorClass = 'text-[#E26E86] font-bold uppercase';
       processedText = processedText.toUpperCase();
    } else if (m.type === 'ai_keyword') {
       colorClass = 'font-bold underline decoration-indigo-200 underline-offset-4';
    } else if (m.type === 'user_highlight') {
       if (m.color === 'yellow') colorClass = 'bg-yellow-200 text-yellow-900 rounded px-1';
       else if (m.color === 'green') colorClass = 'bg-green-200 text-green-900 rounded px-1';
       else if (m.color === 'pink') colorClass = 'bg-pink-200 text-pink-900 rounded px-1';
       else if (m.color === 'blue') colorClass = 'bg-blue-200 text-blue-900 rounded px-1';
       else if (m.color === 'bold') colorClass = 'font-bold text-slate-900';
       else if (m.color === 'underline') colorClass = 'underline decoration-2 underline-offset-2';
    }
    
    segments.push({
      text: processedText,
      classes: [colorClass],
      emoji
    });
    
    lastIndex = m.end;
  }
  
  if (lastIndex < text.length) {
    segments.push({ text: text.substring(lastIndex), classes: [] });
  }
  
  return segments;
}
