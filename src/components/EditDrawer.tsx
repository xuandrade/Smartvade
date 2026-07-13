import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { LawNode } from '../types';

export function EditDrawer() {
  const { 
    editDrawerOpen, 
    editDrawerAction, 
    editDrawerNodeId, 
    closeEditDrawer,
    currentLegislationId,
    legislations,
    updateLawNode,
    insertLawNode,
    removeLawNode
  } = useStore();

  const [text, setText] = useState('');
  const [label, setLabel] = useState('');
  const [heading, setHeading] = useState('');
  
  const legislation = legislations.find(l => l.id === currentLegislationId);
  
  // Recursively find the node to populate initial state
  const findNode = (nodes: LawNode[], id: string): LawNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const node = editDrawerNodeId && legislation ? findNode(legislation.nodes, editDrawerNodeId) : null;

  useEffect(() => {
    if (node) {
      if (editDrawerAction === 'edit_text') {
        setText(node.text);
      } else {
        setText('');
        setLabel('');
        setHeading('');
      }
    }
  }, [node, editDrawerAction]);

  if (!editDrawerOpen || !legislation || !node) return null;

  const handleSave = () => {
    if (editDrawerAction === 'edit_text') {
      updateLawNode(legislation.id, node.id, { text });
    } else if (editDrawerAction === 'toggle_revoke') {
       const isRevoked = node.text.toLowerCase().includes('revogado');
       if (isRevoked) {
           updateLawNode(legislation.id, node.id, { text: node.text.replace(/ \(Revogado\)/i, '').replace(/Revogado\./i, '').trim() });
       } else {
           updateLawNode(legislation.id, node.id, { text: node.text + ' (Revogado)' });
       }
    } else if (editDrawerAction === 'insert_above' || editDrawerAction === 'insert_below' || editDrawerAction === 'insert_child') {
      const newNode: LawNode = {
        id: crypto.randomUUID(),
        type: editDrawerAction === 'insert_child' ? 'inciso' : node.type,
        label: label,
        text: `${label} ${text}`,
        heading: heading || undefined,
        children: []
      };
      const pos = editDrawerAction === 'insert_above' ? 'before' : editDrawerAction === 'insert_below' ? 'after' : 'child';
      insertLawNode(legislation.id, node.id, pos, newNode);
    } else if (editDrawerAction === 'duplicate') {
      const newNode: LawNode = {
        ...node,
        id: crypto.randomUUID(),
        label: node.label + ' (Cópia)'
      };
      insertLawNode(legislation.id, node.id, 'after', newNode);
    } else if (editDrawerAction === 'delete_manual') {
      removeLawNode(legislation.id, node.id);
    } else if (editDrawerAction === 'register_change') {
      // Just an example structure
      updateLawNode(legislation.id, node.id, { text: node.text + ` (Redação dada por ${label})` });
    }
    
    closeEditDrawer();
  };

  const renderContent = () => {
    switch (editDrawerAction) {
      case 'edit_text':
        return (
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-slate-800">Editar Texto</h3>
            <textarea 
              value={text} 
              onChange={e => setText(e.target.value)} 
              className="w-full h-64 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none resize-none font-serif"
            />
          </div>
        );
      case 'register_change':
        return (
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-slate-800">Registrar Alteração Legislativa</h3>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lei Alteradora</label>
              <input 
                value={label} 
                onChange={e => setLabel(e.target.value)} 
                placeholder="Ex: Lei nº 14.123/2021" 
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo da alteração</label>
              <select className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none bg-white">
                <option>Alteração de texto</option>
                <option>Inclusão</option>
                <option>Revogação</option>
                <option>Renumeração</option>
              </select>
            </div>
          </div>
        );
      case 'insert_above':
      case 'insert_below':
      case 'insert_child':
        return (
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-slate-800">Inserir Dispositivo</h3>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rótulo (Número/Inciso)</label>
              <input 
                value={label} 
                onChange={e => setLabel(e.target.value)} 
                placeholder={editDrawerAction === 'insert_child' ? "Ex: I -" : "Ex: Art. 1º-A"} 
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none"
              />
            </div>
            {editDrawerAction !== 'insert_child' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cabeçalho (Opcional)</label>
                <input 
                  value={heading} 
                  onChange={e => setHeading(e.target.value)} 
                  placeholder="Ex: Dos Crimes Contra a Vida" 
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none"
                />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Texto</label>
              <textarea 
                value={text} 
                onChange={e => setText(e.target.value)} 
                placeholder="Texto do dispositivo..."
                className="w-full h-40 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 outline-none resize-none"
              />
            </div>
          </div>
        );
      case 'delete_manual':
        return (
          <div className="flex flex-col gap-4 text-center items-center p-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">
              <X size={24} />
            </div>
            <h3 className="font-bold text-slate-800">Confirmar Exclusão</h3>
            <p className="text-sm text-slate-500">Tem certeza que deseja excluir este dispositivo? Essa ação não pode ser desfeita para dispositivos criados manualmente.</p>
          </div>
        );
      case 'toggle_revoke':
        return (
          <div className="flex flex-col gap-4 text-center items-center p-4">
            <h3 className="font-bold text-slate-800">Alterar Status</h3>
            <p className="text-sm text-slate-500">O dispositivo será marcado/desmarcado como revogado.</p>
          </div>
        );
      case 'duplicate':
        return (
          <div className="flex flex-col gap-4 text-center items-center p-4">
            <h3 className="font-bold text-slate-800">Duplicar Dispositivo</h3>
            <p className="text-sm text-slate-500">Uma cópia deste dispositivo será inserida logo abaixo dele.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Backdrop overlay for mobile (optional) but we want to keep law visible at background */}
      <div 
        className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white border-l border-slate-200 shadow-[0_0_40px_rgba(0,0,0,0.1)] z-50 flex flex-col animate-in slide-in-from-right duration-300"
      >
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100 shrink-0">
          <h2 className="font-bold text-slate-800 tracking-tight">Ferramentas de Edição</h2>
          <button 
            onClick={closeEditDrawer}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {renderContent()}
        </div>

        <div className="p-6 border-t border-slate-100 bg-white flex gap-3 shrink-0">
          <button 
            onClick={closeEditDrawer}
            className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className={cn(
              "flex-1 px-4 py-3 rounded-xl font-bold text-white transition-colors",
              editDrawerAction === 'delete_manual' 
                ? "bg-red-600 hover:bg-red-700" 
                : "bg-teal-600 hover:bg-teal-700"
            )}
          >
            {editDrawerAction === 'delete_manual' ? 'Excluir' : 'Salvar Alteração'}
          </button>
        </div>
      </div>
    </>
  );
}
