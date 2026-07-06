import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, UploadCloud, Settings2 } from 'lucide-react';
import { IncidenceMap, ExamBoard } from '../types';

export function CreateLegislationModal() {
  const { createLegislation, setShowCreateModal } = useStore();
  
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  
  const [fgvText, setFgvText] = useState('');
  const [fccText, setFccText] = useState('');
  const [cebraspeText, setCebraspeText] = useState('');
  const [propriaText, setPropriaText] = useState('');

  const [activeTab, setActiveTab] = useState<ExamBoard>('FGV');

  const handleProcess = () => {
    if (!title.trim() || !text.trim()) return;

    const parseIncidenceList = (raw: string) => {
      const map: Record<string, number> = {};
      const lines = raw.split('\n');
      for (const line of lines) {
        const match = line.match(/Art\.\s*(\d+).*?(\d+)/i);
        if (match) {
           map[`Art. ${match[1]}`] = parseInt(match[2], 10);
        }
      }
      return map;
    };

    const incidences: IncidenceMap = {
      'FGV': parseIncidenceList(fgvText),
      'FCC': parseIncidenceList(fccText),
      'CEBRASPE': parseIncidenceList(cebraspeText),
      'PRÓPRIA': parseIncidenceList(propriaText),
    };

    createLegislation(title, text, incidences);
  };

  const handleDemo = () => {
    setTitle('Código Penal (Demo)');
    setText(`LIVRO I - PARTE GERAL
TÍTULO I - DA APLICAÇÃO DA LEI PENAL
Art. 1º - Não há crime sem lei anterior que o defina. Não há pena sem prévia cominação legal.
Art. 2º - Ninguém pode ser punido por fato que lei posterior deixa de considerar crime.
Parágrafo único - A lei posterior, que de qualquer modo favorecer o agente, aplica-se aos fatos anteriores.
TÍTULO II - DO CRIME
Art. 121 - Matar alguém:
Pena - reclusão, de seis a vinte anos.
Homicídio culposo
§ 3º Se o homicídio é culposo:
Pena - detenção, de um a três anos.`);
    setFgvText(`Art. 121 - 8 vezes\nArt. 1 - 5 vezes\nArt. 2 - 2 vezes`);
    setFccText(`Art. 121 - 10 vezes`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Nova Legislação</h2>
          <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Nome da Legislação</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Ex: Código Penal" 
              className="w-full border border-slate-300 rounded-lg p-3 font-medium focus:ring-2 focus:ring-indigo-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Texto da Lei (Bruto)</label>
            <textarea 
              value={text} 
              onChange={e => setText(e.target.value)} 
              placeholder="Cole o texto bruto da lei aqui..." 
              className="w-full h-40 border border-slate-300 rounded-lg p-3 font-serif text-sm focus:ring-2 focus:ring-indigo-600 outline-none resize-y"
            />
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 size={18} className="text-indigo-600" />
              <h3 className="font-bold text-indigo-800 uppercase tracking-widest text-sm">Mapeamento de Incidência (Opcional)</h3>
            </div>
            
            <div className="flex border-b border-indigo-200 mb-4">
              {(['FGV', 'FCC', 'CEBRASPE', 'PRÓPRIA'] as ExamBoard[]).map(board => (
                <button 
                  key={board}
                  onClick={() => setActiveTab(board)}
                  className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === board ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-indigo-500'}`}
                >
                  {board}
                </button>
              ))}
            </div>

            <p className="text-xs text-indigo-600 mb-3 font-medium">Cole a lista de cobranças para a banca {activeTab}. Ex: "Art. 121 - 5 vezes".</p>
            
            {activeTab === 'FGV' && <textarea className="w-full h-24 border border-indigo-200 bg-white rounded-lg p-3 font-mono text-xs focus:ring-1 focus:ring-indigo-600 outline-none" placeholder="Art. 5 - 12 vezes..." value={fgvText} onChange={e => setFgvText(e.target.value)} />}
            {activeTab === 'FCC' && <textarea className="w-full h-24 border border-indigo-200 bg-white rounded-lg p-3 font-mono text-xs focus:ring-1 focus:ring-indigo-600 outline-none" placeholder="Art. 5 - 12 vezes..." value={fccText} onChange={e => setFccText(e.target.value)} />}
            {activeTab === 'CEBRASPE' && <textarea className="w-full h-24 border border-indigo-200 bg-white rounded-lg p-3 font-mono text-xs focus:ring-1 focus:ring-indigo-600 outline-none" placeholder="Art. 5 - 12 vezes..." value={cebraspeText} onChange={e => setCebraspeText(e.target.value)} />}
            {activeTab === 'PRÓPRIA' && <textarea className="w-full h-24 border border-indigo-200 bg-white rounded-lg p-3 font-mono text-xs focus:ring-1 focus:ring-indigo-600 outline-none" placeholder="Art. 5 - 12 vezes..." value={propriaText} onChange={e => setPropriaText(e.target.value)} />}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-between bg-white shrink-0">
          <button onClick={handleDemo} className="text-sm font-bold text-slate-500 hover:text-indigo-600">
            Preencher Exemplo
          </button>
          
          <div className="flex gap-3">
            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button 
              onClick={handleProcess}
              disabled={!title.trim() || !text.trim()}
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              <UploadCloud size={18} /> Importar Legislação
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
