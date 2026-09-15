import React, { useState } from 'react';
import {
  Mail,
  FileText,
  MessageSquare,
  Search,
  Terminal,
  Clipboard,
  Check,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import { TargetAppId } from '../types';

interface SandboxTargetsProps {
  activeTargetId: TargetAppId;
  onSelectTarget: (id: TargetAppId) => void;
  targetContents: Record<TargetAppId, string>;
  onUpdateTargetContent: (id: TargetAppId, text: string) => void;
  onClearTarget: (id: TargetAppId) => void;
  lastInsertedText: string | null;
}

export const SandboxTargets: React.FC<SandboxTargetsProps> = ({
  activeTargetId,
  onSelectTarget,
  targetContents,
  onUpdateTargetContent,
  onClearTarget,
  lastInsertedText,
}) => {
  const [copiedApp, setCopiedApp] = useState<string | null>(null);

  const handleCopy = (id: TargetAppId, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedApp(id);
    setTimeout(() => setCopiedApp(null), 1800);
  };

  const targets = [
    {
      id: 'gmail' as TargetAppId,
      name: 'Gmail Composer',
      category: 'Workspace App',
      icon: Mail,
      placeholder: 'Compose your email message with Chromebook voice...',
      description: 'Test voice input into email body',
    },
    {
      id: 'docs' as TargetAppId,
      name: 'Google Docs',
      category: 'Document Canvas',
      icon: FileText,
      placeholder: 'Document paragraph... Start dictating thoughts or meeting notes...',
      description: 'Test voice typing into rich document text box',
    },
    {
      id: 'slack' as TargetAppId,
      name: 'Team Chat / Slack',
      category: 'Messaging',
      icon: MessageSquare,
      placeholder: 'Send a message to #general...',
      description: 'Test conversational speech into chat box',
    },
    {
      id: 'omnibox' as TargetAppId,
      name: 'Chrome Omnibox / Search',
      category: 'Browser URL & Search',
      icon: Search,
      placeholder: 'Search Google or type a URL...',
      description: 'Test quick voice search commands',
    },
    {
      id: 'code' as TargetAppId,
      name: 'Terminal & Code Editor',
      category: 'Developer Tools',
      icon: Terminal,
      placeholder: 'npm run test && git commit -m "Voice commit"',
      description: 'Test technical syntax and developer inputs',
    },
  ];

  return (
    <div
      id="sandbox-targets-container"
      className="rounded-2xl border transition-all duration-200 p-5 shadow-sm
        bg-white border-slate-200/90 text-slate-800
        dark:bg-slate-900/90 dark:border-slate-800 dark:text-slate-100"
    >
      {/* Sandbox Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight">
              Target Text Boxes Anywhere
            </h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80">
              Active Ingress: {targets.find((t) => t.id === activeTargetId)?.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click any application box below to target it. Once confirmed, transcriptions are inserted here and auto-copied to the Chromebook system clipboard.
          </p>
        </div>

        {/* Global Clipboard Banner */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs">
          <Laptop className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="text-slate-600 dark:text-slate-300">
            System Clipboard Sync: <strong>Enabled</strong>
          </span>
        </div>
      </div>

      {/* Target Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-4">
        {targets.map((target) => {
          const Icon = target.icon;
          const isActive = activeTargetId === target.id;
          const hasContent = Boolean(targetContents[target.id]?.trim());

          return (
            <button
              key={target.id}
              onClick={() => onSelectTarget(target.id)}
              className={`flex items-center gap-2 p-2.5 rounded-xl text-left border transition-all duration-150 ${
                isActive
                  ? 'bg-blue-50 border-blue-400 dark:bg-blue-950/40 dark:border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200/80 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:border-slate-800'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate leading-tight">
                  {target.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {hasContent ? 'Contains text' : 'Empty'}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Target Interactive Box */}
      <div className="mt-4">
        {targets.map((target) => {
          if (target.id !== activeTargetId) return null;
          const content = targetContents[target.id] || '';
          const Icon = target.icon;

          return (
            <div
              key={target.id}
              className="rounded-xl border border-blue-300/80 dark:border-blue-800/80 bg-slate-50/50 dark:bg-slate-800/30 p-4 transition-all"
            >
              {/* Target App Header Toolbar */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {target.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {target.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {content.trim() && (
                    <>
                      <button
                        onClick={() => handleCopy(target.id, content)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition"
                        title="Copy content to clipboard"
                      >
                        {copiedApp === target.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Clipboard className="w-3 h-3" />
                        )}
                        <span>{copiedApp === target.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={() => onClearTarget(target.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        title="Clear this text box"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Editable Text Area */}
              <div className="relative">
                <textarea
                  id={`target-textarea-${target.id}`}
                  value={content}
                  onChange={(e) => onUpdateTargetContent(target.id, e.target.value)}
                  placeholder={target.placeholder}
                  rows={4}
                  className="w-full text-sm leading-relaxed p-3.5 rounded-lg border font-sans resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition
                    bg-white border-slate-200 text-slate-900 placeholder:text-slate-400
                    dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                />

                {lastInsertedText && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Last voice statement confirmed & inserted successfully!</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
