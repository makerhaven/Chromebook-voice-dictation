import React, { useState, useMemo } from 'react';
import {
  Clock,
  Search,
  Filter,
  Download,
  Cloud,
  FileText,
  Volume2,
  Copy,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { TranscriptLog, GoogleDriveSyncState } from '../types';
import { speakText } from '../utils/audioSynthesis';
import { exportBackupJson, exportMarkdown } from '../utils/storage';

interface CompanionDashboardProps {
  logs: TranscriptLog[];
  driveState: GoogleDriveSyncState;
  onSyncDrive: () => Promise<void>;
  onDeleteLog: (id: string) => void;
  onInsertLogIntoTarget: (text: string) => void;
  onOpenDriveModal: () => void;
  activeSessionName: string;
}

export const CompanionDashboard: React.FC<CompanionDashboardProps> = ({
  logs,
  driveState,
  onSyncDrive,
  onDeleteLog,
  onInsertLogIntoTarget,
  onOpenDriveModal,
  activeSessionName,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterApp, setFilterApp] = useState<string>('all');
  const [filterApproved, setFilterApproved] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);
  const [playingLogId, setPlayingLogId] = useState<string | null>(null);

  // Statistics calculation
  const stats = useMemo(() => {
    let totalWords = 0;
    let approvedCount = 0;
    let totalFillers = 0;

    for (const log of logs) {
      totalWords += log.wordCount || 0;
      if (log.approved) approvedCount++;
      if (log.filteredWords) {
        totalFillers += log.filteredWords.reduce((sum, f) => sum + f.count, 0);
      }
    }

    return {
      totalWords,
      totalStatements: logs.length,
      approvedCount,
      totalFillers,
      approvalRate: logs.length > 0 ? Math.round((approvedCount / logs.length) * 100) : 100,
    };
  }, [logs]);

  // Unique apps list for dropdown filter
  const uniqueApps = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.targetApp));
    return Array.from(set);
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        if (filterApp !== 'all' && log.targetApp !== filterApp) return false;
        if (filterApproved === 'approved' && !log.approved) return false;
        if (filterApproved === 'pending' && log.approved) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCleaned = log.cleanedText.toLowerCase().includes(q);
          const matchRaw = log.rawText.toLowerCase().includes(q);
          const matchSession = log.sessionName.toLowerCase().includes(q);
          return matchCleaned || matchRaw || matchSession;
        }
        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp); // Chronological newest first
  }, [logs, searchQuery, filterApp, filterApproved]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLogId(id);
    setTimeout(() => setCopiedLogId(null), 1800);
  };

  const handlePlay = (id: string, text: string) => {
    setPlayingLogId(id);
    speakText(text, () => setPlayingLogId(null));
  };

  const handleDownloadBackupJson = () => {
    const jsonStr = exportBackupJson(logs);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chromebook-voice-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    const mdStr = exportMarkdown(logs);
    const blob = new Blob([mdStr], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-dictation-history-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="companion-dashboard-container"
      className="space-y-5"
    >
      {/* Top Companion Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Spoken Words */}
        <div className="rounded-2xl border p-4 bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Spoken Words Logged</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {stats.totalWords.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">words backed up</span>
          </div>
        </div>

        {/* Approved & Confirmed Statements */}
        <div className="rounded-2xl border p-4 bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Confirmed Statements</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats.approvedCount}
            </span>
            <span className="text-xs text-slate-400">
              of {stats.totalStatements} ({stats.approvalRate}%)
            </span>
          </div>
        </div>

        {/* Filtered Fillers ("up", "and", etc.) */}
        <div className="rounded-2xl border p-4 bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Fillers Stripped</span>
            <Filter className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
              {stats.totalFillers}
            </span>
            <span className="text-xs text-slate-400">"up", "and", "um"</span>
          </div>
        </div>

        {/* Google Drive Cloud Status */}
        <div
          onClick={onOpenDriveModal}
          className="rounded-2xl border p-4 bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-xs cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Google Drive Sync</span>
            <Cloud className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Drive Synced
              </span>
              <p className="text-[11px] text-slate-400 truncate max-w-[130px]">
                {logs.length} files backed up
              </p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Main Companion Log Table & Controls Card */}
      <div className="rounded-2xl border p-5 bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm">
        {/* Controls Toolbar: Search, Filters & Export */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="search-transcripts-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chronological transcript history..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition
                bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400
                dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              aria-label="Filter by application"
              value={filterApp}
              onChange={(e) => setFilterApp(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Applications</option>
              {uniqueApps.map((app) => (
                <option key={app} value={app}>
                  {app}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by approval status"
              value={filterApproved}
              onChange={(e) => setFilterApproved(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved & Inserted</option>
              <option value="pending">Draft / Pending</option>
            </select>

            {/* Cloud Sync Trigger */}
            <button
              id="btn-manual-sync-drive"
              onClick={onSyncDrive}
              disabled={driveState.status === 'syncing'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 transition"
              title="Push immediate sync to Google Drive"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${driveState.status === 'syncing' ? 'animate-spin' : ''}`} />
              <span>{driveState.status === 'syncing' ? 'Syncing...' : 'Sync to Drive'}</span>
            </button>

            {/* Export Menu */}
            <button
              id="btn-export-backup-json"
              onClick={handleDownloadBackupJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Download full JSON backup of all transcripts"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>

            <button
              id="btn-export-markdown"
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Download readable Markdown report of history"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Markdown</span>
            </button>
          </div>
        </div>

        {/* Chronological List of Transcripts */}
        <div className="mt-4 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-xl border-slate-200 dark:border-slate-800 text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium">No matching chronological logs found</p>
              <p className="text-xs mt-1 text-slate-500">
                Speak any phrase or click "Test Voice Phrase" above to record entries into this companion log.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const dateStr = new Date(log.timestamp).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              });
              const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div
                  key={log.id}
                  id={`log-item-${log.id}`}
                  className="rounded-xl border border-slate-200/90 dark:border-slate-800/90 p-4 transition hover:border-blue-300 dark:hover:border-blue-800 bg-white dark:bg-slate-900/60"
                >
                  {/* Top Metadata Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                        {dateStr} • {timeStr}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        {log.targetApp}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        ({log.wordCount} words)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Approval Status */}
                      {log.approved ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60">
                          <CheckCircle2 className="w-3 h-3" />
                          Approved & Inserted
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/60">
                          <AlertCircle className="w-3 h-3" />
                          Draft / Unconfirmed
                        </span>
                      )}

                      {/* Google Drive Synced indicator */}
                      <span
                        className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500"
                        title="Backed up to Google Drive"
                      >
                        <Cloud className="w-3 h-3 text-emerald-500" />
                        <span className="hidden sm:inline">Drive</span>
                      </span>
                    </div>
                  </div>

                  {/* Cleaned Statement Content */}
                  <div className="my-2">
                    <p className="text-sm sm:text-base leading-relaxed text-slate-900 dark:text-slate-100 font-sans font-medium">
                      "{log.cleanedText}"
                    </p>
                  </div>

                  {/* Filtered Words Badges */}
                  {log.filteredWords && log.filteredWords.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap my-2">
                      <span className="text-[11px] text-slate-400">Stripped:</span>
                      {log.filteredWords.map((f, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50 font-mono"
                        >
                          "{f.word}" ({f.count})
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expandable Passes Diff View */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                        <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                          Pass 1: Words "up" and "and" edited out:
                        </span>
                        <p className="font-mono text-slate-800 dark:text-slate-200">
                          {log.cleanupPasses?.pass1FillerRemoved || log.rawText}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                        <span className="font-semibold text-amber-800 dark:text-amber-400 block mb-1">
                          Original Raw Voice:
                        </span>
                        <p className="font-mono text-slate-800 dark:text-slate-200">
                          "{log.rawText}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons Row */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Hide Passes Breakdown</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>Show Passes & Raw Audio</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Read back aloud */}
                      <button
                        onClick={() => handlePlay(log.id, log.cleanedText)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Read aloud via voice synthesis"
                      >
                        <Volume2 className={`w-3.5 h-3.5 ${playingLogId === log.id ? 'text-blue-500 animate-bounce' : ''}`} />
                      </button>

                      {/* Copy */}
                      <button
                        onClick={() => handleCopy(log.id, log.cleanedText)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Copy to clipboard"
                      >
                        {copiedLogId === log.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Re-insert into current active target */}
                      <button
                        onClick={() => onInsertLogIntoTarget(log.cleanedText)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                        title="Re-insert into the active Chromebook text box"
                      >
                        <ArrowUpRight className="w-3 h-3" />
                        <span className="hidden sm:inline">Insert</span>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDeleteLog(log.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        title="Delete log entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
