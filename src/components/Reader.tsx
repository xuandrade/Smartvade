import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { LawNode, Legislation } from '../types';
import { ArticleCard } from './ArticleCard';
import { Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function Reader() {
  const { getCurrentLegislation, focusMode, toggleFocusMode, filters, articleTags } = useStore();
  const leg = getCurrentLegislation();

  if (!leg) return null;


  const passesFilters = (node: LawNode, leg: Legislation) => {
     if (node.type !== 'artigo' && node.type !== 'paragrafo' && node.type !== 'inciso' && node.type !== 'alinea') return true;
     
     if (filters.showFavorites && !node.isFavorite) return false;
     
     if (filters.showRead !== 'ALL') {
        if (filters.showRead === true && !node.isRead) return false;
        if (filters.showRead === false && node.isRead) return false;
     }
     
     if (filters.minIncidence > 0 || filters.board !== 'ALL') {
        const board = filters.board === 'ALL' ? 'FGV' : filters.board; // fallback if ALL but minIncidence > 0
        const incidence = leg.incidences?.[board]?.[node.id] || 0;
        if (incidence < filters.minIncidence) return false;
     }
     
     if (filters.tagFilter && filters.tagFilter !== 'ALL') {
        const tags = articleTags[node.id] || [];
        if (filters.tagFilter === 'NONE' && tags.length > 0) return false;
        if (filters.tagFilter === 'MULTIPLE' && tags.length < 2) return false;
        if (filters.tagFilter !== 'NONE' && filters.tagFilter !== 'MULTIPLE' && !tags.includes(filters.tagFilter)) return false;
     }
     
     return true;
  };

  const renderRecursive = (nodes: LawNode[]) => {
    return nodes.map((node) => {
      // Container nodes
      if (['livro', 'titulo', 'capitulo', 'secao', 'subsecao'].includes(node.type)) {
        return (
          <div key={node.id} id={`node-${node.id}`} className="mb-10 text-center mt-12">
            <div className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full uppercase tracking-widest mb-4">
              {node.label}
            </div>
            <h2 className="text-2xl font-bold font-sans tracking-tight text-stone-800 mb-2 px-4">
              {node.text.replace(/^(LIVRO|TÍTULO|CAPÍTULO|SEÇÃO|SUBSEÇÃO)\s+[IVXLCDM]+\s*-\s*/i, '')}
            </h2>
            <div className="h-1 w-12 bg-blush-600 mx-auto rounded-full mt-4"></div>
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
           <p key={node.id} className="text-stone-500 mb-4 font-sans text-center text-sm">{node.text}</p>
        );
      }

      // Article Card (Artigos and their children)
      if (node.type === 'artigo' || node.type === 'paragrafo' || node.type === 'inciso' || node.type === 'alinea') {
         if (!passesFilters(node, leg)) return null;
         return <ArticleCard key={node.id} node={node} legislation={leg} />;
      }
      return null;
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 relative pb-48 w-full">
      {/* Focus Mode Toggle (Mobile Only) */}
      <button 
        onClick={toggleFocusMode}
        className="md:hidden fixed top-20 right-4 z-40 bg-white/80 backdrop-blur-md border border-stone-200 p-2.5 rounded-full shadow-sm hover:shadow-md transition-all text-stone-700"
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
