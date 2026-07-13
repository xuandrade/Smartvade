import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { LawNode, Legislation } from '../types';
import { Clock, BookOpen, Star, Brain, CheckCircle, Search, Tag, BarChart2, Target } from 'lucide-react';
import { cn } from '../lib/utils';

export function Dashboard() {
  const { legislations, studyTime, annotations, srsTracking, highlights, retaFinalMode, toggleRetaFinalMode, dailyGoal, tasks, toggleTask } = useStore();
  
  const todayStr = new Date().toISOString().split('T')[0];
  const timeToday = studyTime[todayStr] || 0;
  const progressPct = Math.min(100, Math.round((timeToday / dailyGoal) * 100));

  const stats = useMemo(() => {
    let totalArticles = 0;
    let readArticles = 0;
    let favArticles = 0;
    let srsArticles = Object.keys(srsTracking).length;
    let articlesWithTags = Object.keys(annotations).length; 
    let totalHighlights = 0;
    
    const legStats: Record<string, any> = {};

    const traverse = (nodes: LawNode[], legId: string) => {
      for (const node of nodes) {
        if (node.type === 'artigo') {
          totalArticles++;
          if (!legStats[legId]) {
             legStats[legId] = { total: 0, read: 0, fav: 0, srs: 0, tags: 0, highlights: 0, title: '' };
          }
          legStats[legId].total++;
          if (node.isRead) {
            readArticles++;
            legStats[legId].read++;
          }
          if (node.isFavorite) {
            favArticles++;
            legStats[legId].fav++;
          }
          if (srsTracking[node.id]) {
             legStats[legId].srs++;
          }
          if (annotations[node.id]) {
             legStats[legId].tags += annotations[node.id].length;
          }
          if (highlights[node.id]) {
             totalHighlights += highlights[node.id].length;
             legStats[legId].highlights += highlights[node.id].length;
          }
        }
        if (node.children) traverse(node.children, legId);
      }
    };

    legislations.forEach(leg => {
      legStats[leg.id] = { total: 0, read: 0, fav: 0, srs: 0, tags: 0, highlights: 0, title: leg.title };
      traverse(leg.nodes, leg.id);
    });

    let timeWeek = 0;
    let timeMonth = 0;
    const now = new Date();
    Object.entries(studyTime).forEach(([dateStr, time]) => {
       const date = new Date(dateStr);
       const diffTime = Math.abs(now.getTime() - date.getTime());
       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
       if (diffDays <= 7) timeWeek += time;
       if (diffDays <= 30) timeMonth += time;
    });

    return {
      timeToday,
      timeWeek,
      timeMonth,
      totalArticles,
      readArticles,
      favArticles,
      srsArticles,
      articlesWithTags,
      totalHighlights,
      legStats: Object.values(legStats)
    };
  }, [legislations, studyTime, srsTracking, annotations, highlights]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  if (retaFinalMode) {
      return (
        <div className="flex-1 bg-rose-50 p-8 overflow-y-auto w-full max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center mb-8 bg-rose-600 text-white p-6 rounded-2xl shadow-md">
             <div>
                <h2 className="text-2xl font-black uppercase flex items-center gap-2"><Target /> Modo Reta Final</h2>
                <p className="text-rose-100 font-medium text-sm mt-1">Foco máximo na revisão DPE-SP</p>
             </div>
             <button onClick={toggleRetaFinalMode} className="px-4 py-2 bg-white text-rose-600 rounded-xl text-sm font-bold shadow-sm hover:bg-rose-50">Sair do Modo</button>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-8 shadow-sm">
             <h3 className="text-lg font-black uppercase text-stone-800 mb-4 flex items-center gap-2"><Clock className="text-blush-500"/> Progresso Diário</h3>
             <div className="flex items-end justify-between mb-2">
                <span className="text-sm font-bold text-stone-500">Tempo Estudado</span>
                <span className="text-xl font-black text-stone-800">{formatTime(timeToday)} <span className="text-sm text-stone-400 font-medium">/ {formatTime(dailyGoal)}</span></span>
             </div>
             <div className="w-full bg-stone-100 h-4 rounded-full overflow-hidden">
                <div className="bg-blush-500 h-full transition-all duration-1000" style={{ width: `${progressPct}%` }}></div>
             </div>
             <p className="text-xs font-bold text-stone-400 mt-2 text-right">{progressPct}% concluído</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
             <h3 className="text-lg font-black uppercase text-stone-800 mb-4 flex items-center gap-2"><CheckCircle className="text-green-500"/> Checklist de Hoje</h3>
             {tasks.length === 0 ? (
               <p className="text-sm text-stone-500 italic">Nenhuma tarefa programada para hoje.</p>
             ) : (
               <div className="space-y-3">
                 {tasks.map(task => (
                   <div key={task.id} className="flex items-center gap-3 p-3 border border-stone-100 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer" onClick={() => toggleTask(task.id)}>
                     <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-stone-300'}`}>
                       {task.completed && <CheckCircle size={14} />}
                     </div>
                     <span className={`font-medium text-stone-700 ${task.completed ? 'line-through opacity-50' : ''}`}>{task.title}</span>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>
      );
    }

  return (
    <div className="flex-1 bg-[#FFFFFF] p-8 overflow-y-auto w-full max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-start mb-8">
         <div>
            <h2 className="text-3xl font-black text-stone-800 tracking-tighter uppercase mb-1 drop-shadow-sm">Desempenho Geral</h2>
            <p className="text-stone-500 font-medium">Acompanhe sua evolução e métricas de estudo para a DPE-SP.</p>
         </div>
         <button onClick={toggleRetaFinalMode} className="px-5 py-2.5 bg-stone-900 text-white font-bold rounded-xl text-sm hover:bg-stone-800 shadow-sm uppercase tracking-tight flex items-center gap-2"><Target size={16} className="text-blush-400"/> Modo Reta Final</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
         <StatCard icon={<Clock />} label="Tempo Hoje" value={formatTime(stats.timeToday)} color="blush" />
         <StatCard icon={<Clock />} label="Tempo na Semana" value={formatTime(stats.timeWeek)} color="blue" />
         <StatCard icon={<Clock />} label="Tempo no Mês" value={formatTime(stats.timeMonth)} color="sky" />
         
         <StatCard icon={<CheckCircle />} label="Artigos Lidos" value={stats.readArticles} color="green" />
         <StatCard icon={<Brain />} label="Artigos em Revisão" value={stats.srsArticles} color="rose" />
         <StatCard icon={<Star />} label="Artigos Favoritos" value={stats.favArticles} color="amber" />
         
         <StatCard icon={<Tag />} label="Artigos Anotados" value={stats.articlesWithTags} color="emerald" />
         <StatCard icon={<Search />} label="Grifos/Remissões" value={stats.totalHighlights} color="violet" />
      </div>

      <div className="mb-8 mt-12">
         <h2 className="text-2xl font-black text-stone-800 tracking-tighter uppercase mb-6 drop-shadow-sm flex items-center gap-2">
            <BarChart2 className="text-blush-500" />
            Dashboard por Lei
         </h2>
         
         <div className="space-y-4">
            {stats.legStats.map((lstat, i) => {
               const pct = lstat.total > 0 ? Math.round((lstat.read / lstat.total) * 100) : 0;
               return (
                 <div key={i} className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-stone-700 truncate pr-4 text-lg">{lstat.title}</h3>
                       <div className="flex items-center gap-2 bg-blush-50 px-3 py-1 rounded-full border border-blush-100 shadow-sm">
                         <span className="text-blush-700 font-black text-sm">{pct}%</span>
                         <span className="text-[10px] uppercase font-bold text-blush-400">Progresso</span>
                       </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-stone-100 h-2 rounded-full mb-5 overflow-hidden">
                       <div className="bg-blush-500 h-full rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${pct}%` }}></div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
                       <MiniStat label="Total Artigos" value={lstat.total} />
                       <MiniStat label="Lidos" value={lstat.read} color="text-green-600" />
                       <MiniStat label="Revisão (SRS)" value={lstat.srs} color="text-rose-600" />
                       <MiniStat label="Favoritos" value={lstat.fav} color="text-amber-500" />
                       <MiniStat label="Anotações" value={lstat.tags} color="text-emerald-600" />
                    </div>
                 </div>
               );
            })}
            
            {stats.legStats.length === 0 && (
               <div className="text-center p-8 text-stone-400 border border-dashed border-stone-200 rounded-xl">
                  Nenhum dado disponível ainda. Comece a estudar suas legislações!
               </div>
            )}
         </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
   const colorMap: Record<string, string> = {
      blush: "text-blush-500 bg-blush-50 border-blush-100 shadow-sm",
      blue: "text-blue-600 bg-blue-50 border-blue-100 shadow-sm",
      sky: "text-sky-600 bg-sky-50 border-sky-100 shadow-sm",
      green: "text-green-600 bg-green-50 border-green-100 shadow-sm",
      rose: "text-rose-600 bg-rose-50 border-rose-100 shadow-sm",
      amber: "text-amber-600 bg-amber-50 border-amber-100 shadow-sm",
      emerald: "text-emerald-600 bg-emerald-50 border-emerald-100 shadow-sm",
      violet: "text-violet-600 bg-violet-50 border-violet-100 shadow-sm"
   };
   
   return (
      <div className={cn("p-5 rounded-2xl border flex items-center gap-4 transition-all hover:scale-[1.02]", colorMap[color] || colorMap.blush)}>
         <div className="p-3 bg-white rounded-xl shadow-sm border border-stone-100/50">
            {icon}
         </div>
         <div>
            <p className="text-[10px] uppercase font-bold opacity-70 tracking-widest">{label}</p>
            <p className="text-2xl font-black tracking-tighter">{value}</p>
         </div>
      </div>
   );
}

function MiniStat({ label, value, color = "text-stone-700" }: { label: string, value: number, color?: string }) {
   return (
      <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-stone-50 border border-stone-100">
         <span className={cn("text-lg font-black", color)}>{value}</span>
         <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">{label}</span>
      </div>
   );
}
