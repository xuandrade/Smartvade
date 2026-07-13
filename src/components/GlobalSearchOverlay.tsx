import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { LawNode, Legislation } from '../types';
import { Search, Book, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export function GlobalSearchOverlay() {
  const { legislations, filters, setCurrentLegislation, setFilters, personalTags, articleTags, activeRetaFinalId, showReviewMode, showDashboard } = useStore();
  
  const query = filters.searchQuery.toLowerCase();

  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    
    const matches: { leg: Legislation; node: LawNode; breadcrumbs: string[] }[] = [];

    const traverse = (nodes: LawNode[], leg: Legislation, breadcrumbs: string[]) => {
      for (const node of nodes) {
        
        const textMatch = node.text?.toLowerCase().includes(query);
        const labelMatch = node.label.toLowerCase().includes(query);
        
        let tagMatch = false;
        const nTags = articleTags[node.id] || [];
        for (const tId of nTags) {
           const pTag = personalTags.find(t => t.id === tId);
           if (pTag && pTag.name.toLowerCase().includes(query)) {
              tagMatch = true;
              break;
           }
        }
        
        if (textMatch || labelMatch || tagMatch) {
          matches.push({ leg, node, breadcrumbs });
        }
        
        if (node.children && node.children.length > 0) {
          traverse(node.children, leg, [...breadcrumbs, node.label]);
        }
      }
    };

    legislations.forEach(leg => traverse(leg.nodes, leg, []));
    
    return matches.slice(0, 50); // Limit to 50 results for performance
  }, [query, legislations]);

  if (!query || query.length < 2) return null;

  return (
    <div className="absolute inset-0 bg-[#FDFDFB] z-20 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-2">
          <Search className="text-blush-600" /> Resultados da busca por "{filters.searchQuery}"
        </h2>
        
        {results.length === 0 ? (
          <div className="text-center p-12 text-stone-500">
            Nenhum resultado encontrado.
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((res, idx) => (
              <div 
                key={`${res.leg.id}-${res.node.id}-${idx}`}
                className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => {
                  setCurrentLegislation(res.leg.id);
                  setFilters({ searchQuery: '' });
                  setTimeout(() => {
                    const el = document.getElementById(`node-${res.node.id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 100);
                }}
              >
                <div className="flex items-center text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-2">
                  <Book size={12} className="mr-1" />
                  {res.leg.title}
                  {res.breadcrumbs.length > 0 && (
                    <>
                      <ChevronRight size={12} className="mx-1" />
                      {res.breadcrumbs[res.breadcrumbs.length - 1]}
                    </>
                  )}
                </div>
                <h3 className="text-sm font-bold text-stone-800 mb-1 group-hover:text-blush-600 transition-colors">
                  {res.node.label}
                </h3>
                <p className="text-stone-600 text-sm font-sans line-clamp-2">
                  {res.node.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
