import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { LawNode, Legislation } from '../types';
import { Book, ChevronRight, Hash, Layers, Folder, Plus, ChevronDown, Trash2, Target, Trophy, Download, Upload, Star, Sparkles, Tag, AlignLeft } from 'lucide-react';

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { 
    legislations, 
    currentLegislationId, 
    setCurrentLegislation,
    deleteLegislation,
    setShowCreateModal,
    expandedTocs,
    toggleToc,
    reorderLegislations,
    retaFinalProjects,
    activeRetaFinalId,
    setActiveRetaFinalId,
    articleTags,
    personalTags,
    legislativeCutOffYear,
    setLegislativeCutOffYear
  } = useStore();
  
  const [draggedId, setDraggedId] = useState<string | null>(null);
  
  const [expandedDisciplines, setExpandedDisciplines] = useState<Record<string, boolean>>({});
  const toggleDiscipline = (disc: string) => setExpandedDisciplines(prev => ({...prev, [disc]: !prev[disc]}));

  // Helper to get nodes flat
  const getAllNodes = (leg: Legislation): LawNode[] => {
    const nodes: LawNode[] = [];
    const traverse = (node: LawNode) => {
      nodes.push(node);
      if (node.children) node.children.forEach(traverse);
    };
    leg.nodes.forEach(traverse);
    return nodes;
  };

  const navigateToNode = (legId: string, nodeId: string) => {
    setCurrentLegislation(legId);
    setTimeout(() => {
      const el = document.getElementById(`node-${nodeId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    if (onClose) onClose();
  };

  const renderNode = (node: LawNode, depth: number) => {
    let icon = <Hash size={12} className="text-stone-400" />;
    if (node.type === 'livro' || node.type === 'titulo') icon = <Book size={12} className="text-stone-600" />;
    if (node.type === 'capitulo') icon = <Layers size={12} className="text-stone-500" />;
    
    const isContainer = ['livro', 'titulo', 'capitulo', 'secao', 'subsecao'].includes(node.type);
    const isNodeExpanded = expandedTocs[node.id];
    
    let displayTitle = node.label;
    if (isContainer) { 
       const firstLine = node.text.split('\n')[0].trim();
       if (firstLine && firstLine.length < 150) {
          displayTitle = firstLine;
       }
    }

    return (
      <div key={node.id} className="flex flex-col">
        <div className={cn("flex items-center group relative", depth === 0 ? "mt-2" : "")}>
          <a 
            href={`#node-${node.id}`}
            onClick={(e) => { e.preventDefault(); navigateToNode(currentLegislationId!, node.id); }}
            className={cn(
              "flex items-center gap-2 py-1.5 px-3 hover:bg-cyan-50/50 hover:text-cyan-600 rounded-lg text-xs transition-all duration-200 cursor-pointer flex-1 overflow-hidden",
              depth === 0 ? "font-bold text-slate-700 tracking-tight" : "text-slate-600",
              depth === 1 ? "font-medium ml-2" : "",
              depth === 2 ? "ml-4 opacity-90" : "",
              depth > 2 ? `ml-${depth * 2 + 2} opacity-80` : ""
            )}
          >
            {icon}
            <span className="truncate" title={displayTitle}>{displayTitle}</span>
          </a>
          {isContainer && node.children && node.children.length > 0 && (
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleToc(node.id); }}
              className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-all"
            >
              {isNodeExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
            </button>
          )}
        </div>
        
        {isContainer && isNodeExpanded && node.children && node.children.length > 0 && (
          <div className="flex flex-col">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const disciplines = Array.from(new Set(legislations.map(l => l.discipline || 'Outros'))).sort();
  
  return (
    <>
      <div className="p-4 border-b border-cyan-500/10 bg-transparent flex justify-between items-center shrink-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Smartvade</p>
          <h2 className="text-sm font-bold text-slate-800">Meus Cadernos</h2>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center hover:bg-cyan-100/80 transition-all shadow-[0_0_10px_rgba(6,182,212,0.05)] hover:shadow-[0_0_15px_rgba(6,182,212,0.18)]"
          title="Nova Legislação"
        >
          <Plus size={16} />
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-2 space-y-1 pb-24">
        
        {/* RETA FINAL SECTION */}
        <div className="mb-6">
           <div className="px-2 py-1 flex justify-between items-center mb-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Target size={12}/> Reta Final</p>
              <button onClick={() => window.dispatchEvent(new CustomEvent('open-reta-final-modal'))} className="text-cyan-500 hover:bg-cyan-50 p-1 rounded-md transition-colors" title="Criar Nova Reta Final">
                <Plus size={12} />
              </button>
           </div>
           {retaFinalProjects.map(rf => {
              const isActive = rf.id === activeRetaFinalId;
              return (
                <div 
                  key={rf.id}
                  onClick={() => setActiveRetaFinalId(rf.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 mb-1 border border-transparent",
                    isActive 
                      ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-[0_4px_12px_rgba(6,182,212,0.25)] font-bold animate-none" 
                      : "hover:bg-slate-100/70 text-slate-700 hover:text-cyan-600 hover:border-cyan-500/10"
                  )}
                >
                  <Target size={14} className={isActive ? "text-white" : "text-slate-400"} />
                  <span className="text-sm truncate flex-1">{rf.name}</span>
                </div>
              );
           })}
        </div>

        {/* LEGISLAÇÕES SECTION */}
        <div className="mb-6">
           <div className="px-2 py-1 mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Book size={12}/> Legislações</p>
           </div>
           
           {disciplines.map(discipline => {
             const discId = `disc-${discipline}`;
             const isDiscExpanded = expandedDisciplines[discId];
             const discLegs = legislations.filter(l => (l.discipline || 'Outros') === discipline);
             if (discLegs.length === 0) return null;
             
             return (
               <div key={discipline} className="mb-2">
                 <button 
                   onClick={() => toggleDiscipline(discId)}
                   className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors group"
                 >
                   <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{discipline}</span>
                   {isDiscExpanded ? <ChevronDown size={14} className="text-slate-400 group-hover:text-cyan-500"/> : <ChevronRight size={14} className="text-slate-400 group-hover:text-cyan-500"/>}
                 </button>
                 
                 {isDiscExpanded && (
                   <div className="mt-1 pl-2 ml-2 border-l border-slate-100">
                     {discLegs.map(leg => {
                        const isActive = leg.id === currentLegislationId;
                        const isExpanded = expandedTocs[leg.id];
                        return (
                           <div key={leg.id} className="mb-1"
                             draggable
                             onDragStart={(e) => {
                               setDraggedId(leg.id);
                               e.dataTransfer.effectAllowed = 'move';
                               e.dataTransfer.setData('text/plain', leg.id);
                             }}
                             onDragOver={(e) => {
                               e.preventDefault();
                               e.dataTransfer.dropEffect = 'move';
                             }}
                             onDrop={(e) => {
                               e.preventDefault();
                               if (draggedId && draggedId !== leg.id) {
                                  reorderLegislations(draggedId, leg.id);
                               }
                               setDraggedId(null);
                             }}
                             onDragEnd={() => setDraggedId(null)}
                           >
                             <div
                               onClick={() => setCurrentLegislation(leg.id)}
                               className={cn(
                                 "flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200 group border border-transparent",
                                 isActive ? "bg-cyan-50 text-cyan-700 font-bold" : "hover:bg-slate-100/70 text-slate-600 hover:text-cyan-600",
                                 draggedId === leg.id ? "opacity-50 border-dashed border-stone-400" : ""
                               )}
                             >
                               <Folder size={14} className={isActive ? "text-cyan-500" : "text-slate-400"} />
                               <span className="text-xs truncate flex-1">{leg.title}</span>
                               {isActive && (
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); deleteLegislation(leg.id); }}
                                   className="opacity-0 group-hover:opacity-100 text-blush-300 hover:text-blush-600 p-1 transition-opacity"
                                 >
                                   <Trash2 size={12} />
                                 </button>
                               )}
                               <button 
                                 onClick={(e) => { e.stopPropagation(); toggleToc(leg.id); }}
                                 className={cn("p-1 rounded hover:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity", isActive ? "text-cyan-600" : "text-stone-400")}
                               >
                                 {isExpanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                               </button>
                             </div>
                             {isExpanded && (
                               <div className="ml-2 pl-1 border-l border-slate-100">
                                 {leg.nodes.map(node => renderNode(node, 0))}
                               </div>
                             )}
                           </div>
                        );
                     })}
                   </div>
                 )}
               </div>
             )
           })}
           {legislations.length === 0 && (
              <div className="p-4 text-center text-sm text-stone-500 mt-4">
                Nenhuma legislação importada.<br/><br/>
                <button onClick={() => setShowCreateModal(true)} className="text-cyan-500 font-bold underline">Criar uma agora</button>
              </div>
            )}
        </div>

        {/* FAVORITOS SECTION */}
        {legislations.length > 0 && (
            <div className="mb-6">
               <div className="px-2 py-1 mb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Star size={12}/> Favoritos</p>
               </div>
               <FavoritesNotebook navigateToNode={navigateToNode} />
            </div>
        )}

        {/* NOVIDADES LEGISLATIVAS SECTION */}
        {legislations.length > 0 && (
            <div className="mb-6">
               <div className="px-2 py-1 mb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Sparkles size={12}/> Novidades</p>
               </div>
               <LegislativeNewsNotebook navigateToNode={navigateToNode} />
            </div>
        )}

        {/* TAGS SECTION */}
        {legislations.length > 0 && (
            <div className="mb-6">
               <div className="px-2 py-1 mb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Tag size={12}/> Tags Pessoais</p>
               </div>
               <TagsNotebook navigateToNode={navigateToNode} />
            </div>
        )}

      </nav>
      <div className="p-3 border-t border-cyan-500/10 bg-transparent flex flex-col gap-1 shrink-0">
         <button onClick={() => window.dispatchEvent(new CustomEvent('open-backup-modal'))} className="flex items-center justify-center gap-2 text-slate-600 hover:text-cyan-600 text-sm font-bold p-2.5 rounded-xl hover:bg-cyan-50/50 transition-all w-full border border-transparent">
           <Download size={14} /> Backup
         </button>
      </div>
    </>
  );
}

function FavoritesNotebook({ navigateToNode }: { navigateToNode: (legId: string, nodeId: string) => void }) {
  const { legislations } = useStore();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setExpanded(prev => ({...prev, [id]: !prev[id]}));

  const favGroups: Record<string, Record<string, LawNode[]>> = {};
  
  legislations.forEach(leg => {
    const disc = leg.discipline || 'Outros';
    const favs: LawNode[] = [];
    
    const traverse = (node: LawNode) => {
      if (node.isFavorite) favs.push(node);
      if (node.children) node.children.forEach(traverse);
    };
    leg.nodes.forEach(traverse);
    
    if (favs.length > 0) {
       if (!favGroups[disc]) favGroups[disc] = {};
       favGroups[disc][leg.id] = favs;
    }
  });

  const disciplines = Object.keys(favGroups).sort();
  if (disciplines.length === 0) return <div className="px-4 py-2 text-xs text-slate-400 italic">Nenhum favorito</div>;

  return (
    <>
      {disciplines.map(disc => {
        const isDiscExpanded = expanded[`fav-disc-${disc}`];
        return (
          <div key={`fav-disc-${disc}`} className="mb-1">
            <button 
              onClick={() => toggle(`fav-disc-${disc}`)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-amber-50/50 transition-colors group"
            >
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{disc}</span>
              {isDiscExpanded ? <ChevronDown size={14} className="text-slate-400 group-hover:text-amber-500"/> : <ChevronRight size={14} className="text-slate-400 group-hover:text-amber-500"/>}
            </button>
            {isDiscExpanded && (
              <div className="mt-1 pl-2 ml-2 border-l border-slate-100">
                {Object.keys(favGroups[disc]).sort((a, b) => {
                  const legA = legislations.find(l => l.id === a);
                  const legB = legislations.find(l => l.id === b);
                  return (legA?.title || '').localeCompare(legB?.title || '');
                }).map(legId => {
                  const leg = legislations.find(l => l.id === legId);
                  if (!leg) return null;
                  const isLegExpanded = expanded[`fav-leg-${legId}`];
                  return (
                    <div key={`fav-leg-${legId}`} className="mb-1">
                      <button 
                        onClick={() => toggle(`fav-leg-${legId}`)}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors group"
                      >
                        <span className="text-xs font-medium text-slate-600 truncate">{leg.title}</span>
                        {isLegExpanded ? <ChevronDown size={12} className="text-slate-400"/> : <ChevronRight size={12} className="text-slate-400"/>}
                      </button>
                      {isLegExpanded && (
                        <div className="mt-1 pl-2 ml-2 border-l border-slate-100 flex flex-col gap-0.5">
                          {favGroups[disc][legId].map(node => (
                             <a 
                               key={node.id}
                               href={`#node-${node.id}`}
                               onClick={(e) => { e.preventDefault(); navigateToNode(leg.id, node.id); }}
                               className="text-[11px] text-slate-500 hover:text-amber-600 hover:bg-amber-50 px-2 py-1 rounded truncate block transition-colors"
                             >
                               {node.label || node.text.substring(0, 30)}
                             </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )
      })}
    </>
  );
}

function LegislativeNewsNotebook({ navigateToNode }: { navigateToNode: (legId: string, nodeId: string) => void }) {
  const { legislations, legislativeCutOffYear, setLegislativeCutOffYear } = useStore();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setExpanded(prev => ({...prev, [id]: !prev[id]}));

  const newsGroups: Record<string, Record<number, Record<string, LawNode[]>>> = {};

  legislations.forEach(leg => {
    const disc = leg.discipline || 'Outros';
    
    const traverse = (node: LawNode) => {
      if (node.legislativeUpdate && node.legislativeUpdate.year >= legislativeCutOffYear) {
         const year = node.legislativeUpdate.year;
         if (!newsGroups[disc]) newsGroups[disc] = {};
         if (!newsGroups[disc][year]) newsGroups[disc][year] = {};
         if (!newsGroups[disc][year][leg.id]) newsGroups[disc][year][leg.id] = [];
         newsGroups[disc][year][leg.id].push(node);
      }
      if (node.children) node.children.forEach(traverse);
    };
    leg.nodes.forEach(traverse);
  });

  const disciplines = Object.keys(newsGroups).sort();
  
  return (
    <>
      <div className="px-3 mb-2 flex items-center justify-between gap-2">
         <label className="text-[10px] text-slate-500 font-bold block shrink-0">A PARTIR DE:</label>
         <select 
           value={legislativeCutOffYear} 
           onChange={e => setLegislativeCutOffYear(parseInt(e.target.value))}
           className="flex-1 p-1 text-xs border border-slate-200 rounded outline-none font-bold text-slate-700 bg-white"
         >
           <option value={2022}>2022</option>
           <option value={2023}>2023</option>
           <option value={2024}>2024</option>
           <option value={2025}>2025</option>
         </select>
      </div>
      
      {disciplines.length === 0 && <div className="px-4 py-2 text-xs text-slate-400 italic">Nenhuma novidade encontrada</div>}

      {disciplines.map(disc => {
        const isDiscExpanded = expanded[`news-disc-${disc}`];
        return (
          <div key={`news-disc-${disc}`} className="mb-1">
            <button 
              onClick={() => toggle(`news-disc-${disc}`)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-emerald-50/50 transition-colors group"
            >
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{disc}</span>
              {isDiscExpanded ? <ChevronDown size={14} className="text-slate-400 group-hover:text-emerald-500"/> : <ChevronRight size={14} className="text-slate-400 group-hover:text-emerald-500"/>}
            </button>
            {isDiscExpanded && (
              <div className="mt-1 pl-2 ml-2 border-l border-slate-100">
                {Object.keys(newsGroups[disc]).sort((a,b) => parseInt(b) - parseInt(a)).map(yearStr => {
                  const year = parseInt(yearStr);
                  const isYearExpanded = expanded[`news-year-${disc}-${year}`];
                  return (
                    <div key={`news-year-${disc}-${year}`} className="mb-1">
                      <button 
                        onClick={() => toggle(`news-year-${disc}-${year}`)}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors group"
                      >
                        <span className="text-xs font-bold text-slate-500">{year}</span>
                        {isYearExpanded ? <ChevronDown size={12} className="text-slate-400"/> : <ChevronRight size={12} className="text-slate-400"/>}
                      </button>
                      
                      {isYearExpanded && (
                         <div className="mt-1 pl-2 ml-2 border-l border-slate-100">
                           {Object.keys(newsGroups[disc][year]).sort((a, b) => {
                              const legA = legislations.find(l => l.id === a);
                              const legB = legislations.find(l => l.id === b);
                              return (legA?.title || '').localeCompare(legB?.title || '');
                           }).map(legId => {
                              const leg = legislations.find(l => l.id === legId);
                              if (!leg) return null;
                              const isLegExpanded = expanded[`news-leg-${legId}-${year}`];
                              return (
                                <div key={`news-leg-${legId}-${year}`} className="mb-1">
                                  <button 
                                    onClick={() => toggle(`news-leg-${legId}-${year}`)}
                                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors group"
                                  >
                                    <span className="text-[11px] font-medium text-slate-600 truncate">{leg.title}</span>
                                    {isLegExpanded ? <ChevronDown size={10} className="text-slate-400"/> : <ChevronRight size={10} className="text-slate-400"/>}
                                  </button>
                                  {isLegExpanded && (
                                    <div className="mt-1 pl-2 ml-2 border-l border-slate-100 flex flex-col gap-0.5">
                                      {newsGroups[disc][year][legId].map(node => (
                                         <a 
                                           key={node.id}
                                           href={`#node-${node.id}`}
                                           onClick={(e) => { e.preventDefault(); navigateToNode(leg.id, node.id); }}
                                           className="text-[11px] text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded truncate block transition-colors"
                                         >
                                           {node.label || node.text.substring(0, 30)}
                                         </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                           })}
                         </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </>
  );
}

function TagsNotebook({ navigateToNode }: { navigateToNode: (legId: string, nodeId: string) => void }) {
  const { legislations, articleTags, personalTags } = useStore();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setExpanded(prev => ({...prev, [id]: !prev[id]}));

  const tagsGroups: Record<string, Record<string, Record<string, LawNode[]>>> = {};

  legislations.forEach(leg => {
    const disc = leg.discipline || 'Outros';
    
    const traverse = (node: LawNode) => {
      const nodeTags = articleTags[node.id];
      if (nodeTags && nodeTags.length > 0) {
         nodeTags.forEach(tagId => {
            if (!tagsGroups[tagId]) tagsGroups[tagId] = {};
            if (!tagsGroups[tagId][disc]) tagsGroups[tagId][disc] = {};
            if (!tagsGroups[tagId][disc][leg.id]) tagsGroups[tagId][disc][leg.id] = [];
            tagsGroups[tagId][disc][leg.id].push(node);
         });
      }
      if (node.children) node.children.forEach(traverse);
    };
    leg.nodes.forEach(traverse);
  });

  const tagIds = Object.keys(tagsGroups);
  if (tagIds.length === 0) return <div className="px-4 py-2 text-xs text-slate-400 italic">Nenhuma tag utilizada</div>;

  return (
    <>
      {tagIds.map(tagId => {
        const tag = personalTags.find(t => t.id === tagId);
        if (!tag) return null;
        
        const isTagExpanded = expanded[`tag-${tagId}`];
        return (
          <div key={`tag-${tagId}`} className="mb-1">
            <button 
              onClick={() => toggle(`tag-${tagId}`)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: tag.color === 'emerald' ? '#10b981' : tag.color === 'sky' ? '#0ea5e9' : tag.color === 'amber' ? '#f59e0b' : tag.color === 'rose' ? '#f43f5e' : tag.color === 'purple' ? '#a855f7' : '#94a3b8'}}></div>
                <span className="text-xs font-bold text-slate-600 truncate">{tag.name}</span>
              </div>
              {isTagExpanded ? <ChevronDown size={14} className="text-slate-400"/> : <ChevronRight size={14} className="text-slate-400"/>}
            </button>
            {isTagExpanded && (
              <div className="mt-1 pl-2 ml-2 border-l border-slate-100">
                {Object.keys(tagsGroups[tagId]).sort().map(disc => {
                  const isDiscExpanded = expanded[`tag-disc-${tagId}-${disc}`];
                  return (
                    <div key={`tag-disc-${tagId}-${disc}`} className="mb-1">
                      <button 
                        onClick={() => toggle(`tag-disc-${tagId}-${disc}`)}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors group"
                      >
                        <span className="text-[11px] font-bold text-slate-500 uppercase">{disc}</span>
                        {isDiscExpanded ? <ChevronDown size={12} className="text-slate-400"/> : <ChevronRight size={12} className="text-slate-400"/>}
                      </button>
                      
                      {isDiscExpanded && (
                         <div className="mt-1 pl-2 ml-2 border-l border-slate-100">
                           {Object.keys(tagsGroups[tagId][disc]).sort((a, b) => {
                              const legA = legislations.find(l => l.id === a);
                              const legB = legislations.find(l => l.id === b);
                              return (legA?.title || '').localeCompare(legB?.title || '');
                           }).map(legId => {
                              const leg = legislations.find(l => l.id === legId);
                              if (!leg) return null;
                              const isLegExpanded = expanded[`tag-leg-${tagId}-${legId}`];
                              return (
                                <div key={`tag-leg-${tagId}-${legId}`} className="mb-1">
                                  <button 
                                    onClick={() => toggle(`tag-leg-${tagId}-${legId}`)}
                                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors group"
                                  >
                                    <span className="text-[11px] font-medium text-slate-600 truncate">{leg.title}</span>
                                    {isLegExpanded ? <ChevronDown size={10} className="text-slate-400"/> : <ChevronRight size={10} className="text-slate-400"/>}
                                  </button>
                                  {isLegExpanded && (
                                    <div className="mt-1 pl-2 ml-2 border-l border-slate-100 flex flex-col gap-0.5">
                                      {tagsGroups[tagId][disc][legId].map(node => (
                                         <a 
                                           key={node.id}
                                           href={`#node-${node.id}`}
                                           onClick={(e) => { e.preventDefault(); navigateToNode(leg.id, node.id); }}
                                           className="text-[11px] text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 px-2 py-1 rounded truncate block transition-colors"
                                         >
                                           {node.label || node.text.substring(0, 30)}
                                         </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                           })}
                         </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </>
  );
}

