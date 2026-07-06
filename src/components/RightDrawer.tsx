import React from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { BookOpen, X, MessageSquare, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function RightDrawer() {
  const { rightPanelOpen, toggleRightPanel, activeNodeId, getCurrentLegislation, annotations } = useStore();

  // Find the active node recursively
  const findNode = (nodes: any[], id: string): any => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const currentLeg = getCurrentLegislation();
  const activeNode = activeNodeId && currentLeg ? findNode(currentLeg.nodes, activeNodeId) : null;
  const nodeAnnotations = activeNodeId ? (annotations[activeNodeId] || []) : [];

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-40 w-80 bg-white border-l border-slate-200 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl",
        rightPanelOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-2 text-slate-700">
          <BookOpen size={18} />
          <h2 className="font-bold text-sm tracking-tight uppercase">Gaveta de Estudos</h2>
        </div>
        <button onClick={() => toggleRightPanel()} className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeNode ? (
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Foco Atual</p>
              <h3 className="font-serif text-lg font-bold text-slate-800">{activeNode.label}</h3>
              <p className="text-sm text-slate-600 line-clamp-3 mt-1 font-serif italic border-l-2 border-indigo-200 pl-2">
                {activeNode.text.substring(0, 100)}...
              </p>
            </div>

            {/* Súmulas Mock (Static for demonstration) */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={14} className="text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Súmulas Relacionadas</h4>
              </div>
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 text-sm text-slate-700">
                <p className="font-bold text-indigo-800 mb-1">Súmula Vinculante 14</p>
                <p className="text-xs leading-relaxed">É direito do defensor, no interesse do representado, ter acesso amplo aos elementos de prova que digam respeito ao exercício do direito de defesa.</p>
              </div>
            </div>

            {/* Annotations List */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={14} className="text-slate-400" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Suas Anotações</h4>
              </div>
              
              {nodeAnnotations.length > 0 ? (
                <div className="space-y-3">
                  {nodeAnnotations.map(ann => (
                    <div key={ann.id} className="p-3 bg-yellow-50/50 border border-yellow-100 rounded-lg text-sm text-slate-700 font-serif italic">
                      <ReactMarkdown>{ann.content}</ReactMarkdown>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">Nenhuma anotação neste dispositivo.</p>
              )}
            </div>
            
            {/* AI Context */}
            {activeNode.metadata?.alertas_fgv && (
               <div>
                 <div className="flex items-center gap-2 mb-3">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-amber-600">Doutrina / Dica</h4>
                 </div>
                 <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-900 leading-relaxed">
                   {activeNode.metadata.alertas_fgv}
                 </div>
               </div>
            )}
            
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-4">
            <BookOpen size={48} className="opacity-20" />
            <p className="text-sm">Selecione um artigo para ver os materiais de apoio.</p>
          </div>
        )}
      </div>
    </div>
  );
}
