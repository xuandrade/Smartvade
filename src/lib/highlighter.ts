export interface UserHighlightDef {
  textStr: string;
  startOffset?: number;
  endOffset?: number;
  color: string;
}

export interface TextSegment {
  text: string;
  classes: string[];
  style?: Record<string, string>;
  emoji?: string;
}

const DEFENSORIA_REGEX = /\b(Defensoria Pública)\b/gi;
const NEGATIVE_REGEX = /\b(não poderá|não poderão|não|salvo|vedado|vedada|proibido|proibida|exceto|ressalvado|ressalvada|apenas|somente)\b/gi;
const DEADLINE_REGEX = /\b(\d+\s*(dias|meses|anos|horas)|um terço|dois terços|metade|metades|três quartos)\b/gi;
const DISPOSITIVO_REGEX = /^(Art\.\s*\d+[a-zº]*|§\s*\d+[a-zº]*|Parágrafo único|[IVXLCDM]+\s*-|[a-z]\))/i;

export function processHighlights(
  text: string, 
  aiVerbs: string[] = [], 
  aiKeywords: string[] = [],
  userHighlights: UserHighlightDef[] = []
): TextSegment[] {
  // We represent each character's formatting, including custom styles
  const charFmts: { classes: Set<string>, styles: Record<string, string>, text: string, emoji?: string }[] = Array.from(text).map(c => ({ 
    classes: new Set<string>(), 
    styles: {}, 
    text: c 
  }));

  const applyFmt = (
    start: number, 
    end: number, 
    cssClass: string, 
    isUppercase: boolean = false, 
    emoji?: string, 
    customStyle?: Record<string, string>
  ) => {
    for (let i = start; i < end; i++) {
      if (i >= charFmts.length) break;
      if (cssClass) charFmts[i].classes.add(cssClass);
      if (customStyle) {
        Object.assign(charFmts[i].styles, customStyle);
      }
      if (isUppercase) charFmts[i].text = charFmts[i].text.toUpperCase();
      if (emoji && i === end - 1) charFmts[i].emoji = emoji;
    }
  };

  let match;
  
  while ((match = DEFENSORIA_REGEX.exec(text)) !== null) {
    applyFmt(match.index, match.index + match[0].length, 'bg-[#D4EFDF] text-[#196F3D] font-bold rounded px-1', false, ' 💚');
  }

  while ((match = NEGATIVE_REGEX.exec(text)) !== null) {
    applyFmt(match.index, match.index + match[0].length, 'bg-[#FADBD8] text-[#C0392B] font-semibold rounded px-1');
  }

  while ((match = DEADLINE_REGEX.exec(text)) !== null) {
    applyFmt(match.index, match.index + match[0].length, 'text-lg font-bold bg-[#FCF3CF] text-[#D35400] rounded px-1');
  }

  if ((match = DISPOSITIVO_REGEX.exec(text)) !== null) {
    applyFmt(match.index, match.index + match[0].length, 'font-bold text-slate-900');
  }

  for (const verb of aiVerbs) {
    if (!verb.trim()) continue;
    const escapedVerb = verb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b(${escapedVerb})\\b`, 'gi');
    while ((match = regex.exec(text)) !== null) {
      applyFmt(match.index, match.index + match[0].length, 'text-[#E26E86] font-bold uppercase', true);
    }
  }

  for (const kw of aiKeywords) {
    if (!kw.trim()) continue;
    const regex = new RegExp(`\\b(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
    while ((match = regex.exec(text)) !== null) {
      applyFmt(match.index, match.index + match[0].length, 'font-bold underline decoration-indigo-200 underline-offset-4');
    }
  }

  const getColorClassAndStyle = (color: string): { className: string; style?: Record<string, string> } => {
    if (color === 'yellow') return { className: 'bg-yellow-200 text-yellow-900 rounded px-1' };
    if (color === 'green') return { className: 'bg-teal-200 text-teal-900 rounded px-1' };
    if (color === 'pink') return { className: 'bg-pink-200 text-pink-900 rounded px-1' };
    if (color === 'blue') return { className: 'bg-sky-200 text-sky-900 rounded px-1' };
    if (color === 'red') return { className: 'bg-red-200 text-red-900 rounded px-1' };
    if (color === 'purple') return { className: 'bg-purple-200 text-purple-900 rounded px-1' };
    if (color === 'orange') return { className: 'bg-orange-200 text-orange-900 rounded px-1' };
    if (color === 'bold') return { className: 'font-bold text-slate-900' };
    if (color === 'italic') return { className: 'italic' };
    if (color === 'underline') return { className: 'underline decoration-2 underline-offset-2' };
    if (color === 'strike') return { className: 'line-through text-stone-500' };
    if (color === 'deadline') return { className: 'bg-orange-500 text-white font-bold px-1 rounded shadow-sm' };
    
    // Custom highlights
    if (color.startsWith('bg:')) {
      return { 
        className: 'rounded px-1 text-slate-900', 
        style: { backgroundColor: color.slice(3) } 
      };
    }
    if (color.startsWith('text:')) {
      return { 
        className: 'font-semibold', 
        style: { color: color.slice(5) } 
      };
    }

    if (color.startsWith('text-')) return { className: color };
    if (color.startsWith('text-size-')) return { className: color };
    
    return { className: '' };
  };

  for (const uh of userHighlights) {
    const { className, style } = getColorClassAndStyle(uh.color);
    if (uh.startOffset !== undefined && uh.endOffset !== undefined) {
      applyFmt(uh.startOffset, uh.endOffset, className, false, undefined, style);
    } else {
      if (!uh.textStr || !uh.textStr.trim()) continue;
      let startPos = 0;
      while ((startPos = text.indexOf(uh.textStr, startPos)) !== -1) { 
        applyFmt(startPos, startPos + uh.textStr.length, className, false, undefined, style);
        startPos += uh.textStr.length;
      }
    }
  }

  // Convert char arrays back to segments
  const segments: TextSegment[] = [];
  if (charFmts.length === 0) return segments;

  let currentText = charFmts[0].text;
  let currentClasses = Array.from(charFmts[0].classes).sort().join(' ');
  let currentStyles = JSON.stringify(charFmts[0].styles);
  let currentEmoji = charFmts[0].emoji || '';

  for (let i = 1; i < charFmts.length; i++) {
    const c = charFmts[i];
    const cClasses = Array.from(c.classes).sort().join(' ');
    const cStyles = JSON.stringify(c.styles);
    
    // Break segment if classes or styles change, or if the previous char had an emoji
    if (cClasses !== currentClasses || cStyles !== currentStyles || currentEmoji) {
      segments.push({
        text: currentText,
        classes: currentClasses.split(' ').filter(Boolean),
        style: JSON.parse(currentStyles),
        emoji: currentEmoji
      });
      currentText = c.text;
      currentClasses = cClasses;
      currentStyles = cStyles;
      currentEmoji = c.emoji || '';
    } else {
      currentText += c.text;
      if (c.emoji) currentEmoji = c.emoji;
    }
  }

  segments.push({
    text: currentText,
    classes: currentClasses.split(' ').filter(Boolean),
    style: JSON.parse(currentStyles),
    emoji: currentEmoji
  });

  return segments;
}
