import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Download, Upload, Save, RefreshCw, X, AlertTriangle, Camera } from 'lucide-react';
import { cn } from '../lib/utils';

export function BackupModal({ onClose }: { onClose: () => void }) {
  const { 
    autoBackupEnabled, setAutoBackup, 
    snapshots, createSnapshot, restoreSnapshot, deleteSnapshot,
    importBackup
  } = useStore();

  const [snapshotName, setSnapshotName] = useState('');
  const [activeTab, setActiveTab] = useState<'backup' | 'snapshots'>('backup');

  const handleExport = () => {
    const state = useStore.getState();
    const data = JSON.stringify(state);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Formatting the date
    const date = new Date();
    const dateString = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    
    a.download = `smartvade-${dateString}.svbackup`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.svbackup,.smartvade,application/json';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (!target.files) return;
      const file = target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse((e.target as FileReader).result as string);
          
          if (!data.legislations) {
             throw new Error("Arquivo inválido. Formato não reconhecido.");
          }

          if (window.confirm("Deseja substituir TODOS os dados atuais (OK) ou mesclar as legislações com os dados existentes (Cancelar)?\n\nATENÇÃO: Substituir apagará todos os dados atuais não contidos no backup!")) {
             importBackup(data, 'replace');
          } else {
             importBackup(data, 'merge');
          }
          alert("Backup importado com sucesso!");
        } catch(err) {
          console.error(err);
          alert("Erro ao importar arquivo de backup. Verifique se o formato está correto.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleCreateSnapshot = () => {
    if (!snapshotName.trim()) {
       alert("Por favor, informe um nome para o Snapshot.");
       return;
    }
    createSnapshot(snapshotName);
    setSnapshotName('');
  };

  const handleRestoreSnapshot = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja restaurar o Snapshot "${name}"?\nTodos os dados atuais não salvos serão perdidos.`)) {
      restoreSnapshot(id);
      alert("Snapshot restaurado com sucesso!");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-cyan-500/20">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-cyan-100 text-cyan-600 rounded-xl flex items-center justify-center shadow-sm">
                <Save size={20} />
             </div>
             <div>
                <h2 className="text-xl font-bold text-slate-800">Backup e Restauração</h2>
                <p className="text-sm text-slate-500">Gerencie seus dados e snapshots de estudo</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex border-b border-slate-100">
          <button 
             onClick={() => setActiveTab('backup')} 
             className={cn("flex-1 py-3 text-sm font-bold transition-all", activeTab === 'backup' ? "text-cyan-600 border-b-2 border-cyan-500 bg-cyan-50/30" : "text-slate-500 hover:bg-slate-50")}
          >
            Importar / Exportar
          </button>
          <button 
             onClick={() => setActiveTab('snapshots')} 
             className={cn("flex-1 py-3 text-sm font-bold transition-all", activeTab === 'snapshots' ? "text-cyan-600 border-b-2 border-cyan-500 bg-cyan-50/30" : "text-slate-500 hover:bg-slate-50")}
          >
            Snapshots Rápidos
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'backup' && (
             <div className="space-y-6">
               <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-amber-800">
                    O Smartvade armazena todas as leis localmente no seu dispositivo, offline-first. Para evitar perda de dados por limpeza de cache ou troca de navegador, recomendamos exportar um backup periodicamente.
                  </p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={handleExport} className="p-6 border border-slate-200 rounded-2xl hover:border-cyan-400 hover:shadow-[0_4px_20px_rgba(6,182,212,0.15)] hover:bg-slate-50 transition-all flex flex-col items-center justify-center text-center gap-3 group">
                     <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Download size={24} />
                     </div>
                     <div>
                        <h3 className="font-bold text-slate-800">Exportar Backup</h3>
                        <p className="text-xs text-slate-500 mt-1">Gera um arquivo .svbackup com todas as suas leis, anotações e configurações.</p>
                     </div>
                  </button>

                  <button onClick={handleImport} className="p-6 border border-slate-200 rounded-2xl hover:border-indigo-400 hover:shadow-[0_4px_20px_rgba(99,102,241,0.15)] hover:bg-slate-50 transition-all flex flex-col items-center justify-center text-center gap-3 group">
                     <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload size={24} />
                     </div>
                     <div>
                        <h3 className="font-bold text-slate-800">Importar Backup</h3>
                        <p className="text-xs text-slate-500 mt-1">Restaura seus dados a partir de um arquivo .svbackup criado anteriormente.</p>
                     </div>
                  </button>
               </div>

               <div className="p-5 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div>
                     <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <RefreshCw size={18} className={autoBackupEnabled ? "text-cyan-500 animate-spin-slow" : "text-slate-400"} /> 
                        Backup Automático Local
                     </h3>
                     <p className="text-xs text-slate-500 mt-1 max-w-sm">Salva automaticamente versões recentes em segundo plano, garantindo segurança contra fechamentos inesperados.</p>
                  </div>
                  <button 
                     onClick={() => setAutoBackup(!autoBackupEnabled)}
                     className={cn(
                        "relative inline-flex h-7 w-12 items-center rounded-full transition-colors",
                        autoBackupEnabled ? "bg-cyan-500" : "bg-slate-300"
                     )}
                  >
                     <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white transition-transform", autoBackupEnabled ? "translate-x-6" : "translate-x-1")} />
                  </button>
               </div>
             </div>
          )}

          {activeTab === 'snapshots' && (
             <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                     <Camera size={18} className="text-indigo-500" />
                     Criar Novo Snapshot
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">Um Snapshot é uma fotografia instantânea do seu Vade Mecum. Útil para salvar o estado antes de organizar os materiais de uma prova (ex: "Reta Final DPE-RJ").</p>
                  
                  <div className="flex gap-2">
                     <input 
                        type="text" 
                        value={snapshotName}
                        onChange={e => setSnapshotName(e.target.value)}
                        placeholder="Ex: Pós Edital TJ-SP"
                        className="flex-1 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                     />
                     <button 
                        onClick={handleCreateSnapshot}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-colors"
                     >
                        Salvar
                     </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                   <h3 className="font-bold text-slate-800 mb-4">Meus Snapshots</h3>
                   
                   {snapshots.length === 0 ? (
                      <div className="text-center p-8 bg-slate-50 border border-slate-100 rounded-2xl">
                         <p className="text-slate-500 text-sm">Nenhum snapshot criado ainda.</p>
                      </div>
                   ) : (
                      <div className="space-y-3">
                         {snapshots.slice().reverse().map(snap => (
                            <div key={snap.id} className="p-4 border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-300 transition-colors">
                               <div>
                                  <h4 className="font-bold text-slate-800 text-sm">{snap.name}</h4>
                                  <p className="text-xs text-slate-400">{new Date(snap.date).toLocaleString('pt-BR')}</p>
                               </div>
                               <div className="flex items-center gap-2">
                                  <button 
                                     onClick={() => handleRestoreSnapshot(snap.id, snap.name)}
                                     className="px-3 py-1.5 bg-cyan-50 text-cyan-600 text-xs font-bold rounded-lg hover:bg-cyan-100 transition-colors"
                                  >
                                     Restaurar
                                  </button>
                                  <button 
                                     onClick={() => {
                                        if (window.confirm('Excluir este snapshot?')) deleteSnapshot(snap.id);
                                     }}
                                     className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                     <X size={16} />
                                  </button>
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
