import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TranscriptLog,
  Session,
  CleanupSettings,
  KeyboardShortcut,
  GoogleDriveSyncState,
  ThemeMode,
  TargetAppId,
} from './types';
import {
  loadTranscripts,
  saveTranscripts,
  loadSessions,
  saveSessions,
  loadCleanupSettings,
  saveCleanupSettings,
  loadShortcuts,
  saveShortcuts,
  loadDriveState,
  saveDriveState,
  loadTheme,
  saveTheme,
} from './utils/storage';
import { runLocalCleanupPasses, runAiCleanup } from './utils/cleanupEngine';
import { playEarcon } from './utils/audioSynthesis';
import { useVoiceDictation } from './hooks/useVoiceDictation';
import { Header } from './components/Header';
import { DictationBar } from './components/DictationBar';
import { ConfirmationCard } from './components/ConfirmationCard';
import { SandboxTargets } from './components/SandboxTargets';
import { CompanionDashboard } from './components/CompanionDashboard';
import { SettingsModal } from './components/SettingsModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { FloatingDock } from './components/FloatingDock';
import { Laptop, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Persistence state
  const [transcripts, setTranscripts] = useState<TranscriptLog[]>(loadTranscripts);
  const [sessions, setSessions] = useState<Session[]>(loadSessions);
  const [activeSession, setActiveSession] = useState<Session>(sessions[0] || {
    id: 'session-default',
    name: 'General Dictation',
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    transcriptCount: 0,
  });
  const [cleanupSettings, setCleanupSettings] = useState<CleanupSettings>(loadCleanupSettings);
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>(loadShortcuts);
  const [driveState, setDriveState] = useState<GoogleDriveSyncState>(loadDriveState);
  const [theme, setTheme] = useState<ThemeMode>(loadTheme);

  // UI state
  const [activeView, setActiveView] = useState<'split' | 'dashboard' | 'sandbox'>('split');
  const [activeTargetId, setActiveTargetId] = useState<TargetAppId>('gmail');
  const [targetContents, setTargetContents] = useState<Record<TargetAppId, string>>({
    gmail: 'Hi Team,\n\n',
    docs: 'Project Planning Notes:\n',
    slack: '',
    omnibox: '',
    code: '',
    custom: '',
  });
  const [lastInsertedText, setLastInsertedText] = useState<string | null>(null);

  // Modals & Floating Overlays
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'cleanup' | 'shortcuts'>('cleanup');
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [showFloatingDock, setShowFloatingDock] = useState<boolean>(true);
  const [isAiPolishing, setIsAiPolishing] = useState<boolean>(false);
  const [editedCleanedText, setEditedCleanedText] = useState<string | null>(null);

  // Voice dictation hook
  const {
    isListening,
    isPaused,
    thoughtComplete,
    rawDraft,
    interimTranscript,
    audioLevel,
    micError,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    markThoughtComplete,
    setRawDraft,
    clearDraft,
    simulateSpeechPhrase,
  } = useVoiceDictation();

  // Multi-pass cleanup computation on current draft
  const cleanupResult = useMemo(() => {
    return runLocalCleanupPasses(rawDraft, cleanupSettings);
  }, [rawDraft, cleanupSettings]);

  // Target App Name helper
  const targetAppName = useMemo(() => {
    switch (activeTargetId) {
      case 'gmail':
        return 'Gmail Composer';
      case 'docs':
        return 'Google Docs';
      case 'slack':
        return 'Slack Team Chat';
      case 'omnibox':
        return 'Chrome Omnibox';
      case 'code':
        return 'Terminal & Code';
      default:
        return 'Custom Input';
    }
  }, [activeTargetId]);

  // Handle Dark Mode toggles and system preferences
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System mode
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isSystemDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    saveTheme(theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  // Reset manually edited text whenever new raw speech comes in
  useEffect(() => {
    setEditedCleanedText(null);
  }, [rawDraft]);

  // Save transcripts to localStorage whenever changed
  useEffect(() => {
    saveTranscripts(transcripts);
  }, [transcripts]);

  // Save sessions to localStorage
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  // Save drive state
  useEffect(() => {
    saveDriveState(driveState);
  }, [driveState]);

  // Save settings
  const handleSaveSettings = (updated: CleanupSettings) => {
    setCleanupSettings(updated);
    saveCleanupSettings(updated);
  };

  // Save shortcuts
  const handleSaveShortcuts = (updated: KeyboardShortcut[]) => {
    setShortcuts(updated);
    saveShortcuts(updated);
  };

  // Run AI Polish pass using server API
  const handleRunAiPolish = async () => {
    if (!rawDraft.trim()) return;
    setIsAiPolishing(true);
    try {
      const polished = await runAiCleanup(rawDraft, cleanupSettings);
      setEditedCleanedText(polished);
      playEarcon('confirm');
    } catch (err) {
      console.warn('AI Polish failed:', err);
    } finally {
      setIsAiPolishing(false);
    }
  };

  // THE CHECKMARK CONFIRMATION HANDLER
  // "equally important it does not enter the transcribed statements until user clicks a check mark box confirming proper statement and completion of thought."
  const handleConfirmStatement = useCallback(
    (textToInsert: string) => {
      const text = textToInsert.trim();
      if (!text) return;

      playEarcon('confirm');

      // 1. Enter into the selected target text box
      setTargetContents((prev) => {
        const existing = prev[activeTargetId] || '';
        const separator = existing.length > 0 && !existing.endsWith('\n') && !existing.endsWith(' ') ? ' ' : '';
        return {
          ...prev,
          [activeTargetId]: existing + separator + text,
        };
      });
      setLastInsertedText(text);

      // 2. Auto-copy to Chromebook system clipboard for pasting into any application anywhere
      try {
        navigator.clipboard.writeText(text);
      } catch {}

      // 3. Create chronological transcript log
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      const newLog: TranscriptLog = {
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        rawText: rawDraft,
        cleanedText: text,
        approved: true,
        sessionName: activeSession.name,
        targetApp: targetAppName,
        wordCount,
        durationMs: Math.max(1500, wordCount * 280),
        filteredWords: cleanupResult.filteredWords,
        cleanupPasses: cleanupResult.passes,
        syncedToDrive: driveState.autoSync,
      };

      setTranscripts((prev) => [newLog, ...prev]);

      // 4. Update session statistics
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                transcriptCount: s.transcriptCount + 1,
                lastActiveAt: Date.now(),
              }
            : s
        )
      );

      // 5. If Google Drive auto-sync is on, update sync state
      if (driveState.autoSync) {
        setDriveState((prev) => ({
          ...prev,
          lastSyncTimestamp: Date.now(),
          status: 'synced',
          totalSyncedItems: prev.totalSyncedItems + 1,
        }));
      }

      // 6. Clear current draft
      clearDraft();
      setEditedCleanedText(null);
    },
    [
      activeTargetId,
      rawDraft,
      activeSession,
      targetAppName,
      cleanupResult,
      driveState.autoSync,
      clearDraft,
    ]
  );

  const handleDiscardStatement = useCallback(() => {
    playEarcon('discard');
    clearDraft();
    setEditedCleanedText(null);
  }, [clearDraft]);

  // New Session Creation
  const handleNewSession = useCallback(() => {
    const name = window.prompt('Enter new dictation session name:', `Session ${sessions.length + 1}`);
    if (!name) return;
    const newSess: Session = {
      id: `session-${Date.now()}`,
      name: name.trim(),
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      transcriptCount: 0,
    };
    setSessions((prev) => [newSess, ...prev]);
    setActiveSession(newSess);
  }, [sessions.length]);

  // Google Drive Manual Sync trigger
  const handleSyncDrive = async () => {
    setDriveState((prev) => ({ ...prev, status: 'syncing' }));
    playEarcon('start');
    await new Promise((resolve) => setTimeout(resolve, 800));
    setDriveState((prev) => ({
      ...prev,
      status: 'synced',
      lastSyncTimestamp: Date.now(),
      totalSyncedItems: transcripts.length,
    }));
    playEarcon('confirm');
  };

  const handleToggleAutoSync = () => {
    setDriveState((prev) => ({ ...prev, autoSync: !prev.autoSync }));
  };

  const handleImportTranscripts = (imported: TranscriptLog[]) => {
    setTranscripts((prev) => {
      const existingIds = new Set(prev.map((l) => l.id));
      const novel = imported.filter((l) => !existingIds.has(l.id));
      return [...novel, ...prev];
    });
  };

  const handleDeleteLog = (id: string) => {
    setTranscripts((prev) => prev.filter((l) => l.id !== id));
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in a textarea or input unless modifier is held
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Check shortcuts
      for (const sc of shortcuts) {
        const matchesKey = e.key.toLowerCase() === sc.key.toLowerCase();
        const matchesCtrl = Boolean(sc.ctrlKey) === (e.ctrlKey || e.metaKey);
        const matchesAlt = Boolean(sc.altKey) === e.altKey;
        const matchesShift = Boolean(sc.shiftKey) === e.shiftKey;

        if (matchesKey && matchesCtrl && matchesAlt && matchesShift) {
          e.preventDefault();

          if (sc.id === 'toggle-dictation') {
            if (isListening) {
              stopListening();
            } else {
              startListening();
            }
          } else if (sc.id === 'confirm-statement') {
            const currentDisplay = editedCleanedText || cleanupResult.cleaned || rawDraft;
            if (currentDisplay.trim()) {
              handleConfirmStatement(currentDisplay);
            }
          } else if (sc.id === 'pause-dictation') {
            if (isListening) {
              if (isPaused) resumeListening();
              else pauseListening();
            }
          } else if (sc.id === 'discard-statement') {
            handleDiscardStatement();
          } else if (sc.id === 'new-session') {
            handleNewSession();
          } else if (sc.id === 'toggle-dock') {
            setShowFloatingDock((prev) => !prev);
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    shortcuts,
    isListening,
    isPaused,
    stopListening,
    startListening,
    pauseListening,
    resumeListening,
    editedCleanedText,
    cleanupResult.cleaned,
    rawDraft,
    handleConfirmStatement,
    handleDiscardStatement,
    handleNewSession,
  ]);

  const currentDisplayForCard = editedCleanedText || cleanupResult.cleaned;

  return (
    <div
      id="chromebook-app-root"
      className="min-h-screen transition-colors duration-200 bg-slate-100/80 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col"
    >
      {/* ChromeOS Top Application Header */}
      <Header
        sessions={sessions}
        activeSession={activeSession}
        onSelectSession={setActiveSession}
        onNewSession={handleNewSession}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        driveState={driveState}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
        onOpenSettings={() => {
          setSettingsTab('cleanup');
          setIsSettingsOpen(true);
        }}
        onOpenShortcuts={() => {
          setSettingsTab('shortcuts');
          setIsSettingsOpen(true);
        }}
        activeView={activeView}
        onChangeView={setActiveView}
        isListening={isListening}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Chromebook Voice Dictation Control Bar */}
        <DictationBar
          isListening={isListening}
          isPaused={isPaused}
          thoughtComplete={thoughtComplete}
          audioLevel={audioLevel}
          rawDraft={rawDraft}
          interimTranscript={interimTranscript}
          micError={micError}
          onToggleListen={isListening ? stopListening : startListening}
          onTogglePause={isPaused ? resumeListening : pauseListening}
          onClearDraft={handleDiscardStatement}
          onSimulatePhrase={() => simulateSpeechPhrase()}
          onMarkThoughtComplete={markThoughtComplete}
          settings={cleanupSettings}
          onOpenSettings={() => {
            setSettingsTab('cleanup');
            setIsSettingsOpen(true);
          }}
        />

        {/* Thought Completion & Check Mark Box Confirmation Card */}
        <ConfirmationCard
          rawText={rawDraft}
          interimText={interimTranscript}
          cleanupResult={cleanupResult}
          isListening={isListening}
          thoughtComplete={thoughtComplete}
          targetAppName={targetAppName}
          onConfirmStatement={handleConfirmStatement}
          onDiscardStatement={handleDiscardStatement}
          onRunAiPolish={handleRunAiPolish}
          isAiPolishing={isAiPolishing}
          onUpdateCleanedText={setEditedCleanedText}
        />

        {/* Views Switching */}
        {activeView === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Col: Target text box sandbox (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <SandboxTargets
                activeTargetId={activeTargetId}
                onSelectTarget={setActiveTargetId}
                targetContents={targetContents}
                onUpdateTargetContent={(id, text) =>
                  setTargetContents((prev) => ({ ...prev, [id]: text }))
                }
                onClearTarget={(id) =>
                  setTargetContents((prev) => ({ ...prev, [id]: '' }))
                }
                lastInsertedText={lastInsertedText}
              />
            </div>

            {/* Right Col: Companion Dashboard & Chronological logs (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <CompanionDashboard
                logs={transcripts}
                driveState={driveState}
                onSyncDrive={handleSyncDrive}
                onDeleteLog={handleDeleteLog}
                onInsertLogIntoTarget={(text) => {
                  setTargetContents((prev) => ({
                    ...prev,
                    [activeTargetId]: (prev[activeTargetId] ? prev[activeTargetId] + ' ' : '') + text,
                  }));
                  setLastInsertedText(text);
                  playEarcon('confirm');
                }}
                onOpenDriveModal={() => setIsDriveModalOpen(true)}
                activeSessionName={activeSession.name}
              />
            </div>
          </div>
        )}

        {activeView === 'sandbox' && (
          <div className="max-w-4xl mx-auto">
            <SandboxTargets
              activeTargetId={activeTargetId}
              onSelectTarget={setActiveTargetId}
              targetContents={targetContents}
              onUpdateTargetContent={(id, text) =>
                setTargetContents((prev) => ({ ...prev, [id]: text }))
              }
              onClearTarget={(id) =>
                setTargetContents((prev) => ({ ...prev, [id]: '' }))
              }
              lastInsertedText={lastInsertedText}
            />
          </div>
        )}

        {activeView === 'dashboard' && (
          <CompanionDashboard
            logs={transcripts}
            driveState={driveState}
            onSyncDrive={handleSyncDrive}
            onDeleteLog={handleDeleteLog}
            onInsertLogIntoTarget={(text) => {
              setTargetContents((prev) => ({
                ...prev,
                [activeTargetId]: (prev[activeTargetId] ? prev[activeTargetId] + ' ' : '') + text,
              }));
              setLastInsertedText(text);
              playEarcon('confirm');
            }}
            onOpenDriveModal={() => setIsDriveModalOpen(true)}
            activeSessionName={activeSession.name}
          />
        )}
      </main>

      {/* ChromeOS Floating Shelf Dock Overlay */}
      {showFloatingDock && (
        <FloatingDock
          isListening={isListening}
          isPaused={isPaused}
          audioLevel={audioLevel}
          displayText={currentDisplayForCard}
          hasThought={Boolean(rawDraft.trim())}
          onToggleListen={isListening ? stopListening : startListening}
          onTogglePause={isPaused ? resumeListening : pauseListening}
          onConfirm={() => handleConfirmStatement(currentDisplayForCard)}
          onDiscard={handleDiscardStatement}
          onCloseDock={() => setShowFloatingDock(false)}
          targetAppName={targetAppName}
        />
      )}

      {/* Settings Modal (Passes & Word Filter rules + Custom Shortcuts) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={cleanupSettings}
        onSaveSettings={handleSaveSettings}
        shortcuts={shortcuts}
        onSaveShortcuts={handleSaveShortcuts}
        activeTab={settingsTab}
      />

      {/* Google Drive Cloud Sync Modal */}
      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        driveState={driveState}
        onSyncNow={handleSyncDrive}
        onToggleAutoSync={handleToggleAutoSync}
        transcripts={transcripts}
        onImportTranscripts={handleImportTranscripts}
      />
    </div>
  );
}
