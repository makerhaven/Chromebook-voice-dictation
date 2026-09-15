import React from 'react';
import {
  Mic,
  MicOff,
  Check,
  X,
  Pause,
  Play,
  Volume2,
  Minimize2,
  Maximize2,
  Sparkles,
  Laptop,
} from 'lucide-react';

interface FloatingDockProps {
  isListening: boolean;
  isPaused: boolean;
  audioLevel: number;
  displayText: string;
  hasThought: boolean;
  onToggleListen: () => void;
  onTogglePause: () => void;
  onConfirm: () => void;
  onDiscard: () => void;
  onCloseDock: () => void;
  targetAppName: string;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({
  isListening,
  isPaused,
  audioLevel,
  displayText,
  hasThought,
  onToggleListen,
  onTogglePause,
  onConfirm,
  onDiscard,
  onCloseDock,
  targetAppName,
}) => {
  return (
    <div
      id="chromebook-floating-shelf-dock"
      className="fixed bottom-5 right-5 z-40 max-w-md w-[calc(100vw-40px)] sm:w-auto shadow-2xl rounded-2xl border p-3.5 backdrop-blur-md transition-all duration-200 animate-in slide-in-from-bottom-5
        bg-slate-900/95 border-slate-700 text-white"
    >
      <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 font-medium text-slate-300">
          <Laptop className="w-3.5 h-3.5 text-blue-400" />
          <span>ChromeOS Dictation Overlay</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="truncate max-w-[120px]">Target: {targetAppName}</span>
          <button
            onClick={onCloseDock}
            className="text-slate-400 hover:text-white p-0.5 rounded"
            title="Close overlay"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Active mic button */}
        <button
          onClick={onToggleListen}
          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-md transition ${
            isListening
              ? isPaused
                ? 'bg-amber-500 text-white'
                : 'bg-red-500 text-white ring-4 ring-red-400/30 animate-pulse'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
          title="Toggle Dictation (Ctrl+Space)"
        >
          {isListening ? <Mic className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Text Preview / Prompt */}
        <div className="min-w-0 flex-1">
          {displayText ? (
            <p className="text-xs font-medium text-slate-100 line-clamp-2 leading-tight">
              "{displayText}"
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">
              {isListening ? 'Listening for speech...' : 'Press mic or Ctrl+Space to speak'}
            </p>
          )}
          {isListening && (
            <div className="flex items-center gap-1 mt-1">
              <div
                className="h-1 bg-blue-500 rounded-full transition-all duration-100"
                style={{ width: `${Math.max(10, audioLevel)}%` }}
              />
            </div>
          )}
        </div>

        {/* Quick action buttons: Checkmark confirm & Discard */}
        {hasThought && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onConfirm}
              className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm flex items-center gap-1 text-xs font-semibold"
              title="Click Checkmark to Confirm & Insert statement into target box"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Enter</span>
            </button>
            <button
              onClick={onDiscard}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              title="Discard"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
