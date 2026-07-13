import React from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { Plus, Tag } from 'lucide-react';

export function ArticleTagsPopover({ nodeId, onClose }: { nodeId: string, onClose: () => void }) {
  const { personalTags, articleTags, toggleArticleTag } = useStore();
  const currentTags = articleTags[nodeId] || [];
  
  const colorMap: Record<string, string> = { blue: 'bg-blue-500', rose: 'bg-rose-500', green: 'bg-green-500', amber: 'bg-amber-500', purple: 'bg-purple-500', sky: 'bg-sky-500', emerald: 'bg-emerald-500', stone: 'bg-stone-500' };

  return (
    <div className="absolute right-0 bottom-12 z-30 w-64 bg-white rounded-xl shadow-xl border border-stone-100 p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-3">
         <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5"><Tag size={12}/> Tags Pessoais</h4>
      </div>
      
      <div className="space-y-1 max-h-48 overflow-y-auto mb-3">
         {personalTags.map(t => {
            const isActive = currentTags.includes(t.id);
            return (
              <label key={t.id} className="flex items-center gap-3 p-2 hover:bg-stone-50 rounded-lg cursor-pointer transition-colors group">
                 <input type="checkbox" checked={isActive} onChange={() => toggleArticleTag(nodeId, t.id)} className="w-4 h-4 rounded border-stone-300 text-stone-800 focus:ring-stone-800" />
                 <span className={cn("w-2 h-2 rounded-full", colorMap[t.color] || 'bg-stone-500')}></span>
                 <span className="font-semibold text-stone-700 text-sm truncate flex-1">{t.name}</span>
              </label>
            );
         })}
         {personalTags.length === 0 && (
            <p className="text-xs text-stone-400 italic text-center py-2">Nenhuma tag criada.</p>
         )}
      </div>
      
      <div className="pt-3 border-t border-stone-100">
         <button onClick={() => { onClose(); window.dispatchEvent(new CustomEvent('open-personal-tags-modal')); }} className="w-full py-2 bg-stone-50 hover:bg-stone-100 text-stone-600 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2">
            <Plus size={14} /> Gerenciar Tags
         </button>
      </div>
    </div>
  );
}
