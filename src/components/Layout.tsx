import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Sidebar } from './Sidebar';
import { Reader } from './Reader';

import { CreateLegislationModal } from './CreateLegislationModal';
import { SRSReviewDeck } from './SRSReviewDeck';
import { RetaFinalModal } from './RetaFinalModal';
import { RetaFinalReader } from './RetaFinalReader';
import { PersonalTagsModal } from './PersonalTagsModal';
import { BackupModal } from './BackupModal';
import { BackupReminder } from './BackupReminder';
import { Dashboard } from './Dashboard';
import { GlobalSearchOverlay } from './GlobalSearchOverlay';
import { RichTextToolbar } from './RichTextToolbar';
import { EditDrawer } from './EditDrawer';
import { cn } from '../lib/utils';
import { Menu, X, Plus, Book, FileText, Brain, Search, SlidersHorizontal, BarChart2, Award } from 'lucide-react';
import { ExamBoard } from '../types';

export function Layout() {
  const { 
    activeRetaFinalId,
    legislations, 
    currentLegislationId, 
    focusMode, 
    toggleFocusMode,
    showCreateModal,
    setShowCreateModal,
    mobileMenuOpen,
    toggleMobileMenu,
    showReviewMode,
    showDashboard,
    setShowDashboard,
    setShowReviewMode,
    srsTracking,
    filters,
    setFilters,
    incrementStudyTime,
    sidebarCollapsed,
    toggleSidebar,
    editMode,
    setEditMode
  } = useStore();

  const [showFilterTray, setShowFilterTray] = useState(false);
  const [showRetaFinalModal, setShowRetaFinalModal] = useState<string | boolean>(false);
  const [showPersonalTagsModal, setShowPersonalTagsModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);

  useEffect(() => {
    const handleOpenRF = (e: Event) => {
      const customEvent = e as CustomEvent<{ projectId?: string }>;
      setShowRetaFinalModal(customEvent.detail?.projectId || true);
    };
    window.addEventListener('open-reta-final-modal', handleOpenRF as EventListener);
    const handleOpenTags = () => setShowPersonalTagsModal(true);
    window.addEventListener('open-personal-tags-modal', handleOpenTags);
    const handleOpenBackup = () => setShowBackupModal(true);
    window.addEventListener('open-backup-modal', handleOpenBackup);
    return () => {
      window.removeEventListener('open-reta-final-modal', handleOpenRF as EventListener);
      window.removeEventListener('open-personal-tags-modal', handleOpenTags);
      window.removeEventListener('open-backup-modal', handleOpenBackup);
    };
  }, []);

  // Global Study Timer: highly accurate and optimized with focus detection
  useEffect(() => {
    let lastTick = Date.now();
    
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - lastTick;
      lastTick = now;
      
      // Only increment if window is active and document is visible
      if (!document.hidden) {
        const seconds = Math.floor(elapsedMs / 1000);
        if (seconds > 0) {
          incrementStudyTime(seconds);
        }
      }
    }, 1000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        lastTick = Date.now(); // reset tick when coming back to prevent giant jumps
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [incrementStudyTime]);

  const currentLeg = legislations.find(l => l.id === currentLegislationId);
  const dueCount = Object.values(srsTracking).filter(s => s.nextReviewDate <= Date.now()).length;

  return (
    <div className="h-screen bg-slate-50/50 text-slate-900 font-sans flex flex-col overflow-hidden relative">
      {/* Top Header / Control Bar */}
      <header className="h-16 border-b border-cyan-500/10 flex items-center justify-between px-6 bg-white/70 backdrop-blur-md shrink-0 z-10 shadow-[0_4px_20px_-4px_rgba(6,182,212,0.08)]">
        <div className="flex items-center gap-4">
          <button 
            className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="w-8 h-8 bg-gradient-to-tr from-cyan-400 to-indigo-500 rounded-lg flex items-center justify-center text-white font-extrabold text-sm tracking-tight shadow-[0_0_12px_rgba(6,182,212,0.4)]">SV</div>
          <h1 className="text-lg font-bold tracking-tight text-slate-800 hidden lg:block font-serif">
            Smart Vade <span className="bg-gradient-to-r from-cyan-500 to-indigo-500 bg-clip-text text-transparent font-light italic">Interativo</span>
          </h1>
          {currentLeg && !showReviewMode && (
            <>
              <span className="text-slate-200 hidden lg:block">|</span>
              <span className="text-xs font-bold text-slate-500 bg-slate-100/80 px-2 py-1 rounded-md tracking-tight max-w-[150px] truncate hidden md:block border border-slate-200/50">{currentLeg.title}</span>
            </>
          )}
        </div>

        {/* Global Search Bar */}
        {!activeRetaFinalId && !showReviewMode && !showDashboard && (
        <div className="flex-1 max-w-xl px-4 flex items-center gap-2">
           <div className="relative flex-1">
             <input
               type="text"
               placeholder="Pesquisar na legislação (artigos, palavras, sumário)..."
               className="w-full pl-9 pr-4 py-2 bg-white/80 border border-cyan-500/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:bg-white focus:shadow-[0_0_15px_rgba(6,182,212,0.12)] transition-all placeholder:text-slate-400 text-slate-800 font-sans"
               value={filters.searchQuery}
               onChange={(e) => setFilters({ searchQuery: e.target.value })}
             />
             <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
           </div>
           <button 
             onClick={() => setShowFilterTray(!showFilterTray)}
             className={cn("p-2 rounded-xl border transition-all", showFilterTray ? "bg-cyan-500 text-white border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]" : "bg-white border-slate-200 text-slate-500 hover:border-cyan-400/50 hover:bg-slate-50")}
             title="Filtros avançados"
           >
             <SlidersHorizontal size={18} />
           </button>
        </div>
        )}
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button 
              onClick={() => setShowDashboard(!showDashboard)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border",
                showDashboard 
                  ? "bg-indigo-500 text-white border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]" 
                  : "bg-white text-slate-700 border-slate-200 hover:border-cyan-400/40 hover:bg-slate-50 hover:shadow-[0_0_10px_rgba(6,182,212,0.05)]"
              )}
            >
              <BarChart2 size={14} /> <span className="hidden sm:inline">DASHBOARD</span>
            </button>
            
            <button 
              onClick={() => setShowReviewMode(!showReviewMode)} 
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 relative border",
                showReviewMode 
                  ? "bg-cyan-500 text-white border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]" 
                  : "bg-white text-slate-700 border-slate-200 hover:border-cyan-400/40 hover:bg-slate-50 hover:shadow-[0_0_10px_rgba(6,182,212,0.05)]"
              )}
            >
              <Brain size={14} /> <span className="hidden sm:inline">REVISÃO SRS</span>
              {dueCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 text-[9px] text-white items-center justify-center font-bold">
                    {dueCount > 9 ? '9+' : dueCount}
                  </span>
                </span>
              )}
            </button>
            <button 
              onClick={() => setEditMode(!editMode)} 
              className={cn(
                "px-4 py-2 border rounded-xl text-xs font-semibold uppercase transition-all hidden lg:block",
                editMode 
                  ? "bg-teal-50 text-teal-600 border-teal-200 shadow-[0_0_10px_rgba(20,184,166,0.15)]" 
                  : "border-slate-200 text-slate-700 hover:border-teal-400/40 hover:bg-slate-50"
              )}
            >
              {editMode ? 'CONCLUIR EDIÇÃO' : 'EDITAR LEI'}
            </button>
            <button 
              onClick={toggleFocusMode} 
              className={cn(
                "px-4 py-2 border rounded-xl text-xs font-semibold uppercase transition-all hidden sm:block",
                focusMode 
                  ? "bg-slate-900 text-white border-slate-900 shadow-[0_0_15px_rgba(15,23,42,0.3)]" 
                  : "border-slate-200 text-slate-700 hover:border-cyan-400/40 hover:bg-slate-50"
              )}
            >
              MODO FOCO
            </button>
            <button 
              onClick={toggleSidebar} 
              className={cn(
                "p-2 border rounded-xl text-slate-500 hover:bg-slate-50 transition-all hidden md:block",
                sidebarCollapsed ? "bg-slate-100 border-slate-300" : "bg-white border-slate-200 hover:border-cyan-400/40"
              )}
              title={sidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
            >
              <Menu size={16} />
            </button>
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white rounded-xl text-xs font-semibold uppercase hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:brightness-105 transition-all flex items-center gap-1"
            >
              <Plus size={14} /> <span className="hidden sm:inline font-bold">NOVA LEI</span>
            </button>
          </div>
        </div>
      </header>

      {/* Edit Mode Banner */}
      {editMode && (
        <div className="bg-teal-50 border-b border-teal-100 px-6 py-1.5 flex justify-center items-center shrink-0 shadow-sm z-10 text-xs font-bold text-teal-700 tracking-widest uppercase">
          ✏️ Modo Editar Lei Ativo
        </div>
      )}

      {/* Secondary Filter Tray */}
      {showFilterTray && (
        <div className="bg-white border-b border-stone-100 px-6 py-3 flex flex-wrap items-center gap-4 shadow-sm z-10 shrink-0">
          
          <div className="flex items-center gap-3 border-r border-stone-100 pr-4">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Tags</span>
            <select 
               value={filters.tagFilter || 'ALL'} 
               onChange={e => setFilters({ tagFilter: e.target.value })}
               className="bg-stone-50 border border-stone-100 rounded p-1 text-xs text-stone-700 outline-none focus:ring-1 focus:ring-blush-500 font-medium max-w-[120px] truncate"
            >
              <option value="ALL">Todas</option>
              <option value="NONE">Sem Tags</option>
              <option value="MULTIPLE">Múltiplas Tags</option>
              {useStore.getState().personalTags.map(t => (
                 <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 border-r border-stone-100 pr-4">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Banca</span>
            <select 
               value={filters.board} 
               onChange={e => setFilters({ board: e.target.value as ExamBoard | 'ALL' })}
               className="bg-stone-50 border border-stone-100 rounded p-1 text-xs text-stone-700 outline-none focus:ring-1 focus:ring-blush-500 font-medium"
            >
              <option value="ALL">Todas as Bancas</option>
              <option value="FGV">FGV</option>
              <option value="FCC">FCC</option>
              <option value="CEBRASPE">CEBRASPE</option>
              <option value="PRÓPRIA">PRÓPRIA</option>
            </select>
          </div>
          
          <div className="flex items-center gap-3">
             <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Incidência Mínima</span>
             <input 
               type="range" 
               min="0" 
               max="15" 
               value={filters.minIncidence} 
               onChange={e => setFilters({ minIncidence: parseInt(e.target.value) })}
               className="w-24 accent-blush-500"
             />
             <span className="text-[10px] text-stone-500 font-bold w-12">{filters.minIncidence === 0 ? 'Qualquer' : `>= ${filters.minIncidence}x`}</span>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Search Overlay */}
        <GlobalSearchOverlay />

        {/* Sidebar */}
        
          <div 
            className={cn(
              "absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 bg-white/95 backdrop-blur-md border-r border-cyan-500/10 flex flex-col shrink-0 overflow-hidden shadow-xl md:shadow-none",
              sidebarCollapsed ? "md:w-0 md:border-r-0" : "w-72",
              focusMode ? "md:-translate-x-full md:hidden md:w-0" : "",
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="w-72 h-full flex flex-col">
              <Sidebar onClose={() => { if(mobileMenuOpen) toggleMobileMenu() }} />
            </div>
          </div>

        {/* Overlay for mobile sidebar */}
        {mobileMenuOpen && !showReviewMode && !showDashboard && (
           <div 
             className="md:hidden fixed inset-0 bg-slate-950/20 z-30 backdrop-blur-sm"
             onClick={toggleMobileMenu}
           />
        )}

        {/* Main Content Area */}
        {showDashboard ? (
          <Dashboard />
        ) : activeRetaFinalId ? (
          <main className="flex-1 overflow-y-auto">
            <RetaFinalReader />
          </main>

        ) : showReviewMode ? (
          <SRSReviewDeck />
        ) : (
          <main className="flex-1 bg-transparent p-0 md:p-8 overflow-y-auto relative scroll-smooth flex flex-col items-center">
            {currentLegislationId ? (
              <Reader />
            ) : (
              <div className="m-auto text-center max-w-md p-8 bg-white/80 backdrop-blur-md rounded-3xl border border-cyan-500/15 shadow-[0_10px_30px_rgba(6,182,212,0.06)]">
                 <div className="w-16 h-16 bg-cyan-50 border border-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                    <Book size={32} />
                 </div>
                 <h2 className="text-xl font-bold text-slate-800 mb-2">Nenhuma lei selecionada</h2>
                 <p className="text-slate-500 mb-6 text-sm font-sans">Selecione uma legislação na barra lateral ou crie uma nova para começar a estudar com inteligência.</p>
                 <button onClick={() => setShowCreateModal(true)} className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold rounded-xl shadow-[0_4px_15px_rgba(6,182,212,0.25)] hover:brightness-105 transition-all mx-auto flex items-center gap-2">
                    <FileText size={18} /> Adicionar Legislação
                 </button>
              </div>
            )}
          </main>
        )}
      </div>

      
      
      {/* Rich Text Toolbar for selections */}
      <RichTextToolbar />
      <EditDrawer />
      
      {/* Create Modal */}
      {showCreateModal && <CreateLegislationModal />}
      {showRetaFinalModal && (
        <RetaFinalModal 
          onClose={() => setShowRetaFinalModal(false)} 
          projectId={typeof showRetaFinalModal === 'string' ? showRetaFinalModal : undefined} 
        />
      )}
      {showPersonalTagsModal && <PersonalTagsModal onClose={() => setShowPersonalTagsModal(false)} />}
      {showBackupModal && <BackupModal onClose={() => setShowBackupModal(false)} />}
      <BackupReminder />
    </div>
  );
}
