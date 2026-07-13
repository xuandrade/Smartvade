import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { AlertCircle, X } from 'lucide-react';

export function BackupReminder() {
  const { lastBackupDate, legislations, autoBackupEnabled } = useStore();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if user dismissed it this session, or auto backup is on (since it's already safe), or no data exists
    if (dismissed || autoBackupEnabled || legislations.length === 0) return;

    const checkReminder = () => {
      // Suggest backup if it's been more than 3 days since the last backup
      const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
      if (!lastBackupDate || Date.now() - lastBackupDate > THREE_DAYS) {
        setShow(true);
      }
    };

    // Check on mount and periodically
    checkReminder();
    const interval = setInterval(checkReminder, 60 * 60 * 1000); // every hour
    return () => clearInterval(interval);
  }, [lastBackupDate, legislations.length, autoBackupEnabled, dismissed]);

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-white border border-amber-200 shadow-xl rounded-2xl p-4 max-w-sm z-40 flex flex-col gap-3 animate-in slide-in-from-bottom-5">
      <div className="flex items-start justify-between gap-3">
        <div className="bg-amber-100 text-amber-600 p-2 rounded-full shrink-0">
          <AlertCircle size={20} />
        </div>
        <div>
          <h4 className="font-bold text-slate-800 text-sm">Lembrete de Backup</h4>
          <p className="text-xs text-slate-500 mt-1">Você realizou várias alterações desde o seu último backup manual. Deseja criar um novo backup agora?</p>
        </div>
        <button onClick={() => setShow(false)} className="text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
      </div>
      <div className="flex justify-end gap-2 mt-1">
        <button 
          onClick={() => {
            setDismissed(true);
            setShow(false);
          }}
          className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Não mostrar novamente
        </button>
        <button 
          onClick={() => setShow(false)}
          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Lembrar Depois
        </button>
        <button 
          onClick={() => {
            window.dispatchEvent(new CustomEvent('open-backup-modal'));
            setShow(false);
          }}
          className="px-3 py-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors shadow-sm"
        >
          Criar Backup
        </button>
      </div>
    </div>
  );
}
