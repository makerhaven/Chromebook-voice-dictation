import React from 'react';
import {
  Mic,
  Cloud,
  Moon,
  Sun,
  Laptop,
  Keyboard,
  Settings as SettingsIcon,
  Plus,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Session, ThemeMode, GoogleDriveSyncState } from '../types';

interface HeaderProps {
  sessions: Session[];
  activeSession: Session;
  onSelectSession: (session: Session) => void;
  onNewSession: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  driveState: GoogleDriveSyncState;
  onOpenDriveModal: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  activeView: 'dashboard' | 'sandbox' | 'split';
  onChangeView: (view: 'dashboard' | 'sandbox' | 'split') => void;
  isListening: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  sessions,
  activeSession,
  onSelectSession,
  onNewSession,
  theme,
  onToggleTheme,
  driveState,
  onOpenDriveModal,
  onOpenSettings,
  onOpenShortcuts,
  activeView,
  onChangeView,
  isListening,
}) => {
  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 w-full border-b backdrop-blur-md transition-colors duration-200
        bg-white/90 border-slate-200/80 text-slate-800
        dark:bg-slate-900/90 dark:border-slate-800 dark:text-slate-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand & ChromeOS Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-sm shadow-blue-500/20">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight leading-tight">
                Chromebook Dictation
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80">
                <Laptop className="w-3 h-3" />
                ChromeOS Native
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Voice-to-Text anywhere • Cloud backed up to Google Drive
            </p>
          </div>
        </div>

        {/* Center: Session selector */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-lg p-1 border border-slate-200/70 dark:border-slate-700/60">
            <select
              id="session-select"
              aria-label="Active session"
              value={activeSession?.id || ''}
              onChange={(e) => {
                const found = sessions.find((s) => s.id === e.target.value);
                if (found) onSelectSession(found);
              }}
              className="bg-transparent text-xs font-medium px-2.5 py-1 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id} className="dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  {s.name} ({s.transcriptCount} logs)
                </option>
              ))}
            </select>
            <button
              id="btn-new-session"
              onClick={onNewSession}
              title="Create new dictation session (Ctrl+Shift+S)"
              className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* View Mode Pills */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-lg p-0.5 border border-slate-200/70 dark:border-slate-700/60">
            <button
              id="btn-view-split"
              onClick={() => onChangeView('split')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                activeView === 'split'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Workspace
            </button>
            <button
              id="btn-view-dashboard"
              onClick={() => onChangeView('dashboard')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                activeView === 'dashboard'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Companion Logs
            </button>
            <button
              id="btn-view-sandbox"
              onClick={() => onChangeView('sandbox')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                activeView === 'sandbox'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Target Apps
            </button>
          </div>
        </div>

        {/* Right Controls: Drive Status, Shortcuts, Theme, Settings */}
        <div className="flex items-center gap-2">
          {/* Google Drive Status Pill */}
          <button
            id="btn-drive-status"
            onClick={onOpenDriveModal}
            title="Google Drive Cloud Sync Status"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition
              bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/80
              dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 dark:hover:bg-emerald-900/40"
          >
            <Cloud className={`w-3.5 h-3.5 ${driveState.status === 'syncing' ? 'animate-pulse' : ''}`} />
            <span className="hidden lg:inline">Google Drive</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </button>

          {/* Keyboard Shortcuts Trigger */}
          <button
            id="btn-shortcuts-header"
            onClick={onOpenShortcuts}
            title="Custom Keyboard Shortcuts"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Dark Mode Toggle */}
          <button
            id="btn-theme-toggle"
            onClick={onToggleTheme}
            title={`Switch theme (current: ${theme})`}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Settings Trigger */}
          <button
            id="btn-settings-header"
            onClick={onOpenSettings}
            title="Filter Passes & Cleanup Settings"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
