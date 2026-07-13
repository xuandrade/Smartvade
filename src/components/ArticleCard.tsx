import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { LawNode, Legislation } from '../types';
import { processHighlights } from '../lib/highlighter';
import { cn } from '../lib/utils';
import { MessageSquare, Bookmark, CheckCircle, Trash2, Brain, Tag, Edit3 } from 'lucide-react';
import { ArticleTagsPopover } from './ArticleTagsPopover';
import { RichNoteEditor } from './RichNoteEditor';
import { EditModeMenu } from './EditModeMenu';

const EMPTY_ARR: any[] = [];

const ArticleCardComponent = ({ node, legislation }: { node: LawNode, legislation: Legislation }) => {
  const nodeAnnotations = useStore(state => state.annotations[node.id] || EMPTY_ARR);
  const nodeHighlights = useStore(state => state.highlights[node.id] || EMPTY_ARR);
  const isSrs = useStore(state => !!state.srsTracking[node.id]);
  const nodeTags = useStore(state => state.articleTags[node.id] || EMPTY_ARR);
  const personalTags = useStore(state => state.personalTags);
  const editMode = useStore(state => state.editMode);
  
  const addAnnotation = useStore(state => state.addAnnotation);
  const deleteAnnotation = useStore(state => state.deleteAnnotation);
  const updateAnnotation = useStore(state => state.updateAnnotation);
  const toggleNodeProperty = useStore(state => state.toggleNodeProperty);
  const addToSRS = useStore(state => state.addToSRS);
  const removeFromSRS = useStore(state => state.removeFromSRS);
  
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [showTagsPopover, setShowTagsPopover] = useState(false);
  const [fontSize, setFontSize] = useState(1);

  const handleAddAnnotation = () => {
    if (!newAnnotation.trim()) return;
    addAnnotation(node.id, newAnnotation);
    setNewAnnotation('');
    setShowAnnotationForm(false);
  };

  const handleUpdateAnnotation = () => {
    if (!editingAnnotationId || !editingContent.trim()) return;
    updateAnnotation(node.id, editingAnnotationId, editingContent);
    setEditingAnnotationId(null);
    setEditingContent('');
  };

  const removeAnnotation = (nodeId: string, annId: string) => {
    deleteAnnotation(nodeId, annId);
  };

  const renderText = (text: string, nodeId: string) => {
    // We only pass user highlights. AI verbs and keywords are no longer processed automatically,
    // as per the cleanup request (IA de auto-grifo, grifos automáticos).
    const segments = processHighlights(text, [], [], nodeHighlights);
    
    return segments.map((seg, idx) => {
      const isRevoked = seg.classes.includes('line-through'); // Ensure revoked elements still work with strikethrough
      return (
        <span 
          key={idx} 
          className={cn(seg.classes.join(' '))}
          style={seg.style}
        >
          {seg.text}{seg.emoji}
        </span>
      );
    });
  };

  const renderInner = (children: LawNode[]) => {
    return children.map(child => {
      const isRevoked = child.text.toLowerCase().includes('revogado');
      
      return (
        <div 
          key={child.id} 
          data-node-id={child.id}
          className={cn(
            "mt-4 text-lg font-sans pl-8 border-l-2 border-cyan-500/10 relative transition-all group/child",
            isRevoked ? "text-slate-300 line-through opacity-50" : "text-slate-700 hover:bg-cyan-50/20 rounded-r-2xl"
          )}
        >
           {child.heading && (
             <div className="mb-2 text-base font-serif font-extrabold text-indigo-600/90 tracking-tight">
               {child.heading}
             </div>
           )}
           <span className="font-sans font-bold text-xs text-slate-400 mr-2">{child.label}</span>
           {renderText(child.text.replace(new RegExp(`^${child.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`), ''), child.id)}
        </div>
      );
    });
  };

  const isCaputRevoked = node.text.toLowerCase().includes('revogado');

  return (
    <article 
      id={`node-${node.id}`} 
      className={cn(
        "bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-8 mb-6 transition-all duration-300 relative group scroll-mt-24 border border-cyan-500/10 hover:border-cyan-500/30",
        node.isRead 
          ? "opacity-75 shadow-[0_4px_15px_-3px_rgba(148,163,184,0.05)] border-slate-200/50" 
          : "shadow-[0_10px_30px_rgba(6,182,212,0.04)] hover:shadow-[0_15px_35px_rgba(6,182,212,0.08)]",
        node.isFavorite ? "ring-2 ring-amber-400/30 border-amber-300 bg-amber-50/10 shadow-[0_0_20px_rgba(245,158,11,0.05)]" : "",
        node.legislativeUpdate ? "border-l-[6px] border-l-emerald-300" : ""
      )}
    >
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 min-w-0" data-node-id={node.id}>
          <div className="flex items-center gap-3 mb-4 flex-wrap pr-8">
            {editMode && (
              <div className="mr-1">
                <EditModeMenu node={node} legislation={legislation} />
              </div>
            )}
            <span className="px-3 py-1 bg-cyan-50 border border-cyan-100 text-cyan-600 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
              {node.label}
            </span>
            {node.isFavorite && (
              <span className="text-xs font-bold text-amber-500 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">Favorito</span>
            )}
            {isSrs && (
               <span className="text-xs font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.15)]">Em Revisão</span>
            )}
            {nodeTags.map(tId => {
               const tag = personalTags.find(t => t.id === tId);
               if (!tag) return null;
               const colorMap: Record<string, string> = { blue: 'bg-blue-100 text-blue-700', rose: 'bg-rose-100 text-rose-700', green: 'bg-green-100 text-green-700', amber: 'bg-amber-100 text-amber-700', purple: 'bg-purple-100 text-purple-700', sky: 'bg-sky-100 text-sky-700', emerald: 'bg-emerald-100 text-emerald-700', stone: 'bg-stone-100 text-stone-700' };
               return (
                 <span key={tag.id} className={cn("text-xs font-bold px-2 py-1 rounded", colorMap[tag.color] || 'bg-stone-100 text-stone-700')}>
                    {tag.name}
                 </span>
               );
            })}
            
            {node.legislativeUpdate && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                 🆕 {node.legislativeUpdate.normType === 'EC' || node.legislativeUpdate.normType === 'Emenda Constitucional' ? 'EC' : (node.legislativeUpdate.normType || 'Lei')} {node.legislativeUpdate.law}/{node.legislativeUpdate.year}
              </span>
            )}
          </div>
          
          {node.heading && (
            <div className="mb-3 text-base md:text-lg font-serif font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-indigo-600 tracking-tight">
              {node.heading}
            </div>
          )}
          
          <div className={cn(
             "text-xl md:text-2xl font-serif leading-relaxed tracking-tight text-slate-800",
             isCaputRevoked ? "line-through text-slate-400 opacity-60" : "",
             fontSize === 0 ? "text-lg" : fontSize === 1 ? "text-xl md:text-2xl" : fontSize === 2 ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
          )}>
            {renderText(node.text.replace(new RegExp(`^${node.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`), ''), node.id)}
          </div>
          
          {node.children && node.children.length > 0 && (
            <div className="mt-6 flex flex-col gap-2">
              {renderInner(node.children)}
            </div>
          )}
          
          {(nodeAnnotations.length > 0 || showAnnotationForm) && (
            <div className="mt-8 pt-6 border-t border-stone-100">
              <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <MessageSquare size={12} /> Anotações ({nodeAnnotations.length})
              </h4>
              <div className="space-y-3">
                {nodeAnnotations.map(ann => (
                  <div key={ann.id} className="bg-stone-50 rounded-xl p-4 border border-stone-100 relative group/ann">
                    {editingAnnotationId === ann.id ? (
                      <div>
                        <RichNoteEditor initialContent={editingContent} onChange={setEditingContent} />
                        <div className="flex justify-end gap-2 mt-2">
                          <button 
                            onClick={() => { setEditingAnnotationId(null); setEditingContent(''); }}
                            className="px-4 py-2 text-sm font-semibold text-stone-500 hover:bg-stone-100 rounded-xl transition-colors"
                          >
                            Cancelar
                          </button>
                          <button 
                            onClick={handleUpdateAnnotation}
                            disabled={!editingContent.trim() || editingContent === '<p></p>'}
                            className="px-4 py-2 text-sm font-semibold bg-stone-900 text-white rounded-xl hover:bg-stone-800 disabled:opacity-50 transition-colors"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div dangerouslySetInnerHTML={{ __html: ann.content }} className="prose prose-sm max-w-none text-stone-700" />
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/ann:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setEditingAnnotationId(ann.id); setEditingContent(ann.content); }}
                            className="p-1.5 bg-white rounded shadow-sm text-stone-400 hover:text-cyan-500 transition-colors"
                            title="Editar Anotação"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={() => removeAnnotation(node.id, ann.id)}
                            className="p-1.5 bg-white rounded shadow-sm text-stone-400 hover:text-red-500 transition-colors"
                            title="Excluir Anotação"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {showAnnotationForm && (
            <div className="mt-6">
              <RichNoteEditor initialContent={newAnnotation} onChange={setNewAnnotation} />
              <div className="flex justify-end gap-2 mt-2">
                <button 
                  onClick={() => setShowAnnotationForm(false)}
                  className="px-4 py-2 text-sm font-semibold text-stone-500 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddAnnotation}
                  disabled={!newAnnotation.trim() || newAnnotation === '<p></p>'}
                  className="px-4 py-2 text-sm font-semibold bg-stone-900 text-white rounded-xl hover:bg-stone-800 disabled:opacity-50 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          )}

          {!showAnnotationForm && (
            <button 
              onClick={() => setShowAnnotationForm(true)}
              className="mt-6 text-sm font-semibold text-blush-500 hover:text-blush-600 flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare size={14} /> Adicionar Anotação
            </button>
          )}

        </div>

        {/* Action Panel */}
        <div className="shrink-0 flex flex-row md:flex-col gap-2.5 items-center md:border-l border-cyan-500/10 md:pl-6 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 mt-4 md:mt-0 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:block mb-2">Ações</span>
          
          <button onClick={() => setFontSize(Math.max(0, fontSize - 1))} className="w-10 h-10 rounded-full shadow-sm border border-slate-200 bg-white text-slate-500 flex items-center justify-center hover:border-cyan-400 hover:text-cyan-600 hover:bg-slate-50 hover:shadow-[0_0_10px_rgba(6,182,212,0.15)] transition-all" title="Diminuir Fonte">
            <span className="text-sm font-bold">A-</span>
          </button>
          <button onClick={() => setFontSize(Math.min(3, fontSize + 1))} className="w-10 h-10 rounded-full shadow-sm border border-slate-200 bg-white text-slate-500 flex items-center justify-center hover:border-cyan-400 hover:text-cyan-600 hover:bg-slate-50 hover:shadow-[0_0_10px_rgba(6,182,212,0.15)] transition-all" title="Aumentar Fonte">
            <span className="text-lg font-bold">A+</span>
          </button>
                    <div className="w-px h-8 md:w-8 md:h-px bg-slate-200 hidden md:block my-2"></div>
          
          <div className="relative">
             <button onClick={() => setShowTagsPopover(!showTagsPopover)} className={cn("w-10 h-10 rounded-full shadow-sm border flex items-center justify-center transition-all", nodeTags.length > 0 ? "bg-slate-800 text-white border-slate-800 shadow-[0_4px_12px_rgba(15,23,42,0.15)]" : "bg-white text-slate-400 border-slate-200 hover:border-cyan-400 hover:text-cyan-600 hover:bg-slate-50 hover:shadow-[0_0_10px_rgba(6,182,212,0.15)]")} title="Tags">
               <Tag size={16} />
             </button>
             {showTagsPopover && <ArticleTagsPopover nodeId={node.id} onClose={() => setShowTagsPopover(false)} />}
          </div>
          <button onClick={() => toggleNodeProperty(node.id, 'isFavorite')} className={cn("w-10 h-10 rounded-full shadow-sm border flex items-center justify-center transition-all", node.isFavorite ? "bg-amber-400 text-white border-amber-400 shadow-[0_4px_12px_rgba(245,158,11,0.25)]" : "bg-white text-slate-400 border-slate-200 hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50/50")} title="Favoritar">
            <Bookmark size={18} />
          </button>
          
          <button onClick={() => toggleNodeProperty(node.id, 'isRead')} className={cn("w-10 h-10 rounded-full shadow-sm border flex items-center justify-center transition-all", node.isRead ? "bg-emerald-500 text-white border-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.25)]" : "bg-white text-slate-400 border-slate-200 hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-50/50")} title="Marcar como lido">
            <CheckCircle size={18} />
          </button>
          
          <div className="w-px h-8 md:w-8 md:h-px bg-slate-200 hidden md:block my-2"></div>
          
          <button 
            onClick={() => {
                if (isSrs) {
                    removeFromSRS(node.id);
                } else {
                    addToSRS(node.id);
                }
            }}
            className={cn("w-10 h-10 rounded-full shadow-sm border flex items-center justify-center transition-all", isSrs ? "bg-cyan-500 text-white border-cyan-500 shadow-[0_4px_12px_rgba(6,182,212,0.3)]" : "bg-white text-slate-500 border-slate-200 hover:border-cyan-400 hover:text-cyan-600 hover:bg-cyan-50/50")} 
            title={isSrs ? "Remover da Revisão (SRS)" : "Adicionar à Revisão Espaçada (SRS)"}
          >
            <Brain size={14} /> 
          </button>
        </div>
      </div>
    </article>
  );
}
export const ArticleCard = React.memo(ArticleCardComponent);
