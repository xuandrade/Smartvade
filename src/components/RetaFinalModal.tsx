import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Target, Calendar, Clock, BarChart2, Book, Zap, ArrowRight, Settings, Calculator } from 'lucide-react';
import { RetaFinalSettings, StudyBlock, LawNode, PriorityScore, Legislation } from '../types';
import { cn } from '../lib/utils';

export function RetaFinalModal({ onClose, projectId }: { onClose: () => void, projectId?: string }) {
  const { legislations, createRetaFinalProject, setActiveRetaFinalId, updateRetaFinalProject, retaFinalProjects } = useStore();
  
  const [step, setStep] = useState(1);
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  
  const [hoursPerDay, setHoursPerDay] = useState(4);
  const [studyDays, setStudyDays] = useState<number[]>([1,2,3,4,5]); 
  
  const [coverageLevel, setCoverageLevel] = useState(100);
  
  const [strategy, setStrategy] = useState({
    prioritizeIncidence: true,
    prioritizeNews: true,
    prioritizeFavorites: true,
    prioritizeCostBenefit: true,
  });
  
  const [favoriteBonus, setFavoriteBonus] = useState(5);
  const [legislativeBonus, setLegislativeBonus] = useState(10);
  
  const [selectedLegs, setSelectedLegs] = useState<string[]>([]);
  
  const [disciplineWeights, setDisciplineWeights] = useState<Record<string, number>>({});
  
  const [previewBlocks, setPreviewBlocks] = useState<StudyBlock[]>([]);

  React.useEffect(() => {
    if (projectId) {
      const proj = retaFinalProjects.find(p => p.id === projectId);
      if (proj) {
        setExamName(proj.settings.examName);
        setExamDate(proj.settings.examDate);
        setHoursPerDay(proj.settings.studyHoursPerDay);
        setStudyDays(proj.settings.studyDaysOfWeek);
        setCoverageLevel(proj.settings.coverageLevel);
        setStrategy(proj.settings.strategy);
        setFavoriteBonus(proj.settings.bonusConfig.favoriteBonus);
        setLegislativeBonus(proj.settings.bonusConfig.legislativeBonus);
        
        const existingLegIds = new Set<string>();
        proj.blocks.forEach(b => existingLegIds.add(b.lawId));
        setSelectedLegs(Array.from(existingLegIds));
        setDisciplineWeights(proj.settings.disciplineWeights);
      }
    }
  }, [projectId, retaFinalProjects]);

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const toggleDay = (day: number) => {
    if (studyDays.includes(day)) {
      setStudyDays(studyDays.filter(d => d !== day));
    } else {
      setStudyDays([...studyDays, day]);
    }
  };

  const toggleLeg = (id: string) => {
    if (selectedLegs.includes(id)) {
      setSelectedLegs(selectedLegs.filter(l => l !== id));
    } else {
      setSelectedLegs([...selectedLegs, id]);
    }
  };
  
  const calculateEngine = () => {
    const finalWeights = { ...disciplineWeights };
    const allDisciplines = Array.from(new Set(legislations.filter(l => selectedLegs.includes(l.id)).map(l => l.discipline || 'Outros')));
    allDisciplines.forEach(d => {
        if (!finalWeights[d]) finalWeights[d] = 10;
    });
    
    const cutoffYear = new Date().getFullYear() - 2;

    const blocks = [];
    
    legislations.filter(l => selectedLegs.includes(l.id)).forEach(leg => {
       const disc = leg.discipline || 'Outros';
       const discWeight = finalWeights[disc] || 1;
       
       const totalArticles = leg.nodes.reduce((acc, n) => {
           let count = 0;
           const walk = (node) => {
               if (node.type === 'artigo') count++;
               if (node.children) node.children.forEach(walk);
           }
           walk(n);
           return acc + count;
       }, 0);
       
       const costBenefitRatio = totalArticles > 0 ? (discWeight * 100) / totalArticles : 0;
       
       const traverse = (node, currentHierarchy) => {
           let newHierarchy = [...currentHierarchy];
           if (['livro', 'titulo', 'capitulo', 'secao', 'subsecao'].includes(node.type)) {
               newHierarchy.push(node.label + (node.heading ? ' - ' + node.heading : ''));
           }
           
           if (node.type === 'artigo') {
               let blockId = leg.id + '-' + newHierarchy.join('|');
               let block = blocks.find(b => b.id === blockId);
               if (!block) {
                   block = {
                       id: blockId,
                       discipline: disc,
                       lawId: leg.id,
                       lawTitle: leg.title,
                       hierarchy: newHierarchy,
                       articles: [],
                       priorityScore: 0,
                       estimatedTime: 0
                   };
                   blocks.push(block);
               }
               
               const incidence = Object.values(leg.incidences || {}).reduce((acc, curr) => acc + (curr[node.id] || 0), 0);
               
               let nodeScore = 0;
               if (strategy.prioritizeIncidence) nodeScore += incidence * 2;
               if (strategy.prioritizeFavorites && node.isFavorite) nodeScore += favoriteBonus;
               if (strategy.prioritizeNews && node.legislativeUpdate && node.legislativeUpdate.year >= cutoffYear) nodeScore += legislativeBonus;
               
               if (strategy.prioritizeCostBenefit) nodeScore += costBenefitRatio;
               
               block.priorityScore += nodeScore;
               
               let childCount = 1; 
               const countChildren = (n) => { childCount++; if(n.children) n.children.forEach(countChildren); };
               if (node.children) node.children.forEach(countChildren);
               
               block.estimatedTime += childCount * 0.5;
               
               // we will do the priority assignment later because typescript LawNode doesn't have _tempPriorityScore
               // let's do it directly in an array
               block.articles.push({ node, score: nodeScore });
           } else {
               if (node.children) node.children.forEach(c => traverse(c, newHierarchy));
           }
       };
       
       leg.nodes.forEach(n => traverse(n, []));
    });
    
    blocks.sort((a, b) => b.priorityScore - a.priorityScore);
    
    blocks.forEach(block => {
       const sortedArticles = [...block.articles].sort((a, b) => b.score - a.score);
       const numToKeep = Math.ceil(block.articles.length * (coverageLevel / 100));
       
       block.articles = block.articles.map(a => {
          const isTopN = sortedArticles.indexOf(a) < numToKeep;
          const isFavorite = a.node.isFavorite;
          const isNews = a.node.legislativeUpdate && a.node.legislativeUpdate.year >= cutoffYear;
          
          if (isTopN || isFavorite || isNews || coverageLevel === 100) {
             return a.node;
          } else {
             return { ...a.node, _isHiddenInRetaFinal: true };
          }
       });
    });
    
    const finalBlocks = blocks.filter(b => b.articles.length > 0);
    
    setPreviewBlocks(finalBlocks);
    handleNext();
  };
  
  const handleSave = () => {
    if (!examName || !examDate || selectedLegs.length === 0) {
      alert("Preencha todos os campos e selecione pelo menos uma legislação.");
      return;
    }
    
    const settings: RetaFinalSettings = {
        examName,
        examDate,
        studyHoursPerDay: hoursPerDay,
        studyDaysOfWeek: studyDays,
        disciplineWeights,
        coverageLevel,
        strategy,
        bonusConfig: { favoriteBonus, legislativeBonus }
    };
    
    const project = {
        name: examName,
        settings,
        blocks: previewBlocks
    };
    
    if (projectId) {
      updateRetaFinalProject(projectId, project);
    } else {
      createRetaFinalProject(project);
    }
    onClose();
  };

  const disciplinesList = Array.from(new Set(legislations.map(l => l.discipline || 'Outros'))).sort();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                <Target size={20} />
             </div>
             <div>
               <h2 className="text-xl font-black text-stone-800 tracking-tight">Motor Reta Final</h2>
               <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mt-0.5">Assistente de Priorização</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-0 flex">
           {/* Progress Sidebar */}
           <div className="w-64 bg-stone-50 border-r border-stone-100 p-6 hidden md:block">
              <div className="space-y-6 relative">
                 <div className="absolute left-3 top-2 bottom-2 w-px bg-stone-200 z-0"></div>
                 {[
                   { step: 1, label: 'Dados do Concurso', icon: Calendar },
                   { step: 2, label: 'Legislações e Pesos', icon: Book },
                   { step: 3, label: 'Estratégia e Motor', icon: Settings },
                   { step: 4, label: 'Prévia e Estimativa', icon: BarChart2 }
                 ].map(item => (
                    <div key={item.step} className="relative z-10 flex items-center gap-4">
                       <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
                          step === item.step ? "bg-indigo-600 text-white shadow-md ring-4 ring-indigo-50" : 
                          step > item.step ? "bg-indigo-100 text-indigo-600" : "bg-white border border-stone-200 text-stone-400"
                       )}>
                          {item.step}
                       </div>
                       <span className={cn(
                         "text-sm font-semibold",
                         step === item.step ? "text-stone-800" : "text-stone-400"
                       )}>{item.label}</span>
                    </div>
                 ))}
              </div>
           </div>
           
           {/* Content Area */}
           <div className="flex-1 p-8">
              {step === 1 && (
                 <div className="space-y-6 max-w-lg animate-in slide-in-from-right-4 fade-in">
                    <div>
                      <h3 className="text-lg font-bold text-stone-800 mb-1">Dados do Concurso</h3>
                      <p className="text-sm text-stone-500 mb-6">Informe os dados básicos da sua prova e disponibilidade.</p>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Concurso / Cargo</label>
                            <input type="text" value={examName} onChange={e => setExamName(e.target.value)} placeholder="Ex: DPE RJ" className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 font-medium focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Data da Prova</label>
                            <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 font-medium focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Horas Líquidas por Dia (Lei Seca)</label>
                            <input type="number" min={1} max={24} value={hoursPerDay} onChange={e => setHoursPerDay(parseInt(e.target.value))} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 font-medium focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Dias da Semana Estudados</label>
                            <div className="flex gap-2 justify-between">
                               {['D','S','T','Q','Q','S','S'].map((day, idx) => (
                                 <button key={idx} onClick={() => toggleDay(idx)} className={`w-10 h-10 rounded-full font-bold text-sm transition-colors ${studyDays.includes(idx) ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'}`}>
                                   {day}
                                 </button>
                               ))}
                            </div>
                        </div>
                    </div>
                 </div>
              )}
              
              {step === 2 && (
                 <div className="space-y-6 animate-in slide-in-from-right-4 fade-in h-full flex flex-col">
                    <div>
                      <h3 className="text-lg font-bold text-stone-800 mb-1">Legislações e Pesos</h3>
                      <p className="text-sm text-stone-500 mb-4">Selecione as leis do edital e defina o peso das disciplinas (estimativa de questões).</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">1. Selecionar Legislações</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border border-stone-100 rounded-xl p-3 bg-stone-50 max-h-48 overflow-y-auto">
                               {legislations.map(leg => (
                                 <label key={leg.id} className="flex items-center gap-3 p-2 hover:bg-stone-100 rounded cursor-pointer transition-colors">
                                   <input type="checkbox" checked={selectedLegs.includes(leg.id)} onChange={() => toggleLeg(leg.id)} className="w-4 h-4 rounded border-stone-300 text-indigo-600 focus:ring-indigo-600" />
                                   <span className="text-sm font-semibold text-stone-700 truncate">{leg.title}</span>
                                 </label>
                               ))}
                            </div>
                        </div>
                        
                        <div>
                             <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">2. Pesos das Disciplinas</label>
                             <div className="space-y-3">
                                {disciplinesList.filter(d => legislations.some(l => selectedLegs.includes(l.id) && (l.discipline || 'Outros') === d)).map(disc => (
                                    <div key={disc} className="flex items-center gap-4 bg-stone-50 p-3 rounded-xl border border-stone-100">
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-stone-700">{disc}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="number" placeholder="10" min="1" 
                                               value={disciplineWeights[disc] || ''} 
                                               onChange={e => setDisciplineWeights({...disciplineWeights, [disc]: parseInt(e.target.value) || 0})}
                                               className="w-20 p-2 bg-white border border-stone-200 rounded text-center text-sm font-bold text-indigo-700" 
                                            />
                                            <span className="text-xs text-stone-500 font-medium">questões</span>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                 </div>
              )}
              
              {step === 3 && (
                 <div className="space-y-6 max-w-xl animate-in slide-in-from-right-4 fade-in">
                    <div>
                      <h3 className="text-lg font-bold text-stone-800 mb-1">Estratégia do Motor</h3>
                      <p className="text-sm text-stone-500 mb-6">Ajuste os parâmetros matemáticos do algoritmo de priorização.</p>
                    </div>
                    
                    <div className="space-y-4 bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                         <label className="flex items-start gap-3 cursor-pointer">
                             <input type="checkbox" checked={strategy.prioritizeIncidence} onChange={e => setStrategy({...strategy, prioritizeIncidence: e.target.checked})} className="mt-1 w-4 h-4 text-indigo-600 rounded" />
                             <div>
                                 <p className="text-sm font-bold text-stone-800">Priorizar Incidência Histórica</p>
                                 <p className="text-xs text-stone-500">Artigos mais cobrados pelas bancas ganham mais prioridade.</p>
                             </div>
                         </label>
                         <label className="flex items-start gap-3 cursor-pointer">
                             <input type="checkbox" checked={strategy.prioritizeCostBenefit} onChange={e => setStrategy({...strategy, prioritizeCostBenefit: e.target.checked})} className="mt-1 w-4 h-4 text-indigo-600 rounded" />
                             <div>
                                 <p className="text-sm font-bold text-stone-800">Custo-Benefício da Legislação</p>
                                 <p className="text-xs text-stone-500">Leis pequenas com muitas questões ganham peso extra sobre leis enormes com poucas questões.</p>
                             </div>
                         </label>
                         
                         <div className="h-px bg-indigo-100 my-4"></div>
                         
                         <label className="flex items-start gap-3 cursor-pointer">
                             <input type="checkbox" checked={strategy.prioritizeNews} onChange={e => setStrategy({...strategy, prioritizeNews: e.target.checked})} className="mt-1 w-4 h-4 text-indigo-600 rounded" />
                             <div className="flex-1">
                                 <p className="text-sm font-bold text-stone-800 flex justify-between">
                                     Novidades Legislativas
                                     {strategy.prioritizeNews && <span className="text-indigo-600">Bônus: +{legislativeBonus}</span>}
                                 </p>
                                 <p className="text-xs text-stone-500 mb-2">Artigos recém-alterados.</p>
                                 {strategy.prioritizeNews && (
                                    <input type="range" min="1" max="50" value={legislativeBonus} onChange={e => setLegislativeBonus(parseInt(e.target.value))} className="w-full accent-indigo-600" />
                                 )}
                             </div>
                         </label>
                         <label className="flex items-start gap-3 cursor-pointer">
                             <input type="checkbox" checked={strategy.prioritizeFavorites} onChange={e => setStrategy({...strategy, prioritizeFavorites: e.target.checked})} className="mt-1 w-4 h-4 text-indigo-600 rounded" />
                             <div className="flex-1">
                                 <p className="text-sm font-bold text-stone-800 flex justify-between">
                                     Favoritos
                                     {strategy.prioritizeFavorites && <span className="text-indigo-600">Bônus: +{favoriteBonus}</span>}
                                 </p>
                                 <p className="text-xs text-stone-500 mb-2">Seus artigos marcados como favoritos.</p>
                                 {strategy.prioritizeFavorites && (
                                    <input type="range" min="1" max="50" value={favoriteBonus} onChange={e => setFavoriteBonus(parseInt(e.target.value))} className="w-full accent-indigo-600" />
                                 )}
                             </div>
                         </label>
                    </div>
                    
                    <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200">
                        <p className="text-sm font-bold text-stone-800 flex justify-between mb-2">
                             Nível de Cobertura Desejada
                             <span className="text-indigo-600">{coverageLevel}%</span>
                         </p>
                         <p className="text-xs text-stone-500 mb-4">Determine quanto da legislação você quer cobrir. Menos cobertura significa foco apenas na "nata" dos artigos.</p>
                         <input type="range" min="10" max="100" step="10" value={coverageLevel} onChange={e => setCoverageLevel(parseInt(e.target.value))} className="w-full accent-stone-800" />
                    </div>
                 </div>
              )}
              
              {step === 4 && (
                 <div className="space-y-6 animate-in slide-in-from-right-4 fade-in h-full flex flex-col">
                    <div>
                      <h3 className="text-lg font-bold text-stone-800 mb-1">Prévia da Priorização</h3>
                      <p className="text-sm text-stone-500 mb-4">Os blocos foram ordenados pelo Índice de Prioridade calculado.</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4 shrink-0">
                        <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                           <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Total de Blocos</p>
                           <p className="text-2xl font-black text-stone-800">{previewBlocks.length}</p>
                        </div>
                        <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                           <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Tempo Estimado Total</p>
                           <p className="text-2xl font-black text-stone-800">
                               {Math.floor(previewBlocks.reduce((acc, b) => acc + b.estimatedTime, 0) / 60)}h
                           </p>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto border border-stone-200 rounded-xl bg-white">
                        <div className="sticky top-0 bg-stone-50 px-4 py-2 border-b border-stone-200 flex justify-between text-xs font-bold text-stone-500 uppercase tracking-widest z-10">
                            <span>Bloco / Estrutura</span>
                            <div className="flex gap-8 text-right">
                                <span className="w-20">Artigos</span>
                                <span className="w-20">Prioridade</span>
                            </div>
                        </div>
                        <div className="divide-y divide-stone-100">
                            {previewBlocks.map((block, idx) => (
                                <div key={block.id} className="p-4 hover:bg-stone-50 transition-colors flex items-center justify-between">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">{idx + 1}º</span>
                                            <span className="text-xs font-bold text-stone-500 truncate">{block.lawTitle}</span>
                                        </div>
                                        <p className="text-sm font-semibold text-stone-800 truncate">
                                            {block.hierarchy.join(' > ')}
                                        </p>
                                    </div>
                                    <div className="flex gap-8 text-right text-sm">
                                        <div className="w-20 font-medium text-stone-600">{block.articles.length}</div>
                                        <div className="w-20 font-black text-indigo-600">{block.priorityScore.toFixed(0)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>
              )}
           </div>
        </div>
        
        {/* Footer */}
        <div className="p-5 border-t border-stone-100 bg-stone-50 flex justify-between items-center shrink-0">
          <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-stone-500 hover:text-stone-800 transition-colors">
            Cancelar
          </button>
          <div className="flex gap-3">
              {step > 1 && (
                  <button onClick={handlePrev} className="px-6 py-2.5 text-sm font-bold bg-white border border-stone-200 text-stone-700 rounded-xl hover:bg-stone-50 transition-colors">
                    Voltar
                  </button>
              )}
              {step < 3 && (
                  <button onClick={handleNext} disabled={step === 1 && (!examName || !examDate)} className="px-6 py-2.5 text-sm font-bold bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors flex items-center gap-2 disabled:opacity-50">
                    Avançar <ArrowRight size={16} />
                  </button>
              )}
              {step === 3 && (
                  <button onClick={calculateEngine} className="px-6 py-2.5 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2">
                    <Calculator size={16} /> Calcular Motor
                  </button>
              )}
              {step === 4 && (
                  <button onClick={handleSave} className="px-6 py-2.5 text-sm font-bold bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors flex items-center gap-2">
                    <Target size={16} /> {projectId ? 'Atualizar Plano' : 'Criar Plano'}
                  </button>
              )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
