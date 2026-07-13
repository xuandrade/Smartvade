import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Target, Calendar, Clock, BarChart2, Book, CheckCircle, Brain, Filter, ChevronRight, ChevronDown, Play, AlertTriangle, Plus, Settings, BookOpen, Layers, Check, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { StudyBlock, LawNode, Legislation } from '../types';
import { ArticleCard } from './ArticleCard';

function getRemainingStudyDays(examDate: string, studyDays: number[]) {
  const end = new Date(examDate + 'T23:59:59');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let count = 0;
  let curr = new Date(today);
  while (curr <= end) {
    if (studyDays.includes(curr.getDay())) count++;
    curr.setDate(curr.getDate() + 1);
  }
  return count;
}

function BlockCard({ block, project, legislations, onToggleArticle }: { block: StudyBlock, project: any, legislations: Legislation[], onToggleArticle: (id: string) => void }) {
    const [expanded, setExpanded] = useState(false);
    const [showHidden, setShowHidden] = useState(false);
    
    const leg = legislations.find(l => l.id === block.lawId);
    if (!leg) return null;
    
    const visibleArticles = block.articles.filter(a => !a._isHiddenInRetaFinal);
    const hiddenArticles = block.articles.filter(a => a._isHiddenInRetaFinal);
    
    const targetArticles = visibleArticles.length > 0 ? visibleArticles : block.articles;
    const studiedCount = targetArticles.filter(a => project.studiedArticles[a.id]).length;
    const progress = targetArticles.length > 0 ? studiedCount / targetArticles.length : 1;
    const isCompleted = progress >= 1;
    
    return (
       <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden mb-4">
           {/* Compact Header */}
           <div className="p-4 cursor-pointer hover:bg-stone-50 transition-colors" onClick={() => setExpanded(!expanded)}>
               <div className="flex justify-between items-start mb-2">
                   <div>
                       <div className="flex items-center gap-2 mb-1">
                           <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{block.discipline}</span>
                           <span className="text-[10px] font-medium text-stone-400">•</span>
                           <span className="text-[10px] font-bold text-stone-600 uppercase tracking-widest truncate max-w-[150px] md:max-w-none">{block.lawTitle}</span>
                       </div>
                       <h3 className="font-bold text-stone-800 text-sm">{block.hierarchy.join(' > ')}</h3>
                   </div>
                   <div className="flex items-center gap-3 shrink-0">
                       {isCompleted && <CheckCircle size={20} className="text-green-500 hidden sm:block" />}
                       <div className="text-right">
                           <div className="text-xs font-black text-stone-800">{Math.ceil(block.estimatedTime)} min</div>
                           <div className="text-[10px] text-indigo-500 font-bold uppercase">PRIO {block.priorityScore.toFixed(0)}</div>
                       </div>
                       <div className="text-stone-400">
                           {expanded ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                       </div>
                   </div>
               </div>
               
               {/* Progress bar */}
               <div className="flex items-center gap-3 mt-3">
                   <div className="flex-1 bg-stone-100 h-2 rounded-full overflow-hidden">
                       <div className="bg-indigo-500 h-full transition-all" style={{ width: `${progress * 100}%` }}></div>
                   </div>
                   <span className="text-[10px] font-bold text-stone-500 w-8">{Math.round(progress * 100)}%</span>
               </div>
           </div>
           
           {/* Expanded Content */}
           {expanded && (
               <div className="p-4 border-t border-stone-100 bg-stone-50/50">
                   <div className="space-y-6">
                       {visibleArticles.map(article => (
                           <div key={article.id} className="relative group/rf">
                               <ArticleCard node={article} legislation={leg} />
                               <div className="absolute -bottom-3 right-4 z-10">
                                   <button 
                                       onClick={(e) => { e.stopPropagation(); onToggleArticle(article.id); }}
                                       className={cn(
                                           "px-4 py-1.5 rounded-full text-xs font-black shadow-sm transition-all flex items-center gap-1.5",
                                           project.studiedArticles[article.id] 
                                               ? "bg-green-500 text-white hover:bg-green-600 hover:scale-105" 
                                               : "bg-white border border-stone-200 text-stone-600 hover:border-indigo-300 hover:text-indigo-600 hover:scale-105"
                                       )}
                                   >
                                       {project.studiedArticles[article.id] ? <><Check size={14} /> ESTUDADO</> : <><Play size={14} /> MARCAR ESTUDADO</>}
                                   </button>
                               </div>
                           </div>
                       ))}
                       
                       {hiddenArticles.length > 0 && !showHidden && (
                           <button 
                               onClick={() => setShowHidden(true)}
                               className="w-full py-3 border-2 border-dashed border-stone-300 bg-white rounded-xl text-stone-500 text-xs font-bold uppercase hover:bg-stone-50 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                           >
                               <ChevronDown size={14} /> Mostrar mais {hiddenArticles.length} artigos de menor prioridade
                           </button>
                       )}
                       
                       {showHidden && hiddenArticles.map(article => (
                           <div key={article.id} className="relative group/rf opacity-75 hover:opacity-100 transition-opacity">
                               <ArticleCard node={article} legislation={leg} />
                               <div className="absolute -bottom-3 right-4 z-10">
                                   <button 
                                       onClick={(e) => { e.stopPropagation(); onToggleArticle(article.id); }}
                                       className={cn(
                                           "px-4 py-1.5 rounded-full text-xs font-black shadow-sm transition-all flex items-center gap-1.5",
                                           project.studiedArticles[article.id] 
                                               ? "bg-green-500 text-white hover:bg-green-600 hover:scale-105" 
                                               : "bg-white border border-stone-200 text-stone-600 hover:border-indigo-300 hover:text-indigo-600 hover:scale-105"
                                       )}
                                   >
                                       {project.studiedArticles[article.id] ? <><Check size={14} /> ESTUDADO</> : <><Play size={14} /> MARCAR ESTUDADO</>}
                                   </button>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
           )}
       </div>
    );
}

export function RetaFinalReader() {
  const [extraTime, setExtraTime] = useState(0);
  const [delayStrategy, setDelayStrategy] = useState<'redistribute'|'ignore'|null>(null);
  const [activeTab, setActiveTab] = useState<'hoje' | 'todos'>('hoje');

  const { retaFinalProjects, activeRetaFinalId, legislations, toggleRetaFinalArticleStudied } = useStore();
  const project = retaFinalProjects.find(p => p.id === activeRetaFinalId);

  const data = useMemo(() => {
      if (!project) return null;
      
      const rDays = Math.max(1, getRemainingStudyDays(project.settings.examDate, project.settings.studyDaysOfWeek));
      
      let totalBlocks = 0;
      let completedBlocks = 0;
      let pendingBlocks: StudyBlock[] = [];
      let totalTime = 0;
      let remainingTime = 0;
      
      const todayStr = new Date().toDateString();
      let timeStudiedToday = 0;
      
      project.blocks.forEach(block => {
           totalBlocks++;
           totalTime += block.estimatedTime;
           
           const visibleArticles = block.articles.filter(a => !a._isHiddenInRetaFinal);
           const targetArticles = visibleArticles.length > 0 ? visibleArticles : block.articles;
           const studiedCount = targetArticles.filter(a => project.studiedArticles[a.id]).length;
           const isCompleted = targetArticles.length > 0 && studiedCount >= targetArticles.length;
           
           if (isCompleted) {
               completedBlocks++;
           } else {
               pendingBlocks.push(block);
               remainingTime += block.estimatedTime;
           }
           
           const timePerArticle = block.articles.length > 0 ? block.estimatedTime / block.articles.length : 0;
           block.articles.forEach(a => {
               const studiedAt = project.studiedArticles[a.id];
               if (studiedAt && new Date(studiedAt).toDateString() === todayStr) {
                   timeStudiedToday += timePerArticle;
               }
           });
      });
      
      const lawGroups: Record<string, { maxScore: number, blocks: StudyBlock[] }> = {};
      pendingBlocks.forEach(b => {
           if (!lawGroups[b.lawId]) lawGroups[b.lawId] = { maxScore: 0, blocks: [] };
           lawGroups[b.lawId].blocks.push(b);
           if (b.priorityScore > lawGroups[b.lawId].maxScore) {
               lawGroups[b.lawId].maxScore = b.priorityScore;
           }
      });
      
      Object.keys(lawGroups).forEach(lawId => {
           const leg = legislations.find(l => l.id === lawId);
           if (leg) {
               const naturalOrder: string[] = [];
               const traverseSeq = (node: LawNode, path: string[]) => {
                   let newPath = [...path];
                   if (['livro', 'titulo', 'capitulo', 'secao', 'subsecao'].includes(node.type)) {
                       newPath.push(node.label + (node.heading ? ' - ' + node.heading : ''));
                   }
                   if (node.type === 'artigo') {
                       naturalOrder.push(leg.id + '-' + newPath.join('|'));
                   } else if (node.children) {
                       node.children.forEach(c => traverseSeq(c, newPath));
                   }
               };
               leg.nodes.forEach(n => traverseSeq(n, []));
               
               lawGroups[lawId].blocks.sort((a, b) => naturalOrder.indexOf(a.id) - naturalOrder.indexOf(b.id));
           }
      });
      
      const sortedLaws = Object.values(lawGroups).sort((a, b) => b.maxScore - a.maxScore);
      
      const scheduleSequence: StudyBlock[] = [];
      sortedLaws.forEach(g => scheduleSequence.push(...g.blocks));
      
      const baseTargetMinutes = project.settings.studyHoursPerDay * 60;
      const requiredMinutesPerDay = remainingTime / rDays;
      
      let todaysQuota = baseTargetMinutes + extraTime;
      if (delayStrategy === 'redistribute' && requiredMinutesPerDay > baseTargetMinutes) {
          todaysQuota = requiredMinutesPerDay + extraTime;
      }
      
      const remainingQuotaToday = Math.max(0, todaysQuota - timeStudiedToday);
      const todaysBlocks: StudyBlock[] = [];
      
      if (remainingQuotaToday > 0) {
          let accTime = 0;
          for (const block of scheduleSequence) {
              todaysBlocks.push(block);
              accTime += block.estimatedTime;
              if (accTime >= remainingQuotaToday) {
                  break;
              }
          }
      }
      
      const needsRedistributionPrompt = !delayStrategy && (requiredMinutesPerDay > baseTargetMinutes * 1.15) && scheduleSequence.length > 0;
      
      return {
          stats: {
              remainingDays: rDays,
              totalBlocks,
              completedBlocks,
              totalTime,
              remainingTime,
              coverageLevel: project.settings.coverageLevel,
              pct: totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0,
              timeStudiedToday
          },
          todaysBlocks,
          needsRedistributionPrompt,
          scheduleSequence,
          requiredMinutesPerDay,
          baseTargetMinutes
      };
  }, [project, legislations, extraTime, delayStrategy]);

  if (!project || !data) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative pb-48 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Delay / Atraso Alert */}
      {data.needsRedistributionPrompt && (
          <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-2xl mb-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-4">
              <div className="flex gap-3">
                  <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={24} />
                  <div>
                      <h3 className="text-red-800 font-bold">Você possui metas pendentes</h3>
                      <p className="text-red-600 text-sm mt-1">O volume de estudo necessário para finalizar até a prova (~{Math.ceil(data.requiredMinutesPerDay / 60)}h/dia) está maior que o configurado ({project.settings.studyHoursPerDay}h/dia).</p>
                  </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                  <button onClick={() => setDelayStrategy('ignore')} className="px-4 py-2 bg-white text-stone-600 text-xs font-bold rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors">Ignorar</button>
                  <button onClick={() => setDelayStrategy('redistribute')} className="px-4 py-2 bg-white text-stone-600 text-xs font-bold rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors">Adicionar aos próximos dias</button>
                  <button onClick={() => window.dispatchEvent(new CustomEvent('open-reta-final-modal', { detail: { projectId: project.id } }))} className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm">Redistribuir (Ajustar Config)</button>
              </div>
          </div>
      )}

      {/* Hero Dashboard */}
      <div className="bg-stone-900 rounded-3xl p-6 md:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Target size={140} />
         </div>
         
         <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                   <span className="px-3 py-1 bg-stone-800 text-stone-300 rounded-full text-[10px] font-bold uppercase tracking-widest border border-stone-700">
                     Motor Reta Final
                   </span>
                   <span className="text-sm font-bold text-blush-400">{project.settings.examName}</span>
                </div>
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-reta-final-modal', { detail: { projectId: project.id } }))}
                    className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-colors"
                    title="Configurações do Projeto"
                >
                    <Settings size={20} />
                </button>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-8">{project.name}</h1>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
               <div className="bg-stone-800/50 p-4 rounded-2xl border border-stone-700/50 flex flex-col justify-between">
                  <div className="text-[9px] uppercase font-bold tracking-wider text-stone-400 mb-2">Faltam</div>
                  <p className="text-xl font-black">{data.stats.remainingDays} dias</p>
               </div>
               
               <div className="bg-stone-800/50 p-4 rounded-2xl border border-stone-700/50 flex flex-col justify-between">
                  <div className="text-[9px] uppercase font-bold tracking-wider text-stone-400 mb-2">Blocos Restantes</div>
                  <p className="text-xl font-black">{data.stats.totalBlocks - data.stats.completedBlocks}</p>
               </div>
               
               <div className="bg-stone-800/50 p-4 rounded-2xl border border-stone-700/50 flex flex-col justify-between">
                  <div className="text-[9px] uppercase font-bold tracking-wider text-stone-400 mb-2">Blocos Concluídos</div>
                  <p className="text-xl font-black">{data.stats.completedBlocks}</p>
               </div>
               
               <div className="bg-stone-800/50 p-4 rounded-2xl border border-stone-700/50 flex flex-col justify-between">
                  <div className="text-[9px] uppercase font-bold tracking-wider text-stone-400 mb-2">Tempo Diário</div>
                  <p className="text-xl font-black text-blush-400">~{Math.ceil((delayStrategy === 'redistribute' ? data.requiredMinutesPerDay : data.baseTargetMinutes) / 60)}h</p>
               </div>

               <div className="bg-stone-800/50 p-4 rounded-2xl border border-stone-700/50 flex flex-col justify-between">
                  <div className="text-[9px] uppercase font-bold tracking-wider text-stone-400 mb-2">Progresso</div>
                  <p className="text-xl font-black">{data.stats.pct}%</p>
               </div>
            </div>

            <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
               <div className="bg-gradient-to-r from-blush-500 to-indigo-500 h-full transition-all duration-1000" style={{ width: `${data.stats.pct}%` }}></div>
            </div>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-stone-200 mb-6">
          <button 
            onClick={() => setActiveTab('hoje')}
            className={cn("pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors", activeTab === 'hoje' ? "border-indigo-600 text-indigo-700" : "border-transparent text-stone-400 hover:text-stone-600")}
          >
              Meta de Hoje
          </button>
          <button 
            onClick={() => setActiveTab('todos')}
            className={cn("pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors", activeTab === 'todos' ? "border-indigo-600 text-indigo-700" : "border-transparent text-stone-400 hover:text-stone-600")}
          >
              Todos os Blocos Pendentes
          </button>
      </div>

      {/* Content */}
      {activeTab === 'hoje' && (
          <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2 text-stone-500 font-bold text-sm uppercase tracking-widest pl-2">
                     <Clock size={18} /> Selecionados para Hoje
                  </div>
                  <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                      Estudado Hoje: {Math.floor(data.stats.timeStudiedToday)} / {Math.ceil((delayStrategy === 'redistribute' ? data.requiredMinutesPerDay : data.baseTargetMinutes) + extraTime)} min
                  </div>
              </div>
              
              {data.todaysBlocks.length === 0 ? (
                 <div className="text-center py-20 bg-stone-50 rounded-3xl border border-stone-200 shadow-inner">
                    <CheckCircle size={56} className="mx-auto text-green-500 mb-4 opacity-80" />
                    <h2 className="text-2xl font-black text-stone-800 mb-2">Meta Cumprida!</h2>
                    <p className="text-stone-500 font-medium mb-8">Você finalizou todos os blocos programados para hoje.</p>
                    {data.scheduleSequence.length > 0 ? (
                        <button 
                            onClick={() => setExtraTime(prev => prev + 30)}
                            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-transform hover:scale-105 inline-flex items-center gap-2"
                        >
                            <Plus size={18} /> Tenho mais tempo (+30 min)
                        </button>
                    ) : (
                        <p className="text-lg font-bold text-indigo-600">Projeto Inteiro Concluído! 🎉</p>
                    )}
                 </div>
              ) : (
                  <>
                      {data.todaysBlocks.map(block => (
                          <BlockCard 
                              key={block.id} 
                              block={block} 
                              project={project} 
                              legislations={legislations} 
                              onToggleArticle={(id) => toggleRetaFinalArticleStudied(project.id, id)}
                          />
                      ))}
                      
                      <div className="flex justify-center pt-8">
                         <div className="text-center">
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Ao finalizar os blocos acima, novos blocos não aparecerão até você pedir.</p>
                         </div>
                      </div>
                  </>
              )}
          </div>
      )}

      {activeTab === 'todos' && (
          <div className="space-y-4">
              <div className="flex items-center gap-2 text-stone-500 font-bold text-sm uppercase tracking-widest mb-6 pl-2">
                 <Layers size={18} /> Fila de Planejamento ({data.scheduleSequence.length} blocos)
              </div>
              
              {data.scheduleSequence.slice(0, 50).map(block => (
                  <BlockCard 
                      key={block.id} 
                      block={block} 
                      project={project} 
                      legislations={legislations} 
                      onToggleArticle={(id) => toggleRetaFinalArticleStudied(project.id, id)}
                  />
              ))}
              
              {data.scheduleSequence.length > 50 && (
                  <div className="text-center p-6 text-stone-400 font-bold text-sm">
                      E mais {data.scheduleSequence.length - 50} blocos na fila.
                  </div>
              )}
              
              {data.scheduleSequence.length === 0 && (
                  <div className="text-center p-10 text-stone-500 font-bold">
                      Nenhum bloco pendente!
                  </div>
              )}
          </div>
      )}

    </div>
  );
}
