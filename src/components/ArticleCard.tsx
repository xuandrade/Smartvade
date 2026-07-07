import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { LawNode, Legislation } from '../types';
import { processHighlights, UserHighlightDef } from '../lib/highlighter';
import { cn } from '../lib/utils';
import { Sparkles, BookOpen, Bookmark, CheckCircle, Edit3, Trash2, X, Highlighter, Bold, Underline, Network, Brain, Wand2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { MindMapView } from './MindMapView';

function getNodeText(node: LawNode): string {
  return [node.label, node.text, ...(node.children || []).map(getNodeText)].join('\n');
}

function getIncidenceForNode(node: LawNode, legislation: Legislation, filters: ReturnType<typeof useStore.getState>['filters']) {
  const matchNum = node.label.match(/\d+/);
  if (!matchNum) return 0;

  const articleKey = `Art. ${matchNum[0]}`;
  if (filters.board === 'ALL') {
    return Object.values(legislation.incidences || {}).reduce((acc, curr) => acc + (curr?.[articleKey] || 0), 0);
  }

  return legislation.incidences?.[filters.board]?.[articleKey] || 0;
}

export function ArticleCard({ node, legislation }: { node: LawNode, legislation: Legislation }) {
  const { 
    setMetadata, 
    annotations, 
    addAnnotation, 
    deleteAnnotation, 
    updateAnnotation,
    filters, 
    toggleNodeProperty, 
    toggleRightPanel,
    highlights,
    addHighlight,
    srsTracking,
    addToSRS,
    removeFromSRS
  } = useStore();
  
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingMap, setLoadingMap] = useState(false);
  const [loadingHighlight, setLoadingHighlight] = useState(false);
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);
  const [editingAnnotationContent, setEditingAnnotationContent] = useState('');
  const [selectionBox, setSelectionBox] = useState<{x: number, y: number, text: string} | null>(null);
  const cardRef = useRef<HTMLElement>(null);

  const nodeAnnotations = annotations[node.id] || [];
  const nodeHighlights = highlights[node.id] || [];
  const fullNodeText = getNodeText(node);
  const normalizedQuery = filters.searchQuery.trim().toLowerCase();
  const fgvIncidence = getIncidenceForNode(node, legislation, filters);
  const isHidden =
    fgvIncidence < filters.minIncidence ||
    (filters.showFavorites && !node.isFavorite) ||
    (filters.showNeedsReview && !node.needsReview) ||
    (filters.showRead === true && !node.isRead) ||
    (filters.showRead === false && node.isRead) ||
    (normalizedQuery.length > 0 && !fullNodeText.toLowerCase().includes(normalizedQuery));

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && cardRef.current?.contains(selection.anchorNode)) {
        const text = selection.toString().trim();
        if (text.length > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setSelectionBox({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
            text
          });
        }
      } else {
        setTimeout(() => setSelectionBox(null), 150);
      }
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  if (isHidden) return null;

  const handleAutoHighlight = async () => {
    setLoadingHighlight(true);
    try {
      const res = await fetch('/api/autohighlight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: fullNodeText,
          rule: filters.colorCodeConfig
        })
      });
      
      if (!res.ok) throw new Error('API failed');
      
      const data = await res.json();
      if (data && Array.isArray(data)) {
        useStore.getState().addHighlightsBatch(
          node.id, 
          data.map((h: any) => ({ nodeId: node.id, textStr: h.textStr, color: h.color }))
        );
      }
    } catch (e) {
      console.error(e);
      alert("Falha ao gerar grifos automáticos. Tente novamente.");
    } finally {
      setLoadingHighlight(false);
    }
  };

  const handleApplyHighlight = (color: any) => {
    if (selectionBox) {
      addHighlight(node.id, { nodeId: node.id, textStr: selectionBox.text, color });
      window.getSelection()?.removeAllRanges();
      setSelectionBox(null);
    }
  };

  const handleEnrich = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullNodeText })
      });
      
      if (!res.ok) throw new Error('API failed');
      
      const data = await res.json();
      setMetadata(node.id, { ...node.metadata, ...data });
    } catch (e) {
      console.error(e);
      setMetadata(node.id, {
        ...node.metadata,
        termo_nucleo: 'Conceito Indisponível',
        verbos_nucleares: ['falha', 'sistema'],
        alertas_fgv: 'Não foi possível conectar à IA no momento.'
      });
    } finally {
      setLoadingAi(false);
    }
  };

  const handleGenerateMap = async () => {
    setLoadingMap(true);
    try {
      const res = await fetch('/api/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullNodeText })
      });
      
      if (!res.ok) throw new Error('API failed');
      
      const data = await res.json();
      setMetadata(node.id, { ...node.metadata, mapa_mental: data });
    } catch (e) {
      console.error(e);
      setMetadata(node.id, {
        ...node.metadata,
        mapa_mental: { name: 'Falha ao gerar mapa mental' }
      });
    } finally {
      setLoadingMap(false);
    }
  };

  const renderText = (text: string) => {
    const userHighs: UserHighlightDef[] = nodeHighlights.map(h => ({
       textStr: h.textStr,
       color: h.color
    }));
    const segments = processHighlights(
      text, 
      node.metadata?.verbos_nucleares || [], 
      node.metadata?.palavras_chave || [],
      userHighs
    );
    return (
      <>
        {segments.map((seg, i) => (
          <span key={i} className={cn(seg.classes)}>
            {seg.text}{seg.emoji}
          </span>
        ))}
      </>
    );
  };

  const renderInner = (children: LawNode[]) => {
    return children.map(child => {
      const isRevoked = child.text.toLowerCase().includes('revogado');
      
      return (
        <div key={child.id} className={cn(
          "mt-4 text-lg font-serif pl-8 border-l-2 border-slate-100",
          isRevoked ? "text-slate-300 line-through opacity-50" : "text-slate-700"
        )}>
           <span className="font-sans font-bold text-xs text-slate-400 mr-2">{child.label}</span>
           {renderText(child.text.replace(new RegExp(`^${child.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`), ''))}
           {child.children && child.children.length > 0 && renderInner(child.children)}
        </div>
      );
    });
  };

  const startEditingAnnotation = (annotationId: string, content: string) => {
    setEditingAnnotationId(annotationId);
    setEditingAnnotationContent(content);
  };

  const saveEditingAnnotation = () => {
    if (!editingAnnotationId || !editingAnnotationContent.trim()) return;
    updateAnnotation(node.id, editingAnnotationId, editingAnnotationContent);
    setEditingAnnotationId(null);
    setEditingAnnotationContent('');
  };

  let fgvBadgeClass = "";
  let fgvLabel = "";
  if (fgvIncidence > 6) {
    fgvBadgeClass = "bg-[#C0392B] text-white";
    fgvLabel = `ESSENCIAL - COBRADO ${fgvIncidence} VEZES`;
  } else if (fgvIncidence >= 5) {
    fgvBadgeClass = "bg-[#E67E22] text-white";
    fgvLabel = `MUITO IMPORTANTE - COBRADO ${fgvIncidence} VEZES`;
  } else if (fgvIncidence >= 3) {
    fgvBadgeClass = "bg-[#F1C40F] text-slate-900";
    fgvLabel = `IMPORTANTE - COBRADO ${fgvIncidence} VEZES`;
  } else if (fgvIncidence > 0) {
    fgvBadgeClass = "bg-[#2ECC71] text-white";
    fgvLabel = `COBRADO ${fgvIncidence} VEZES`;
  }

  return (
    <article ref={cardRef} id={`node-${node.id}`} className={cn(
      "bg-white border rounded-2xl p-6 md:p-8 shadow-sm mb-8 relative group transition-all duration-300",
      node.isRead ? "border-green-200 bg-green-50/20 opacity-80" : "border-slate-200 hover:shadow-md",
      node.isFavorite ? "ring-2 ring-yellow-400 border-yellow-400" : "",
      node.needsReview ? "outline outline-2 outline-rose-200" : ""
    )}>
      {selectionBox && (
        <div 
          className="fixed z-50 bg-slate-900 text-white rounded-lg shadow-xl px-2 py-1.5 flex items-center gap-1 transform -translate-x-1/2 -translate-y-full mb-2"
          style={{ left: selectionBox.x, top: selectionBox.y }}
        >
          <button onClick={(e) => { e.stopPropagation(); handleApplyHighlight('yellow'); }} className="w-6 h-6 rounded-full bg-yellow-400 hover:scale-110 transition-transform" />
          <button onClick={(e) => { e.stopPropagation(); handleApplyHighlight('green'); }} className="w-6 h-6 rounded-full bg-green-400 hover:scale-110 transition-transform" />
          <button onClick={(e) => { e.stopPropagation(); handleApplyHighlight('pink'); }} className="w-6 h-6 rounded-full bg-pink-400 hover:scale-110 transition-transform" />
          <button onClick={(e) => { e.stopPropagation(); handleApplyHighlight('blue'); }} className="w-6 h-6 rounded-full bg-blue-400 hover:scale-110 transition-transform" />
          <div className="w-px h-4 bg-slate-700 mx-1"></div>
          <button onClick={(e) => { e.stopPropagation(); handleApplyHighlight('bold'); }} className="w-6 h-6 flex items-center justify-center hover:bg-slate-700 rounded"><Bold size={14}/></button>
          <button onClick={(e) => { e.stopPropagation(); handleApplyHighlight('underline'); }} className="w-6 h-6 flex items-center justify-center hover:bg-slate-700 rounded"><Underline size={14}/></button>
        </div>
      )}

      <div className="absolute -right-4 top-12 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button onClick={() => toggleNodeProperty(node.id, 'isFavorite')} className={cn("w-10 h-10 rounded-full shadow-lg border flex items-center justify-center transition-colors", node.isFavorite ? "bg-yellow-400 text-white border-yellow-400" : "bg-white text-slate-400 border-slate-100 hover:bg-yellow-50")} title="Favoritar">
          <Bookmark size={18} />
        </button>
        <button onClick={() => toggleNodeProperty(node.id, 'isRead')} className={cn("w-10 h-10 rounded-full shadow-lg border flex items-center justify-center transition-colors", node.isRead ? "bg-green-500 text-white border-green-500" : "bg-white text-slate-400 border-slate-100 hover:bg-green-50")} title="Marcar como lido">
          <CheckCircle size={18} />
        </button>
        <button onClick={() => toggleNodeProperty(node.id, 'needsReview')} className={cn("w-10 h-10 rounded-full shadow-lg border flex items-center justify-center transition-colors", node.needsReview ? "bg-rose-500 text-white border-rose-500" : "bg-white text-slate-400 border-slate-100 hover:bg-rose-50")} title="Marcar para revisar depois">
          <Highlighter size={18} />
        </button>
        <button onClick={() => toggleRightPanel(node.id)} className="w-10 h-10 rounded-full bg-slate-800 shadow-lg text-white flex items-center justify-center hover:bg-slate-700" title="Abrir Gaveta de Estudos">
          <BookOpen size={18} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {fgvIncidence > 0 && (
          <span className={cn("px-2 py-1 text-[9px] font-bold rounded uppercase tracking-tighter italic", fgvBadgeClass)}>
            {fgvLabel}
          </span>
        )}

        {node.needsReview && (
          <span className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-100 text-[9px] font-bold rounded uppercase tracking-tighter">
            Revisar depois
          </span>
        )}

        {node.metadata?.novidade_legislativa && (
          <span className="px-2 py-1 bg-[#ccff00] text-slate-900 text-[9px] font-bold rounded uppercase tracking-tighter shadow-sm border border-green-200">
            Novidade legislativa
          </span>
        )}

        {node.metadata?.termo_nucleo && (
          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[9px] font-bold rounded uppercase tracking-tighter border border-slate-200">
            {node.metadata.termo_nucleo}
          </span>
        )}

        {node.metadata?.nome_crime && (
          <span className="px-2 py-1 bg-red-100 text-red-800 border border-red-200 text-[9px] font-bold rounded uppercase tracking-tighter">
            CRIME: {node.metadata.nome_crime}
          </span>
        )}

        {node.metadata?.principio && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 border border-blue-200 text-[9px] font-bold rounded uppercase tracking-tighter">
            PRINCÍPIO: {node.metadata.principio}
          </span>
        )}
      </div>

      <div className="font-serif text-xl leading-relaxed text-slate-800 border-l-4 border-slate-100 pl-4 md:pl-6">
        {renderText(node.text)}
      </div>
      
      {node.children && node.children.length > 0 && (
        <div className="mt-6">
          {renderInner(node.children)}
        </div>
      )}

      {node.metadata && (
        <div className="mt-8 space-y-2">
          {node.metadata.verbos_nucleares && node.metadata.verbos_nucleares.length > 0 && (
            <div className="border border-slate-100 rounded-lg p-3 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Ação Principal: {node.metadata.verbos_nucleares.map(v => v.toUpperCase()).join(', ')}</span>
            </div>
          )}
          {node.metadata.alertas_fgv && (
            <div className="border border-amber-100 rounded-lg p-3 bg-amber-50 flex items-start gap-2">
              <span className="text-sm font-medium text-amber-900">{node.metadata.alertas_fgv}</span>
            </div>
          )}
        </div>
      )}

      {node.metadata?.mapa_mental && (
        <div className="mt-8">
           <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
             <Network size={16} className="text-indigo-600" /> Mapa Mental
           </h4>
           <MindMapView data={node.metadata.mapa_mental} />
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-dashed border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-xs">✏️</span>
          <h4 className="text-sm font-bold text-slate-700">Anotações</h4>
          <button 
            onClick={() => setShowAnnotationForm(!showAnnotationForm)}
            className="ml-auto text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase"
          >
            + Adicionar
          </button>
        </div>

        {showAnnotationForm && (
          <div className="mb-4">
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none resize-y min-h-[80px]"
              placeholder="Suas notas, esquemas, palavras-chave..."
              value={newAnnotation}
              onChange={(e) => setNewAnnotation(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button 
                onClick={() => setShowAnnotationForm(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (newAnnotation.trim()) {
                    addAnnotation(node.id, newAnnotation);
                    setNewAnnotation('');
                    setShowAnnotationForm(false);
                  }
                }}
                disabled={!newAnnotation.trim()}
                className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          </div>
        )}

        {nodeAnnotations.length > 0 && (
          <div className="space-y-2">
            {nodeAnnotations.map(ann => (
              <div key={ann.id} className="group relative bg-yellow-50 border border-yellow-100 rounded p-3 pr-16">
                {editingAnnotationId === ann.id ? (
                  <div>
                    <textarea
                      className="w-full bg-white border border-yellow-200 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-600 outline-none resize-y min-h-[80px]"
                      value={editingAnnotationContent}
                      onChange={(e) => setEditingAnnotationContent(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => setEditingAnnotationId(null)} className="px-2 py-1 text-xs font-bold text-slate-500 hover:bg-yellow-100 rounded">Cancelar</button>
                      <button onClick={saveEditingAnnotation} disabled={!editingAnnotationContent.trim()} className="px-2 py-1 text-xs font-bold bg-indigo-600 text-white rounded disabled:opacity-50">Salvar</button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-serif italic text-slate-700">
                     <ReactMarkdown>{ann.content}</ReactMarkdown>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => startEditingAnnotation(ann.id, ann.content)}
                    className="p-1 text-yellow-500 hover:text-indigo-600"
                    title="Editar anotação"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    onClick={() => deleteAnnotation(node.id, ann.id)}
                    className="p-1 text-yellow-400 hover:text-red-500"
                    title="Excluir anotação"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="absolute right-4 md:right-6 top-6 flex flex-col gap-2">
        <button 
          onClick={handleAutoHighlight}
          disabled={loadingHighlight}
          className="px-3 py-1.5 rounded-full shadow-sm border border-slate-200 bg-white text-slate-500 flex items-center justify-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors font-bold text-xs uppercase tracking-tight disabled:opacity-50"
          title="Auto-Grifar com IA baseada na sua Regra de Cores"
        >
          <Wand2 size={14} className={loadingHighlight ? "animate-bounce text-indigo-600" : "text-indigo-600"} />
          <span className="hidden sm:inline">Auto-Grifo (IA)</span>
        </button>
        <button 
          onClick={() => {
              if (srsTracking[node.id]) {
                  removeFromSRS(node.id);
              } else {
                  addToSRS(node.id);
              }
          }}
          className={cn("px-3 py-1.5 rounded-full shadow-sm border flex items-center justify-center gap-2 transition-colors font-bold text-xs uppercase tracking-tight", srsTracking[node.id] ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600")} 
          title={srsTracking[node.id] ? "Remover da Revisão (SRS)" : "Adicionar à Revisão Espaçada (SRS)"}
        >
          <Brain size={14} /> {srsTracking[node.id] ? "Em Revisão" : "Estudar"}
        </button>
        {!node.metadata?.verbos_nucleares && (
          <button
            onClick={handleEnrich}
            disabled={loadingAi}
            className="w-10 h-10 rounded-full bg-indigo-50 shadow-sm border border-indigo-100 flex items-center justify-center hover:bg-indigo-100 text-indigo-600 disabled:opacity-50 transition-colors"
            title="Enriquecer com IA"
          >
            <Sparkles size={16} className={loadingAi ? "animate-spin" : ""} />
          </button>
        )}
        {(!node.metadata?.mapa_mental) && (
          <button
            onClick={handleGenerateMap}
            disabled={loadingMap}
            className="w-10 h-10 rounded-full bg-emerald-50 shadow-sm border border-emerald-100 flex items-center justify-center hover:bg-emerald-100 text-emerald-600 disabled:opacity-50 transition-colors"
            title="Gerar Mapa Mental"
          >
            <Network size={16} className={loadingMap ? "animate-spin" : ""} />
          </button>
        )}
      </div>
    </article>
  );
}
