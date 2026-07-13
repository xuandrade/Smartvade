import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Palette, Bold, Underline, Highlighter, Type, MousePointer2, Sparkles, Eraser } from 'lucide-react';
import { cn } from '../lib/utils';

function getAbsoluteOffset(container: HTMLElement, node: Node, offset: number) {
  let absoluteOffset = 0;
  const treeWalker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  
  while (treeWalker.nextNode()) {
    const textNode = treeWalker.currentNode;
    if (textNode === node) {
      absoluteOffset += offset;
      break;
    }
    absoluteOffset += textNode.nodeValue?.length || 0;
  }
  return absoluteOffset;
}

const MORE_HIGHLIGHT_COLORS = [
  { name: 'Pêssego Suave', hex: '#FFE4E6', label: 'bg:#FFE4E6' },
  { name: 'Laranja Quente', hex: '#FFEDD5', label: 'bg:#FFEDD5' },
  { name: 'Amarelo Claro', hex: '#FEF9C3', label: 'bg:#FEF9C3' },
  { name: 'Verde Lima', hex: '#ECFCCB', label: 'bg:#ECFCCB' },
  { name: 'Verde Hortelã', hex: '#D1FAE5', label: 'bg:#D1FAE5' },
  { name: 'Azul Turquesa', hex: '#CFFAFE', label: 'bg:#CFFAFE' },
  { name: 'Azul Celeste', hex: '#E0F2FE', label: 'bg:#E0F2FE' },
  { name: 'Lavanda', hex: '#E0E7FF', label: 'bg:#E0E7FF' },
  { name: 'Roxo Claro', hex: '#F3E8FF', label: 'bg:#F3E8FF' },
  { name: 'Rosa Suave', hex: '#FCE7F3', label: 'bg:#FCE7F3' },
  { name: 'Cinza Suave', hex: '#F1F5F9', label: 'bg:#F1F5F9' },
];

const FONT_COLORS = [
  { name: 'Preto', hex: '#0F172A', label: 'text:#0F172A' },
  { name: 'Cinza Escuro', hex: '#475569', label: 'text:#475569' },
  { name: 'Vermelho', hex: '#DC2626', label: 'text:#DC2626' },
  { name: 'Laranja', hex: '#D97706', label: 'text:#D97706' },
  { name: 'Verde Sólido', hex: '#16A34A', label: 'text:#16A34A' },
  { name: 'Azul Real', hex: '#2563EB', label: 'text:#2563EB' },
  { name: 'Índigo', hex: '#4F46E5', label: 'text:#4F46E5' },
  { name: 'Roxo', hex: '#7C3AED', label: 'text:#7C3AED' },
  { name: 'Rosa Vibrante', hex: '#DB2777', label: 'text:#DB2777' },
];

export function RichTextToolbar() {
  const { addHighlight, clearOverlappingHighlights } = useStore();
  
  const [selection, setSelection] = useState<{
    text: string;
    nodeId: string;
    x: number;
    y: number;
    startOffset: number;
    endOffset: number;
  } | null>(null);

  const [showHighlightPalette, setShowHighlightPalette] = useState(false);
  const [showFontColorPicker, setShowFontColorPicker] = useState(false);

  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.toString().trim() === '') {
        setSelection(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      let container = range.commonAncestorContainer as HTMLElement;
      if (container.nodeType !== 1) container = container.parentElement as HTMLElement;
      
      const articleEl = container.closest('[data-node-id]') as HTMLElement;
      if (!articleEl) {
        setSelection(null);
        return;
      }

      const nodeId = articleEl.getAttribute('data-node-id');
      if (!nodeId) return;

      const startOffset = getAbsoluteOffset(articleEl, range.startContainer, range.startOffset);
      const endOffset = getAbsoluteOffset(articleEl, range.endContainer, range.endOffset);

      setSelection({
        text: sel.toString(),
        nodeId,
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
        startOffset,
        endOffset
      });
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);
    
    // Clear on mousedown
    const handleMouseDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.rich-text-toolbar')) {
        setSelection(null);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  useEffect(() => {
    if (!selection) {
      setShowHighlightPalette(false);
      setShowFontColorPicker(false);
    }
  }, [selection]);

  if (!selection) return null;

  const applyHighlight = (color: string) => {
    addHighlight(selection.nodeId, {
      nodeId: selection.nodeId,
      textStr: selection.text, // keep textStr for fallback
      startOffset: selection.startOffset,
      endOffset: selection.endOffset,
      color
    });
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const clearHighlights = () => {
    clearOverlappingHighlights(selection.nodeId, selection.startOffset, selection.endOffset);
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div 
      className="rich-text-toolbar fixed z-50 flex flex-col gap-1.5 bg-white border border-stone-200 shadow-xl rounded-2xl p-2.5 animate-in fade-in slide-in-from-bottom-2 max-w-[320px]"
      style={{ 
        left: `${selection.x}px`, 
        top: `${selection.y}px`,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <div className="flex items-center gap-1.5 px-1">
        <button onClick={() => applyHighlight('yellow')} className="w-6 h-6 rounded-full bg-yellow-200 hover:scale-115 transition-transform shadow-sm border border-yellow-300 cursor-pointer" title="Amarelo" />
        <button onClick={() => applyHighlight('green')} className="w-6 h-6 rounded-full bg-teal-200 hover:scale-115 transition-transform shadow-sm border border-teal-300" title="Verde" />
        <button onClick={() => applyHighlight('pink')} className="w-6 h-6 rounded-full bg-pink-200 hover:scale-115 transition-transform shadow-sm border border-pink-300" title="Rosa" />
        <button onClick={() => applyHighlight('blue')} className="w-6 h-6 rounded-full bg-sky-200 hover:scale-115 transition-transform shadow-sm border border-sky-300" title="Azul" />
        <button onClick={() => applyHighlight('purple')} className="w-6 h-6 rounded-full bg-purple-200 hover:scale-115 transition-transform shadow-sm border border-purple-300" title="Roxo" />
        <button onClick={() => applyHighlight('deadline')} className="w-6 h-6 rounded-full bg-orange-500 hover:scale-115 transition-transform shadow-sm border border-orange-600 flex items-center justify-center text-white cursor-pointer" title="Destaque de Prazo">
           <Sparkles size={11} />
        </button>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowHighlightPalette(!showHighlightPalette);
            setShowFontColorPicker(false);
          }}
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center border transition-all cursor-pointer",
            showHighlightPalette 
              ? "bg-cyan-50 border-cyan-500 text-cyan-600 ring-2 ring-cyan-100" 
              : "bg-white border-slate-200 hover:border-cyan-400 text-slate-500 hover:text-cyan-600"
          )}
          title="Mais Cores de Marca-texto"
        >
          <Palette size={12} />
        </button>
      </div>

      {showHighlightPalette && (
        <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl animate-in slide-in-from-top-1 fade-in duration-150">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">Mais Marca-textos</div>
          <div className="grid grid-cols-6 gap-1.5">
            {MORE_HIGHLIGHT_COLORS.map(c => (
              <button
                key={c.hex}
                onClick={() => applyHighlight(c.label)}
                className="w-5 h-5 rounded-full hover:scale-115 transition-transform border shadow-sm cursor-pointer"
                style={{ backgroundColor: c.hex, borderColor: `${c.hex}cc` }}
                title={c.name}
              />
            ))}
            <label 
              className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center cursor-pointer hover:scale-115 transition-transform bg-gradient-to-tr from-red-500 via-green-500 to-blue-500" 
              title="Cor Personalizada de Marca-texto"
            >
              <input 
                type="color" 
                className="sr-only" 
                onChange={(e) => applyHighlight(`bg:${e.target.value}`)}
              />
              <span className="text-[9px] font-black text-white leading-none shadow-sm">+</span>
            </label>
          </div>
        </div>
      )}

      <div className="w-full h-px bg-slate-100"></div>
      
      <div className="flex items-center gap-1 justify-center">
        <button onClick={() => applyHighlight('bold')} className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-700 hover:bg-stone-100 transition-all font-bold cursor-pointer" title="Negrito">
          B
        </button>
        <button onClick={() => applyHighlight('italic')} className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-700 hover:bg-stone-100 transition-all italic font-serif cursor-pointer" title="Itálico">
          I
        </button>
        <button onClick={() => applyHighlight('underline')} className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-700 hover:bg-stone-100 transition-all underline cursor-pointer" title="Sublinhado">
          U
        </button>
        <button onClick={() => applyHighlight('strike')} className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-700 hover:bg-stone-100 transition-all line-through cursor-pointer" title="Tachado">
          S
        </button>
        
        <div className="w-px h-5 bg-stone-200 mx-1"></div>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowFontColorPicker(!showFontColorPicker);
            setShowHighlightPalette(false);
          }}
          className={cn(
            "w-8 h-8 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer relative border border-transparent",
            showFontColorPicker 
              ? "bg-indigo-50 border-indigo-200 text-indigo-600" 
              : "text-stone-700 hover:bg-stone-100"
          )}
          title="Escolher Cor da Fonte"
        >
          <span className="font-bold text-sm leading-none">A</span>
          <div className="h-1 w-5 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500 mt-0.5"></div>
        </button>

        <div className="w-px h-5 bg-stone-200 mx-1"></div>

        <button onClick={clearHighlights} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer" title="Remover Marcações (Desfazer)">
          <Eraser size={16} />
        </button>
      </div>

      {showFontColorPicker && (
        <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl animate-in slide-in-from-top-1 fade-in duration-150">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">Cores da Fonte</div>
          <div className="grid grid-cols-5 gap-1.5">
            {FONT_COLORS.map(c => (
              <button
                key={c.hex}
                onClick={() => applyHighlight(c.label)}
                className="w-5 h-5 rounded-full hover:scale-115 transition-transform border border-slate-200 shadow-sm cursor-pointer flex items-center justify-center"
                style={{ backgroundColor: c.hex }}
                title={c.name}
              >
                <span className="text-[9px] font-extrabold text-white leading-none opacity-80">A</span>
              </button>
            ))}
            <label 
              className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center cursor-pointer hover:scale-115 transition-transform bg-gradient-to-tr from-red-500 via-green-500 to-blue-500" 
              title="Cor de Fonte Personalizada"
            >
              <input 
                type="color" 
                className="sr-only" 
                onChange={(e) => applyHighlight(`text:${e.target.value}`)}
              />
              <span className="text-[9px] font-black text-white leading-none shadow-sm">+</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
