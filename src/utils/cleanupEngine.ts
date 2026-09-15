import { CleanupSettings } from '../types';

export interface CleanupResult {
  raw: string;
  cleaned: string;
  filteredWords: { word: string; count: number }[];
  passes: {
    pass1FillerRemoved: string;
    pass2Punctuation: string;
    pass3Professional: string;
  };
}

/**
 * Performs local multi-pass cleanup for voice transcription.
 * Special focus on user requirements:
 * - Allow for passes
 * - Words 'up' and 'and' to be edited out
 * - Cleaned up for readability and professional presentation
 */
export function runLocalCleanupPasses(
  rawText: string,
  settings: CleanupSettings
): CleanupResult {
  const text = rawText.trim();
  if (!text) {
    return {
      raw: '',
      cleaned: '',
      filteredWords: [],
      passes: {
        pass1FillerRemoved: '',
        pass2Punctuation: '',
        pass3Professional: '',
      },
    };
  }

  const filteredCounts: Record<string, number> = {};

  // Track removed words helper
  function trackRemoved(word: string, count: number = 1) {
    const key = word.toLowerCase();
    filteredCounts[key] = (filteredCounts[key] || 0) + count;
  }

  // PASS 1: Filler Words & Specific Words ("up", "and", custom words)
  let pass1 = text;

  // Specific requirement: remove "and" when used as conversational run-on or filler
  if (settings.removeAnd) {
    // Count "and"
    const andMatches = pass1.match(/\b(and)\b/gi);
    if (andMatches) {
      trackRemoved('and', andMatches.length);
    }
    // Remove "and and", starting "And ...", or trailing "... and"
    pass1 = pass1.replace(/^and\s+/i, '');
    pass1 = pass1.replace(/\s+and\s*$/i, '');
    pass1 = pass1.replace(/\b(and\s+and)\b/gi, 'and');
    // Remove conversational pauses like ", and, " or " and so "
    pass1 = pass1.replace(/,\s*and\s*,?/gi, ', ');
    // Remove general filler "and"
    pass1 = pass1.replace(/\b(and)\b/gi, ' ');
  }

  // Specific requirement: remove "up" when used as speech clutter / filler
  if (settings.removeUp) {
    const upMatches = pass1.match(/\b(up)\b/gi);
    if (upMatches) {
      trackRemoved('up', upMatches.length);
    }
    pass1 = pass1.replace(/^up\s+/i, '');
    pass1 = pass1.replace(/\s+up\s*$/i, '');
    pass1 = pass1.replace(/\b(up)\b/gi, ' ');
  }

  // Common fillers
  if (settings.removeCommonFillers) {
    const commonFillers = ['um', 'uh', 'er', 'ah', 'like', 'you know', 'basically', 'actually', 'sort of', 'kind of'];
    for (const filler of commonFillers) {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = pass1.match(regex);
      if (matches) {
        trackRemoved(filler, matches.length);
      }
      pass1 = pass1.replace(regex, ' ');
    }
  }

  // Custom user words
  if (settings.customRemovedWords && settings.customRemovedWords.length > 0) {
    for (const customWord of settings.customRemovedWords) {
      const trimmed = customWord.trim();
      if (!trimmed) continue;
      const regex = new RegExp(`\\b${trimmed}\\b`, 'gi');
      const matches = pass1.match(regex);
      if (matches) {
        trackRemoved(trimmed, matches.length);
      }
      pass1 = pass1.replace(regex, ' ');
    }
  }

  // Collapse repeated spaces after removals
  pass1 = pass1.replace(/\s+/g, ' ').trim();

  // PASS 2: Punctuation, Spacing & Capitalization
  let pass2 = pass1;
  if (settings.autoPunctuate || settings.capitalizeSentences) {
    // Remove duplicate punctuation
    pass2 = pass2.replace(/([,.;:?!])\s*[,.;:?!]+/g, '$1');

    // Ensure space after punctuation
    pass2 = pass2.replace(/\s*([,.;:?!])\s*/g, '$1 ');

    // Remove leading commas or periods
    pass2 = pass2.replace(/^[,.;:?!]\s*/, '');

    // Capitalize beginning of sentences
    if (settings.capitalizeSentences && pass2.length > 0) {
      pass2 = pass2.replace(/(^\s*|[.?!]\s+)([a-z])/g, (_match, prefix, char) => {
        return prefix + char.toUpperCase();
      });
    }

    // Ensure ending punctuation if reasonable statement length
    if (settings.autoPunctuate && pass2.length > 3 && !/[.?!]$/.test(pass2)) {
      pass2 = pass2.trim() + '.';
    }
  }

  // PASS 3: Professional Presentation & Flow
  let pass3 = pass2;
  if (settings.professionalTone) {
    // Remove repeated adjacent words (e.g., "we we", "the the")
    pass3 = pass3.replace(/\b(\w+)\s+\1\b/gi, '$1');

    // Replace colloquial slang with professional equivalents
    const proReplacements: [RegExp, string][] = [
      [/\bgonna\b/gi, 'going to'],
      [/\bwanna\b/gi, 'want to'],
      [/\bgotta\b/gi, 'need to'],
      [/\bkinda\b/gi, 'somewhat'],
      [/\bya\b/gi, 'you'],
      [/\bcoz\b|\bcause\b/gi, 'because'],
    ];

    for (const [pattern, replacement] of proReplacements) {
      pass3 = pass3.replace(pattern, replacement);
    }

    // Capitalize "I" standalone
    pass3 = pass3.replace(/\b(i)\b/g, 'I');
    pass3 = pass3.replace(/\b(i'm)\b/gi, "I'm");
    pass3 = pass3.replace(/\b(i've)\b/gi, "I've");
    pass3 = pass3.replace(/\b(i'll)\b/gi, "I'll");
    pass3 = pass3.replace(/\b(i'd)\b/gi, "I'd");

    // Clean up any remaining whitespace artifacts
    pass3 = pass3.replace(/\s+/g, ' ').trim();
  }

  const filteredWordsList = Object.entries(filteredCounts).map(([word, count]) => ({
    word,
    count,
  }));

  return {
    raw: text,
    cleaned: pass3 || pass2 || pass1 || text,
    filteredWords: filteredWordsList,
    passes: {
      pass1FillerRemoved: pass1,
      pass2Punctuation: pass2,
      pass3Professional: pass3,
    },
  };
}

/**
 * Optional server-side AI cleanup using Gemini model
 */
export async function runAiCleanup(
  text: string,
  settings: CleanupSettings
): Promise<string> {
  if (!settings.useGeminiAi || !text.trim()) {
    return runLocalCleanupPasses(text, settings).cleaned;
  }

  try {
    const wordsToRemove: string[] = [];
    if (settings.removeUp) wordsToRemove.push('up');
    if (settings.removeAnd) wordsToRemove.push('and');
    if (settings.customRemovedWords) wordsToRemove.push(...settings.customRemovedWords);

    const response = await fetch('/api/ai-cleanup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        removeWords: wordsToRemove,
        tone: settings.professionalTone ? 'executive professional' : 'clean conversational',
      }),
    });

    if (!response.ok) {
      throw new Error(`AI cleanup status: ${response.status}`);
    }

    const data = await response.json();
    if (data.cleanedText) {
      return data.cleanedText;
    }
  } catch (err) {
    console.warn('AI cleanup unavailable, falling back to local passes:', err);
  }

  return runLocalCleanupPasses(text, settings).cleaned;
}
