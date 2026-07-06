import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { LawNode } from '../types';
import { ArticleCard } from './ArticleCard';
import { Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function Reader() {
  const { getCurrentLegislation, focusMode, toggleFocusMode } = useStore();
  const leg = getCurrentLegislation();

  if (!leg) return null;

  const renderRecursive = (nodes: LawNode[]) => {
    return nodes.map((node) => {
      // Container nodes
      if (['livro', 'titulo', 'capitulo', 'secao', 'subsecao'].includes(node.type)) {
        return (
          <div key={node.id} id={`node-${node.id}`} className="mb-10 text-center mt-12">
            <div className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full uppercase tracking-widest mb-4">
              {node.label}
            </div>
            <h2 className="text-3xl font-serif text-slate-900 mb-2 italic px-4">
              {node.text.replace(/^(LIVRO|TÍTULO|CAPÍTULO|SEÇÃO|SUBSEÇÃO)\s+[IVXLCDM]+\s*-\s*/i, '')}
            </h2>
            <div className="h-1 w-12 bg-indigo-600 mx-auto rounded-full mt-4"></div>
            {node.children && node.children.length > 0 && (
              <div className="mt-8 text-left">
                {renderRecursive(node.children)}
              </div>
            )}
          </div>
        );
      }
      
      // Pure text or unsupported types fallback
      if (node.type === 'texto_puro') {
        return (
           <p key={node.id} className="text-gray-500 italic mb-4 font-serif text-center">{node.text}</p>
        );
      }

      // Article Card (Artigos and their children)
      if (node.type === 'artigo') {
         return <ArticleCard key={node.id} node={node} legislation={leg} />;
      }
      
      // If a paragrafo/inciso somehow appears at top level
      return <ArticleCard key={node.id} node={node} legislation={leg} />;
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 relative pb-48 w-full">
      {/* Focus Mode Toggle (Mobile Only) */}
      <button 
        onClick={toggleFocusMode}
        className="md:hidden fixed top-20 right-4 z-40 bg-white/80 backdrop-blur-md border border-slate-200 p-2.5 rounded-full shadow-sm hover:shadow-md transition-all text-slate-700"
        title={focusMode ? "Sair do Modo Foco" : "Modo Foco"}
      >
        {focusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>

      <div className="space-y-6">
        {renderRecursive(leg.nodes)}
      </div>
    </div>
  );
}
