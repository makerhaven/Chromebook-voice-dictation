import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  CheckSquare,
  Square,
  Sparkles,
  ArrowRight,
  Filter,
  Eye,
  Sliders,
  RotateCcw,
  Copy,
  Check,
  Volume2,
  Send,
  HelpCircle,
  FileCheck2,
} from 'lucide-react';
import { CleanupResult } from '../utils/cleanupEngine';
import { speakText } from '../utils/audioSynthesis';

interface ConfirmationCardProps {
  rawText: string;
  interimText: string;
  cleanupResult: CleanupResult;
  isListening: boolean;
  thoughtComplete: boolean;
  targetAppName: string;
  onConfirmStatement: (finalText: string) => void;
  onDiscardStatement: () => void;
  onRunAiPolish: () => Promise<void>;
  isAiPolishing: boolean;
  onUpdateCleanedText: (newText: string) => void;
}

export const ConfirmationCard: React.FC<ConfirmationCardProps> = ({
  rawText,
  interimText,
  cleanupResult,
  isListening,
  thoughtComplete,
  targetAppName,
  onConfirmStatement,
  onDiscardStatement,
  onRunAiPolish,
  isAiPolishing,
  onUpdateCleanedText,
}) => {
  const [activeTab, setActiveTab] = useState<'cleaned' | 'passes' | 'raw'>('cleaned');
  const [hasCopied, setHasCopied] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [userChecked, setUserChecked] = useState<boolean>(false);

  const displayText = cleanupResult.cleaned || rawText;

  // Reset checked state when a new draft comes in
  useEffect(() => {
    setUserChecked(false);
  }, [rawText]);

  const handleCopy = () => {
    if (!displayText) return;
    navigator.clipboard.writeText(displayText);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handlePlayTts = () => {
    if (!displayText) return;
    setIsPlayingAudio(true);
    speakText(displayText, () => setIsPlayingAudio(false));
  };

  const handleConfirm = () => {
    if (!displayText.trim()) return;
    onConfirmStatement(displayText.trim());
    setUserChecked(false);
  };

  const hasContent = Boolean(rawText.trim() || interimText.trim());

  if (!hasContent) {
    return (
      <div
        id="confirmation-empty-state"
        className="rounded-2xl border border-dashed p-6 text-center transition-colors
          bg-slate-50/70 border-slate-200 text-slate-500
          dark:bg-slate-900/40 dark:border-slate-800 dark:text-slate-400"
      >
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
          <FileCheck2 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Awaiting Voice Thought
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
          Words spoken will be held here in draft mode. Transcriptions are <strong>never entered</strong> into your target text box until you review the cleanup and click the confirmation checkmark box.
        </p>
      </div>
    );
  }

  return (
    <div
      id="statement-confirmation-card"
      className="w-full rounded-2xl border transition-all duration-200 p-5 shadow-sm
        bg-white border-blue-200/90 text-slate-800
        dark:bg-slate-900 dark:border-blue-900/60 dark:text-slate-100"
    >
      {/* Top Banner: Thought Completion Status & Target Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              thoughtComplete
                ? 'bg-emerald-500 ring-4 ring-emerald-400/20'
                : 'bg-amber-400 animate-pulse'
            }`}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            {thoughtComplete
              ? 'Completion of Thought Confirmed'
              : 'Speaking Thought in Progress...'}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-medium">
            Target: {targetAppName}
          </span>
        </div>

        {/* Filtered Words Badge */}
        {cleanupResult.filteredWords.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-md border border-indigo-100 dark:border-indigo-900/50">
            <Filter className="w-3 h-3" />
            <span className="font-medium">
              Filtered words: {cleanupResult.filteredWords.map((f) => `"${f.word}" (${f.count})`).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Tabs for Passes view: Cleaned vs Passes Diff vs Raw */}
      <div className="flex items-center justify-between mt-3 mb-2">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setActiveTab('cleaned')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              activeTab === 'cleaned'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Cleaned Statement
          </button>
          <button
            onClick={() => setActiveTab('passes')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              activeTab === 'passes'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Review Passes
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              activeTab === 'raw'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Raw Voice
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Read aloud */}
          <button
            onClick={handlePlayTts}
            disabled={isPlayingAudio}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs flex items-center gap-1"
            title="Read back statement aloud"
          >
            <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-bounce text-blue-500' : ''}`} />
            <span className="hidden sm:inline">Listen</span>
          </button>

          {/* AI Polish */}
          <button
            onClick={onRunAiPolish}
            disabled={isAiPolishing}
            className="p-1.5 rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition text-xs flex items-center gap-1 font-medium"
            title="Run Gemini AI Executive Polish pass"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAiPolishing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isAiPolishing ? 'Polishing...' : 'AI Polish'}</span>
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs flex items-center gap-1"
            title="Copy to clipboard"
          >
            {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{hasCopied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Box: Cleaned Editable Area or Passes View */}
      {activeTab === 'cleaned' && (
        <div className="relative mt-2">
          <textarea
            id="statement-editable-input"
            aria-label="Editable cleaned statement"
            value={displayText}
            onChange={(e) => onUpdateCleanedText(e.target.value)}
            rows={3}
            className="w-full text-sm sm:text-base leading-relaxed p-3.5 rounded-xl border font-sans resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition
              bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400
              dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-100"
            placeholder="Cleaned statement will appear here. You may edit words directly before confirming..."
          />
          {interimText && (
            <div className="mt-1 text-xs italic text-blue-500 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>Streaming voice: {interimText}</span>
            </div>
          )}
        </div>
      )}

      {activeTab === 'passes' && (
        <div className="mt-2 space-y-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Pass 1: Filler Words ("up", "and", "um") Removed:
            </span>
            <p className="mt-1 font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
              {cleanupResult.passes.pass1FillerRemoved || 'None'}
            </p>
          </div>
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Pass 2: Capitalization & Sentence Punctuation:
            </span>
            <p className="mt-1 font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
              {cleanupResult.passes.pass2Punctuation || 'None'}
            </p>
          </div>
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Pass 3: Professional Presentation & Flow:
            </span>
            <p className="mt-1 font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
              {cleanupResult.passes.pass3Professional || 'None'}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'raw' && (
        <div className="mt-2 p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-xs font-mono text-slate-800 dark:text-slate-200 leading-relaxed">
          <p className="text-[11px] font-sans font-semibold text-amber-800 dark:text-amber-400 mb-1">
            Raw Speech Verbatim:
          </p>
          "{rawText}"
        </div>
      )}

      {/* Critical Mandate: The Confirmation Check Mark Box & Final Insertion Button */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Checkmark Box */}
        <label
          htmlFor="checkbox-confirm-thought"
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <input
            id="checkbox-confirm-thought"
            type="checkbox"
            checked={userChecked}
            onChange={(e) => setUserChecked(e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 cursor-pointer"
          />
          <div className="text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
              I confirm proper statement & completion of thought
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Enables insertion into {targetAppName} & logs to history
            </p>
          </div>
        </label>

        {/* Action Buttons: Discard & Confirm */}
        <div className="flex items-center gap-2 justify-end">
          <button
            id="btn-discard-thought"
            onClick={onDiscardStatement}
            className="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition"
          >
            Discard
          </button>

          <button
            id="btn-confirm-and-enter"
            onClick={handleConfirm}
            disabled={!displayText.trim()}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200 ${
              displayText.trim()
                ? userChecked
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 scale-102 ring-4 ring-emerald-500/20'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
            title="Confirm statement and enter into target text box (Ctrl+Enter)"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Confirm & Enter Statement</span>
          </button>
        </div>
      </div>
    </div>
  );
};
