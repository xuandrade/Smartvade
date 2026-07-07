import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { LawNode, ExamBoard } from '../types';
import { Book, ChevronRight, Hash, Layers, Folder, Plus, ChevronDown, Trash2, Wand2 } from 'lucide-react';

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { 
    legislations, 
    currentLegislationId, 
    setCurrentLegislation,
    deleteLegislation,
    filters,
    setFilters,
    setShowCreateModal
  } = useStore();
  
  const currentLegislation = legislations.find(l => l.id === currentLegislationId);
  const [expandedTocs, setExpandedTocs] = useState<Record<string, boolean>>({});

  const toggleToc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTocs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderNode = (node: LawNode, depth: number = 0) => {
    // Show Livro, Titulo, Capitulo, Secao, Subsecao, Artigo
    if (!['livro', 'titulo', 'capitulo', 'secao', 'subsecao', 'artigo'].includes(node.type)) return null;
    
    let icon = <Hash size={12} className="text-gray-400" />;
    if (node.type === 'livro' || node.type === 'titulo') icon = <Book size={14} className="text-gray-600" />;
    if (node.type === 'capitulo') icon = <Layers size={12} className="text-gray-500" />;
    
    const isContainer = ['livro', 'titulo', 'capitulo', 'secao'].includes(node.type);

    return (
      <div key={node.id} className="flex flex-col">
        <a 
          href={`#node-${node.id}`}
          onClick={onClose}
          className={cn(
            "flex items-center gap-2 py-1.5 px-3 hover:bg-slate-100 hover:text-indigo-600 rounded-md text-xs transition-colors cursor-pointer",
            depth === 0 ? "font-bold text-slate-700 uppercase tracking-tighter mt-2" : "text-slate-600",
            depth === 1 ? "font-medium ml-2" : "",
            depth === 2 ? "ml-4 opacity-90" : "",
            depth > 2 ? `ml-${depth * 2 + 2} opacity-80` : ""
          )}
        >
          {icon}
          <span className="truncate" title={node.label}>{node.label}</span>
          
          {/* Badge Indicators for FGV if > 5 etc (we'd need incidence map, skipped here for performance in sidebar) */}
        </a>
        
        {isContainer && node.children && node.children.length > 0 && (
          <div className="flex flex-col">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Vade Mecum</p>
          <h2 className="text-sm font-semibold text-slate-700">Legislações</h2>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors"
          title="Nova Legislação"
        >
          <Plus size={16} />
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-2 space-y-1 pb-24">
        {legislations.map(leg => {
          const isActive = leg.id === currentLegislationId;
          const isExpanded = expandedTocs[leg.id];
          return (
             <div key={leg.id} className="mb-2">
               <div 
                 onClick={() => setCurrentLegislation(leg.id)}
                 className={cn(
                   "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors group",
                   isActive ? "bg-indigo-600 text-white" : "hover:bg-slate-100 text-slate-700"
                 )}
               >
                 <Folder size={16} className={isActive ? "text-white" : "text-slate-400"} />
                 <span className="font-semibold text-sm truncate flex-1">{leg.title}</span>
                 
                 {isActive && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); deleteLegislation(leg.id); }}
                     className="opacity-0 group-hover:opacity-100 text-indigo-200 hover:text-white p-1"
                   >
                     <Trash2 size={14} />
                   </button>
                 )}
                 <button 
                   onClick={(e) => toggleToc(leg.id, e)}
                   className={cn("p-1 rounded hover:bg-black/10", isActive ? "text-white" : "text-slate-400")}
                 >
                   {isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                 </button>
               </div>
               
               {isExpanded && (
                 <div className="mt-1 ml-2 border-l border-slate-200 pl-1">
                   {leg.nodes.map(node => renderNode(node, 0))}
                 </div>
               )}
             </div>
          );
        })}

        {legislations.length === 0 && (
          <div className="p-4 text-center text-sm text-slate-500 mt-10">
            Nenhuma legislação importada.<br/><br/>
            <button onClick={() => setShowCreateModal(true)} className="text-indigo-600 font-bold underline">Criar uma agora</button>
          </div>
        )}
      </nav>
      
      {/* Filters Footer */}
      <div className="p-4 mt-auto border-t border-slate-200 bg-[#F9FAFB] shrink-0">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Filtros Ativos</p>
        
        <div className="flex flex-col gap-3">
          <label className="flex items-center justify-between text-xs cursor-pointer group">
            <span className="font-semibold text-slate-600 uppercase tracking-tight">Ocultar Lidos</span>
            <div className={cn("w-8 h-4 rounded-full transition-colors relative", filters.showRead === false ? "bg-indigo-600" : "bg-slate-300")}>
              <div className={cn("absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform shadow-sm", filters.showRead === false ? "translate-x-4" : "translate-x-0")} />
            </div>
            <input type="checkbox" className="hidden" checked={filters.showRead === false} onChange={() => setFilters({ showRead: filters.showRead === false ? 'ALL' : false })} />
          </label>
          
          <label className="flex items-center justify-between text-xs cursor-pointer group">
            <span className="font-semibold text-slate-600 uppercase tracking-tight text-yellow-600">Apenas Favoritos</span>
            <div className={cn("w-8 h-4 rounded-full transition-colors relative", filters.showFavorites ? "bg-yellow-400" : "bg-slate-300")}>
              <div className={cn("absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform shadow-sm", filters.showFavorites ? "translate-x-4" : "translate-x-0")} />
            </div>
            <input type="checkbox" className="hidden" checked={filters.showFavorites} onChange={() => setFilters({ showFavorites: !filters.showFavorites })} />
          </label>

          <div className="flex flex-col gap-1 mt-2">
            <span className="font-semibold text-slate-600 uppercase tracking-tight text-xs">Banca</span>
            <select 
              value={filters.board} 
              onChange={e => setFilters({ board: e.target.value as ExamBoard | 'ALL' })}
              className="bg-white border border-slate-200 rounded p-1 text-xs text-slate-700 outline-none"
            >
              <option value="ALL">Todas</option>
              <option value="FGV">FGV</option>
              <option value="FCC">FCC</option>
              <option value="CEBRASPE">CEBRASPE</option>
              <option value="PRÓPRIA">PRÓPRIA</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-slate-600 uppercase tracking-tight text-xs">Incidência Mínima</span>
            <input 
              type="range" 
              min="0" 
              max="15" 
              value={filters.minIncidence} 
              onChange={e => setFilters({ minIncidence: parseInt(e.target.value) })}
              className="w-full"
            />
            <span className="text-[10px] text-slate-400 text-right">{filters.minIncidence === 0 ? 'Qualquer' : `>= ${filters.minIncidence} vezes`}</span>
          </div>

          <div className="flex flex-col gap-1 mt-2">
            <span className="font-semibold text-slate-600 uppercase tracking-tight text-xs flex items-center gap-1"><Wand2 size={12} className="text-indigo-600"/> Regra de Auto-Grifo (IA)</span>
            <textarea 
              className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 resize-y min-h-[50px] shadow-sm leading-tight"
              value={filters.colorCodeConfig || ''}
              onChange={(e) => setFilters({ colorCodeConfig: e.target.value })}
              placeholder="Ex: Prazos em green, verbos em bold..."
            />
          </div>

        </div>
      </div>
    </>
  );
}
