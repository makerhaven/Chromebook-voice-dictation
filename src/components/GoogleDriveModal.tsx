import React, { useState } from 'react';
import {
  Cloud,
  X,
  RefreshCw,
  FolderSync,
  CheckCircle2,
  Download,
  Upload,
  ShieldCheck,
  Smartphone,
  Laptop,
  HardDrive,
  FileJson,
} from 'lucide-react';
import { GoogleDriveSyncState, TranscriptLog } from '../types';
import { exportBackupJson } from '../utils/storage';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  driveState: GoogleDriveSyncState;
  onSyncNow: () => Promise<void>;
  onToggleAutoSync: () => void;
  transcripts: TranscriptLog[];
  onImportTranscripts: (imported: TranscriptLog[]) => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  driveState,
  onSyncNow,
  onToggleAutoSync,
  transcripts,
  onImportTranscripts,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.transcripts)) {
          onImportTranscripts(parsed.transcripts);
          setImportStatus(`Successfully restored ${parsed.transcripts.length} logs from Drive backup!`);
          setTimeout(() => setImportStatus(null), 3000);
        } else if (Array.isArray(parsed)) {
          onImportTranscripts(parsed);
          setImportStatus(`Successfully restored ${parsed.length} logs!`);
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('Invalid backup file format');
        }
      } catch (err) {
        setImportStatus('Failed to parse Google Drive JSON backup file');
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadSnapshot = () => {
    const jsonStr = exportBackupJson(transcripts);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GoogleDrive-VoiceTranscripts-Backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lastSyncStr = driveState.lastSyncTimestamp
    ? new Date(driveState.lastSyncTimestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Never';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="google-drive-sync-modal"
        className="w-full max-w-lg rounded-2xl border shadow-xl overflow-hidden transition-all
          bg-white border-slate-200 text-slate-900
          dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">
                Google Drive Cloud Sync
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cross-platform backup & multi-device sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Connection Status Card */}
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Google Drive Cloud Sync: Connected & Active
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                Last synced: {lastSyncStr}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Target Folder:</span>
                <span className="font-mono font-medium">My Drive / {driveState.driveFolder}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Synced Items:</span>
                <span className="font-mono font-medium">{transcripts.length} transcript logs</span>
              </div>
            </div>
          </div>

          {/* Sync Actions */}
          <div className="space-y-3">
            {/* Auto-Sync Toggle */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
              <div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Automatic Background Cloud Sync
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Automatically backs up each confirmed voice thought to Google Drive instantly.
                </p>
              </div>
              <input
                type="checkbox"
                checked={driveState.autoSync}
                onChange={onToggleAutoSync}
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </label>

            {/* Sync Now Button */}
            <button
              onClick={onSyncNow}
              disabled={driveState.status === 'syncing'}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-xs transition"
            >
              <RefreshCw className={`w-4 h-4 ${driveState.status === 'syncing' ? 'animate-spin' : ''}`} />
              <span>{driveState.status === 'syncing' ? 'Syncing with Google Drive...' : 'Sync with Google Drive Now'}</span>
            </button>
          </div>

          {/* Cross-Platform Device Sync Features */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 text-xs">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-blue-500" />
              <span>Cross-Device Compatibility</span>
            </h4>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              Access your spoken transcripts from any Chromebook, Android device, or browser. Download a backup snapshot or restore previously recorded sessions.
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleDownloadSnapshot}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Drive Snapshot</span>
              </button>

              <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition font-medium cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Restore Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {importStatus}
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 hover:opacity-90 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
