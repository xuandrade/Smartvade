import { useEffect } from 'react';
import { useStore } from '../store/useStore';

const AUTO_BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useAutoBackup() {
  const { autoBackupEnabled, createSnapshot, updateLastBackupDate } = useStore();

  useEffect(() => {
    if (!autoBackupEnabled) return;

    const interval = setInterval(() => {
      // Create a rolling snapshot automatically
      const now = new Date();
      createSnapshot(`Auto Backup - ${now.toLocaleTimeString('pt-BR')}`);
      updateLastBackupDate();
    }, AUTO_BACKUP_INTERVAL);

    return () => clearInterval(interval);
  }, [autoBackupEnabled, createSnapshot, updateLastBackupDate]);
}
