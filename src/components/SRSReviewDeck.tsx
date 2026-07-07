import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Brain, ArrowLeft, Check, X, TrendingUp, Calendar, Inbox, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { ArticleCard } from './ArticleCard';

export function SRSReviewDeck() {
  const { srsTracking, setShowReviewMode, legislations, processSRSReview } = useStore();
  const [sessionActive, setSessionActive] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  
  // Compute SRS stats
  const now = Date.now();
  const allSrsNodes = Object.keys(srsTracking);
  
  const dueNodes = useMemo(() => {
    return allSrsNodes.filter(id => srsTracking[id].nextReviewDate <= now);
  }, [srsTracking, now]);

  const totalTracked = allSrsNodes.length;
  const learningPhase = allSrsNodes.filter(id => srsTracking[id].interval < 21).length;
  const graduatedPhase = totalTracked - learningPhase;

  // Session state
  const [reviewQueue, setReviewQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const startSession = () => {
    setReviewQueue([...dueNodes].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setSessionActive(true);
    setShowAnswer(false);
  };

  const currentReviewId = reviewQueue[currentIndex];
  
  // Find the node data
  const currentNode = useMemo(() => {
    if (!currentReviewId) return null;
    for (const leg of legislations) {
      const found = leg.nodes.find(n => n.id === currentReviewId);
      if (found) return { node: found, legislation: leg };
      
      // Deep search
      const searchDeep = (nodes: any[]): any => {
        for (const n of nodes) {
          if (n.id === currentReviewId) return n;
          if (n.children) {
            const foundChild = searchDeep(n.children);
            if (foundChild) return foundChild;
          }
        }
        return null;
      };
      const deepFound = searchDeep(leg.nodes);
      if (deepFound) return { node: deepFound, legislation: leg };
    }
    return null;
  }, [currentReviewId, legislations]);

  const handleGrade = (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    if (!currentReviewId) return;
    
    processSRSReview(currentReviewId, quality);
    
    if (currentIndex < reviewQueue.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      setSessionActive(false);
      setReviewQueue([]);
    }
  };

  if (sessionActive && currentNode) {
    return (
      <div className="flex-1 bg-slate-900 flex flex-col items-center justify-center p-4 relative w-full h-full">
        <button 
          onClick={() => setSessionActive(false)}
          className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2"
        >
          <ArrowLeft size={20} /> Sair da Revisão
        </button>

        <div className="text-slate-400 mb-8 font-mono text-sm">
          Cartão {currentIndex + 1} de {reviewQueue.length}
        </div>

        <div className="max-w-3xl w-full bg-white rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-y-auto max-h-[70vh]">
           <div className="text-center mb-6">
             <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 block">
               {currentNode.legislation.title}
             </span>
             <h2 className="text-3xl font-serif font-bold text-slate-800 mb-4">
               {currentNode.node.label}
             </h2>
             {!showAnswer && (
               <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-4">
                 {currentNode.node.metadata?.termo_nucleo && (
                   <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full border border-slate-200">
                     Dica: {currentNode.node.metadata.termo_nucleo}
                   </span>
                 )}
                 {currentNode.node.metadata?.nome_crime && (
                   <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-200">
                     Dica: {currentNode.node.metadata.nome_crime}
                   </span>
                 )}
               </div>
             )}
             <p className="text-slate-500 text-sm max-w-md mx-auto">
               {!showAnswer ? "Tente lembrar o conteúdo exato ou os pontos principais deste artigo antes de revelar." : "Avalie como foi sua lembrança:"}
             </p>
           </div>

           {!showAnswer ? (
             <div className="flex justify-center mt-12">
               <button 
                 onClick={() => setShowAnswer(true)}
                 className="px-8 py-4 bg-indigo-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-indigo-700 transition-transform hover:scale-105"
               >
                 Mostrar Texto Legal
               </button>
             </div>
           ) : (
             <div className="mt-8">
               <div className="font-serif text-xl leading-relaxed text-slate-700 border-l-4 border-indigo-200 pl-6 mb-12 whitespace-pre-wrap">
                 {currentNode.node.text}
                 {/* Only showing text for simplicity in review, if they need more, they can see in vade mecum */}
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <button onClick={() => handleGrade(1)} className="flex flex-col items-center p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors group">
                   <span className="text-red-600 font-bold mb-1">Errei</span>
                   <span className="text-xs text-red-400 group-hover:text-red-500">&lt; 1 min</span>
                 </button>
                 <button onClick={() => handleGrade(3)} className="flex flex-col items-center p-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-colors group">
                   <span className="text-orange-600 font-bold mb-1">Difícil</span>
                   <span className="text-xs text-orange-400 group-hover:text-orange-500">Curto</span>
                 </button>
                 <button onClick={() => handleGrade(4)} className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-colors group">
                   <span className="text-green-600 font-bold mb-1">Bom</span>
                   <span className="text-xs text-green-400 group-hover:text-green-500">Ideal</span>
                 </button>
                 <button onClick={() => handleGrade(5)} className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors group">
                   <span className="text-blue-600 font-bold mb-1">Fácil</span>
                   <span className="text-xs text-blue-400 group-hover:text-blue-500">Longo</span>
                 </button>
               </div>
             </div>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#FDFDFB] p-4 md:p-8 overflow-y-auto w-full">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setShowReviewMode(false)}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              <Brain className="text-indigo-600" size={32} /> Central de Revisão
            </h1>
            <p className="text-slate-500 mt-1">Algoritmo Spaced Repetition System (SRS)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
             <Inbox size={24} className="text-indigo-500 mb-3" />
             <div className="text-4xl font-bold text-slate-800 mb-1">{totalTracked}</div>
             <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Mapeados</div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
             <Calendar size={24} className="text-rose-500 mb-3" />
             <div className="text-4xl font-bold text-rose-600 mb-1">{dueNodes.length}</div>
             <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Revisões Hoje</div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
             <TrendingUp size={24} className="text-emerald-500 mb-3" />
             <div className="text-4xl font-bold text-slate-800 mb-1">{graduatedPhase}</div>
             <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Memorizados</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 text-center shadow-sm max-w-2xl mx-auto">
          {dueNodes.length > 0 ? (
            <>
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Você tem {dueNodes.length} cards pendentes</h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">
                Revise os artigos no momento exato em que seu cérebro está prestes a esquecê-los para consolidar a memória de longo prazo.
              </p>
              <button 
                onClick={startSession}
                className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 hover:-translate-y-1 transition-all duration-200 flex items-center gap-3 mx-auto"
              >
                <Brain size={20} />
                Iniciar Sessão de Revisão
              </button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Tudo em dia!</h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">
                Você não tem revisões pendentes para hoje. Adicione novos artigos ao seu plano de estudos clicando no ícone do cérebro nos artigos.
              </p>
              <button 
                onClick={() => setShowReviewMode(false)}
                className="px-8 py-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors mx-auto"
              >
                Voltar para o Vade Mecum
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
