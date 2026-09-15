import {
  TranscriptLog,
  Session,
  CleanupSettings,
  KeyboardShortcut,
  GoogleDriveSyncState,
  ThemeMode,
} from '../types';

const STORAGE_KEYS = {
  TRANSCRIPTS: 'chromebook_voice_transcripts_v1',
  SESSIONS: 'chromebook_voice_sessions_v1',
  SETTINGS: 'chromebook_voice_settings_v1',
  SHORTCUTS: 'chromebook_voice_shortcuts_v1',
  DRIVE_SYNC: 'chromebook_voice_drive_sync_v1',
  THEME: 'chromebook_voice_theme_v1',
};

export const DEFAULT_CLEANUP_SETTINGS: CleanupSettings = {
  removeUp: true,
  removeAnd: true,
  removeCommonFillers: true,
  customRemovedWords: ['basically', 'actually', 'you know'],
  capitalizeSentences: true,
  autoPunctuate: true,
  professionalTone: true,
  useGeminiAi: true,
};

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  {
    id: 'toggle-dictation',
    name: 'Toggle Dictation',
    description: 'Start or pause live voice input',
    key: ' ',
    ctrlKey: true,
  },
  {
    id: 'confirm-statement',
    name: 'Confirm Checkmark',
    description: 'Approve statement and insert into target text box',
    key: 'Enter',
    ctrlKey: true,
  },
  {
    id: 'pause-dictation',
    name: 'Pause / Resume Thought',
    description: 'Mark thought complete or pause listening',
    key: 'p',
    altKey: true,
  },
  {
    id: 'discard-statement',
    name: 'Discard Thought',
    description: 'Clear the unconfirmed draft',
    key: 'Escape',
  },
  {
    id: 'new-session',
    name: 'New Session',
    description: 'Start a fresh log session',
    key: 'S',
    ctrlKey: true,
    shiftKey: true,
  },
  {
    id: 'toggle-dock',
    name: 'Toggle Floating Shelf',
    description: 'Switch between full dashboard and ChromeOS mini-dock',
    key: 'D',
    ctrlKey: true,
    shiftKey: true,
  },
];

export const INITIAL_SESSIONS: Session[] = [
  {
    id: 'session-default',
    name: 'General Dictation',
    createdAt: Date.now() - 3600000 * 2,
    lastActiveAt: Date.now(),
    transcriptCount: 3,
  },
  {
    id: 'session-work',
    name: 'Client Email Drafts',
    createdAt: Date.now() - 3600000 * 24,
    lastActiveAt: Date.now() - 3600000 * 5,
    transcriptCount: 2,
  },
];

export const INITIAL_TRANSCRIPTS: TranscriptLog[] = [
  {
    id: 'log-1',
    timestamp: Date.now() - 1000 * 60 * 25,
    rawText: 'and so I wanted to follow up and see if the quarter three project review is ready up for tomorrow morning',
    cleanedText: 'I wanted to follow up and see if the quarter three project review is ready for tomorrow morning.',
    approved: true,
    sessionName: 'General Dictation',
    targetApp: 'Gmail Composer',
    wordCount: 18,
    durationMs: 4200,
    filteredWords: [
      { word: 'and', count: 2 },
      { word: 'up', count: 1 },
    ],
    cleanupPasses: {
      pass1FillerRemoved: 'I wanted to follow up see if the quarter three project review is ready for tomorrow morning',
      pass2Punctuation: 'I wanted to follow up see if the quarter three project review is ready for tomorrow morning.',
      pass3Professional: 'I wanted to follow up and see if the quarter three project review is ready for tomorrow morning.',
    },
    syncedToDrive: true,
  },
  {
    id: 'log-2',
    timestamp: Date.now() - 1000 * 60 * 12,
    rawText: 'and we are gonna push the new accessibility improvements directly to the Chromebook repository and test them out',
    cleanedText: 'We are going to push the new accessibility improvements directly to the Chromebook repository and test them out.',
    approved: true,
    sessionName: 'General Dictation',
    targetApp: 'Google Docs',
    wordCount: 19,
    durationMs: 4800,
    filteredWords: [
      { word: 'and', count: 1 },
    ],
    cleanupPasses: {
      pass1FillerRemoved: 'we are gonna push the new accessibility improvements directly to the Chromebook repository test them out',
      pass2Punctuation: 'We are gonna push the new accessibility improvements directly to the Chromebook repository test them out.',
      pass3Professional: 'We are going to push the new accessibility improvements directly to the Chromebook repository and test them out.',
    },
    syncedToDrive: true,
  },
  {
    id: 'log-3',
    timestamp: Date.now() - 1000 * 60 * 3,
    rawText: 'um up basically please make sure the team reviews the security requirements before the launch',
    cleanedText: 'Please make sure the team reviews the security requirements before the launch.',
    approved: true,
    sessionName: 'General Dictation',
    targetApp: 'Slack Workspace',
    wordCount: 13,
    durationMs: 3100,
    filteredWords: [
      { word: 'um', count: 1 },
      { word: 'up', count: 1 },
      { word: 'basically', count: 1 },
    ],
    cleanupPasses: {
      pass1FillerRemoved: 'please make sure the team reviews the security requirements before the launch',
      pass2Punctuation: 'Please make sure the team reviews the security requirements before the launch.',
      pass3Professional: 'Please make sure the team reviews the security requirements before the launch.',
    },
    syncedToDrive: true,
  },
];

export function loadTranscripts(): TranscriptLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSCRIPTS);
    if (!raw) return INITIAL_TRANSCRIPTS;
    return JSON.parse(raw);
  } catch {
    return INITIAL_TRANSCRIPTS;
  }
}

export function saveTranscripts(logs: TranscriptLog[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSCRIPTS, JSON.stringify(logs));
  } catch (e) {
    console.warn('Failed to save transcripts to localStorage', e);
  }
}

export function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) return INITIAL_SESSIONS;
    return JSON.parse(raw);
  } catch {
    return INITIAL_SESSIONS;
  }
}

export function saveSessions(sessions: Session[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.warn('Failed to save sessions to localStorage', e);
  }
}

export function loadCleanupSettings(): CleanupSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_CLEANUP_SETTINGS;
    return { ...DEFAULT_CLEANUP_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CLEANUP_SETTINGS;
  }
}

export function saveCleanupSettings(settings: CleanupSettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings to localStorage', e);
  }
}

export function loadShortcuts(): KeyboardShortcut[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHORTCUTS);
    if (!raw) return DEFAULT_SHORTCUTS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SHORTCUTS;
  }
}

export function saveShortcuts(shortcuts: KeyboardShortcut[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SHORTCUTS, JSON.stringify(shortcuts));
  } catch (e) {
    console.warn('Failed to save shortcuts to localStorage', e);
  }
}

export function loadDriveState(): GoogleDriveSyncState {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DRIVE_SYNC);
    if (!raw) {
      return {
        isConnected: true,
        lastSyncTimestamp: Date.now() - 1000 * 60 * 18,
        status: 'synced',
        backupFileName: 'Google Drive/VoiceDictation/transcripts_backup.json',
        totalSyncedItems: 3,
        autoSync: true,
        driveFolder: 'VoiceDictation-Logs',
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      isConnected: true,
      lastSyncTimestamp: Date.now(),
      status: 'synced',
      backupFileName: 'Google Drive/VoiceDictation/transcripts_backup.json',
      totalSyncedItems: 3,
      autoSync: true,
      driveFolder: 'VoiceDictation-Logs',
    };
  }
}

export function saveDriveState(state: GoogleDriveSyncState) {
  try {
    localStorage.setItem(STORAGE_KEYS.DRIVE_SYNC, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save drive state to localStorage', e);
  }
}

export function loadTheme(): ThemeMode {
  try {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (theme === 'dark' || theme === 'light' || theme === 'system') {
      return theme;
    }
    return 'system';
  } catch {
    return 'system';
  }
}

export function saveTheme(theme: ThemeMode) {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (e) {
    console.warn('Failed to save theme to localStorage', e);
  }
}

export function exportBackupJson(transcripts: TranscriptLog[]): string {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: 'Chromebook Voice Dictation',
    version: '1.2.0',
    totalEntries: transcripts.length,
    device: 'Chromebook / ChromeOS Native Voice Ingress',
    transcripts,
  };
  return JSON.stringify(payload, null, 2);
}

export function exportMarkdown(transcripts: TranscriptLog[]): string {
  let md = `# Chromebook Voice Dictation - Chronological History Logs\n\n`;
  md += `*Generated: ${new Date().toLocaleString()}*\n\n`;
  md += `| Time | Target App | Approved | Filtered Words | Cleaned Transcript |\n`;
  md += `| :--- | :--- | :---: | :--- | :--- |\n`;

  for (const log of transcripts) {
    const time = new Date(log.timestamp).toLocaleTimeString();
    const filtered = log.filteredWords.map((f) => `${f.word} (${f.count})`).join(', ') || 'None';
    md += `| ${time} | ${log.targetApp} | ${log.approved ? 'Yes' : 'No'} | ${filtered} | "${log.cleanedText}" |\n`;
  }

  md += `\n\n## Detailed Transcript Blocks\n\n`;
  for (const log of transcripts) {
    md += `### [${new Date(log.timestamp).toLocaleString()}] ${log.targetApp}\n`;
    md += `- **Raw Voice**: \`${log.rawText}\`\n`;
    md += `- **Cleaned Output**: ${log.cleanedText}\n`;
    md += `- **Status**: ${log.approved ? 'Approved & Inserted' : 'Discarded/Pending'}\n\n`;
  }

  return md;
}
