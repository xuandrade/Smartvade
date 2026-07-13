import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Plus, Trash2, Edit2, Tag as TagIcon } from 'lucide-react';
import { PersonalTag } from '../types';
import { cn } from '../lib/utils';

export function PersonalTagsModal({ onClose }: { onClose: () => void }) {
  const { personalTags, addPersonalTag, updatePersonalTag, deletePersonalTag } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('blue');
  
  const colors = ['blue', 'rose', 'green', 'amber', 'purple', 'sky', 'emerald', 'stone'];
  
  const handleSave = () => {
    if (!name.trim()) return;
    if (editingId) {
       updatePersonalTag(editingId, { name, color });
       setEditingId(null);
    } else {
       addPersonalTag({ name, color });
    }
    setName('');
    setColor('blue');
  };
  
  const handleEdit = (t: PersonalTag) => {
    setEditingId(t.id);
    setName(t.name);
    setColor(t.color);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <div>
            <h2 className="text-xl font-black text-stone-800 tracking-tighter uppercase">Minhas Tags</h2>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex gap-2 mb-4">
             <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome da tag..." className="flex-1 p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 text-sm font-medium focus:outline-none focus:border-stone-400" />
             <button onClick={handleSave} className="px-4 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors font-bold text-sm">
                {editingId ? 'Salvar' : 'Criar'}
             </button>
          </div>
          
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
             {colors.map(c => {
                const bgMap: Record<string, string> = { blue: 'bg-blue-400', rose: 'bg-rose-400', green: 'bg-green-400', amber: 'bg-amber-400', purple: 'bg-purple-400', sky: 'bg-sky-400', emerald: 'bg-emerald-400', stone: 'bg-stone-400' };
                return (
                  <button 
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn("w-8 h-8 rounded-full shrink-0 border-2 transition-transform", color === c ? "border-stone-900 scale-110" : "border-transparent", bgMap[c])}
                  />
                );
             })}
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
             {personalTags.map(t => {
                const colorMap: Record<string, string> = { blue: 'bg-blue-500', rose: 'bg-rose-500', green: 'bg-green-500', amber: 'bg-amber-500', purple: 'bg-purple-500', sky: 'bg-sky-500', emerald: 'bg-emerald-500', stone: 'bg-stone-500' };
                return (
                <div key={t.id} className="flex justify-between items-center p-3 border border-stone-100 rounded-xl hover:bg-stone-50 group">
                   <div className="flex items-center gap-3">
                      <span className={cn("w-3 h-3 rounded-full", colorMap[t.color] || 'bg-stone-500')}></span>
                      <span className="font-bold text-stone-700 text-sm">{t.name}</span>
                   </div>
                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(t)} className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded"><Edit2 size={14}/></button>
                      <button onClick={() => deletePersonalTag(t.id)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded"><Trash2 size={14}/></button>
                   </div>
                </div>
                );
             })}
{personalTags.length === 0 && (
                <p className="text-center text-sm font-medium text-stone-400 italic py-4">Nenhuma tag criada.</p>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
