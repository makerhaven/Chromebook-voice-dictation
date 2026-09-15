import React from 'react';
import {
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  CheckCircle2,
  Wand2,
  Radio,
  Sliders,
} from 'lucide-react';
import { CleanupSettings } from '../types';

interface DictationBarProps {
  isListening: boolean;
  isPaused: boolean;
  thoughtComplete: boolean;
  audioLevel: number;
  rawDraft: string;
  interimTranscript: string;
  micError: string | null;
  onToggleListen: () => void;
  onTogglePause: () => void;
  onClearDraft: () => void;
  onSimulatePhrase: () => void;
  onMarkThoughtComplete: () => void;
  settings: CleanupSettings;
  onOpenSettings: () => void;
}

export const DictationBar: React.FC<DictationBarProps> = ({
  isListening,
  isPaused,
  thoughtComplete,
  audioLevel,
  rawDraft,
  interimTranscript,
  micError,
  onToggleListen,
  onTogglePause,
  onClearDraft,
  onSimulatePhrase,
  onMarkThoughtComplete,
  settings,
  onOpenSettings,
}) => {
  // Compute visual waveform heights based on audioLevel
  const barHeights = React.useMemo(() => {
    return [0.4, 0.7, 1.0, 0.85, 0.6, 0.9, 0.5, 0.3].map((multiplier) => {
      if (!isListening || isPaused) return 6;
      const height = Math.max(6, Math.min(36, Math.round((audioLevel / 100) * 36 * multiplier + Math.random() * 4)));
      return height;
    });
  }, [audioLevel, isListening, isPaused]);

  return (
    <div
      id="dictation-control-bar"
      className="w-full rounded-2xl border transition-all duration-300 p-4 sm:p-5 shadow-sm
        bg-white border-slate-200/90 text-slate-800
        dark:bg-slate-900/90 dark:border-slate-800 dark:text-slate-100"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Active Dictation Mic Button & State */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative">
            {/* Listening pulse rings */}
            {isListening && !isPaused && (
              <span className="absolute -inset-2 rounded-full bg-blue-500/25 animate-ping" />
            )}
            <button
              id="btn-toggle-mic"
              onClick={onToggleListen}
              className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${
                isListening
                  ? isPaused
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30 ring-4 ring-amber-400/20'
                    : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30 ring-4 ring-red-400/25'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 hover:scale-105'
              }`}
              title={
                isListening
                  ? isPaused
                    ? 'Resume voice dictation'
                    : 'Stop listening (Ctrl+Space)'
                  : 'Start voice dictation (Ctrl+Space)'
              }
            >
              {isListening ? (
                isPaused ? (
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                ) : (
                  <Mic className="w-6 h-6 animate-pulse" />
                )
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  isListening
                    ? isPaused
                      ? 'bg-amber-500'
                      : 'bg-red-500 animate-pulse'
                    : 'bg-slate-400 dark:bg-slate-600'
                }`}
              />
              <h2 className="text-sm font-semibold tracking-tight">
                {isListening
                  ? isPaused
                    ? 'Dictation Paused'
                    : 'Listening to Voice...'
                  : 'Chromebook Voice Ready'}
              </h2>
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                Ctrl + Space
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isListening
                ? isPaused
                  ? 'Press play or Alt+P to resume speaking'
                  : 'Speak naturally into any target box'
                : 'Click mic or press shortcut to begin dictating'}
            </p>
          </div>
        </div>

        {/* Center: Live Audio Waveform & Level Meter */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-center">
          <div className="flex items-end gap-1 h-9 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50">
            {barHeights.map((height, i) => (
              <div
                key={i}
                style={{ height: `${height}px` }}
                className={`w-1 rounded-full transition-all duration-100 ${
                  isListening && !isPaused
                    ? 'bg-blue-600 dark:bg-blue-400'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Thought State Indicator */}
          {rawDraft.trim() && (
            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60">
              <span
                className={`w-2 h-2 rounded-full ${
                  thoughtComplete ? 'bg-emerald-500' : 'bg-amber-400 animate-ping'
                }`}
              />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {thoughtComplete ? 'Thought Complete' : 'Speaking...'}
              </span>
            </div>
          )}
        </div>

        {/* Right Controls: Pause, Complete, Simulate & Filter Rules */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {/* Pause / Resume button */}
          {isListening && (
            <button
              id="btn-pause-listening"
              onClick={onTogglePause}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition
                bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300/80
                dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700"
              title="Pause dictation (Alt+P)"
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
          )}

          {/* Mark thought finished button */}
          {rawDraft.trim() && !thoughtComplete && (
            <button
              id="btn-mark-thought-complete"
              onClick={onMarkThoughtComplete}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80 transition"
              title="Flag statement as complete for review"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Finish Thought</span>
            </button>
          )}

          {/* Quick Clear */}
          {rawDraft.trim() && (
            <button
              id="btn-clear-draft"
              onClick={onClearDraft}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Discard draft (Esc)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Test / Simulate Phrase button */}
          <button
            id="btn-simulate-voice"
            onClick={onSimulatePhrase}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-dashed border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 transition"
            title="Simulate speaking a sample phrase with 'up' and 'and' to test auto-cleaner"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Test Voice Phrase</span>
          </button>

          {/* Active Filter Badges */}
          <button
            id="btn-open-filter-rules"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60 hover:opacity-90 transition"
            title="Configured word filters"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">
              Filters: {settings.removeUp ? '-up ' : ''}{settings.removeAnd ? '-and' : ''}
            </span>
          </button>
        </div>
      </div>

      {/* Microphone Error Alert if permission blocked */}
      {micError && (
        <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MicOff className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{micError}</span>
          </div>
          <button
            onClick={onSimulatePhrase}
            className="font-medium underline text-amber-900 dark:text-amber-100 hover:no-underline ml-2"
          >
            Run Test Audio
          </button>
        </div>
      )}
    </div>
  );
};
