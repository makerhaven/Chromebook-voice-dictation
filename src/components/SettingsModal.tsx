import React, { useState, useEffect } from 'react';
import {
  X,
  Keyboard,
  Sliders,
  Sparkles,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { CleanupSettings, KeyboardShortcut } from '../types';
import { DEFAULT_SHORTCUTS, DEFAULT_CLEANUP_SETTINGS } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CleanupSettings;
  onSaveSettings: (settings: CleanupSettings) => void;
  shortcuts: KeyboardShortcut[];
  onSaveShortcuts: (shortcuts: KeyboardShortcut[]) => void;
  activeTab?: 'cleanup' | 'shortcuts';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  shortcuts,
  onSaveShortcuts,
  activeTab: initialTab = 'cleanup',
}) => {
  const [activeTab, setActiveTab] = useState<'cleanup' | 'shortcuts'>(initialTab);
  const [localSettings, setLocalSettings] = useState<CleanupSettings>(settings);
  const [localShortcuts, setLocalShortcuts] = useState<KeyboardShortcut[]>(shortcuts);
  const [newCustomWord, setNewCustomWord] = useState<string>('');
  const [recordingShortcutId, setRecordingShortcutId] = useState<string | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
    setLocalShortcuts(shortcuts);
    setActiveTab(initialTab);
  }, [settings, shortcuts, initialTab, isOpen]);

  // Key recorder for custom keyboard shortcuts
  useEffect(() => {
    if (!recordingShortcutId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Skip lone modifier presses
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;

      const updated = localShortcuts.map((sc) => {
        if (sc.id === recordingShortcutId) {
          return {
            ...sc,
            key: e.key,
            ctrlKey: e.ctrlKey,
            altKey: e.altKey,
            shiftKey: e.shiftKey,
            metaKey: e.metaKey,
          };
        }
        return sc;
      });

      setLocalShortcuts(updated);
      onSaveShortcuts(updated);
      setRecordingShortcutId(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordingShortcutId, localShortcuts, onSaveShortcuts]);

  if (!isOpen) return null;

  const handleToggleSetting = (key: keyof CleanupSettings) => {
    const updated = { ...localSettings, [key]: !localSettings[key] };
    setLocalSettings(updated);
    onSaveSettings(updated);
  };

  const handleAddCustomWord = () => {
    const word = newCustomWord.trim().toLowerCase();
    if (!word) return;
    if (!localSettings.customRemovedWords.includes(word)) {
      const updatedWords = [...localSettings.customRemovedWords, word];
      const updated = { ...localSettings, customRemovedWords: updatedWords };
      setLocalSettings(updated);
      onSaveSettings(updated);
    }
    setNewCustomWord('');
  };

  const handleRemoveCustomWord = (word: string) => {
    const updatedWords = localSettings.customRemovedWords.filter((w) => w !== word);
    const updated = { ...localSettings, customRemovedWords: updatedWords };
    setLocalSettings(updated);
    onSaveSettings(updated);
  };

  const handleResetSettings = () => {
    setLocalSettings(DEFAULT_CLEANUP_SETTINGS);
    onSaveSettings(DEFAULT_CLEANUP_SETTINGS);
  };

  const handleResetShortcuts = () => {
    setLocalShortcuts(DEFAULT_SHORTCUTS);
    onSaveShortcuts(DEFAULT_SHORTCUTS);
  };

  const formatShortcutKey = (sc: KeyboardShortcut) => {
    const parts: string[] = [];
    if (sc.ctrlKey) parts.push('Ctrl');
    if (sc.altKey) parts.push('Alt');
    if (sc.shiftKey) parts.push('Shift');
    if (sc.metaKey) parts.push('Search/Cmd');
    parts.push(sc.key === ' ' ? 'Space' : sc.key.toUpperCase());
    return parts.join(' + ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="settings-modal"
        className="w-full max-w-2xl rounded-2xl border shadow-xl overflow-hidden transition-all
          bg-white border-slate-200 text-slate-900
          dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-semibold">
              Voice Dictation & Cleanup Preferences
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-2 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('cleanup')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'cleanup'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Passes & Word Cleanup ("up", "and")</span>
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'shortcuts'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Customized Keyboard Shortcuts</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {activeTab === 'cleanup' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Specific Word Removal Passes (User Requirement)
                </h4>

                <div className="space-y-3">
                  {/* Remove "up" */}
                  <label className="flex items-start justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
                    <div className="pr-4">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Edit out word: "up"
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Removes repetitive speech filler "up" (e.g., "heads up", filler clutter) across transcription passes.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.removeUp}
                      onChange={() => handleToggleSetting('removeUp')}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
                    />
                  </label>

                  {/* Remove "and" */}
                  <label className="flex items-start justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
                    <div className="pr-4">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Edit out word: "and"
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Removes conversational run-on connectors and stuttered "and" for clean, concise sentence breaks.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.removeAnd}
                      onChange={() => handleToggleSetting('removeAnd')}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
                    />
                  </label>

                  {/* Remove Common Fillers */}
                  <label className="flex items-start justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
                    <div className="pr-4">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Edit out verbal pauses ("um", "uh", "like", "you know")
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Strips hesitation sounds and filler phrases during speech processing.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.removeCommonFillers}
                      onChange={() => handleToggleSetting('removeCommonFillers')}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Custom Word Blacklist */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Custom Word Filter List
                </h4>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCustomWord}
                    onChange={(e) => setNewCustomWord(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomWord()}
                    placeholder="Add word to filter (e.g. 'basically')..."
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                  <button
                    onClick={handleAddCustomWord}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {localSettings.customRemovedWords.map((word) => (
                    <span
                      key={word}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      <span>"{word}"</span>
                      <button
                        onClick={() => handleRemoveCustomWord(word)}
                        className="hover:text-red-500 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Readability & Presentation Options */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Readability & Presentation
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
                    <div>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Professional Polish & Flow
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Substitutes colloquial speech ("gonna" → "going to", "wanna" → "want to") for executive clarity.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.professionalTone}
                      onChange={() => handleToggleSetting('professionalTone')}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <div>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          Gemini AI Presentation Polish
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Utilizes Gemini 2.5 Flash server-side to polish sentence boundary flow.
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.useGeminiAi}
                      onChange={() => handleToggleSetting('useGeminiAi')}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleResetSettings}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Default Cleanup Rules</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300">
                <p className="font-semibold mb-0.5">Customized Keyboard Shortcuts</p>
                <p>
                  Click "Record New" on any action, then press your desired key combination on your Chromebook keyboard.
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {localShortcuts.map((sc) => {
                  const isRecording = recordingShortcutId === sc.id;

                  return (
                    <div
                      key={sc.id}
                      className="py-3 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {sc.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {sc.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-xs px-3 py-1.5 rounded-lg border shadow-2xs font-semibold ${
                            isRecording
                              ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {isRecording ? 'Press keys now...' : formatShortcutKey(sc)}
                        </span>

                        <button
                          onClick={() => setRecordingShortcutId(isRecording ? null : sc.id)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          {isRecording ? 'Cancel' : 'Record New'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleResetShortcuts}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Default Shortcuts</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
