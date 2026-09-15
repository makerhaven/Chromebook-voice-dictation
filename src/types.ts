export interface TranscriptLog {
  id: string;
  timestamp: number; // Unix epoch ms
  rawText: string;
  cleanedText: string;
  approved: boolean; // Confirmed by user check mark
  sessionName: string;
  targetApp: string;
  wordCount: number;
  durationMs: number;
  filteredWords: { word: string; count: number }[];
  cleanupPasses: {
    pass1FillerRemoved: string;
    pass2Punctuation: string;
    pass3Professional: string;
  };
  syncedToDrive: boolean;
  notes?: string;
}

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  lastActiveAt: number;
  transcriptCount: number;
}

export interface CleanupSettings {
  removeUp: boolean; // Specifically remove repetitive/filler "up"
  removeAnd: boolean; // Specifically remove repetitive/filler "and"
  removeCommonFillers: boolean; // "um", "uh", "like", "you know"
  customRemovedWords: string[];
  capitalizeSentences: boolean;
  autoPunctuate: boolean;
  professionalTone: boolean;
  useGeminiAi: boolean;
}

export interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
}

export interface GoogleDriveSyncState {
  isConnected: boolean;
  lastSyncTimestamp: number | null;
  status: 'idle' | 'syncing' | 'synced' | 'error';
  backupFileName: string;
  totalSyncedItems: number;
  autoSync: boolean;
  driveFolder: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type TargetAppId = 'gmail' | 'docs' | 'slack' | 'omnibox' | 'code' | 'custom';

export interface TargetAppDefinition {
  id: TargetAppId;
  name: string;
  iconName: string;
  placeholder: string;
  category: string;
}
