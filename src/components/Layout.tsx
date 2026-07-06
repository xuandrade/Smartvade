import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Sidebar } from './Sidebar';
import { Reader } from './Reader';
import { RightDrawer } from './RightDrawer';
import { CreateLegislationModal } from './CreateLegislationModal';
import { SRSReviewDeck } from './SRSReviewDeck';
import { cn } from '../lib/utils';
import { Menu, X, Plus, Book, FileText, Brain } from 'lucide-react';

export function Layout() {
  const { 
    legislations, 
    currentLegislationId, 
    focusMode, 
    toggleFocusMode,
    showCreateModal,
    setShowCreateModal,
    mobileMenuOpen,
    toggleMobileMenu,
    showReviewMode,
    setShowReviewMode,
    srsTracking
  } = useStore();

  const currentLeg = legislations.find(l => l.id === currentLegislationId);
  const dueCount = Object.values(srsTracking).filter(s => s.nextReviewDate <= Date.now()).length;

  return (
    <div className="h-screen bg-[#FDFDFB] text-slate-900 font-sans flex flex-col overflow-hidden relative">
      {/* Top Header / Control Bar */}
      <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">SV</div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-800 hidden sm:block">
            Smart Vade <span className="text-indigo-600 font-light italic">Interativo</span>
          </h1>
          {currentLeg && !showReviewMode && (
            <>
              <span className="text-slate-300 hidden md:block">|</span>
              <span className="text-sm font-bold text-slate-500 tracking-tight">{currentLeg.title}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button 
              onClick={() => setShowReviewMode(!showReviewMode)} 
              className={cn(
                "px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 relative border",
                showReviewMode ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Brain size={14} /> <span className="hidden sm:inline">REVISÃO SRS</span>
              {dueCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[9px] text-white items-center justify-center font-bold">
                    {dueCount > 9 ? '9+' : dueCount}
                  </span>
                </span>
              )}
            </button>
            <button 
              onClick={toggleFocusMode} 
              className={cn(
                "px-3 py-1.5 border rounded text-xs font-semibold uppercase transition-colors hidden sm:block",
                focusMode ? "bg-slate-800 text-white border-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
            >
              MODO FOCO
            </button>
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold uppercase hover:bg-indigo-700 transition-colors flex items-center gap-1"
            >
              <Plus size={14} /> <span className="hidden sm:inline">NOVA LEI</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        {!showReviewMode && (
          <div 
            className={cn(
              "absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 w-72 bg-[#F9FAFB] border-r border-slate-200 flex flex-col shrink-0",
              focusMode ? "md:-translate-x-full md:hidden md:w-0" : "",
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <Sidebar onClose={() => { if(mobileMenuOpen) toggleMobileMenu() }} />
          </div>
        )}

        {/* Overlay for mobile sidebar */}
        {mobileMenuOpen && !showReviewMode && (
           <div 
             className="md:hidden fixed inset-0 bg-slate-900/20 z-30 backdrop-blur-sm"
             onClick={toggleMobileMenu}
           />
        )}

        {/* Main Content Area */}
        {showReviewMode ? (
          <SRSReviewDeck />
        ) : (
          <main className="flex-1 bg-[#FDFDFB] p-0 md:p-8 overflow-y-auto relative scroll-smooth flex flex-col items-center">
            {currentLegislationId ? (
              <Reader />
            ) : (
              <div className="m-auto text-center max-w-md p-8">
                 <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-500">
                    <Book size={32} />
                 </div>
                 <h2 className="text-xl font-bold text-slate-800 mb-2">Nenhuma lei selecionada</h2>
                 <p className="text-slate-500 mb-6 text-sm">Selecione uma legislação na barra lateral ou crie uma nova para começar a estudar.</p>
                 <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded shadow-sm hover:bg-indigo-700 mx-auto flex items-center gap-2">
                    <FileText size={18} /> Adicionar Legislação
                 </button>
              </div>
            )}
          </main>
        )}
      </div>

      {/* Right Drawer */}
      <RightDrawer />
      
      {/* Create Modal */}
      {showCreateModal && <CreateLegislationModal />}
    </div>
  );
}
