import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit2, History, ArrowUpToLine, ArrowDownToLine, Copy, Trash2, XCircle, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { LawNode, Legislation } from '../types';
import { cn } from '../lib/utils';

export function EditModeMenu({ node, legislation }: { node: LawNode, legislation: Legislation }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { openEditDrawer, updateLawNode, removeLawNode } = useStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action: string) => {
    setIsOpen(false);
    openEditDrawer(action, node.id);
  };

  const isRevoked = node.text.toLowerCase().includes('revogado');

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2 rounded-xl transition-all shadow-sm border",
          isOpen 
            ? "bg-teal-50 border-teal-200 text-teal-600 shadow-[0_4px_12px_rgba(20,184,166,0.15)]" 
            : "bg-white text-slate-400 border-slate-200 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50"
        )}
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          <div className="py-2 flex flex-col">
            <button onClick={() => handleAction('edit_text')} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors w-full text-left font-medium">
              <Edit2 size={14} className="text-slate-400" /> Editar texto
            </button>
            <button onClick={() => handleAction('register_change')} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors w-full text-left font-medium">
              <History size={14} className="text-slate-400" /> Registrar alteração legislativa
            </button>
            
            <div className="h-px bg-slate-100 my-1 mx-4"></div>
            
            <button onClick={() => handleAction('insert_above')} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors w-full text-left">
              <ArrowUpToLine size={14} className="text-slate-400" /> Inserir artigo acima
            </button>
            <button onClick={() => handleAction('insert_below')} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors w-full text-left">
              <ArrowDownToLine size={14} className="text-slate-400" /> Inserir artigo abaixo
            </button>
            
            <div className="h-px bg-slate-100 my-1 mx-4"></div>
            
            <button onClick={() => handleAction('insert_child')} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors w-full text-left">
              <span className="font-serif italic font-bold text-slate-400 text-[10px] w-3.5 text-center">I</span> Inserir inciso, §, alínea...
            </button>
            
            <div className="h-px bg-slate-100 my-1 mx-4"></div>
            
            {!isRevoked ? (
              <button onClick={() => handleAction('toggle_revoke')} className="flex items-center gap-3 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors w-full text-left font-medium">
                <XCircle size={14} className="text-orange-400" /> Marcar como revogado
              </button>
            ) : (
              <button onClick={() => handleAction('toggle_revoke')} className="flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors w-full text-left font-medium">
                <RotateCcw size={14} className="text-emerald-400" /> Restaurar artigo
              </button>
            )}
            
            <button onClick={() => handleAction('duplicate')} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors w-full text-left">
              <Copy size={14} className="text-slate-400" /> Duplicar artigo
            </button>
            <button onClick={() => handleAction('delete_manual')} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left font-medium">
              <Trash2 size={14} className="text-red-400" /> Excluir (criados manualmente)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
